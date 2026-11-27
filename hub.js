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
  var AULA_COLS = 'id,titulo,duracao_seg,ordem,publicado_em,momento,escopo';
  H.cursos = function () {
    return sb.from('cursos').select('id,slug,titulo,descricao,capa,carga_horaria,tipo,formato,gratuito,ordem,clube_id,modulos(id,titulo,ordem,oculto,capa,aulas(id))')
      .order('ordem').order('titulo').then(ok).then(function (cs) { (cs || []).forEach(function (c) { c.modulos = (c.modulos || []).filter(function (m) { return !m.oculto; }); }); return cs; });
  };
  H.curso = function (filtro) {
    var q = sb.from('cursos').select('id,slug,titulo,descricao,capa,carga_horaria,tipo,formato,gratuito,modulos(id,titulo,ordem,oculto,capa,fora_certificado,aulas(' + AULA_COLS + '))');
    q = typeof filtro === 'number' ? q.eq('id', filtro) : q.eq('slug', filtro);
    return q.maybeSingle().then(ok).then(function (c) {
      if (!c) return null;
      c.modulos = (c.modulos || []).filter(function (m) { return !m.oculto; }).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; });
      c.modulos.forEach(function (m) { m.aulas = (m.aulas || []).sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; }); });
      c.aulas = []; c.modulos.forEach(function (m) { m.aulas.forEach(function (a) { a.modulo = m; c.aulas.push(a); }); });
      return c;
    });
  };
  // Arrastar aulas para mudar a ordem (só admin vê a alça [data-pega]). Um tratador por página.
  var tratadorArrasto = null;
  H.aoArrastarAulas = function (fn) { tratadorArrasto = fn; instalarArrasto(); };
  H.reordenarAulas = function (raiz, ids, movido) {
    if (!raiz || !raiz.modulos) return Promise.resolve(false);
    var porId = {}; raiz.modulos.forEach(function (m) { m.aulas.forEach(function (a) { porId[a.id] = a; a._mod = m.id; }); });
    var mv = porId[movido]; if (!mv) return Promise.resolve(false);
    var lista = ids.map(function (i) { return porId[i]; }).filter(function (a) { return a && a._mod === mv._mod; });
    var ords = lista.map(function (a) { return a.ordem; }).sort(function (x, y) { return x - y; });
    var distintos = ords.every(function (o, k) { return !k || o > ords[k - 1]; });
    if (!distintos) ords = ords.map(function (o, k) { return (ords[0] || 1) + k; });
    var mud = [];
    lista.forEach(function (a, k) { if (a.ordem !== ords[k]) { a.ordem = ords[k]; mud.push(a); } });
    var o = function (x, y) { return x.ordem - y.ordem || x.id - y.id; };
    raiz.modulos.forEach(function (m) { m.aulas.sort(o); });
    if (raiz.tema) raiz.aulas.sort(o); else { raiz.aulas = []; raiz.modulos.forEach(function (m) { m.aulas.forEach(function (x) { raiz.aulas.push(x); }); }); }
    return mud.length ? H.salvarOrdem(mud).then(function () { return true; }) : Promise.resolve(false);
  };
  var arrastoOk = false;
  function instalarArrasto() {
    if (arrastoOk) return; arrastoOk = true;
    var ar = null;
    function irmaos(li) { return [].slice.call(li.parentNode.children).filter(function (x) { return x.matches && x.matches('li[data-aid]'); }); }
    function limpar() { if (!ar) return; ar.li.classList.remove('hub-arrastando'); ar.marca.remove(); ar.fant.remove(); document.body.style.cursor = ''; ar = null; }
    function alvo(y) {
      var lis = irmaos(ar.li), pos = lis.length, r;
      for (var i = 0; i < lis.length; i++) { r = lis[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { pos = i; break; } }
      var ref = lis[Math.min(pos, lis.length - 1)].getBoundingClientRect(), topo = pos < lis.length ? ref.top - 2 : ref.bottom + 1;
      ar.marca.style.left = ref.left + 'px'; ar.marca.style.width = ref.width + 'px'; ar.marca.style.top = topo + 'px'; ar.pos = pos;
    }
    function soltar(li, pos) {
      var lis = irmaos(li), ids = lis.map(function (x) { return +x.getAttribute('data-aid'); }), de = lis.indexOf(li), id = ids[de];
      if (pos > de) pos--; if (pos === de || de < 0) return;
      ids.splice(de, 1); ids.splice(pos, 0, id);
      if (tratadorArrasto) tratadorArrasto(ids, id);
    }
    document.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('[data-pega]'); if (!h || e.button) return;
      var li = h.closest('li[data-aid]'); if (!li) return;
      e.preventDefault(); e.stopPropagation();
      var marca = document.createElement('div'); marca.className = 'hub-marca'; document.body.appendChild(marca);
      var fant = document.createElement('div'); fant.className = 'hub-fantasma'; var t = li.querySelector('a'); fant.textContent = (t ? t.textContent : '').replace(/\s+/g, ' ').trim(); document.body.appendChild(fant);
      ar = { li: li, marca: marca, fant: fant, pos: null, y0: e.clientY };
      li.classList.add('hub-arrastando'); document.body.style.cursor = 'grabbing';
      fant.style.left = (e.clientX + 14) + 'px'; fant.style.top = (e.clientY - 18) + 'px'; alvo(e.clientY);
    }, true);
    document.addEventListener('pointermove', function (e) {
      if (!ar) return; e.preventDefault();
      ar.fant.style.left = (e.clientX + 14) + 'px'; ar.fant.style.top = (e.clientY - 18) + 'px'; alvo(e.clientY);
      if (e.clientY < 70) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
    });
    document.addEventListener('pointerup', function () { if (!ar) return; var li = ar.li, pos = ar.pos; limpar(); if (pos != null) soltar(li, pos); });
    document.addEventListener('pointercancel', limpar);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') return limpar();
      var h = e.target.closest && e.target.closest('[data-pega]'); if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault(); var li = h.closest('li[data-aid]'), lis = irmaos(li), de = lis.indexOf(li), aid = li.getAttribute('data-aid');
      var pos = e.key === 'ArrowUp' ? de - 1 : de + 2; if (pos < 0 || pos > lis.length) return;
      soltar(li, pos);
      setTimeout(function () { var x = document.querySelector('[data-pega="' + aid + '"]'); if (x) x.focus(); }, 120);
    });
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-pega]')) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  H.salvarOrdem = function (aulas) { return Promise.all(aulas.map(function (a) { return sb.from('aulas').update({ ordem: a.ordem }).eq('id', a.id).select('id').then(ok).then(function (r) { if (!r || !r.length) throw new Error('sem permissão para mudar a ordem'); }); })); };
  // Cursos cujos módulos são temas independentes (cada módulo vira um card na área do aluno)
  H.TEMAS = { masterclasses: 1 };
  H.porTema = function (c) { return !!(c && H.TEMAS[c.slug]); };
  H.nomeTema = function (t) { if (/^master\s*class(es)?\s+de\s/i.test(t || '')) return String(t); return String(t || '').replace(/^master\s*class(es)?\s*[-–:]?\s*/i, '').replace(/^./, function (x) { return x.toUpperCase(); }); };
  H.soModulo = function (c, mid) {
    var m = (c.modulos || []).filter(function (x) { return x.id === mid; })[0];
    if (!m) return null;
    var d = Object.assign({}, c, { modulos: [m], aulas: m.aulas.slice(), tema: m, titulo: H.nomeTema(m.titulo), cursoTitulo: c.titulo });
    return d;
  };
  // Divide uma lista de aulas em módulos sempre que a numeração dos títulos recomeça em 1 ("1. Introduction")
  H.grupos = function (aulas) {
    var gs = [];
    (aulas || []).forEach(function (a) {
      var n = /^\s*(\d+)\s*[.)\-–]/.exec(a.titulo || '');
      if (!gs.length || (n && +n[1] === 1 && gs[gs.length - 1].aulas.length)) gs.push({ aulas: [] });
      gs[gs.length - 1].aulas.push(a);
    });
    gs.forEach(function (g, i) { g.n = i + 1; });
    return gs;
  };
  H.MOMENTOS = [['org_ofensiva', 'Organização ofensiva'], ['org_defensiva', 'Organização defensiva'], ['trans_ofensiva', 'Transição ofensiva'], ['trans_defensiva', 'Transição defensiva'], ['bolas_paradas', 'Bolas paradas'], ['treino', 'Treino']];
  H.ESCOPOS = [['coletiva', 'Tática coletiva'], ['individual', 'Tática individual']];
  H.OCULTOS_HUB = { 'material-complementar': 1 };
  H.artigos = function () { return sb.from('artigos').select('id,titulo,autores,ano,tema,resumo,arquivo,tamanho_kb,criado_em').eq('publicado', true).order('criado_em', { ascending: false }).then(ok); };
  H.abrirArtigo = function (a) {
    var w = window.open('', '_blank');
    return sb.storage.from('artigos').createSignedUrl(a.arquivo, 900).then(ok).then(function (u) { if (w) w.location = u.signedUrl; else location.assign(u.signedUrl); H.ev('hub_artigo', { artigo: a.id }); })
      .catch(function (e) { if (w) w.close(); throw e; });
  };
  H.aula = function (id) {
    return sb.from('aulas').select('id,titulo,descricao,duracao_seg,modulo_id,modulos(curso_id)').eq('id', id).maybeSingle().then(ok);
  };
  H.recentes = function (n) { return sb.rpc('conteudos_recentes', { lim: n || 12 }).then(ok); };

  // ---------- Busca e sugestões ----------
  H.trechos = function (q) { return sb.rpc('buscar_trechos', { q: q, lim: 30 }).then(ok); };
  // ---------- Clubes parceiros (aba visível só para os e-mails do clube e para o admin) ----------
  H.meusClubes = function () { return B.user ? sb.rpc('meus_clubes').then(ok).then(function (r) { return r || []; }) : Promise.resolve([]); };
  H.clubeConteudo = function (id) {
    return Promise.all([
      sb.from('clube_recados').select('id,texto,criado_em').eq('clube_id', id).order('criado_em', { ascending: false }).then(ok),
      sb.from('clube_arquivos').select('id,titulo,caminho,tamanho,criado_em').eq('clube_id', id).order('criado_em', { ascending: false }).then(ok)
    ]).then(function (r) { return { recados: r[0] || [], arquivos: r[1] || [] }; });
  };
  H.abrirArquivoClube = function (a) {
    var w = window.open('', '_blank');
    return sb.storage.from('clubes').createSignedUrl(a.caminho, 900).then(ok).then(function (u) { if (w) w.location = u.signedUrl; else location.assign(u.signedUrl); H.ev('hub_clube_arquivo', { arquivo: a.id }); })
      .catch(function (e) { if (w) w.close(); throw e; });
  };
  H.ehPremium = function () { return B.user ? sb.rpc('eh_premium').then(function (r) { return !!r.data; }) : Promise.resolve(false); };
  H.perguntar = function (q) { return sb.functions.invoke('ia', { body: { acao: 'pergunta', pergunta: q } }).then(function (r) { if (r.error) throw r.error; H.ev('hub_ia_pergunta'); return r.data || {}; }); };
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
  H.meuCertificadoTrilha = function (t) { return B.user ? sb.from('certificados').select('codigo').eq('usuario_id', B.user.id).eq('trilha_id', t).maybeSingle().then(ok) : Promise.resolve(null); };
  H.emitirCertificadoTrilha = function (t) { return sb.rpc('emitir_certificado_trilha', { t: t }).then(ok).then(function (cod) { H.ev('hub_certificado_trilha', { trilha: t }); return cod; }); };
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

