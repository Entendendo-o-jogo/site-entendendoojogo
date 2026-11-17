/* Área do aluno EOJ (/hub) — cursos, aulas, progresso, materiais, comentários, notas e anotações.
   Usa a conexão e o login de biblioteca.js (window.EOJB). A segurança fica nas regras (RLS) do banco. */
(function () {
  'use strict';
  var B = window.EOJB, sb = B.sb;
  var H = window.EOJH = {};
  function ok(r) { if (r.error) throw r.error; return r.data; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  H.esc = esc;

  H.ev = function (nome, dados) {
    try { if (window.__eojGA && window.gtag) window.gtag('event', nome, Object.assign({ area: 'hub' }, dados || {})); } catch (e) {}
  };

  // ---------- Catálogo ----------
  var AULA_COLS = 'id,titulo,duracao_seg,ordem,publicado_em';
  H.cursos = function () {
    return sb.from('cursos').select('id,slug,titulo,descricao,capa,carga_horaria,tipo,formato,gratuito,ordem,modulos(id,aulas(id))')
      .order('ordem').order('titulo').then(ok);
  };
  H.curso = function (filtro) {
    var q = sb.from('cursos').select('id,slug,titulo,descricao,capa,carga_horaria,tipo,formato,gratuito,modulos(id,titulo,ordem,aulas(' + AULA_COLS + '))');
    q = typeof filtro === 'number' ? q.eq('id', filtro) : q.eq('slug', filtro);
    return q.maybeSingle().then(ok).then(function (c) {
      if (!c) return null;
      c.modulos = (c.modulos || []).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; });
      c.modulos.forEach(function (m) { m.aulas = (m.aulas || []).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; }); });
      c.aulas = []; c.modulos.forEach(function (m) { m.aulas.forEach(function (a) { a.modulo = m; c.aulas.push(a); }); });
      return c;
    });
  };
  H.aula = function (id) {
    return sb.from('aulas').select('id,titulo,descricao,duracao_seg,modulo_id,modulos(curso_id)').eq('id', id).maybeSingle().then(ok);
  };
  H.recentes = function (n) { return sb.rpc('conteudos_recentes', { lim: n || 12 }).then(ok); };

  // ---------- Busca e sugestões ----------
  H.buscar = function (q) { return sb.rpc('buscar_hub', { q: q, lim: 40 }).then(ok); };
  H.sugerir = function (texto) { return sb.from('pedidos').insert({ texto: texto, area: 'hub' }).then(ok).then(function () { H.ev('hub_sugestao'); }); };
  H.minhasSugestoes = function () { return B.user ? sb.from('pedidos').select('id,texto,status,aula_id,criado_em').eq('usuario_id', B.user.id).eq('area', 'hub').order('criado_em', { ascending: false }).limit(20).then(ok) : Promise.resolve([]); };
  H.apagarSugestao = function (id) { return sb.from('pedidos').delete().eq('id', id).then(ok); };
  H.avisos = function () { return B.avisos(); };
  H.lerAvisos = function () { return B.lerAvisos(); };

  // ---------- Salvos, marcadores, trilhas e certificados ----------
  H.salvos = function () { return B.user ? sb.from('hub_salvos').select('aula_id,criado_em,aulas(id,titulo,duracao_seg,modulos(titulo,curso_id))').eq('usuario_id', B.user.id).order('criado_em', { ascending: false }).then(ok) : Promise.resolve([]); };
  H.estaSalva = function (aula) { return B.user ? sb.from('hub_salvos').select('aula_id').eq('usuario_id', B.user.id).eq('aula_id', aula).maybeSingle().then(ok).then(function (r) { return !!r; }) : Promise.resolve(false); };
  H.salvar = function (aula, on) {
    if (on) return sb.from('hub_salvos').upsert({ usuario_id: B.user.id, aula_id: aula }, { onConflict: 'usuario_id,aula_id' }).then(ok).then(function () { H.ev('hub_salvar', { aula_id: aula }); });
    return sb.from('hub_salvos').delete().eq('usuario_id', B.user.id).eq('aula_id', aula).then(ok);
  };
  H.marcadores = function (aula) { return sb.from('aula_marcadores').select('id,segundo,titulo').eq('aula_id', aula).order('segundo').then(ok); };
  H.trilhas = function () { return B.user ? sb.from('trilhas').select('id,titulo,perfil,descricao,ordem').eq('publicado', true).order('ordem').order('id').then(ok) : Promise.resolve([]); };
  H.trilhaAulas = function (t) { return sb.rpc('trilha_aulas', { t: t }).then(ok); };
  H.meuCertificado = function (curso) { return B.user ? sb.from('certificados').select('codigo').eq('usuario_id', B.user.id).eq('curso_id', curso).maybeSingle().then(ok) : Promise.resolve(null); };
  H.emitirCertificado = function (curso) { return sb.rpc('emitir_certificado', { c: curso }).then(ok).then(function (cod) { H.ev('hub_certificado', { curso_id: curso }); return cod; }); };
  H.verCertificado = function (cod) { return sb.rpc('ver_certificado', { cod: cod }).then(ok).then(function (r) { return (r && r[0]) || null; }); };
  H.salvarNome = function (nome) { return sb.from('perfis').update({ nome: nome }).eq('id', B.user.id).then(ok).then(function () { if (B.perfil) B.perfil.nome = nome; }); };
  H.horas = function (seg) { if (!seg) return ''; var h = Math.floor(seg / 3600), m = Math.round((seg % 3600) / 60); return h ? h + 'h' + (m ? ' ' + m + 'min' : '') : m + ' min'; };

  // ---------- Acesso ----------
  // Cursos inteiros e módulos liberados para a pessoa logada (MemberKit, Hotmart, assinatura, matrícula manual)
  H.matriculas = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.rpc('meus_acessos').then(ok);
  };
  H.premium = function () { return !!(B.perfil && (B.perfil.papel === 'admin' || (B.perfil.acesso_ate && new Date(B.perfil.acesso_ate) > new Date()))); };
  // acc[curso_id] = tem algum acesso; acc.full[curso_id] = curso inteiro; acc.mod[modulo_id] = módulo avulso
  H.acessos = function (cursos, linhas) {
    var m = { full: {}, mod: {} };
    (linhas || []).forEach(function (r) { m[r.curso_id] = true; if (r.modulo_id) m.mod[r.modulo_id] = true; else m.full[r.curso_id] = true; });
    (cursos || []).forEach(function (c) { if (c.gratuito) { m[c.id] = true; m.full[c.id] = true; } });
    return m;
  };
  H.temModulo = function (acc, cursoId, moduloId) { return !!(acc.full[cursoId] || acc.mod[moduloId]); };
  H.podeAula = function (id) { return sb.rpc('pode_ver_aula', { a: id }).then(ok); };
  H.video = function (aulaId) { return sb.rpc('aula_video', { a: aulaId }).then(ok).then(function (r) { return (r && r[0]) || null; }); };

  // ---------- Progresso ----------
  H.progresso = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.from('progresso').select('aula_id,segundos,concluida_em,atualizado_em').eq('usuario_id', B.user.id).then(ok);
  };
  H.mapaProgresso = function (lista) { var m = {}; (lista || []).forEach(function (p) { m[p.aula_id] = p; }); return m; };
  H.salvarProgresso = function (aula, seg, concluida) {
    if (!B.user) return Promise.resolve();
    var linha = { usuario_id: B.user.id, aula_id: aula, segundos: Math.round(seg || 0), atualizado_em: new Date().toISOString() };
    if (concluida === true) linha.concluida_em = new Date().toISOString();
    if (concluida === false) linha.concluida_em = null;
    return sb.from('progresso').upsert(linha, { onConflict: 'usuario_id,aula_id' }).then(ok);
  };
  H.ultimaAssistida = function () {
    if (!B.user) return Promise.resolve(null);
    return sb.from('progresso').select('aula_id,segundos,concluida_em,aulas(titulo,duracao_seg,modulos(curso_id))')
      .eq('usuario_id', B.user.id).order('atualizado_em', { ascending: false }).limit(1).then(ok).then(function (r) { return (r && r[0]) || null; });
  };
  H.pct = function (curso, prog) {
    var ids = []; (curso.modulos || []).forEach(function (m) { (m.aulas || []).forEach(function (a) { ids.push(a.id); }); });
    if (!ids.length) return 0;
    var feitas = ids.filter(function (id) { return prog[id] && prog[id].concluida_em; }).length;
    return Math.round(feitas * 100 / ids.length);
  };

  // ---------- Materiais extras ----------
  H.TIPOS = { pdf: 'PDF da aula', video: 'Vídeo de apoio', relatorio_coletivo: 'Relatório coletivo', relatorio_individual: 'Relatório individual', artigo: 'Artigo científico', outro: 'Material' };
  H.materiais = function (aula) { return sb.from('materiais').select('*').eq('aula_id', aula).order('ordem').order('id').then(ok); };
  H.abrirMaterial = function (m) {
    H.ev('hub_material', { aula_id: m.aula_id, tipo: m.tipo });
    if (m.arquivo) {
      return sb.storage.from('materiais').createSignedUrl(m.arquivo, 300, { download: true }).then(ok).then(function (d) { location.href = d.signedUrl; });
    }
    if (m.vimeo_id) { H.modalVideo(m.vimeo_id, m.vimeo_hash, m.titulo); return Promise.resolve(); }
    if (m.url) { window.open(m.url, '_blank', 'noopener'); return Promise.resolve(); }
    return Promise.reject(new Error('sem_arquivo'));
  };
  H.tamanho = function (kb) { if (!kb) return ''; return kb >= 1024 ? (kb / 1024).toFixed(1).replace('.', ',') + ' MB' : kb + ' KB'; };
  function urlVimeo(id, hash, extra) { return 'https://player.vimeo.com/video/' + id + '?' + (hash ? 'h=' + hash + '&' : '') + 'title=0&byline=0&portrait=0&dnt=1' + (extra || ''); }
  H.modalVideo = function (id, hash, titulo) {
    var fundo = document.createElement('div');
    fundo.setAttribute('role', 'dialog'); fundo.setAttribute('aria-modal', 'true'); fundo.setAttribute('aria-label', titulo || 'Vídeo de apoio');
    fundo.style.cssText = 'position:fixed;inset:0;background:rgba(17,17,17,0.85);z-index:60;display:flex;align-items:center;justify-content:center;padding:24px';
    fundo.innerHTML = '<div style="position:relative;width:100%;max-width:1100px"><button type="button" aria-label="Fechar" style="position:absolute;right:0;top:-52px;width:44px;height:44px;border:0;border-radius:8px;background:#FFFFFF;color:#111111;font-size:22px;cursor:pointer">×</button>' +
      '<div style="position:relative;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden"><iframe src="' + esc(urlVimeo(id, hash, '&autoplay=1')) + '" title="' + esc(titulo || '') + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div></div>';
    function fechar() { fundo.remove(); document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') fechar(); }
    fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
    fundo.querySelector('button').addEventListener('click', fechar);
    document.addEventListener('keydown', tecla);
    document.body.appendChild(fundo);
    fundo.querySelector('button').focus();
  };

  // ---------- Comentários, notas e anotações ----------
  H.comentarios = function (aula) { return sb.from('comentarios_aula').select('*').eq('aula_id', aula).order('criado_em').then(ok); };
  H.comentar = function (aula, texto, minuto, resposta) {
    return sb.from('comentarios').insert({ aula_id: aula, texto: texto, minuto: minuto == null ? null : minuto, resposta_a: resposta || null }).then(ok)
      .then(function () { H.ev('hub_comentario', { aula_id: aula }); });
  };
  H.apagarComentario = function (id) { return sb.from('comentarios').delete().eq('id', id).then(ok); };
  H.minhaNota = function (aula) {
    if (!B.user) return Promise.resolve(0);
    return sb.from('avaliacoes').select('nota').eq('aula_id', aula).eq('usuario_id', B.user.id).maybeSingle().then(ok).then(function (r) { return r ? r.nota : 0; });
  };
  H.media = function (aula) { return sb.rpc('nota_media', { a: aula }).then(ok).then(function (r) { return (r && r[0]) || { media: null, total: 0 }; }); };
  H.avaliar = function (aula, nota) {
    return sb.from('avaliacoes').upsert({ usuario_id: B.user.id, aula_id: aula, nota: nota }, { onConflict: 'usuario_id,aula_id' }).then(ok)
      .then(function () { H.ev('hub_nota', { aula_id: aula, nota: nota }); });
  };
  H.anotacoes = function (aula) {
    if (!B.user) return Promise.resolve([]);
    return sb.from('anotacoes').select('*').eq('aula_id', aula).eq('usuario_id', B.user.id).order('minuto', { nullsFirst: true }).order('criado_em').then(ok);
  };
  H.anotar = function (aula, texto, minuto) { return sb.from('anotacoes').insert({ aula_id: aula, texto: texto, minuto: minuto == null ? null : minuto }).then(ok); };
  H.apagarAnotacao = function (id) { return sb.from('anotacoes').delete().eq('id', id).then(ok); };

  // ---------- Datas ----------
  H.quando = function (iso) {
    var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return 'agora';
    if (s < 3600) return 'há ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'há ' + Math.floor(s / 3600) + ' h';
    var dias = Math.floor(s / 86400);
    if (dias === 1) return 'ontem';
    if (dias < 30) return 'há ' + dias + ' dias';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  H.min = function (seg) { return B.dur(seg); };

  // ---------- Player da aula (fica fora da árvore re-renderizada, posicionado sobre [data-player-slot]) ----------
  // opcoes: { aula, video: {vimeo_id, vimeo_hash}, titulo, inicio, aoConcluir, proxima }
  H.player = function (op) {
    var velho = document.getElementById('eoj-player'); if (velho) velho.remove();
    var host = document.createElement('div');
    host.id = 'eoj-player';
    host.style.cssText = 'position:absolute;z-index:5;background:#000;border-radius:12px;overflow:hidden;display:none';
    host.innerHTML = '<iframe src="' + esc(urlVimeo(op.video.vimeo_id, op.video.vimeo_hash)) + '" title="' + esc(op.titulo) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>' +
      '<div class="eoj-fim" style="position:absolute;inset:0;background:#111111;color:#FFFFFF;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;text-align:center"></div>';
    document.body.appendChild(host);
    var iframe = host.querySelector('iframe'), fim = host.querySelector('.eoj-fim'), player = null, atual = 0, salvoEm = 0, concluida = false, tocou = false;
    fim.innerHTML = '<p style="margin:0;color:#A1C4E6;font-weight:600;font-size:13px;letter-spacing:0.12em;text-transform:uppercase">Aula concluída</p>' +
      (op.proxima ? '<p style="margin:0;font-size:20px;font-weight:700;max-width:560px">A seguir: ' + esc(op.proxima.titulo) + '</p>' : '<p style="margin:0;font-size:20px;font-weight:700">Você chegou ao fim do curso.</p>') +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' +
      (op.proxima ? '<a href="' + esc(op.proxima.url) + '" style="font:inherit;font-size:15px;font-weight:700;background:#A1C4E6;color:#111111;border-radius:8px;padding:12px 18px;text-decoration:none">Próxima aula</a>' : '') +
      '<button type="button" class="eoj-denovo" style="font:inherit;font-size:15px;font-weight:600;color:#FFFFFF;background:none;border:1.5px solid #4A4A4A;border-radius:8px;padding:11px 18px;cursor:pointer">Assistir de novo</button></div>';
    function salvar(forcar) {
      if (!B.user || !tocou) return;
      var agora = Date.now();
      if (!forcar && agora - salvoEm < 15000) return;
      salvoEm = agora;
      H.salvarProgresso(op.aula, atual, concluida ? true : undefined).catch(function () {});
    }
    function ligar() {
      if (!window.Vimeo || !window.Vimeo.Player) return;
      player = new window.Vimeo.Player(iframe);
      if (op.inicio > 5) player.setCurrentTime(op.inicio).catch(function () {});
      player.on('play', function () { fim.style.display = 'none'; if (!tocou) { tocou = true; H.ev('hub_play', { aula_id: op.aula }); } });
      player.on('timeupdate', function (d) {
        atual = d.seconds;
        if (!concluida && d.percent >= 0.9) { concluida = true; salvar(true); if (op.aoConcluir) op.aoConcluir(); H.ev('hub_aula_concluida', { aula_id: op.aula }); }
        else salvar(false);
      });
      player.on('pause', function () { salvar(true); });
      player.on('ended', function () { fim.style.display = 'flex'; salvar(true); });
    }
    fim.querySelector('.eoj-denovo').addEventListener('click', function () { fim.style.display = 'none'; if (player) player.setCurrentTime(0).then(function () { return player.play(); }).catch(function () {}); });
    window.addEventListener('pagehide', function () { salvar(true); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') salvar(true); });
    if (window.Vimeo && window.Vimeo.Player) ligar();
    else { var s = document.createElement('script'); s.src = 'https://player.vimeo.com/api/player.js'; s.onload = ligar; document.head.appendChild(s); }
    function posicionar() {
      var slot = document.querySelector('[data-player-slot]');
      if (!slot || !slot.offsetParent) { host.style.display = 'none'; return; }
      var r = slot.getBoundingClientRect();
      host.style.display = 'block'; host.style.fontFamily = getComputedStyle(slot).fontFamily;
      host.style.top = (r.top + window.scrollY) + 'px'; host.style.left = (r.left + window.scrollX) + 'px';
      host.style.width = r.width + 'px'; host.style.height = r.height + 'px';
    }
    window.addEventListener('resize', posicionar);
    if (window.ResizeObserver) new ResizeObserver(posicionar).observe(document.body);
    posicionar();
    return {
      posicionar: posicionar,
      tempo: function () { return Math.floor(atual); },
      ir: function (seg) {
        fim.style.display = 'none';
        var slot = document.querySelector('[data-player-slot]');
        if (slot && slot.getBoundingClientRect().top < 0) slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (player) player.setCurrentTime(seg).then(function () { return player.play(); }).catch(function () {});
      }
    };
  };
})();
