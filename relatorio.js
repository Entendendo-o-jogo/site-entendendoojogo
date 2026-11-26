/* Relatório do EOJ (admin): monta um documento HTML pronto para salvar em PDF.
   EOJRel.html(dados, layout) → string; layout: 'executivo' | 'detalhado' | 'apresentacao'.
   Os dados vêm da função relatorio_hub(ini, fim) do Supabase. */
(function () {
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(v) { return (+v || 0).toLocaleString('pt-BR'); }
  function dia(iso) { var d = new Date(iso); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }); }
  function periodoTxt(p) {
    var a = new Date(p.ini), b = new Date(new Date(p.fim).getTime() - 1000);
    var ma = a.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'numeric', year: 'numeric' }).split('/');
    var mb = b.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'numeric', year: 'numeric' }).split('/');
    var mesInteiro = ma[0] === '1' && ma[1] === mb[1] && ma[2] === mb[2] && new Date(+mb[2], +mb[1], 0).getDate() === +mb[0];
    if (mesInteiro) return MESES[+ma[1] - 1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' de ' + ma[2];
    return dia(p.ini) + ' a ' + dia(new Date(new Date(p.fim).getTime() - 1000).toISOString());
  }
  function variacao(a, b) {
    a = +a || 0; b = +b || 0;
    if (!b && !a) return { txt: 'igual', cls: 'neu' };
    if (!b) return { txt: 'novo', cls: 'up' };
    var p = Math.round((a - b) / b * 100);
    return { txt: (p > 0 ? '+' : '') + p + '%', cls: p > 0 ? 'up' : p < 0 ? 'down' : 'neu' };
  }
  // Indicadores principais: [chave, rótulo, quanto menor melhor?]
  var KPIS = [
    ['contas_novas', 'Contas criadas'], ['entraram', 'Pessoas que entraram'], ['alunos_ativos', 'Alunos que assistiram'], ['vendas', 'Vendas aprovadas'],
    ['aulas_assistidas', 'Aulas assistidas'], ['aulas_concluidas', 'Aulas concluídas'], ['aulas_publicadas', 'Aulas postadas no EOJHub'], ['clipes_publicados', 'Clipes postados na Biblioteca'],
    ['certificados', 'Certificados emitidos'], ['favoritos', 'Clipes salvos'], ['playlists', 'Playlists criadas'], ['reembolsos', 'Reembolsos', 1], ['cancelamentos', 'Assinaturas canceladas', 1]
  ];
  function destaques(d) {
    var k = d.kpis, a = d.kpis_antes, e = d.engajamento || {}, out = [];
    var v = variacao(k.vendas, a.vendas); out.push(n(k.vendas) + (k.vendas === 1 ? ' venda aprovada' : ' vendas aprovadas') + (a.vendas || k.vendas ? ' (' + v.txt + ' em relação ao período anterior, que teve ' + n(a.vendas) + ')' : '') + '.');
    if (d.vendas_por_produto && d.vendas_por_produto[0]) out.push('Produto que mais vendeu: ' + d.vendas_por_produto[0].produto + ' (' + n(d.vendas_por_produto[0].n) + ').');
    out.push(n(k.contas_novas) + ' contas novas; ' + n(k.alunos_ativos) + ' alunos assistiram a pelo menos uma aula e ' + n(k.aulas_concluidas) + ' aulas foram concluídas.');
    if (d.top_cursos && d.top_cursos[0]) out.push('Conteúdo mais procurado: ' + d.top_cursos[0].curso + ' (' + n(d.top_cursos[0].alunos) + ' alunos).');
    if (d.contas_por_funcao && d.contas_por_funcao[0]) out.push('Perfil que mais se cadastrou: ' + d.contas_por_funcao[0].funcao + ' (' + n(d.contas_por_funcao[0].n) + ').');
    if (d.vendas_pendentes) out.push(n(d.vendas_pendentes) + ' pagamentos pendentes (boleto/Pix gerado ou em atraso): vale um lembrete para esses compradores.');
    if (d.carrinho_abandonado) out.push(n(d.carrinho_abandonado) + ' abandonos de carrinho na Hotmart.');
    if (d.vendas_sem_liberacao) out.push('Atenção: ' + n(d.vendas_sem_liberacao) + ' vendas chegaram sem produto mapeado no site (acesso não liberado automaticamente).');
    if (e.pedidos_abertos) out.push(n(e.pedidos_abertos) + (e.pedidos_abertos === 1 ? ' pedido de vídeo em aberto' : ' pedidos de vídeo em aberto') + ' na Biblioteca.');
    if (k.reembolsos || k.cancelamentos) out.push(n(k.reembolsos) + ' reembolsos e ' + n(k.cancelamentos) + ' cancelamentos de assinatura.');
    if (!k.clipes_publicados) out.push('Nenhum clipe novo publicado na Biblioteca no período.');
    return out;
  }
  function barras(lista, rot, val, cor) {
    if (!lista || !lista.length) return '<p class="vazio">Nada no período.</p>';
    var max = Math.max.apply(null, lista.map(function (x) { return +x[val] || 0; })) || 1;
    return '<div class="barras">' + lista.map(function (x) {
      return '<div class="br"><span class="br-r">' + esc(x[rot]) + '</span><span class="br-t"><i style="width:' + Math.max(3, (x[val] / max) * 100) + '%;background:' + (cor || '#4A79A6') + '"></i></span><b>' + n(x[val]) + '</b></div>';
    }).join('') + '</div>';
  }
  function colunasDias(d) {
    var ini = new Date(d.periodo.ini), fim = new Date(d.periodo.fim), mapa = {};
    (d.contas_por_dia || []).forEach(function (x) { mapa[x.dia] = x.n; });
    var dias = [], t = new Date(ini.getTime());
    while (t < fim && dias.length < 62) { var k = t.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); dias.push([k, mapa[k] || 0]); t = new Date(t.getTime() + 86400000); }
    var max = Math.max.apply(null, dias.map(function (x) { return x[1]; })) || 1, w = 100 / dias.length;
    return '<div class="cols">' + dias.map(function (x) {
      return '<div class="col" style="width:' + w + '%"><span class="col-n">' + (x[1] || '') + '</span><i style="height:' + Math.max(2, x[1] / max * 100) + '%"></i><span class="col-d">' + x[0].slice(8) + '</span></div>';
    }).join('') + '</div>';
  }
  function tabela(cab, linhas) {
    return '<table><thead><tr>' + cab.map(function (c, i) { return '<th' + (i ? ' class="num"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (linhas.length ? linhas.map(function (l) { return '<tr>' + l.map(function (c, i) { return '<td' + (i ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + cab.length + '" class="vazio">Nada no período.</td></tr>') + '</tbody></table>';
  }
  function linhaKpi(d, k) {
    var a = d.kpis[k[0]], b = d.kpis_antes[k[0]], v = variacao(a, b), cls = k[2] ? (v.cls === 'up' ? 'down' : v.cls === 'down' ? 'up' : v.cls) : v.cls;
    return [esc(k[1]), '<b>' + n(a) + '</b>', n(b), '<span class="' + cls + '">' + v.txt + '</span>'];
  }
  var NOTA = 'Visitas ao site e às páginas de venda não ficam no banco do EOJ: consulte o Cloudflare Web Analytics para esse número. “Pessoas que entraram” conta quem fez login no período. Vendas contam aprovações da Hotmart (uma por transação).';

  var CSS_BASE = '@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Montserrat,"Helvetica Neue",Arial,sans-serif;color:#111111;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px;line-height:1.45}' +
    'h1,h2,h3{margin:0}.up{color:#1E7A3C;font-weight:700}.down{color:#B3261E;font-weight:700}.neu{color:#777777;font-weight:700}.vazio{color:#777777;font-style:italic}' +
    'table{width:100%;border-collapse:collapse;font-size:11.5px}th{text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#555555;border-bottom:2px solid #111111;padding:6px 6px}td{border-bottom:1px solid #E6E6E6;padding:6px 6px;vertical-align:top}.num{text-align:right;white-space:nowrap}' +
    '.barras{display:flex;flex-direction:column;gap:6px}.br{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 34px;gap:8px;align-items:center;font-size:11.5px}.br-r{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.br-t{height:10px;background:#EEF2F6;border-radius:99px;overflow:hidden}.br-t i{display:block;height:100%;border-radius:99px}.br b{text-align:right}' +
    '.cols{display:flex;align-items:flex-end;height:120px;gap:2px;padding-top:16px}.col{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.col i{display:block;width:70%;background:#4A79A6;border-radius:3px 3px 0 0}.col-n{font-size:9px;font-weight:700;margin-bottom:2px}.col-d{font-size:8.5px;color:#777777;margin-top:3px}' +
    '.nota{font-size:9.5px;color:#777777;line-height:1.5;margin-top:14px}.marca{font-weight:800;letter-spacing:.04em}';

  function cabecalho(d, titulo, escuro) {
    return '<header class="cab' + (escuro ? ' esc' : '') + '"><div><div class="marca">ENTENDENDO O JOGO · EOJHUB + BIBLIOTECA</div><h1>' + esc(titulo) + '</h1><div class="per">' + esc(periodoTxt(d.periodo)) + ' · comparado com o período anterior de mesma duração</div></div><div class="ger">Gerado em ' + dia(d.periodo.gerado_em) + '</div></header>';
  }

  // ---------- Layout 1: executivo (1–2 páginas, cartões + destaques) ----------
  function executivo(d) {
    var css = CSS_BASE + '.cab{background:#111111;color:#FFFFFF;border-radius:14px;padding:20px 22px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}.cab .marca{font-size:10px;color:#A1C4E6}.cab h1{font-size:26px;text-transform:uppercase;margin:6px 0 4px}.cab .per{font-size:12px;color:#CCCCCC}.ger{font-size:10px;color:#999999;white-space:nowrap}' +
      '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.card{border:1px solid #E2E2E2;border-radius:12px;padding:12px}.card .r{font-size:10px;color:#555555;text-transform:uppercase;letter-spacing:.05em;min-height:26px}.card .v{font-size:26px;font-weight:800;line-height:1.1}.card .c{font-size:10.5px;margin-top:3px;color:#777777}.card.dest{background:#E6EFF8;border-color:#A1C4E6}' +
      '.dest-box{background:#FFF8D6;border:1px solid #FFD400;border-radius:12px;padding:14px 16px}.dest-box h2{font-size:13px;text-transform:uppercase;margin-bottom:6px}.dest-box ul{margin:0;padding-left:18px}.dest-box li{margin:3px 0}' +
      '.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.box{border:1px solid #E2E2E2;border-radius:12px;padding:14px}.box h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}.pb{break-before:page}';
    var cards = KPIS.slice(0, 8).map(function (k, i) {
      var v = variacao(d.kpis[k[0]], d.kpis_antes[k[0]]);
      return '<div class="card' + (i === 3 ? ' dest' : '') + '"><div class="r">' + esc(k[1]) + '</div><div class="v">' + n(d.kpis[k[0]]) + '</div><div class="c"><span class="' + v.cls + '">' + v.txt + '</span> · antes ' + n(d.kpis_antes[k[0]]) + '</div></div>';
    }).join('');
    var e = d.engajamento || {}, t = d.totais || {};
    var body = cabecalho(d, 'Relatório do período') +
      '<div class="cards">' + cards + '</div>' +
      '<div class="dest-box"><h2>Destaques</h2><ul>' + destaques(d).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="g2"><div class="box"><h2>Contas criadas por dia</h2>' + colunasDias(d) + '</div><div class="box"><h2>Vendas por produto</h2>' + barras(d.vendas_por_produto, 'produto', 'n', '#111111') + '</div></div>' +
      '<div class="g2 pb"><div class="box"><h2>Aulas mais assistidas</h2>' + barras((d.top_aulas || []).slice(0, 8), 'titulo', 'alunos') + '</div><div class="box"><h2>Quem se cadastrou</h2>' + barras(d.contas_por_funcao, 'funcao', 'n', '#A1C4E6') + '</div></div>' +
      '<div class="g2"><div class="box"><h2>Conteúdo novo</h2>' + tabela(['Postado', 'Qtde'], [['Aulas no EOJHub', n(d.kpis.aulas_publicadas)], ['Clipes na Biblioteca', n(d.kpis.clipes_publicados)], ['Pranchetas criadas pelos alunos', n(e.pranchetas)], ['Playlists criadas', n(d.kpis.playlists)]]) + '</div>' +
      '<div class="box"><h2>Atendimento e base</h2>' + tabela(['Indicador', 'Qtde'], [['Conversas no chat', n(e.chat_conversas)], ['Mensagens de alunos / respostas', n(e.chat_alunos) + ' / ' + n(e.chat_respostas)], ['E-mails de boas-vindas', n(e.emails_boas_vindas)], ['Contas no total', n(t.contas)], ['Acessos pagos ativos', n(t.acessos_ativos)], ['Aulas / clipes publicados (total)', n(t.aulas) + ' / ' + n(t.clipes)]]) + '</div></div>' +
      '<p class="nota">' + NOTA + '</p>';
    return doc('Relatório EOJ · ' + periodoTxt(d.periodo), css, body);
  }

  // ---------- Layout 2: detalhado (tabelas por área) ----------
  function detalhado(d) {
    var css = CSS_BASE + '.cab{border-bottom:3px solid #111111;padding-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}.cab .marca{font-size:10px;color:#4A79A6}.cab h1{font-size:24px;text-transform:uppercase;margin:4px 0}.cab .per{font-size:12px;color:#555555}.ger{font-size:10px;color:#777777}' +
      'section{margin-top:18px;break-inside:avoid}section h2{font-size:14px;text-transform:uppercase;display:flex;gap:10px;align-items:center;margin-bottom:8px}section h2 span{background:#111111;color:#FFFFFF;border-radius:6px;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px}' +
      '.resumo{background:#F4F7FA;border-left:4px solid #4A79A6;padding:10px 14px;margin-top:14px}.resumo li{margin:2px 0}.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}';
    var e = d.engajamento || {}, t = d.totais || {};
    function sec(i, tit, conteudo) { return '<section><h2><span>' + i + '</span>' + esc(tit) + '</h2>' + conteudo + '</section>'; }
    var cabK = ['Indicador', 'Período', 'Anterior', 'Variação'];
    var body = cabecalho(d, 'Relatório detalhado') +
      '<div class="resumo"><b>Resumo</b><ul>' + destaques(d).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      sec(1, 'Público', tabela(cabK, [KPIS[0], KPIS[1], KPIS[2]].map(function (k) { return linhaKpi(d, k); })) + '<div class="g2" style="margin-top:10px"><div>' + tabela(['Função informada no cadastro', 'Contas'], (d.contas_por_funcao || []).map(function (x) { return [esc(x.funcao), n(x.n)]; })) + '</div><div>' + colunasDias(d) + '</div></div>') +
      sec(2, 'Vendas (Hotmart)', tabela(cabK, [KPIS[3], KPIS[11], KPIS[12]].map(function (k) { return linhaKpi(d, k); }).concat([['Pagamentos pendentes (boleto/Pix)', '<b>' + n(d.vendas_pendentes) + '</b>', '–', ''], ['Abandonos de carrinho', '<b>' + n(d.carrinho_abandonado) + '</b>', '–', ''], ['Vendas sem produto mapeado', '<b>' + n(d.vendas_sem_liberacao) + '</b>', '–', '']])) +
        '<div style="margin-top:10px">' + tabela(['Produto / oferta', 'Vendas'], (d.vendas_por_produto || []).map(function (x) { return [esc(x.produto), n(x.n)]; })) + '</div>') +
      sec(3, 'EOJHub', tabela(cabK, [KPIS[4], KPIS[5], KPIS[6], KPIS[8]].map(function (k) { return linhaKpi(d, k); })) +
        '<div class="g2" style="margin-top:10px"><div>' + tabela(['Aula mais assistida', 'Alunos'], (d.top_aulas || []).map(function (x) { return [esc(x.titulo) + '<br><small style="color:#777777">' + esc(x.curso) + '</small>', n(x.alunos)]; })) + '</div><div>' +
        tabela(['Curso / área', 'Alunos'], (d.top_cursos || []).map(function (x) { return [esc(x.curso), n(x.alunos)]; })) + '</div></div>' +
        '<div style="margin-top:10px">' + tabela(['Aula postada', 'Curso', 'Data'], (d.aulas_novas || []).map(function (x) { return [esc(x.titulo), esc(x.curso), dia(x.quando)]; })) + '</div>') +
      sec(4, 'Biblioteca EOJ', tabela(cabK, [KPIS[7], KPIS[9], KPIS[10]].map(function (k) { return linhaKpi(d, k); }).concat([['Pranchetas criadas', '<b>' + n(e.pranchetas) + '</b>', '–', ''], ['Pedidos de vídeo recebidos / atendidos / em aberto', '<b>' + n(e.pedidos) + ' / ' + n(e.pedidos_atendidos) + ' / ' + n(e.pedidos_abertos) + '</b>', '–', '']])) +
        '<div class="g2" style="margin-top:10px"><div>' + tabela(['Clipe postado', 'Momento'], (d.clipes_novos || []).map(function (x) { return [esc(x.titulo) + (x.clube ? ' <small style="color:#8A6A12">(clube)</small>' : ''), esc(x.momento || '–')]; })) + '</div><div>' +
        tabela(['Clipe mais salvo', 'Vezes'], (d.top_clipes || []).map(function (x) { return [esc(x.titulo), n(x.n)]; })) + '</div></div>') +
      sec(5, 'Engajamento e atendimento', tabela(['Indicador', 'Período'], [['Avaliações de aulas (nota média)', n(e.avaliacoes) + (e.nota_media ? ' (' + String(e.nota_media).replace('.', ',') + ')' : '')], ['Comentários nas aulas', n(e.comentarios)], ['Anotações feitas pelos alunos', n(e.anotacoes)], ['Aulas salvas para depois', n(e.salvos)], ['Perguntas ao EOJ (IA)', n(e.perguntas_ia)], ['Conversas no chat', n(e.chat_conversas)], ['Mensagens de alunos / respostas da equipe', n(e.chat_alunos) + ' / ' + n(e.chat_respostas)], ['E-mails de boas-vindas enviados', n(e.emails_boas_vindas)]])) +
      sec(6, 'Base total (hoje)', tabela(['Indicador', 'Total'], [['Contas cadastradas', n(t.contas)], ['E-mails com acesso pago ativo', n(t.acessos_ativos)], ['Cursos publicados', n(t.cursos)], ['Aulas publicadas', n(t.aulas)], ['Clipes publicados na Biblioteca', n(t.clipes)], ['Clipes exclusivos de clubes', n(t.clipes_clube)], ['Membros de clubes', n(t.membros_clubes)]])) +
      '<p class="nota">' + NOTA + '</p>';
    return doc('Relatório detalhado EOJ · ' + periodoTxt(d.periodo), css, body);
  }

  // ---------- Layout 3: apresentação (páginas em paisagem, um tema por página) ----------
  function apresentacao(d) {
    var css = CSS_BASE.replace('@page{size:A4;margin:14mm}', '@page{size:A4 landscape;margin:0}') +
      '.sl{width:297mm;height:210mm;padding:16mm 18mm;display:flex;flex-direction:column;break-after:page;overflow:hidden;position:relative}.sl:last-child{break-after:auto}.sl.esc{background:#111111;color:#FFFFFF}.sl.az{background:#E6EFF8}' +
      '.eb{font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#4A79A6}.esc .eb{color:#A1C4E6}.tt{font-size:40px;font-weight:800;text-transform:uppercase;line-height:1.05;margin:8px 0 18px}' +
      '.big{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.big div{border-radius:16px;padding:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.az .big div,.sl:not(.esc) .big div{background:#FFFFFF;border:1px solid #DDE5EE}.big b{display:block;font-size:64px;line-height:1;font-weight:800}.big span{display:block;font-size:13px;margin-top:6px}.big em{font-style:normal;font-size:12px}' +
      '.rod{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;font-size:10px;color:#777777}.esc .rod{color:#888888}' +
      '.g2{display:grid;grid-template-columns:1fr 1fr;gap:22px;flex:1;min-height:0}.lista{font-size:19px;line-height:1.6;margin:0;padding-left:22px}.lista li{margin:4px 0}' +
      '.sl .barras{gap:10px}.sl .barras .br{font-size:15px}.sl .br-t{height:16px}.sl .cols{height:190px}.esc .br-t{background:#2A2A2A}';
    var k = d.kpis, a = d.kpis_antes, e = d.engajamento || {}, t = d.totais || {}, per = periodoTxt(d.periodo), pg = 0;
    function big(lista) { return '<div class="big">' + lista.map(function (x) { var v = variacao(k[x[0]], a[x[0]]); return '<div><b>' + n(k[x[0]]) + '</b><span>' + esc(x[1]) + '</span><em class="' + v.cls + '">' + v.txt + '</em> <em style="color:#999999">· antes ' + n(a[x[0]]) + '</em></div>'; }).join('') + '</div>'; }
    function sl(cls, eb, tt, conteudo) { pg++; return '<section class="sl ' + cls + '"><div class="eb">' + esc(eb) + '</div><div class="tt">' + tt + '</div>' + conteudo + '<div class="rod"><span class="marca">ENTENDENDO O JOGO</span><span>' + esc(per) + ' · ' + pg + '</span></div></section>'; }
    var body =
      sl('esc', 'Relatório do período', 'EOJHub +<br>Biblioteca EOJ', '<div style="font-size:22px;color:#A1C4E6;font-weight:700;margin-bottom:26px">' + esc(per) + '</div>' + big([['vendas', 'Vendas aprovadas'], ['contas_novas', 'Contas criadas'], ['alunos_ativos', 'Alunos que assistiram']])) +
      sl('', 'Destaques', 'O que aconteceu', '<ul class="lista">' + destaques(d).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>') +
      sl('az', '01 · Público', 'Quem chegou', big([['contas_novas', 'Contas criadas'], ['entraram', 'Pessoas que entraram'], ['alunos_ativos', 'Alunos ativos']]) + '<div class="g2" style="margin-top:18px"><div>' + colunasDias(d) + '</div><div>' + barras(d.contas_por_funcao, 'funcao', 'n', '#4A79A6') + '</div></div>') +
      sl('esc', '02 · Vendas', 'Hotmart', big([['vendas', 'Vendas aprovadas'], ['reembolsos', 'Reembolsos', 1], ['cancelamentos', 'Assinaturas canceladas', 1]]) + '<div class="g2" style="margin-top:18px"><div>' + barras(d.vendas_por_produto, 'produto', 'n', '#A1C4E6') + '</div><div style="font-size:15px;line-height:1.7"><b style="font-size:30px;color:#FFD400">' + n(d.vendas_pendentes) + '</b> pagamentos pendentes<br><b style="font-size:30px;color:#FFD400">' + n(d.carrinho_abandonado) + '</b> abandonos de carrinho</div></div>') +
      sl('', '03 · EOJHub', 'Aulas e progresso', big([['aulas_assistidas', 'Aulas assistidas'], ['aulas_concluidas', 'Aulas concluídas'], ['aulas_publicadas', 'Aulas postadas']]) + '<div class="g2" style="margin-top:18px"><div>' + barras((d.top_aulas || []).slice(0, 6), 'titulo', 'alunos') + '</div><div>' + barras((d.top_cursos || []).slice(0, 6), 'curso', 'alunos', '#111111') + '</div></div>') +
      sl('az', '04 · Biblioteca EOJ', 'Clipes e uso', big([['clipes_publicados', 'Clipes postados'], ['favoritos', 'Clipes salvos'], ['playlists', 'Playlists criadas']]) + '<div class="g2" style="margin-top:18px"><div style="font-size:15px;line-height:1.8">Pranchetas criadas: <b>' + n(e.pranchetas) + '</b><br>Pedidos de vídeo: <b>' + n(e.pedidos) + '</b> · em aberto: <b>' + n(e.pedidos_abertos) + '</b><br>Clipes no acervo: <b>' + n(t.clipes) + '</b> (' + n(t.clipes_clube) + ' de clubes)</div><div>' + barras(d.top_clipes, 'titulo', 'n') + '</div></div>') +
      sl('esc', '05 · Relacionamento', 'Atendimento e base', '<div class="big"><div><b>' + n(e.chat_conversas) + '</b><span>Conversas no chat</span><em style="color:#999999">' + n(e.chat_alunos) + ' mensagens de alunos · ' + n(e.chat_respostas) + ' respostas</em></div><div><b>' + n(e.emails_boas_vindas) + '</b><span>E-mails de boas-vindas</span></div><div><b>' + n(t.acessos_ativos) + '</b><span>Acessos pagos ativos (hoje)</span><em style="color:#999999">' + n(t.contas) + ' contas no total</em></div></div><p class="nota" style="color:#999999;margin-top:auto;margin-bottom:10mm">' + NOTA + '</p>');
    return doc('Apresentação EOJ · ' + per, css, body);
  }

  function doc(titulo, css, body) {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet"><style>' + css +
      '@media screen{body{background:#E9E9E9;padding:20px}body>*{max-width:900px;margin-left:auto;margin-right:auto}.sl{margin:0 auto 20px;box-shadow:0 8px 30px rgba(0,0,0,.15);max-width:none}body:not(.ap){background:#FFFFFF;max-width:820px;margin:0 auto}}</style></head><body' + (/sl /.test(body) ? ' class="ap"' : '') + '>' + body + '</body></html>';
  }

  window.EOJRel = {
    html: function (d, layout) { return layout === 'detalhado' ? detalhado(d) : layout === 'apresentacao' ? apresentacao(d) : executivo(d); },
    periodoTxt: periodoTxt
  };
})();