/* Janela de compra: ao clicar em conteúdo bloqueado (links /cursos/... dentro da área do aluno),
   mostra as opções (curso avulso, Basic, Premium) em vez de mandar direto para a página de venda. */
(function () {
  'use strict';
  if (!/^\/hub(\/|$)/.test(location.pathname)) return;
  var HM = 'https://pay.hotmart.com/T89761885Q?off=';
  var LINK = { basic: HM + 'l30o64an', anual: HM + '4kfotxvj', mensal: HM + 'foqitieg&bid=1704899286192' };
  var VENDA = { 'atuacao-profissional': 'consultoria', 'masterclasses': '' };
  var css = '.pw-bg{position:fixed;inset:0;z-index:80;background:rgba(17,17,17,.7);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.pw{position:relative;background:#F5F5F5;border-radius:18px;max-width:820px;width:100%;max-height:92vh;overflow:auto;font-family:Montserrat,"Helvetica Neue",Arial,sans-serif;color:#111111;box-shadow:0 30px 80px rgba(0,0,0,.45)}' +
    '.pw *{box-sizing:border-box;font-family:inherit}' +
    '.pw-topo{background:#111111;color:#FFFFFF;padding:28px 30px 26px;border-radius:18px 18px 0 0}' +
    '.pw-eb{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#A1C4E6}' +
    '.pw h2{margin:0;font-size:30px;font-weight:800;line-height:1.05;text-transform:uppercase;color:#FFFFFF;padding-right:40px}' +
    '.pw-topo p{margin:10px 0 0;font-size:15px;line-height:1.5;color:#CCCCCC}.pw-topo strong{color:#FFFFFF}' +
    '.pw-x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:99px;border:1px solid #333333;background:#1C1C1C;color:#FFFFFF;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}.pw-x:hover{border-color:#A1C4E6}' +
    '.pw-corpo{padding:22px 30px 26px;display:flex;flex-direction:column;gap:14px}' +
    '.pw-op{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}' +
    '.pw-c{background:#FFFFFF;border:1px solid #E2E2E2;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:8px}' +
    '.pw-c.dest{background:#111111;border-color:#111111;color:#FFFFFF;position:relative}' +
    '.pw-c b{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#4A79A6}.pw-c.dest b{color:#A1C4E6}' +
    '.pw-c .v{font-size:30px;font-weight:800;line-height:1.05;letter-spacing:-.01em}.pw-c .v.t{font-size:20px;text-transform:uppercase}.pw-c .v small{font-size:13px;font-weight:600;color:#777777;letter-spacing:0}.pw-c.dest .v small{color:#BBBBBB}' +
    '.pw-c span{font-size:14px;line-height:1.5;color:#555555}.pw-c.dest span{color:#CCCCCC}' +
    '.pw-tag{position:absolute;top:16px;right:16px;background:#FFD400;color:#111111;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:99px}' +
    '.pw-c a{margin-top:auto;display:inline-flex;justify-content:center;align-items:center;gap:8px;text-decoration:none;font-weight:700;font-size:15px;padding:13px 16px;border-radius:10px;background:#111111;color:#FFFFFF}.pw-c a:hover{background:#333333}' +
    '.pw-c.dest a{background:#A1C4E6;color:#111111}.pw-c.dest a:hover{background:#B9D4EE}' +
    '.pw-nota{margin:0;font-size:13px;line-height:1.5;color:#555555;background:#FFFFFF;border:1px solid #E2E2E2;border-left:4px solid #FFD400;border-radius:0;padding:10px 14px}' +
    '.pw-rod{margin:0;font-size:13px;line-height:1.5;color:#555555}.pw-rod a{color:#3A6894;font-weight:700}' +
    '@media (max-width:600px){.pw-topo{padding:22px 20px}.pw h2{font-size:23px}.pw-corpo{padding:18px 20px 22px}}';
  function abrir(slug, href) {
    var B = window.EOJB, H = window.EOJH;
    var venda = slug in VENDA ? VENDA[slug] : slug;
    B.sb.from('cursos').select('titulo,plano_basic').eq('slug', slug).maybeSingle().then(function (r) {
      var c = (r && r.data) || { titulo: '', plano_basic: slug === 'masterclasses' };
      var op = [];
      if (venda) op.push('<div class="pw-c"><b>Curso avulso</b><div class="v t">' + esc(c.titulo || 'Este curso') + '</div><span>Acesso por 12 meses a este curso, com certificado.</span><a data-pw="curso" href="/cursos/' + venda + '">Ver preço e comprar</a></div>');
      if (c.plano_basic) op.push('<div class="pw-c"><b>Basic</b><div class="v">R$ 19,99<small> /mês</small></div><span>Todas as masterclasses + novas todo mês.</span><a data-pw="basic" href="' + LINK.basic + '">Assinar o Basic</a></div>');
      op.push('<div class="pw-c dest"><span class="pw-tag">Mais completo</span><b>EOJHub Premium</b><div class="v">R$ 111,90<small> /mês no anual</small></div><span>Todos os cursos, masterclasses e conteúdos novos. Mensal: R$ 159,90.</span><a data-pw="premium" href="' + LINK.anual + '">Assinar o Premium →</a></div>');
      var bg = document.createElement('div'); bg.className = 'pw-bg'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-modal', 'true'); bg.setAttribute('aria-labelledby', 'pw-t');
      bg.innerHTML = '<style>' + css + '</style><div class="pw"><button type="button" class="pw-x" data-pw-x aria-label="Fechar">✕</button>' +
        '<div class="pw-topo"><p class="pw-eb">Conteúdo exclusivo</p><h2 id="pw-t">Este conteúdo não está no seu plano</h2><p>' + (c.titulo ? 'Ele faz parte de <strong>' + esc(c.titulo) + '</strong>. ' : '') + 'Escolha como liberar:</p></div>' +
        '<div class="pw-corpo"><div class="pw-op">' + op.join('') + '</div>' +
        '<p class="pw-nota">Já é Basic? Depois de assinar o Premium, cancele o Basic na Hotmart (ele não é cancelado sozinho) ou fale com a gente.</p>' +
        '<p class="pw-rod">Já comprou? Confira se entrou com o mesmo e-mail da compra na Hotmart. Dúvidas: <a href="https://api.whatsapp.com/send?phone=6282113761580" target="_blank" rel="noopener">fale com a gente no WhatsApp</a> · <a href="/eojhub">comparar os planos</a></p></div></div>';
      document.body.appendChild(bg);
      var x = bg.querySelector('[data-pw-x]'); x.focus();
      function fechar() { bg.remove(); document.removeEventListener('keydown', esc1); }
      function esc1(e) { if (e.key === 'Escape') fechar(); }
      document.addEventListener('keydown', esc1);
      bg.addEventListener('click', function (e) {
        if (e.target === bg || e.target.closest('[data-pw-x]')) return fechar();
        var a = e.target.closest('[data-pw]'); if (a && H) H.ev('paywall_clique', { opcao: a.getAttribute('data-pw'), curso: slug });
      });
      if (H) H.ev('paywall_abriu', { curso: slug });
    });
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/cursos/"]');
    if (!a || a.closest('.pw, header, footer, nav') || e.ctrlKey || e.metaKey) return;
    var m = /^\/cursos\/([a-z0-9-]+)/.exec(a.getAttribute('href')); if (!m) return;
    e.preventDefault(); abrir(m[1], a.getAttribute('href'));
  }, true);
})();

