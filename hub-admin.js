/* Painel da Área do aluno (/hub/admin): cursos, módulos, aulas, materiais (com envio de arquivo), produtos da Hotmart,
   acessos manuais e notificações recebidas. Só funciona para admin (as regras do banco bloqueiam os demais). */
(function () {
  'use strict';
  var B = window.EOJB, sb = B.sb, raiz, st = { cursos: [], aberto: null, aba: 'cursos' };
  function ok(r) { if (r.error) throw r.error; return r.data; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function aviso(t, erro) { var a = raiz.querySelector('.ha-aviso'); a.textContent = t; a.style.background = erro ? '#8C1D18' : '#111111'; a.style.display = 'block'; clearTimeout(aviso.t); aviso.t = setTimeout(function () { a.style.display = 'none'; }, 3500); }
  function falha(e) { aviso(B.msg ? B.msg(e) : String(e && e.message || e), true); }
  var CSS = '.ha{display:flex;flex-direction:column;gap:18px}.ha-tabs{display:flex;flex-wrap:wrap;gap:6px;border-bottom:1px solid #E2E2E2}' +
    '.ha-tab{font:inherit;font-size:15px;font-weight:600;background:none;border:0;border-bottom:3px solid transparent;padding:12px 10px;cursor:pointer;color:#555555}.ha-tab[aria-selected="true"]{color:#111111;border-bottom-color:#4A79A6}' +
    '.ha-box{background:#FFFFFF;border:1px solid #E2E2E2;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px}' +
    '.ha-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ha-in{font:inherit;font-size:14px;padding:8px 10px;border:1.5px solid #CCCCCC;border-radius:8px;background:#FFFFFF;min-width:0}' +
    '.ha-b{font:inherit;font-size:14px;font-weight:600;background:#FFFFFF;border:1.5px solid #CCCCCC;border-radius:8px;padding:8px 12px;cursor:pointer;color:#111111}.ha-b:hover{border-color:#4A79A6}' +
    '.ha-p{font:inherit;font-size:14px;font-weight:700;background:#A1C4E6;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;color:#111111}.ha-x{color:#8C1D18}' +
    '.ha-chk{display:inline-flex;gap:6px;align-items:center;font-size:14px}.ha-chk input{width:17px;height:17px;margin:0;accent-color:#4A79A6}' +
    '.ha table{width:100%;border-collapse:collapse;font-size:14px}.ha th{text-align:left;font-size:12px;color:#555555;text-transform:uppercase;letter-spacing:.05em;padding:6px;border-bottom:1px solid #E2E2E2}.ha td{padding:6px;border-bottom:1px solid #F0F0F0;vertical-align:top}' +
    '.ha-mod{border:1px solid #E2E2E2;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px;background:#FAFAFA}' +
    '.ha-aula{background:#FFFFFF;border:1px solid #E8E8E8;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px}' +
    '.ha-aviso{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);color:#FFFFFF;padding:12px 18px;border-radius:10px;font-size:15px;z-index:60;display:none}';

  function tabs() {
    var T = [['cursos', 'Cursos e aulas'], ['hotmart', 'Produtos da Hotmart'], ['acessos', 'Acessos'], ['eventos', 'Notificações da Hotmart'], ['sugestoes', 'Sugestões dos alunos'], ['trilhas', 'Trilhas'], ['filtros', 'Filtros das masterclasses'], ['almanaque', 'Almanaque de artigos'], ['engajamento', 'Engajamento']];
    return '<div class="ha-tabs" role="tablist">' + T.map(function (t) { return '<button type="button" role="tab" class="ha-tab" data-aba="' + t[0] + '" aria-selected="' + (st.aba === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function desenhar() {
    var c = raiz.querySelector('.ha-corpo'); raiz.querySelector('.ha-tabs-w').innerHTML = tabs();
    if (st.aba === 'cursos') return st.aberto ? cursoAberto(c) : listaCursos(c);
    if (st.aba === 'hotmart') return hotmart(c);
    if (st.aba === 'acessos') return acessos(c);
    if (st.aba === 'eventos') return eventos(c);
    if (st.aba === 'sugestoes') return sugestoes(c);
    if (st.aba === 'trilhas') return trilhas(c);
    if (st.aba === 'engajamento') return engajamento(c);
    if (st.aba === 'almanaque') return almanaque(c);
    if (st.aba === 'filtros') return filtrosMc(c);
  }

  // ---------- Cursos ----------
  function carregarCursos() { return sb.from('cursos').select('*').order('ordem').order('id').then(ok).then(function (d) { st.cursos = d; }); }
  function listaCursos(c) {
    c.innerHTML = '<div class="ha-box" data-vimeo-box><b style="font-size:18px">Vídeos das aulas no Vimeo</b><p style="margin:0;font-size:14px;color:#555555">Autoriza o domínio entendendoojogo.com.br em todos os vídeos das aulas (necessário uma vez, depois da troca para o /hub). Leva alguns minutos; deixe esta aba aberta.</p><div class="ha-row"><button type="button" class="ha-p" data-liberar-vimeo>Liberar vídeos no site novo</button><span data-vimeo-st style="font-size:14px"></span></div>' +
      '<div class="ha-row"><button type="button" class="ha-b" data-duracoes>Buscar a duração das aulas no Vimeo</button><span data-dur-st style="font-size:14px"></span></div>' +
      '<div class="ha-row"><button type="button" class="ha-b" data-transcricoes>Preparar o índice das aulas (legendas do Vimeo)</button><span data-tr-st style="font-size:14px"></span></div>' +
      '<div class="ha-row"><button type="button" class="ha-p" data-transcricoes-todas>Ler a legenda de TODAS as aulas (as que faltam)</button><span data-trt-st style="font-size:14px"></span></div>' +
      '<p style="margin:0;font-size:13px;color:#555555">Lê a legenda automática do Vimeo das aulas das trilhas e das aulas gratuitas e guarda um resumo para o Claude sugerir os marcadores de minuto. Não muda nada para os alunos.</p></div>' +
      '<div class="ha-box"><div class="ha-row" style="justify-content:space-between"><b style="font-size:18px">Cursos (' + st.cursos.length + ')</b><button type="button" class="ha-p" data-novo-curso>+ Novo curso</button></div>' +
      '<p style="margin:0;font-size:13px;color:#555555">Só aparecem para os alunos os cursos marcados como publicados. "Basic" = incluído no plano Basic. "Grátis" = aberto para qualquer conta.</p>' +
      '<table><thead><tr><th>Curso</th><th>Tipo</th><th>Publicado</th><th>Grátis</th><th>Basic</th><th></th></tr></thead><tbody>' +
      st.cursos.map(function (k) {
        return '<tr data-curso="' + k.id + '"><td><input class="ha-in" data-f="titulo" value="' + esc(k.titulo) + '" style="width:100%"><div style="font-size:12px;color:#777777;margin-top:3px">/hub/curso?c=' + esc(k.slug) + (k.memberkit_cat ? ' · do MemberKit' : '') + '</div></td>' +
          '<td><select class="ha-in" data-f="tipo">' + ['curso', 'aula_avulsa', 'live', 'podcast'].map(function (t) { return '<option' + (k.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></td>' +
          '<td><input type="checkbox" data-f="publicado"' + (k.publicado ? ' checked' : '') + '></td><td><input type="checkbox" data-f="gratuito"' + (k.gratuito ? ' checked' : '') + '></td><td><input type="checkbox" data-f="plano_basic"' + (k.plano_basic ? ' checked' : '') + '></td>' +
          '<td style="white-space:nowrap"><button type="button" class="ha-b" data-salvar-curso="' + k.id + '">Salvar</button> <button type="button" class="ha-p" data-abrir="' + k.id + '">Abrir</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function linhaCurso(tr) {
    var d = {}; tr.querySelectorAll('[data-f]').forEach(function (i) { d[i.getAttribute('data-f')] = i.type === 'checkbox' ? i.checked : (i.value === '' ? null : i.value); });
    if (d.carga_horaria != null) d.carga_horaria = +d.carga_horaria; if (d.ordem != null) d.ordem = +d.ordem; return d;
  }
  function cursoAberto(c) {
    var k = st.cursos.filter(function (x) { return x.id === st.aberto; })[0];
    c.innerHTML = '<p style="margin:0">Carregando…</p>';
    Promise.all([sb.from('modulos').select('*').eq('curso_id', k.id).order('ordem').order('id').then(ok), sb.rpc('admin_aulas', { c: k.id }).then(ok)]).then(function (r) {
      var mods = r[0], aulas = r[1];
      var html = '<div class="ha-row"><button type="button" class="ha-b" data-voltar>← Todos os cursos</button><a class="ha-b" style="text-decoration:none" href="/hub/curso?c=' + encodeURIComponent(k.slug) + '" target="_blank" rel="noopener">Ver como aluno ↗</a></div>' +
        '<div class="ha-box" data-curso="' + k.id + '"><b style="font-size:18px">' + esc(k.titulo) + '</b>' +
        '<div class="ha-row"><label style="flex:1 1 260px">Título<br><input class="ha-in" data-f="titulo" value="' + esc(k.titulo) + '" style="width:100%"></label>' +
        '<label style="flex:0 1 220px">Endereço (slug)<br><input class="ha-in" data-f="slug" value="' + esc(k.slug) + '" style="width:100%"></label>' +
        '<label style="flex:0 1 120px">Carga horária<br><input class="ha-in" type="number" data-f="carga_horaria" value="' + esc(k.carga_horaria) + '" style="width:100%"></label>' +
        '<label style="flex:0 1 90px">Ordem<br><input class="ha-in" type="number" data-f="ordem" value="' + esc(k.ordem) + '" style="width:100%"></label></div>' +
        '<label style="max-width:360px">Formato<br><select class="ha-in" data-f="formato" style="width:100%"><option value="curso"' + (k.formato !== 'colecao' ? ' selected' : '') + '>Curso (módulos em sequência)</option><option value="colecao"' + (k.formato === 'colecao' ? ' selected' : '') + '>Coleção (conteúdos soltos por tema)</option></select></label>' +
        '<label>Capa (URL da imagem)<br><input class="ha-in" data-f="capa" value="' + esc(k.capa) + '" style="width:100%"></label>' +
        '<label>Descrição<br><textarea class="ha-in" data-f="descricao" rows="3" style="width:100%">' + esc(k.descricao) + '</textarea></label>' +
        '<div class="ha-row"><label class="ha-chk"><input type="checkbox" data-f="publicado"' + (k.publicado ? ' checked' : '') + '>Publicado</label><label class="ha-chk"><input type="checkbox" data-f="gratuito"' + (k.gratuito ? ' checked' : '') + '>Grátis</label><label class="ha-chk"><input type="checkbox" data-f="plano_basic"' + (k.plano_basic ? ' checked' : '') + '>Incluído no Basic</label>' +
        '<button type="button" class="ha-p" data-salvar-curso="' + k.id + '">Salvar curso</button></div></div>' +
        '<div class="ha-row" style="justify-content:space-between"><b style="font-size:18px">Módulos e aulas</b><button type="button" class="ha-p" data-novo-mod="' + k.id + '">+ Novo módulo</button></div>';
      html += mods.map(function (m) {
        var as = aulas.filter(function (a) { return a.modulo_id === m.id; });
        return '<div class="ha-mod" data-mod="' + m.id + '"><div class="ha-row"><input class="ha-in" data-f="ordem" type="number" value="' + m.ordem + '" style="width:64px" aria-label="Ordem"><input class="ha-in" data-f="titulo" value="' + esc(m.titulo) + '" style="flex:1 1 260px" aria-label="Título do módulo">' +
          '<button type="button" class="ha-b" data-salvar-mod="' + m.id + '">Salvar</button><button type="button" class="ha-b" data-nova-aula="' + m.id + '">+ Aula</button><button type="button" class="ha-b ha-x" data-apagar-mod="' + m.id + '">Apagar</button></div>' +
          as.map(aulaHtml).join('') + '</div>';
      }).join('');
      c.innerHTML = html;
    }).catch(falha);
  }
  function aulaHtml(a) {
    return '<div class="ha-aula" data-aula="' + a.id + '"><div class="ha-row"><input class="ha-in" data-f="ordem" type="number" value="' + a.ordem + '" style="width:64px" aria-label="Ordem">' +
      '<input class="ha-in" data-f="titulo" value="' + esc(a.titulo) + '" style="flex:1 1 260px" aria-label="Título da aula">' +
      '<input class="ha-in" data-f="vimeo_id" value="' + esc(a.vimeo_id) + '" placeholder="ID do Vimeo" style="width:120px" aria-label="ID do Vimeo">' +
      '<input class="ha-in" data-f="duracao_seg" type="number" value="' + esc(a.duracao_seg) + '" placeholder="seg" style="width:80px" aria-label="Duração em segundos">' +
      '<label class="ha-chk"><input type="checkbox" data-f="publicado"' + (a.publicado ? ' checked' : '') + '>Publicada</label></div>' +
      '<textarea class="ha-in" data-f="descricao" rows="2" placeholder="Descrição da aula" aria-label="Descrição">' + esc(a.descricao) + '</textarea>' +
      '<div class="ha-row"><button type="button" class="ha-b" data-salvar-aula="' + a.id + '">Salvar aula</button><button type="button" class="ha-b" data-materiais="' + a.id + '">Materiais</button><button type="button" class="ha-b" data-marcs="' + a.id + '">Índice (marcadores)</button><button type="button" class="ha-b ha-x" data-apagar-aula="' + a.id + '">Apagar</button></div>' +
      '<div class="ha-mats" data-mats="' + a.id + '" style="display:none"></div><div data-marcbox="' + a.id + '" style="display:none"></div></div>';
  }
  function vals(box) {
    var d = {}; box.querySelectorAll(':scope > .ha-row [data-f], :scope > [data-f], :scope > label [data-f], :scope > .ha-row label [data-f]').forEach(function (i) {
      var v = i.type === 'checkbox' ? i.checked : (i.value === '' ? null : i.value);
      if (i.type === 'number' && v != null) v = +v; d[i.getAttribute('data-f')] = v;
    }); return d;
  }
  function materiais(aulaId) {
    var box = raiz.querySelector('[data-mats="' + aulaId + '"]');
    box.style.display = 'flex'; box.style.flexDirection = 'column'; box.style.gap = '8px'; box.innerHTML = 'Carregando…';
    sb.from('materiais').select('*').eq('aula_id', aulaId).order('ordem').order('id').then(ok).then(function (ms) {
      box.innerHTML = (ms.length ? '<ul style="margin:0;padding-left:18px;font-size:14px">' + ms.map(function (m) {
        return '<li>' + esc(m.titulo) + ' <span style="color:#777777">(' + esc(m.tipo) + (m.arquivo ? ' · arquivo' : m.vimeo_id ? ' · Vimeo ' + esc(m.vimeo_id) : m.url ? ' · link' : '') + ')</span> <button type="button" class="ha-b ha-x" style="padding:2px 8px" data-apagar-mat="' + m.id + '" data-da-aula="' + aulaId + '">Apagar</button></li>';
      }).join('') + '</ul>' : '<span style="font-size:14px;color:#777777">Nenhum material.</span>') +
        '<div class="ha-row" style="border-top:1px dashed #DDDDDD;padding-top:8px"><input class="ha-in" data-m="titulo" placeholder="Título do material" style="flex:1 1 200px">' +
        '<select class="ha-in" data-m="tipo"><option value="pdf">PDF da aula</option><option value="video">Vídeo de apoio</option><option value="relatorio_coletivo">Relatório coletivo</option><option value="relatorio_individual">Relatório individual</option><option value="artigo">Artigo científico</option><option value="outro">Outro</option></select></div>' +
        '<div class="ha-row"><input type="file" data-m="arquivo" class="ha-in" style="flex:1 1 220px"><span style="font-size:13px;color:#777777">ou</span><input class="ha-in" data-m="vimeo" placeholder="ID do Vimeo" style="width:120px"><span style="font-size:13px;color:#777777">ou</span><input class="ha-in" data-m="url" placeholder="Link" style="flex:1 1 180px">' +
        '<button type="button" class="ha-p" data-add-mat="' + aulaId + '">Adicionar material</button></div>';
    }).catch(falha);
  }
  function addMaterial(aulaId) {
    var box = raiz.querySelector('[data-mats="' + aulaId + '"]'), g = function (k) { return box.querySelector('[data-m="' + k + '"]'); };
    var titulo = g('titulo').value.trim(), tipo = g('tipo').value, file = g('arquivo').files[0], vimeo = g('vimeo').value.trim(), url = g('url').value.trim();
    if (!titulo) return aviso('Dê um título ao material.', true);
    if (!file && !vimeo && !url) return aviso('Escolha um arquivo, um ID do Vimeo ou um link.', true);
    var p = Promise.resolve(null);
    if (file) {
      var nome = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
      var caminho = st.aberto + '/' + aulaId + '/' + Date.now() + '-' + nome;
      aviso('Enviando arquivo…');
      p = sb.storage.from('materiais').upload(caminho, file, { upsert: false, contentType: file.type || undefined }).then(ok).then(function () { return caminho; });
    }
    p.then(function (caminho) {
      return sb.from('materiais').insert({ aula_id: aulaId, titulo: titulo, tipo: tipo, arquivo: caminho, vimeo_id: vimeo || null, url: caminho || vimeo ? null : url, tamanho_kb: file ? Math.round(file.size / 1024) : null }).then(ok);
    }).then(function () { aviso('Material adicionado'); materiais(aulaId); }).catch(falha);
  }

  // ---------- Hotmart ----------
  function hotmart(c) {
    c.innerHTML = 'Carregando…';
    Promise.all([sb.from('produtos_hotmart').select('*').order('nome').then(ok), sb.from('modulos').select('id,titulo,curso_id').order('curso_id').order('ordem').then(ok)]).then(function (r) {
      var ps = r[0], mods = r[1];
      function destinoSel(p) {
        var o = '<option value="">— escolha —</option><option value="plano:premium"' + (p && p.plano === 'premium' ? ' selected' : '') + '>Plano Premium (tudo)</option><option value="plano:basic"' + (p && p.plano === 'basic' ? ' selected' : '') + '>Plano Basic</option>';
        o += st.cursos.map(function (k) { return '<option value="curso:' + k.id + '"' + (p && p.curso_id === k.id ? ' selected' : '') + '>Curso: ' + esc(k.titulo) + '</option>'; }).join('');
        o += mods.map(function (m) { var k = st.cursos.filter(function (x) { return x.id === m.curso_id; })[0]; return '<option value="modulo:' + m.id + '"' + (p && p.modulo_id === m.id ? ' selected' : '') + '>Módulo: ' + esc((k ? k.titulo + ' › ' : '') + m.titulo) + '</option>'; }).join('');
        return '<select class="ha-in" data-p="destino" style="max-width:360px">' + o + '</select>';
      }
      c.innerHTML = '<div class="ha-box"><b style="font-size:18px">O que cada produto da Hotmart libera</b>' +
        '<p style="margin:0;font-size:13px;color:#555555;line-height:1.5">Produto = ID do produto na Hotmart. Para diferenciar ofertas do mesmo produto (ex.: mensal e anual), use "ID:código da oferta". Meses = duração do acesso; vazio = vitalício ou enquanto a assinatura estiver ativa.</p>' +
        '<table><thead><tr><th>Produto</th><th>Nome</th><th>Libera</th><th>Meses</th><th></th></tr></thead><tbody>' +
        ps.concat([{ produto: '', nome: '', novo: true }]).map(function (p) {
          return '<tr data-prod="' + esc(p.produto) + '"><td><input class="ha-in" data-p="produto" value="' + esc(p.produto) + '" style="width:130px"' + (p.novo ? '' : ' readonly') + '></td><td><input class="ha-in" data-p="nome" value="' + esc(p.nome) + '" style="width:100%"></td><td>' + destinoSel(p.novo ? null : p) + '</td>' +
            '<td><input class="ha-in" type="number" data-p="meses" value="' + esc(p.meses) + '" style="width:70px"></td><td style="white-space:nowrap"><button type="button" class="ha-p" data-salvar-prod>' + (p.novo ? 'Adicionar' : 'Salvar') + '</button>' + (p.novo ? '' : ' <button type="button" class="ha-b ha-x" data-apagar-prod>Apagar</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).catch(falha);
  }
  function salvarProduto(tr) {
    var g = function (k) { return tr.querySelector('[data-p="' + k + '"]').value.trim(); }, dest = g('destino').split(':');
    var d = { produto: g('produto'), nome: g('nome') || null, meses: g('meses') ? +g('meses') : null, curso_id: null, modulo_id: null, plano: null };
    if (!d.produto) return aviso('Informe o ID do produto.', true);
    if (dest[0] === 'curso') d.curso_id = +dest[1]; else if (dest[0] === 'modulo') d.modulo_id = +dest[1]; else if (dest[0] === 'plano') d.plano = dest[1]; else return aviso('Escolha o que o produto libera.', true);
    sb.from('produtos_hotmart').upsert(d).then(ok).then(function () { aviso('Produto salvo'); hotmart(raiz.querySelector('.ha-corpo')); }).catch(falha);
  }

  // ---------- Acessos ----------
  function acessos(c) {
    c.innerHTML = '<div class="ha-box"><b style="font-size:18px">Dar acesso a um e-mail</b>' +
      '<p style="margin:0;font-size:13px;color:#555555">O acesso vale assim que a pessoa entrar (ou criar a conta) com este e-mail.</p>' +
      '<div class="ha-row"><input class="ha-in" data-a="email" type="email" placeholder="email@exemplo.com" style="flex:1 1 240px"><select class="ha-in" data-a="destino"><option value="plano:premium">Plano Premium (tudo)</option><option value="plano:basic">Plano Basic</option>' +
      st.cursos.map(function (k) { return '<option value="curso:' + k.id + '">Curso: ' + esc(k.titulo) + '</option>'; }).join('') + '</select>' +
      '<label style="font-size:13px">Até <input class="ha-in" data-a="ate" type="date"></label><button type="button" class="ha-p" data-dar-acesso>Dar acesso</button></div></div>' +
      '<div class="ha-box"><b style="font-size:18px">Consultar um e-mail</b><div class="ha-row"><input class="ha-in" data-a="busca" type="email" placeholder="email@exemplo.com" style="flex:1 1 240px"><button type="button" class="ha-b" data-buscar>Consultar</button></div><div class="ha-res"></div></div>';
  }
  function buscar() {
    var e = raiz.querySelector('[data-a="busca"]').value.trim().toLowerCase(), res = raiz.querySelector('.ha-res');
    if (!e) return;
    sb.from('acessos_email').select('*').eq('email', e).order('criado_em', { ascending: false }).then(ok).then(function (rs) {
      var nomeC = function (id) { var k = st.cursos.filter(function (x) { return x.id === id; })[0]; return k ? k.titulo : id; };
      res.innerHTML = rs.length ? '<table><thead><tr><th>Libera</th><th>Origem</th><th>Até</th><th>Ativo</th><th></th></tr></thead><tbody>' + rs.map(function (r) {
        return '<tr><td>' + esc(r.plano ? 'Plano ' + r.plano : r.curso_id ? 'Curso: ' + nomeC(r.curso_id) : 'Módulo ' + r.modulo_id) + '</td><td>' + esc(r.origem) + '</td><td>' + (r.acesso_ate ? new Date(r.acesso_ate).toLocaleDateString('pt-BR') : '—') + '</td><td>' + (r.ativo ? 'sim' : 'não') + '</td>' +
          '<td><button type="button" class="ha-b' + (r.ativo ? ' ha-x' : '') + '" data-ativo="' + r.id + '" data-v="' + (!r.ativo) + '">' + (r.ativo ? 'Retirar' : 'Reativar') + '</button></td></tr>';
      }).join('') + '</tbody></table>' : '<span style="font-size:14px;color:#777777">Nenhum acesso para este e-mail.</span>';
    }).catch(falha);
  }

  // ---------- Notificações ----------
  function eventos(c) {
    c.innerHTML = 'Carregando…';
    sb.from('hotmart_eventos').select('*').order('recebido_em', { ascending: false }).limit(80).then(ok).then(function (ev) {
      c.innerHTML = '<div class="ha-box"><b style="font-size:18px">Últimas notificações da Hotmart</b>' + (ev.length ? '<table><thead><tr><th>Quando</th><th>Evento</th><th>Produto</th><th>E-mail</th><th>Resultado</th></tr></thead><tbody>' + ev.map(function (e) {
        return '<tr><td>' + new Date(e.recebido_em).toLocaleString('pt-BR') + '</td><td>' + esc(e.evento) + '</td><td>' + esc(e.produto) + '</td><td>' + esc(e.email) + '</td><td>' + esc(e.resultado) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<span style="font-size:14px;color:#777777">Nenhuma notificação recebida ainda.</span>') + '</div>';
    }).catch(falha);
  }

  // ---------- Índice (marcadores) da aula: uma linha por marcador, "mm:ss Título" ----------
  function marcadores(aulaId) {
    var box = raiz.querySelector('[data-marcbox="' + aulaId + '"]');
    box.style.display = 'flex'; box.style.flexDirection = 'column'; box.style.gap = '8px'; box.innerHTML = 'Carregando…';
    sb.from('aula_marcadores').select('segundo,titulo').eq('aula_id', aulaId).order('segundo').then(ok).then(function (ms) {
      var txt = ms.map(function (m) { var mm = Math.floor(m.segundo / 60), ss = m.segundo % 60; return mm + ':' + (ss < 10 ? '0' : '') + ss + ' ' + m.titulo; }).join('\n');
      box.innerHTML = '<span style="font-size:13px;color:#555555">Uma linha por marcador, no formato <b>mm:ss Título</b> (ex.: 2:10 Saída de 3 com o volante). Aparece para o aluno como “Índice da aula”.</span>' +
        '<textarea class="ha-in" data-marc-txt rows="5">' + esc(txt) + '</textarea><div class="ha-row"><button type="button" class="ha-p" data-salvar-marcs="' + aulaId + '">Salvar índice</button></div>';
    }).catch(falha);
  }
  function salvarMarcadores(aulaId) {
    var box = raiz.querySelector('[data-marcbox="' + aulaId + '"]'), linhas = box.querySelector('[data-marc-txt]').value.split('\n'), novos = [], ruins = [];
    linhas.forEach(function (l) { l = l.trim(); if (!l) return; var m = l.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/); if (!m) { ruins.push(l); return; }
      novos.push({ aula_id: aulaId, segundo: (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]), titulo: m[4].slice(0, 200) }); });
    if (ruins.length) return aviso('Confira o formato: ' + ruins[0], true);
    sb.from('aula_marcadores').delete().eq('aula_id', aulaId).then(ok).then(function () { return novos.length ? sb.from('aula_marcadores').insert(novos).then(ok) : null; })
      .then(function () { aviso('Índice salvo (' + novos.length + ')'); }).catch(falha);
  }

  // ---------- Duração das aulas (Vimeo) ----------
  function buscarDuracoes(btn) {
    var stt = raiz.querySelector('[data-dur-st]'), total = 0; btn.disabled = true;
    function lote() {
      return sb.functions.invoke('vimeo', { body: { acao: 'duracoes' } }).then(function (r) {
        if (r.error) throw r.error; var d = r.data || {}; total += d.feitos || 0;
        stt.textContent = total + ' aulas atualizadas · faltam ' + (d.faltam || 0) + (d.limite ? ' · aguardando o limite do Vimeo…' : '');
        if (!d.faltam || (!d.feitos && !d.limite)) { stt.textContent = 'Pronto: ' + total + ' aulas com duração.'; btn.disabled = false; return; }
        return new Promise(function (ok2) { setTimeout(ok2, d.limite ? 60000 : 400); }).then(lote);
      });
    }
    lote().catch(function (e) { btn.disabled = false; stt.textContent = 'Erro: ' + (e && e.message || e); });
  }

  function prepararTranscricoes(btn) {
    var stt = raiz.querySelector('[data-tr-st]'); btn.disabled = true; stt.textContent = 'Separando as aulas…';
    var com = 0, sem = 0, erros = 0;
    sb.from('trilha_itens').select('aula_id').then(ok).then(function (ti) {
      var ids = ti.map(function (x) { return x.aula_id; }).concat([13, 14, 15, 16, 17, 18, 19, 20, 21, 50]);
      ids = ids.filter(function (v, i, l) { return l.indexOf(v) === i; });
      var i = 0;
      function lote() {
        if (i >= ids.length) { stt.textContent = 'Pronto: ' + com + ' aulas com legenda, ' + sem + ' sem legenda' + (erros ? ', ' + erros + ' com erro' : '') + '. Pode avisar o Claude.'; btn.disabled = false; return; }
        var parte = ids.slice(i, i + 4); i += 4;
        stt.textContent = 'Lendo legendas… ' + Math.min(i, ids.length) + ' de ' + ids.length;
        return sb.functions.invoke('vimeo', { body: { acao: 'legendas', aulas: parte, intervalo: 60, salvar: true } }).then(function (r) {
          if (r.error) throw r.error;
          (r.data && r.data.aulas || []).forEach(function (a) { if (a.erro === 'sem_legenda') sem++; else if (a.erro) erros++; else com++; });
          return lote();
        });
      }
      return lote();
    }).catch(function (e) { btn.disabled = false; stt.textContent = 'Erro: ' + (e && e.message || e); });
  }

  function transcreverTodas(btn) {
    var stt = raiz.querySelector('[data-trt-st]'); btn.disabled = true; var feitas = 0, sem = 0, vazias = 0;
    function lote() {
      return sb.functions.invoke('vimeo', { body: { acao: 'legendas', pendentes: true, lote: 4, intervalo: 60, salvar: true } }).then(function (r) {
        if (r.error) throw r.error; var d = r.data || {}, ok1 = 0;
        (d.aulas || []).forEach(function (a) { if (!a.erro) { feitas++; ok1++; } else if (a.erro === 'sem_legenda') { sem++; ok1++; } });
        stt.textContent = feitas + ' aulas lidas, ' + sem + ' sem legenda · faltam ' + (d.restantes || 0) + (d.limite ? ' · aguardando o limite do Vimeo (1 min)…' : '');
        if (!d.restantes && !d.limite) { stt.textContent = 'Pronto: ' + feitas + ' aulas lidas, ' + sem + ' sem legenda. Pode avisar o Claude.'; btn.disabled = false; return; }
        vazias = ok1 || d.limite ? 0 : vazias + 1;
        if (vazias >= 3) { stt.textContent += ' · parei: algumas aulas deram erro. Pode avisar o Claude.'; btn.disabled = false; return; }
        return new Promise(function (ok2) { setTimeout(ok2, d.limite ? 60000 : 300); }).then(lote);
      });
    }
    lote().catch(function (e) { btn.disabled = false; stt.textContent = 'Erro: ' + (e && e.message || e) + ' — clique de novo para continuar de onde parou.'; });
  }

  // ---------- Trilhas ----------
  function trilhas(c) {
    c.innerHTML = 'Carregando…';
    sb.from('trilhas').select('*, trilha_itens(aula_id, ordem)').order('ordem').order('id').then(ok).then(function (ts) {
      c.innerHTML = '<div class="ha-box"><div class="ha-row" style="justify-content:space-between"><b style="font-size:18px">Trilhas (' + ts.length + ')</b><button type="button" class="ha-p" data-nova-trilha>+ Nova trilha</button></div>' +
        '<p style="margin:0;font-size:14px;color:#555555">Sequências sugeridas de aulas por perfil (ex.: Analista, Treinador, Auxiliar). Informe os números das aulas na ordem, separados por vírgula ou um por linha (o número aparece em /hub/aula?id=…). Só aparecem para os alunos as trilhas publicadas.</p></div>' +
        ts.map(function (t) {
          var ids = (t.trilha_itens || []).slice().sort(function (a, b) { return a.ordem - b.ordem; }).map(function (x) { return x.aula_id; }).join(', ');
          return '<div class="ha-box" data-trilha="' + t.id + '"><div class="ha-row"><label style="flex:1 1 260px">Título<br><input class="ha-in" data-f="titulo" value="' + esc(t.titulo) + '" style="width:100%"></label>' +
            '<label style="flex:0 1 200px">Perfil<br><input class="ha-in" data-f="perfil" value="' + esc(t.perfil) + '" style="width:100%"></label>' +
            '<label style="flex:0 1 90px">Ordem<br><input class="ha-in" type="number" data-f="ordem" value="' + esc(t.ordem) + '" style="width:100%"></label></div>' +
            '<label>Descrição<br><textarea class="ha-in" data-f="descricao" rows="2" style="width:100%">' + esc(t.descricao) + '</textarea></label>' +
            '<label>Aulas (números, na ordem)<br><textarea class="ha-in" data-trilha-ids rows="2" style="width:100%">' + esc(ids) + '</textarea></label>' +
            '<div class="ha-row"><label class="ha-chk"><input type="checkbox" data-f="publicado"' + (t.publicado ? ' checked' : '') + '>Publicada</label>' +
            '<button type="button" class="ha-p" data-salvar-trilha="' + t.id + '">Salvar trilha</button><button type="button" class="ha-b ha-x" data-apagar-trilha="' + t.id + '">Apagar</button></div></div>';
        }).join('');
    }).catch(falha);
  }
  function salvarTrilha(id) {
    var box = raiz.querySelector('[data-trilha="' + id + '"]'), d = {};
    box.querySelectorAll('[data-f]').forEach(function (i) { d[i.getAttribute('data-f')] = i.type === 'checkbox' ? i.checked : (i.value === '' ? null : i.value); });
    if (d.ordem != null) d.ordem = +d.ordem;
    var ids = box.querySelector('[data-trilha-ids]').value.split(/[^0-9]+/).filter(Boolean).map(Number);
    sb.from('trilhas').update(d).eq('id', id).then(ok)
      .then(function () { return sb.from('trilha_itens').delete().eq('trilha_id', id).then(ok); })
      .then(function () { return ids.length ? sb.from('trilha_itens').insert(ids.map(function (a, k) { return { trilha_id: id, aula_id: a, ordem: k }; })).then(ok) : null; })
      .then(function () { aviso('Trilha salva (' + ids.length + ' aulas)'); trilhas(raiz.querySelector('.ha-corpo')); }).catch(falha);
  }

  // ---------- Filtros das masterclasses (momento do jogo + tipo de tática) ----------
  var MOM = [['', '— sem momento —'], ['org_ofensiva', 'Organização ofensiva'], ['org_defensiva', 'Organização defensiva'], ['trans_ofensiva', 'Transição ofensiva'], ['trans_defensiva', 'Transição defensiva'], ['bolas_paradas', 'Bolas paradas'], ['treino', 'Treino']];
  var ESC = [['', '— sem tipo —'], ['coletiva', 'Tática coletiva'], ['individual', 'Tática individual']];
  function sel(lista, v, attr, id) { return '<select class="ha-in" ' + attr + '="' + id + '">' + lista.map(function (o) { return '<option value="' + o[0] + '"' + ((v || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }
  function filtrosMc(c) {
    c.innerHTML = 'Carregando…';
    sb.from('cursos').select('id').eq('slug', 'masterclasses').single().then(ok).then(function (k) {
      return sb.from('modulos').select('id,titulo,ordem,oculto,aulas(id,titulo,ordem,momento,escopo)').eq('curso_id', k.id).order('ordem').then(ok);
    }).then(function (ms) {
      ms = ms.filter(function (m) { return !m.oculto; });
      var n = 0, sem = 0; ms.forEach(function (m) { m.aulas.sort(function (a, b) { return a.ordem - b.ordem || a.id - b.id; }); m.aulas.forEach(function (a) { n++; if (!a.momento) sem++; }); });
      c.innerHTML = '<div class="ha-box"><b style="font-size:18px">Filtros das masterclasses</b>' +
        '<p style="margin:0;font-size:14px;color:#555555">Defina em que filtro cada masterclass aparece na área do aluno (aba Masterclasses). Salva sozinho ao trocar. Já deixei uma sugestão pelo tema e pelo título — confira. ' + n + ' masterclasses; ' + sem + ' sem momento do jogo.</p>' +
        '<div class="ha-row"><label class="ha-chk"><input type="checkbox" data-f-sem>Mostrar só as que estão sem momento do jogo</label></div></div>' +
        ms.map(function (m) {
          return '<div class="ha-box" data-f-mod><div class="ha-row" style="justify-content:space-between"><b style="font-size:16px">' + esc(m.titulo) + ' (' + m.aulas.length + ')</b>' +
            '<span class="ha-row" style="font-size:13px">Aplicar a todas deste tema: ' + sel(MOM, '__', 'data-f-mod-mom', m.id) + sel(ESC, '__', 'data-f-mod-esc', m.id) + '</span></div>' +
            '<table><tbody>' + m.aulas.map(function (a) {
              return '<tr data-f-aula="' + a.id + '" data-vazio="' + (a.momento ? '0' : '1') + '"><td>' + esc(a.titulo) + '</td><td style="width:220px">' + sel(MOM, a.momento, 'data-f-mom', a.id) + '</td><td style="width:170px">' + sel(ESC, a.escopo, 'data-f-esc', a.id) + '</td></tr>';
            }).join('') + '</tbody></table></div>';
        }).join('');
    }).catch(falha);
  }
  function salvarFiltro(el) {
    var id, campo, ids;
    if (el.hasAttribute('data-f-mom')) { id = +el.getAttribute('data-f-mom'); campo = 'momento'; }
    else if (el.hasAttribute('data-f-esc')) { id = +el.getAttribute('data-f-esc'); campo = 'escopo'; }
    else if (el.hasAttribute('data-f-mod-mom') || el.hasAttribute('data-f-mod-esc')) {
      campo = el.hasAttribute('data-f-mod-mom') ? 'momento' : 'escopo';
      var box = el.closest('[data-f-mod]'); ids = [].map.call(box.querySelectorAll('[data-f-aula]'), function (tr) { return +tr.getAttribute('data-f-aula'); });
      if (el.value === '__') return;
      if (!confirm('Aplicar a todas as ' + ids.length + ' masterclasses deste tema?')) { el.value = '__'; return; }
      var d1 = {}; d1[campo] = el.value || null;
      return sb.from('aulas').update(d1).in('id', ids).then(ok).then(function () { aviso('Filtro aplicado a ' + ids.length + ' masterclasses'); filtrosMc(raiz.querySelector('.ha-corpo')); }).catch(falha);
    } else return;
    var d = {}; d[campo] = el.value || null;
    sb.from('aulas').update(d).eq('id', id).then(ok).then(function () { aviso('Filtro salvo'); if (campo === 'momento') el.closest('tr').setAttribute('data-vazio', el.value ? '0' : '1'); }).catch(falha);
  }

  // ---------- Almanaque de artigos (PDF; aberto a qualquer aluno com conta) ----------
  function almanaque(c) {
    c.innerHTML = 'Carregando…';
    sb.from('artigos').select('*').order('criado_em', { ascending: false }).then(ok).then(function (as) {
      c.innerHTML = '<div class="ha-box"><b style="font-size:18px">Novo artigo</b>' +
        '<p style="margin:0;font-size:14px;color:#555555">Envie o PDF do artigo científico. Ele aparece na aba “Almanaque de artigos” da área do aluno para qualquer pessoa com conta (inclusive plano grátis).</p>' +
        '<div class="ha-row" data-art-novo><label style="flex:1 1 320px">Título<br><input class="ha-in" data-a="titulo" style="width:100%"></label>' +
        '<label style="flex:1 1 240px">Autores<br><input class="ha-in" data-a="autores" placeholder="Ex.: Garganta, J.; Pinto, J." style="width:100%"></label>' +
        '<label style="flex:0 1 90px">Ano<br><input class="ha-in" type="number" data-a="ano" style="width:100%"></label>' +
        '<label style="flex:0 1 200px">Tema<br><input class="ha-in" data-a="tema" list="ha-temas" placeholder="Ex.: Treinamento" style="width:100%"></label>' +
        '<label style="flex:1 1 100%">Resumo (opcional)<br><textarea class="ha-in" data-a="resumo" rows="2" style="width:100%"></textarea></label>' +
        '<label style="flex:1 1 320px">Arquivo PDF<br><input type="file" accept="application/pdf,.pdf" data-art-arq></label>' +
        '<button type="button" class="ha-p" data-art-enviar>Enviar artigo</button><span data-art-st style="font-size:14px"></span></div>' +
        '<datalist id="ha-temas">' + as.map(function (a) { return a.tema; }).filter(function (t, i, l) { return t && l.indexOf(t) === i; }).map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist></div>' +
        '<div class="ha-box"><b style="font-size:18px">Artigos (' + as.length + ')</b>' + (as.length ? '<table><thead><tr><th>Artigo</th><th>Tema</th><th>Publicado</th><th></th></tr></thead><tbody>' +
        as.map(function (a) { return '<tr data-art="' + a.id + '"><td><b>' + esc(a.titulo) + '</b><div style="font-size:12px;color:#777777">' + esc([a.autores, a.ano].filter(Boolean).join(' · ')) + '</div></td><td>' + esc(a.tema) + '</td>' +
          '<td><input type="checkbox" data-art-pub="' + a.id + '"' + (a.publicado ? ' checked' : '') + '></td><td style="white-space:nowrap"><button type="button" class="ha-b" data-art-ver="' + a.id + '">Ver PDF</button> <button type="button" class="ha-b ha-x" data-art-apagar="' + a.id + '">Apagar</button></td></tr>'; }).join('') +
        '</tbody></table>' : '<p style="margin:0;color:#555555">Nenhum artigo ainda.</p>') + '</div>';
      st.artigos = as;
    }).catch(falha);
  }
  function enviarArtigo() {
    var box = raiz.querySelector('[data-art-novo]'), d = {}, stt = raiz.querySelector('[data-art-st]');
    box.querySelectorAll('[data-a]').forEach(function (i) { d[i.getAttribute('data-a')] = i.value.trim() || null; });
    var f = box.querySelector('[data-art-arq]').files[0];
    if (!d.titulo) return aviso('Informe o título do artigo', true);
    if (!f) return aviso('Escolha o arquivo PDF', true);
    if (d.ano) d.ano = +d.ano;
    var nome = Date.now() + '-' + f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-');
    stt.textContent = 'Enviando…';
    sb.storage.from('artigos').upload(nome, f, { upsert: false, contentType: 'application/pdf' }).then(ok)
      .then(function () { d.arquivo = nome; d.tamanho_kb = Math.round(f.size / 1024); return sb.from('artigos').insert(d).then(ok); })
      .then(function () { aviso('Artigo publicado no Almanaque'); almanaque(raiz.querySelector('.ha-corpo')); })
      .catch(function (e) { stt.textContent = ''; falha(e); });
  }

  // ---------- Engajamento ----------
  function engajamento(c) {
    c.innerHTML = 'Carregando…';
    sb.rpc('admin_engajamento').then(ok).then(function (d) {
      function num(v, l) { return '<div class="ha-box" style="flex:1 1 160px;gap:4px"><b style="font-size:30px">' + (v || 0) + '</b><span style="font-size:13px;color:#555555">' + l + '</span></div>'; }
      function tab(t, cols, rows) { return '<div class="ha-box"><b style="font-size:17px">' + t + '</b>' + (rows.length ? '<table><thead><tr>' + cols.map(function (x) { return '<th>' + x[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + cols.map(function (x) { var v = r[x[1]]; return '<td>' + (x[1] === 'titulo' && r.id ? '<a href="/hub/aula?id=' + r.id + '" target="_blank" rel="noopener">' + esc(v) + '</a>' : esc(v)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '<span style="font-size:14px;color:#777777">Ainda sem dados suficientes.</span>') + '</div>'; }
      c.innerHTML = '<div class="ha-row" style="align-items:stretch">' + num(d.ativos7, 'alunos ativos nos últimos 7 dias') + num(d.ativos30, 'alunos ativos nos últimos 30 dias') + num(d.alunos, 'e-mails com acesso') + num(d.concluidas30, 'aulas concluídas em 30 dias') + num(d.certificados, 'certificados emitidos') + num(d.sugestoesAbertas, 'sugestões abertas') + '</div>' +
        tab('Aulas mais vistas (30 dias)', [['Aula', 'titulo'], ['Curso', 'curso'], ['Alunos', 'alunos'], ['Concluíram', 'concluiram']], d.maisVistas || []) +
        tab('Onde os alunos param (mín. 5 que começaram)', [['Aula', 'titulo'], ['Curso', 'curso'], ['Começaram', 'comecaram'], ['% sem concluir', 'pct_abandono']], d.abandono || []) +
        tab('Notas mais baixas (mín. 3 votos)', [['Aula', 'titulo'], ['Curso', 'curso'], ['Média', 'media'], ['Votos', 'votos']], d.piorNota || []) +
        tab('Cursos com mais alunos ativos (30 dias)', [['Curso', 'titulo'], ['Alunos', 'alunos']], d.cursos || []);
    }).catch(falha);
  }

  // ---------- Sugestões dos alunos (EOJHub) ----------
  function sugestoes(c) {
    c.innerHTML = 'Carregando…';
    sb.rpc('admin_sugestoes_hub').then(ok).then(function (rs) {
      var ST = { aberto: 'Aberta', atendido: 'Publicada', arquivado: 'Arquivada' };
      c.innerHTML = '<div class="ha-box"><b style="font-size:18px">Sugestões dos alunos (' + rs.filter(function (r) { return r.status === 'aberto'; }).length + ' abertas)</b>' +
        '<p style="margin:0;font-size:14px;color:#555555">Quando publicar uma aula que atende a sugestão, informe o número da aula (aparece em /hub/aula?id=…) e clique em “Publicada”: o aluno recebe um aviso com o link.</p>' +
        (rs.length ? '<table><thead><tr><th>Quando</th><th>Aluno</th><th>Sugestão</th><th>Situação</th><th></th></tr></thead><tbody>' + rs.map(function (r) {
          return '<tr data-sug="' + r.id + '"><td style="white-space:nowrap">' + new Date(r.criado_em).toLocaleDateString('pt-BR') + '</td><td>' + esc(r.nome || '') + '<div style="font-size:12px;color:#777777">' + esc(r.email || '') + '</div></td><td>' + esc(r.texto) + '</td><td>' + (ST[r.status] || r.status) + (r.aula_id ? ' · <a href="/hub/aula?id=' + r.aula_id + '" target="_blank" rel="noopener">aula ' + r.aula_id + '</a>' : '') + '</td>' +
            '<td style="white-space:nowrap">' + (r.status === 'aberto' ? '<input class="ha-in" data-sug-aula type="number" placeholder="Nº da aula" style="width:110px"> <button type="button" class="ha-p" data-atender="' + r.id + '">Publicada</button> <button type="button" class="ha-b" data-arquivar="' + r.id + '">Arquivar</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<span style="font-size:14px;color:#777777">Nenhuma sugestão ainda.</span>') + '</div>';
    }).catch(falha);
  }

  function cliques(e) {
    var t = e.target, x;
    if ((x = t.closest('[data-aba]'))) { st.aba = x.getAttribute('data-aba'); st.aberto = null; return desenhar(); }
    if (t.closest('[data-art-enviar]')) return enviarArtigo();
    if ((x = t.closest('[data-art-ver]'))) { var av = (st.artigos || []).filter(function (a) { return a.id === +x.getAttribute('data-art-ver'); })[0]; return sb.storage.from('artigos').createSignedUrl(av.arquivo, 600).then(ok).then(function (u) { window.open(u.signedUrl, '_blank', 'noopener'); }).catch(falha); }
    if ((x = t.closest('[data-art-pub]'))) { return sb.from('artigos').update({ publicado: x.checked }).eq('id', +x.getAttribute('data-art-pub')).then(ok).then(function () { aviso(x.checked ? 'Artigo publicado' : 'Artigo escondido dos alunos'); }).catch(falha); }
    if ((x = t.closest('[data-art-apagar]'))) { var ap = (st.artigos || []).filter(function (a) { return a.id === +x.getAttribute('data-art-apagar'); })[0]; if (!confirm('Apagar o artigo “' + ap.titulo + '” e o PDF? Não dá para desfazer.')) return;
      return sb.storage.from('artigos').remove([ap.arquivo]).then(function () { return sb.from('artigos').delete().eq('id', ap.id).then(ok); }).then(function () { aviso('Artigo apagado'); almanaque(raiz.querySelector('.ha-corpo')); }).catch(falha); }
    if ((x = t.closest('[data-abrir]'))) { st.aberto = +x.getAttribute('data-abrir'); return desenhar(); }
    if (t.closest('[data-voltar]')) { st.aberto = null; return carregarCursos().then(desenhar); }
    if ((x = t.closest('[data-salvar-curso]'))) {
      var box = x.closest('[data-curso]'), d = box.tagName === 'TR' ? linhaCurso(box) : (function () { var o = {}; box.querySelectorAll('[data-f]').forEach(function (i) { var v = i.type === 'checkbox' ? i.checked : (i.value === '' ? null : i.value); if (i.type === 'number' && v != null) v = +v; o[i.getAttribute('data-f')] = v; }); return o; })();
      return sb.from('cursos').update(d).eq('id', +x.getAttribute('data-salvar-curso')).then(ok).then(function () { aviso('Curso salvo'); return carregarCursos(); }).catch(falha);
    }
    if (t.closest('[data-novo-curso]')) {
      var tt = prompt('Nome do novo curso:'); if (!tt) return;
      var slug = tt.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return sb.from('cursos').insert({ titulo: tt, slug: slug, publicado: false }).select().single().then(ok).then(function (k) { return carregarCursos().then(function () { st.aberto = k.id; desenhar(); }); }).catch(falha);
    }
    if ((x = t.closest('[data-novo-mod]'))) { var tm = prompt('Nome do módulo:'); if (!tm) return; return sb.from('modulos').insert({ curso_id: +x.getAttribute('data-novo-mod'), titulo: tm, ordem: 99 }).then(ok).then(desenhar).catch(falha); }
    if ((x = t.closest('[data-salvar-mod]'))) { var mb = x.closest('[data-mod]'); return sb.from('modulos').update({ titulo: mb.querySelector(':scope > .ha-row [data-f="titulo"]').value, ordem: +mb.querySelector(':scope > .ha-row [data-f="ordem"]').value }).eq('id', +x.getAttribute('data-salvar-mod')).then(ok).then(function () { aviso('Módulo salvo'); }).catch(falha); }
    if ((x = t.closest('[data-apagar-mod]'))) { if (!confirm('Apagar este módulo e todas as aulas dele? Não dá para desfazer.')) return; return sb.from('modulos').delete().eq('id', +x.getAttribute('data-apagar-mod')).then(ok).then(desenhar).catch(falha); }
    if ((x = t.closest('[data-nova-aula]'))) { var ta = prompt('Título da aula:'); if (!ta) return; return sb.from('aulas').insert({ modulo_id: +x.getAttribute('data-nova-aula'), titulo: ta, ordem: 99, publicado: false }).then(ok).then(desenhar).catch(falha); }
    if ((x = t.closest('[data-salvar-aula]'))) { var ab = x.closest('[data-aula]'), da = {}; ab.querySelectorAll(':scope > .ha-row [data-f], :scope > [data-f]').forEach(function (i) { var v = i.type === 'checkbox' ? i.checked : (i.value === '' ? null : i.value); if (i.type === 'number' && v != null) v = +v; da[i.getAttribute('data-f')] = v; });
      return sb.from('aulas').update(da).eq('id', +x.getAttribute('data-salvar-aula')).then(ok).then(function () { aviso('Aula salva'); }).catch(falha); }
    if ((x = t.closest('[data-apagar-aula]'))) { if (!confirm('Apagar esta aula? Não dá para desfazer.')) return; return sb.from('aulas').delete().eq('id', +x.getAttribute('data-apagar-aula')).then(ok).then(desenhar).catch(falha); }
    if ((x = t.closest('[data-materiais]'))) { return materiais(+x.getAttribute('data-materiais')); }
    if ((x = t.closest('[data-add-mat]'))) { return addMaterial(+x.getAttribute('data-add-mat')); }
    if ((x = t.closest('[data-apagar-mat]'))) { if (!confirm('Apagar este material?')) return; var aid = +x.getAttribute('data-da-aula'); return sb.from('materiais').delete().eq('id', +x.getAttribute('data-apagar-mat')).then(ok).then(function () { materiais(aid); }).catch(falha); }
    if ((x = t.closest('[data-salvar-prod]'))) { return salvarProduto(x.closest('tr')); }
    if ((x = t.closest('[data-apagar-prod]'))) { if (!confirm('Apagar este produto?')) return; return sb.from('produtos_hotmart').delete().eq('produto', x.closest('tr').getAttribute('data-prod')).then(ok).then(function () { hotmart(raiz.querySelector('.ha-corpo')); }).catch(falha); }
    if (t.closest('[data-dar-acesso]')) {
      var g = function (k) { return raiz.querySelector('[data-a="' + k + '"]').value.trim(); }, em = g('email').toLowerCase(), ds = g('destino').split(':');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return aviso('Informe um e-mail válido.', true);
      var row = { email: em, origem: 'manual', acesso_ate: g('ate') ? new Date(g('ate') + 'T23:59:59').toISOString() : null };
      if (ds[0] === 'plano') row.plano = ds[1]; else row.curso_id = +ds[1];
      return sb.from('acessos_email').insert(row).then(ok).then(function () { aviso('Acesso liberado'); raiz.querySelector('[data-a="busca"]').value = em; buscar(); }).catch(falha);
    }
    if (t.closest('[data-buscar]')) return buscar();
    if ((x = t.closest('[data-atender]'))) {
      var au = +x.closest('tr').querySelector('[data-sug-aula]').value;
      if (!au) return aviso('Informe o número da aula publicada.', true);
      return sb.rpc('atender_sugestoes', { aula: au, ids: [+x.getAttribute('data-atender')] }).then(ok).then(function () { aviso('Aluno avisado'); sugestoes(raiz.querySelector('.ha-corpo')); }).catch(falha);
    }
    if ((x = t.closest('[data-arquivar]'))) return sb.from('pedidos').update({ status: 'arquivado' }).eq('id', +x.getAttribute('data-arquivar')).then(ok).then(function () { sugestoes(raiz.querySelector('.ha-corpo')); }).catch(falha);
    if ((x = t.closest('[data-liberar-vimeo]'))) return liberarVimeo(x);
    if ((x = t.closest('[data-duracoes]'))) return buscarDuracoes(x);
    if ((x = t.closest('[data-transcricoes-todas]'))) return transcreverTodas(x);
    if ((x = t.closest('[data-transcricoes]'))) return prepararTranscricoes(x);
    if ((x = t.closest('[data-marcs]'))) return marcadores(+x.getAttribute('data-marcs'));
    if ((x = t.closest('[data-salvar-marcs]'))) return salvarMarcadores(+x.getAttribute('data-salvar-marcs'));
    if (t.closest('[data-nova-trilha]')) { var tn = prompt('Nome da trilha (ex.: Começando como analista):'); if (!tn) return; return sb.from('trilhas').insert({ titulo: tn }).then(ok).then(function () { trilhas(raiz.querySelector('.ha-corpo')); }).catch(falha); }
    if ((x = t.closest('[data-salvar-trilha]'))) return salvarTrilha(+x.getAttribute('data-salvar-trilha'));
    if ((x = t.closest('[data-apagar-trilha]'))) { if (!confirm('Apagar esta trilha?')) return; return sb.from('trilhas').delete().eq('id', +x.getAttribute('data-apagar-trilha')).then(ok).then(function () { trilhas(raiz.querySelector('.ha-corpo')); }).catch(falha); }
    if ((x = t.closest('[data-ativo]'))) { return sb.from('acessos_email').update({ ativo: x.getAttribute('data-v') === 'true', atualizado_em: new Date().toISOString() }).eq('id', +x.getAttribute('data-ativo')).then(ok).then(buscar).catch(falha); }
  }

  // Acrescenta o domínio novo em lotes, respeitando o limite da API do Vimeo
  function liberarVimeo(btn) {
    var stt = raiz.querySelector('[data-vimeo-st]'), feitos = 0, falhas = 0;
    btn.disabled = true;
    function lote(off) {
      return sb.functions.invoke('vimeo', { body: { acao: 'dominio', offset: off, limite: 50 } }).then(function (r) {
        if (r.error) throw r.error;
        var d = r.data || {}; feitos += d.feitos || 0; falhas += (d.falhas || []).length;
        stt.textContent = feitos + ' de ' + d.total + ' vídeos liberados' + (falhas ? ' · ' + falhas + ' com erro' : '') + (d.limite ? ' · aguardando o limite do Vimeo…' : '');
        if (d.proximo == null) { stt.textContent = 'Pronto: ' + feitos + ' vídeos liberados' + (falhas ? ' (' + falhas + ' com erro)' : '') + '.'; btn.disabled = false; return; }
        return new Promise(function (ok) { setTimeout(ok, d.limite ? 60000 : 500); }).then(function () { return lote(d.proximo); });
      });
    }
    lote(0).catch(function (e) { btn.disabled = false; stt.textContent = 'Erro: ' + (e && e.message || e); });
  }

  window.EOJHubAdmin = {
    iniciar: function (alvo) {
      raiz = alvo; raiz.setAttribute('data-pronto', '1');
      raiz.innerHTML = '<p style="margin:0">Carregando…</p>';
      B.ready.then(function () {
        if (!B.user) { raiz.innerHTML = '<p style="margin:0">Entre com a conta de administrador. <a href="/hub?volta=' + encodeURIComponent('/hub/admin') + '">Entrar</a></p>'; return; }
        if (!B.isAdmin()) { raiz.innerHTML = '<p style="margin:0">Esta página é só para administradores.</p>'; return; }
        raiz.innerHTML = '<style>' + CSS + '</style><div class="ha"><div class="ha-tabs-w"></div><div class="ha-corpo"></div></div><div class="ha-aviso" role="status"></div>';
        raiz.addEventListener('click', cliques);
        raiz.addEventListener('change', function (e) {
          var t = e.target;
          if (t.matches('[data-f-mom],[data-f-esc],[data-f-mod-mom],[data-f-mod-esc]')) return salvarFiltro(t);
          if (t.matches('[data-f-sem]')) raiz.querySelectorAll('[data-f-aula]').forEach(function (tr) { tr.style.display = t.checked && tr.getAttribute('data-vazio') === '0' ? 'none' : ''; });
        });
        if (/^#(sugestoes|eventos|acessos|hotmart|trilhas|engajamento|almanaque|filtros)$/.test(location.hash)) st.aba = location.hash.slice(1);
        return carregarCursos().then(desenhar);
      }).catch(function (e) { raiz.innerHTML = '<p>' + esc(String(e && e.message || e)) + '</p>'; });
    }
  };
})();