// ---------- Aviso para quem é Basic (todas as páginas do /hub) ----------
(function () {
  if (!/^\/(es\/|en\/)?hub(\/|$)/.test(location.pathname) || /\/hub\/(admin|certificado)/.test(location.pathname)) return;
  var LG = (/^\/(es|en)\//.exec(location.pathname) || [])[1] || 'pt';
  var T = {
    pt: { so: '<b>Já é Basic?</b> Se assinar o Premium, cancele o Basic na Hotmart depois: ele não é cancelado sozinho. Dúvidas? Fale com a gente pelo chat.',
          dois: '<b>Você tem o Basic e o Premium ativos.</b> O Premium já inclui tudo do Basic: cancele o Basic na Hotmart para não pagar duas vezes, ou fale com a gente pelo chat.',
          como: 'Como cancelar', x: 'Fechar aviso' },
    es: { so: '<b>¿Ya eres Basic?</b> Si te suscribes al Premium, cancela el Basic en Hotmart después: no se cancela solo. ¿Dudas? Escríbenos por el chat.',
          dois: '<b>Tienes Basic y Premium activos.</b> El Premium ya incluye todo el Basic: cancela el Basic en Hotmart para no pagar dos veces, o escríbenos por el chat.',
          como: 'Cómo cancelar', x: 'Cerrar aviso' },
    en: { so: '<b>Already on Basic?</b> If you subscribe to Premium, cancel Basic on Hotmart afterwards: it is not cancelled automatically. Questions? Message us in the chat.',
          dois: '<b>You have both Basic and Premium active.</b> Premium already includes everything in Basic: cancel Basic on Hotmart so you don\'t pay twice, or message us in the chat.',
          como: 'How to cancel', x: 'Close notice' }
  }[LG];
  function mostrar(dois) {
    var chave = 'eojAvisoBasic' + (dois ? '2' : '1');
    try { if (sessionStorage.getItem(chave)) return; } catch (e) {}
    var d = document.createElement('div'); d.id = 'eoj-aviso-basic'; d.setAttribute('role', 'status');
    d.style.cssText = 'background:' + (dois ? '#FDE7E7' : '#FFF4DC') + ';color:#3A2A00;border-bottom:1px solid ' + (dois ? '#F2B8B5' : '#F0D9A0') + ';font:14px/1.45 Montserrat,Inter,system-ui,sans-serif;padding:10px 48px 10px 20px;position:relative;text-align:center';
    d.innerHTML = '<span>' + (dois ? T.dois : T.so) + '</span> <a href="https://help.hotmart.com/pt-br/article/115002183968" target="_blank" rel="noopener" style="color:#4A79A6;font-weight:700;margin-left:6px">' + T.como + ' →</a>' +
      '<button type="button" aria-label="' + T.x + '" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;font-size:20px;line-height:1;cursor:pointer;color:#3A2A00;padding:4px 8px">×</button>';
    d.querySelector('button').onclick = function () { d.remove(); try { sessionStorage.setItem(chave, '1'); } catch (e) {} };
    var menu = document.getElementById('menu-principal'), cab = menu && (menu.closest('header') || menu.parentElement);
    if (cab && cab.parentElement && getComputedStyle(cab).position !== 'fixed') cab.parentElement.insertBefore(d, cab.nextSibling);
    else document.body.insertBefore(d, document.body.firstChild);
  }
  function iniciar() {
    var B = window.EOJB; if (!B || !B.ready) return setTimeout(iniciar, 400);
    B.ready.then(function () {
      if (!B.user) return;
      B.sb.rpc('meus_planos').then(function (r) { var p = r && r.data; if (p && p.basic) mostrar(!!p.premium); });
    });
  }
  if (document.readyState === 'complete') setTimeout(iniciar, 300); else window.addEventListener('load', function () { setTimeout(iniciar, 300); });
})();

/* QR Code (c) 2009 Kazuhiko Arase, MIT license — empacotado de qrcode-terminal/vendor. EOJQR.svg(texto) devolve um <svg>. */
(function () {
var M = {};
function req(n) { n = n.replace("./", ""); return M[n]; }
M["QRMode"] = (function () { var module = { exports: {} }, exports = module.exports;
module.exports = {
    MODE_NUMBER :       1 << 0,
    MODE_ALPHA_NUM :    1 << 1,
    MODE_8BIT_BYTE :    1 << 2,
    MODE_KANJI :        1 << 3
};

return module.exports; })();
M["QRMath"] = (function () { var module = { exports: {} }, exports = module.exports;
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

module.exports = QRMath;

return module.exports; })();
M["QRErrorCorrectLevel"] = (function () { var module = { exports: {} }, exports = module.exports;
module.exports = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};


return module.exports; })();
M["QRMaskPattern"] = (function () { var module = { exports: {} }, exports = module.exports;
module.exports = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

return module.exports; })();
M["QRBitBuffer"] = (function () { var module = { exports: {} }, exports = module.exports;
function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};

module.exports = QRBitBuffer;

return module.exports; })();
M["QR8bitByte"] = (function () { var module = { exports: {} }, exports = module.exports;
var QRMode = req('./QRMode');

function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};

module.exports = QR8bitByte;

return module.exports; })();
M["QRPolynomial"] = (function () { var module = { exports: {} }, exports = module.exports;
var QRMath = req('./QRMath');

function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};

module.exports = QRPolynomial;

return module.exports; })();
M["QRRSBlock"] = (function () { var module = { exports: {} }, exports = module.exports;
var QRErrorCorrectLevel = req('./QRErrorCorrectLevel');

function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

module.exports = QRRSBlock;

return module.exports; })();
M["QRUtil"] = (function () { var module = { exports: {} }, exports = module.exports;
var QRMode = req('./QRMode');
var QRPolynomial = req('./QRPolynomial');
var QRMath = req('./QRMath');
var QRMaskPattern = req('./QRMaskPattern');

var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};

module.exports = QRUtil;

return module.exports; })();
M["index"] = (function () { var module = { exports: {} }, exports = module.exports;
//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
// Modified to work in node for this project (and some refactoring)
//---------------------------------------------------------------------

var QR8bitByte = req('./QR8bitByte');
var QRUtil = req('./QRUtil');
var QRPolynomial = req('./QRPolynomial');
var QRRSBlock = req('./QRRSBlock');
var QRBitBuffer = req('./QRBitBuffer');

function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};

module.exports = QRCode;

return module.exports; })();
var QRCode = M["index"], L = M["QRErrorCorrectLevel"];
window.EOJQR = { svg: function (txt, cor) {
  var q; for (var t = 3; t <= 12; t++) { try { q = new QRCode(t, L.M); q.addData(txt); q.make(); break; } catch (e) { q = null; } }
  if (!q) return '';
  var n = q.getModuleCount(), p = '';
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) p += 'M' + (c + 2) + ' ' + (r + 2) + 'h1v1h-1z';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR code de verificação"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="' + p + '" fill="' + (cor || '#111111') + '"/></svg>';
} };
})();