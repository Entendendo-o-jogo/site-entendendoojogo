/* Prancheta tática da Biblioteca EOJ (/biblioteca/prancheta).
   Campo com jogadores, bola, cones e setas; vários quadros que viram animação; baixar vídeo/imagem;
   salvar na conta (tabela pranchetas) e compartilhar por link (?c=CODIGO). Tudo no navegador. */
(function () {
  'use strict';
  var W = 105, H = 68; // proporção do campo (metros)
  var COR = { a: '#2F6FB5', b: '#C8322F', bola: '#FFFFFF', cone: '#F28C28' };
  var FORM = {
    '4-3-3': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [33, 30], [31, 50], [33, 70], [45, 20], [47, 50], [45, 80]],
    '4-4-2': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [33, 15], [32, 38], [32, 62], [33, 85], [45, 40], [45, 60]],
    '4-2-3-1': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [30, 40], [30, 60], [39, 20], [39, 50], [39, 80], [47, 50]],
    '3-5-2': [[5, 50], [20, 28], [19, 50], [20, 72], [33, 10], [31, 35], [30, 50], [31, 65], [33, 90], [45, 40], [45, 60]],
    '5-3-2': [[5, 50], [22, 8], [19, 30], [18, 50], [19, 70], [22, 92], [32, 30], [31, 50], [32, 70], [44, 40], [44, 60]]
  };
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function novoDoc() { return { titulo: 'Nova prancheta', dur: 1.2, pecas: [], quadros: [{ pos: {}, setas: [] }] }; }

  /* ---------- desenho ---------- */
  function campo(ctx, w, h) {
    var s = w / W;
    for (var i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2E7D46' : '#2A7341'; ctx.fillRect(i * w / 10, 0, w / 10 + 1, h); }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, s * 0.25);
    var m = 2 * s; ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    ctx.beginPath(); ctx.moveTo(w / 2, m); ctx.lineTo(w / 2, h - m); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 9.15 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 0.5 * s, 0, Math.PI * 2); ctx.fill();
    [[m, 1], [w - m, -1]].forEach(function (g) {
      var x = g[0], d = g[1];
      ctx.strokeRect(Math.min(x, x + d * 16.5 * s), h / 2 - 20.16 * s, 16.5 * s, 40.32 * s);
      ctx.strokeRect(Math.min(x, x + d * 5.5 * s), h / 2 - 9.16 * s, 5.5 * s, 18.32 * s);
      ctx.beginPath(); ctx.arc(x + d * 11 * s, h / 2, 0.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + d * 11 * s, h / 2, 9.15 * s, d > 0 ? -0.93 : Math.PI - 0.93, d > 0 ? 0.93 : Math.PI + 0.93); ctx.stroke();
    });
  }
  function seta(ctx, a, w, h, alfa) {
    var s = w / W, x1 = a.x1 * w, y1 = a.y1 * h, x2 = a.x2 * w, y2 = a.y2 * h;
    ctx.save(); ctx.globalAlpha = alfa == null ? 1 : alfa;
    ctx.strokeStyle = a.tipo === 'passe' ? '#FFFFFF' : '#FFE27A'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(2, s * 0.45); ctx.lineCap = 'round';
    var ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1), cab = Math.max(9, s * 2);
    ctx.beginPath();
    if (a.tipo === 'cond') { // condução: linha ondulada
      var n = Math.max(4, Math.floor(L / (s * 2.2)));
      for (var i = 0; i <= n; i++) { var t = i / n, px = x1 + (x2 - x1) * t * (1 - cab / L / 1.2), py = y1 + (y2 - y1) * t * (1 - cab / L / 1.2), off = (i % 2 ? 1 : -1) * s * 0.7 * (i === 0 || i === n ? 0 : 1);
        px += Math.cos(ang + Math.PI / 2) * off; py += Math.sin(ang + Math.PI / 2) * off; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    } else {
      if (a.tipo === 'passe') ctx.setLineDash([s * 1.4, s * 1.1]);
      ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * cab * 0.8, y2 - Math.sin(ang) * cab * 0.8);
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(ang - 0.42) * cab, y2 - Math.sin(ang - 0.42) * cab); ctx.lineTo(x2 - Math.cos(ang + 0.42) * cab, y2 - Math.sin(ang + 0.42) * cab); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function peca(ctx, p, x, y, w, sel) {
    var s = w / W;
    if (p.tipo === 'bola') {
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#111111'; ctx.lineWidth = Math.max(1, s * 0.2);
      ctx.beginPath(); ctx.arc(x, y, s * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.arc(x, y, s * 0.35, 0, Math.PI * 2); ctx.fill();
    } else if (p.tipo === 'cone') {
      ctx.fillStyle = COR.cone; ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s * 1.1, y + s * 0.9); ctx.lineTo(x - s * 1.1, y + s * 0.9); ctx.closePath(); ctx.fill();
    } else {
      var r = s * 1.75;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + s * 0.25, y + s * 0.3, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COR[p.tipo]; ctx.strokeStyle = sel ? '#FFE27A' : '#FFFFFF'; ctx.lineWidth = Math.max(1.5, s * (sel ? 0.5 : 0.3));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (p.n) { ctx.fillStyle = '#FFFFFF'; ctx.font = '700 ' + Math.round(s * 1.7) + 'px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(p.n).slice(0, 3), x, y + s * 0.08); }
    }
  }
  function desenhar(ctx, w, h, doc, pos, setas, selId, alfaSetas) {
    ctx.clearRect(0, 0, w, h); campo(ctx, w, h);
    (setas || []).forEach(function (a) { seta(ctx, a, w, h, alfaSetas); });
    var ordem = doc.pecas.slice().sort(function (p, q) { return (p.tipo === 'bola') - (q.tipo === 'bola'); });
    ordem.forEach(function (p) { var q = pos[p.id]; if (q) peca(ctx, p, q.x * w, q.y * h, w, p.id === selId); });
  }

  /* ---------- tela ---------- */
  window.EOJPrancheta = { iniciar: function (raiz) {
    var B = window.EOJB, doc = novoDoc(), q = 0, modo = 'mover', sel = null, arr = null, novaSeta = null, tocando = false, idSalvo = null, somenteLeitura = false;
    var css = '.pr{display:flex;flex-direction:column;gap:14px}.pr-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.pr-b{font:inherit;font-size:14px;font-weight:600;padding:9px 12px;border-radius:8px;border:1.5px solid #CCCCCC;background:#FFFFFF;color:#111111;cursor:pointer;display:inline-flex;gap:6px;align-items:center}' +
      '.pr-b[aria-pressed="true"]{background:#111111;border-color:#111111;color:#FFFFFF}.pr-b.p{background:#A1C4E6;border-color:#A1C4E6;color:#111111}.pr-b:disabled{opacity:.5;cursor:default}' +
      '.pr-sel{font:inherit;font-size:14px;padding:8px;border-radius:8px;border:1.5px solid #CCCCCC;background:#FFFFFF}.pr-sep{width:1px;height:28px;background:#DDDDDD;margin:0 4px}' +
      '.pr-cv{width:100%;aspect-ratio:105/68;border-radius:12px;touch-action:none;display:block;box-shadow:0 10px 30px rgba(0,0,0,.15);background:#2A7341}' +
      '.pr-q{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.pr-q .pr-b{min-width:44px;justify-content:center}.pr-dica{font-size:13px;color:#555555;margin:0}' +
      '.pr-in{font:inherit;font-size:15px;padding:9px 11px;border-radius:8px;border:1.5px solid #CCCCCC;min-width:220px;flex:1 1 220px}' +
      '.pr-lista{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}.pr-lista li{display:flex;gap:10px;align-items:center;justify-content:space-between;background:#FFFFFF;border:1px solid #E2E2E2;border-radius:10px;padding:10px 12px}';
    raiz.innerHTML = '<style>' + css + '</style><div class="pr">' +
      '<div class="pr-bar" role="toolbar" aria-label="Ferramentas">' +
        b('mover', '✋ Mover') + b('a', '<span style="width:12px;height:12px;border-radius:50%;background:' + COR.a + '"></span> Jogador azul') + b('b', '<span style="width:12px;height:12px;border-radius:50%;background:' + COR.b + '"></span> Jogador vermelho') +
        b('bola', '⚽ Bola') + b('cone', '▲ Cone') + '<span class="pr-sep"></span>' + b('passe', '⤏ Passe') + b('mov', '→ Movimento') + b('cond', '〰 Condução') + '<span class="pr-sep"></span>' + b('apagar', '✕ Apagar') +
      '</div>' +
      '<div class="pr-bar"><label style="font-size:14px;font-weight:600">Azul <select class="pr-sel" data-form="a"><option value="">Formação…</option>' + Object.keys(FORM).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
        '<label style="font-size:14px;font-weight:600">Vermelho <select class="pr-sel" data-form="b"><option value="">Formação…</option>' + Object.keys(FORM).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
        '<button type="button" class="pr-b" data-acao="limpar">Limpar tudo</button></div>' +
      '<canvas class="pr-cv" aria-label="Campo da prancheta tática" role="img"></canvas>' +
      '<p class="pr-dica" data-dica></p>' +
      '<div class="pr-q" aria-label="Quadros da animação"><strong style="font-size:14px">Quadros:</strong><span data-quadros style="display:flex;flex-wrap:wrap;gap:6px"></span>' +
        '<button type="button" class="pr-b" data-acao="novoq">+ Novo quadro</button><button type="button" class="pr-b" data-acao="apagarq">Apagar quadro</button></div>' +
      '<div class="pr-bar"><button type="button" class="pr-b p" data-acao="play">▶ Reproduzir</button>' +
        '<label style="font-size:14px;font-weight:600">Velocidade <select class="pr-sel" data-vel><option value="1.8">Lenta</option><option value="1.2" selected>Normal</option><option value="0.7">Rápida</option></select></label>' +
        '<button type="button" class="pr-b" data-acao="video">⬇ Baixar vídeo</button><button type="button" class="pr-b" data-acao="png">⬇ Baixar imagem</button><span data-status style="font-size:14px;color:#555555"></span></div>' +
      '<div class="pr-bar" style="border-top:1px solid #E2E2E2;padding-top:14px"><input class="pr-in" data-titulo maxlength="80" aria-label="Nome da prancheta" placeholder="Nome da prancheta">' +
        '<button type="button" class="pr-b p" data-acao="salvar">Salvar</button><button type="button" class="pr-b" data-acao="nova">Nova</button><button type="button" class="pr-b" data-acao="link">🔗 Compartilhar link</button></div>' +
      '<div data-minhas></div></div>';
    function b(m, t) { return '<button type="button" class="pr-b" data-modo="' + m + '" aria-pressed="false">' + t + '</button>'; }
    var cv = raiz.querySelector('canvas'), ctx = cv.getContext('2d'), stEl = raiz.querySelector('[data-status]'), tit = raiz.querySelector('[data-titulo]');
    var DICAS = { mover: 'Arraste as peças. Duplo clique em um jogador para mudar o número.', a: 'Clique no campo para colocar jogadores azuis.', b: 'Clique no campo para colocar jogadores vermelhos.', bola: 'Clique no campo para colocar a bola.', cone: 'Clique no campo para colocar cones.',
      passe: 'Arraste para desenhar um passe (seta tracejada).', mov: 'Arraste para desenhar um movimento sem bola.', cond: 'Arraste para desenhar uma condução de bola.', apagar: 'Clique em uma peça ou seta para apagar.' };
    function tam() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * H / W * d); render(); }
    function pos() { var Q = doc.quadros[q]; return Q.pos; }
    function render() { if (tocando) return; var setas = doc.quadros[q].setas.slice(); if (novaSeta) setas.push(novaSeta); desenhar(ctx, cv.width, cv.height, doc, pos(), setas, sel); }
    function ponto(e) { var r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; }
    function acha(p) { var P = pos(), melhor = null, d0 = 2.6 / W; doc.pecas.forEach(function (x) { var c = P[x.id]; if (!c) return; var d = Math.hypot((c.x - p.x) * W / H * 0.647 * 1.546, c.y - p.y); d = Math.hypot((c.x - p.x), (c.y - p.y) * H / W); if (d < d0) { d0 = d; melhor = x; } }); return melhor; }
    function achaSeta(p) { var S = doc.quadros[q].setas, k = -1, d0 = 1.5 / W; S.forEach(function (a, i) { var dx = a.x2 - a.x1, dy = (a.y2 - a.y1) * H / W, L = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p.x - a.x1) * dx + (p.y - a.y1) * H / W * dy) / L)), d = Math.hypot(a.x1 + t * dx - p.x, (a.y1 * H / W + t * dy) - p.y * H / W); if (d < d0) { d0 = d; k = i; } }); return k; }
    function addPeca(tipo, p, n) {
      if (tipo === 'bola' && doc.pecas.some(function (x) { return x.tipo === 'bola'; })) { var bo = doc.pecas.filter(function (x) { return x.tipo === 'bola'; })[0]; pos()[bo.id] = { x: p.x, y: p.y }; return; }
      var id = uid(), num = n;
      if (num == null && (tipo === 'a' || tipo === 'b')) { var usados = doc.pecas.filter(function (x) { return x.tipo === tipo; }).map(function (x) { return +x.n; }); num = 1; while (usados.indexOf(num) >= 0) num++; }
      doc.pecas.push({ id: id, tipo: tipo, n: num == null ? '' : String(num) });
      doc.quadros.forEach(function (Q) { Q.pos[id] = { x: p.x, y: p.y }; });
    }
    function setModo(m) { modo = m; raiz.querySelectorAll('[data-modo]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-modo') === m ? 'true' : 'false'); }); raiz.querySelector('[data-dica]').textContent = DICAS[m] || ''; }
    function quadros() {
      var box = raiz.querySelector('[data-quadros]');
      box.innerHTML = doc.quadros.map(function (Q, i) { return '<button type="button" class="pr-b" data-q="' + i + '" aria-pressed="' + (i === q) + '" aria-label="Quadro ' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('');
      raiz.querySelector('[data-acao="apagarq"]').disabled = doc.quadros.length < 2;
    }
    function tudo() { quadros(); tit.value = doc.titulo || ''; render(); }

    cv.addEventListener('pointerdown', function (e) {
      if (tocando || somenteLeitura) return; var p = ponto(e); cv.setPointerCapture(e.pointerId);
      if (modo === 'mover') { var x = acha(p); sel = x ? x.id : null; arr = x ? { id: x.id } : null; render(); }
      else if (modo === 'a' || modo === 'b' || modo === 'bola' || modo === 'cone') { addPeca(modo, p); render(); }
      else if (modo === 'passe' || modo === 'mov' || modo === 'cond') { novaSeta = { tipo: modo, x1: p.x, y1: p.y, x2: p.x, y2: p.y }; }
      else if (modo === 'apagar') {
        var y = acha(p);
        if (y) { doc.pecas = doc.pecas.filter(function (z) { return z.id !== y.id; }); doc.quadros.forEach(function (Q) { delete Q.pos[y.id]; }); }
        else { var k = achaSeta(p); if (k >= 0) doc.quadros[q].setas.splice(k, 1); }
        render();
      }
    });
    cv.addEventListener('pointermove', function (e) {
      if (arr) { var p = ponto(e); pos()[arr.id] = { x: p.x, y: p.y }; render(); }
      else if (novaSeta) { var p2 = ponto(e); novaSeta.x2 = p2.x; novaSeta.y2 = p2.y; render(); }
    });
    cv.addEventListener('pointerup', function () {
      arr = null;
      if (novaSeta) { if (Math.hypot(novaSeta.x2 - novaSeta.x1, (novaSeta.y2 - novaSeta.y1) * H / W) > 0.02) doc.quadros[q].setas.push(novaSeta); novaSeta = null; render(); }
    });
    cv.addEventListener('dblclick', function (e) {
      if (somenteLeitura) return; var x = acha(ponto(e)); if (!x || (x.tipo !== 'a' && x.tipo !== 'b')) return;
      var n = prompt('Número ou letra do jogador (até 3 caracteres):', x.n || ''); if (n != null) { x.n = n.trim().slice(0, 3); render(); }
    });
    raiz.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-modo')) return setModo(t.getAttribute('data-modo'));
      if (t.hasAttribute('data-q')) { q = +t.getAttribute('data-q'); sel = null; quadros(); render(); return; }
      var a = t.getAttribute('data-acao');
      if (a === 'novoq') { doc.quadros.splice(q + 1, 0, { pos: clone(pos()), setas: [] }); q++; quadros(); render(); }
      if (a === 'apagarq' && doc.quadros.length > 1) { doc.quadros.splice(q, 1); q = Math.max(0, q - 1); quadros(); render(); }
      if (a === 'limpar' && confirm('Apagar todas as peças e quadros?')) { var t0 = doc.titulo; doc = novoDoc(); doc.titulo = t0; q = 0; tudo(); }
      if (a === 'play') tocar(false);
      if (a === 'video') tocar(true);
      if (a === 'png') { var c2 = document.createElement('canvas'); c2.width = 1600; c2.height = Math.round(1600 * H / W); desenhar(c2.getContext('2d'), c2.width, c2.height, doc, pos(), doc.quadros[q].setas, null); baixar(c2.toDataURL('image/png'), nomeArq() + '.png'); ev('prancheta_imagem'); }
      if (a === 'salvar') salvar();
      if (a === 'nova') { if (!confirm('Começar uma prancheta nova? O que não foi salvo será perdido.')) return; doc = novoDoc(); q = 0; idSalvo = null; somenteLeitura = false; history.replaceState(null, '', location.pathname); tudo(); }
      if (a === 'link') compartilhar();
      if (a === 'abrir') abrir(+t.getAttribute('data-id'));
      if (a === 'excluir') excluir(+t.getAttribute('data-id'));
      if (a === 'copiar') { somenteLeitura = false; idSalvo = null; doc.titulo = (doc.titulo || 'Prancheta') + ' (cópia)'; tit.value = doc.titulo; status('Agora é uma cópia sua: edite e salve.'); }
    });
    raiz.querySelector('[data-vel]').addEventListener('change', function (e) { doc.dur = +e.target.value; });
    raiz.querySelectorAll('[data-form]').forEach(function (s) { s.addEventListener('change', function () {
      var tipo = s.getAttribute('data-form'), f = FORM[s.value]; s.value = ''; if (!f) return;
      doc.pecas.filter(function (x) { return x.tipo === tipo; }).forEach(function (x) { doc.quadros.forEach(function (Q) { delete Q.pos[x.id]; }); });
      doc.pecas = doc.pecas.filter(function (x) { return x.tipo !== tipo; });
      var nums = [1, 2, 3, 4, 6, 5, 8, 10, 7, 9, 11];
      f.forEach(function (c, i) { var x = c[0] / 100, y = c[1] / 100; if (tipo === 'b') { x = 1 - x; y = 1 - y; } addPeca(tipo, { x: x, y: y }, nums[i] || i + 1); });
      render();
    }); });
    tit.addEventListener('input', function () { doc.titulo = tit.value; });
    window.addEventListener('resize', tam);

    /* ---------- animação e vídeo ---------- */
    function eas(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function tocar(gravar) {
      if (tocando) return; if (doc.quadros.length < 2 && !gravar) { status('Crie pelo menos 2 quadros para animar (botão “+ Novo quadro”).'); return; }
      var alvo = cv, actx = ctx, rec = null, partes = [];
      if (gravar) {
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { status('Seu navegador não grava vídeo. Use o Chrome ou o Edge, ou baixe a imagem.'); return; }
        alvo = document.createElement('canvas'); alvo.width = 1280; alvo.height = 830; actx = alvo.getContext('2d');
        var tipos = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'], mime = tipos.filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
        try { rec = new MediaRecorder(alvo.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 6000000 } : {}); } catch (er) { status('Não foi possível gravar o vídeo neste navegador.'); return; }
        rec.ondataavailable = function (ev2) { if (ev2.data.size) partes.push(ev2.data); };
        rec.onstop = function () { var tp = rec.mimeType || 'video/webm', bl = new Blob(partes, { type: tp }); baixar(URL.createObjectURL(bl), nomeArq() + (/mp4/.test(tp) ? '.mp4' : '.webm')); status('Vídeo pronto' + (/mp4/.test(tp) ? '.' : ' (formato WebM; abre no Chrome, VLC e no WhatsApp Web).')); ev('prancheta_video'); };
        rec.start(); status('Gravando…');
      }
      tocando = true; sel = null;
      var dur = (doc.dur || 1.2) * 1000, k = 0, t0 = null, n = doc.quadros.length, pausaFim = 900, pausaIni = gravar ? 600 : 250;
      function interp(A, Bq, t) { var o = {}; doc.pecas.forEach(function (p) { var a = A.pos[p.id], b2 = Bq.pos[p.id] || a; if (!a) return; o[p.id] = { x: a.x + (b2.x - a.x) * t, y: a.y + (b2.y - a.y) * t }; }); return o; }
      function passo(ts) {
        if (t0 == null) t0 = ts;
        var dt = ts - t0, W2 = alvo.width, H2 = alvo.height;
        if (n < 2) { desenhar(actx, W2, H2, doc, doc.quadros[0].pos, doc.quadros[0].setas, null); if (dt > 2500) return fim(); return requestAnimationFrame(passo); }
        var total = pausaIni + (n - 1) * dur + pausaFim;
        if (dt >= total) { desenhar(actx, W2, H2, doc, doc.quadros[n - 1].pos, doc.quadros[n - 1].setas, null); return fim(); }
        var u = dt - pausaIni;
        if (u < 0) desenhar(actx, W2, H2, doc, doc.quadros[0].pos, doc.quadros[0].setas, null);
        else { k = Math.min(n - 2, Math.floor(u / dur)); var t = Math.min(1, (u - k * dur) / dur); if (u >= (n - 1) * dur) { k = n - 2; t = 1; }
          desenhar(actx, W2, H2, doc, interp(doc.quadros[k], doc.quadros[k + 1], eas(t)), doc.quadros[k].setas, null, 1 - t * 0.7); }
        requestAnimationFrame(passo);
      }
      function fim() { tocando = false; if (rec) setTimeout(function () { rec.stop(); }, 200); render(); }
      requestAnimationFrame(passo);
    }
    function baixar(url, nome) { var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); }
    function nomeArq() { return (doc.titulo || 'prancheta').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'prancheta'; }
    function status(t) { stEl.textContent = t; }
    function ev(n) { try { if (window.__eojGA && window.gtag) gtag('event', n); } catch (e) {} }

    /* ---------- salvar, abrir, compartilhar ---------- */
    function precisaLogin() { if (B && B.user) return false; if (confirm('Para salvar e compartilhar, entre na sua conta grátis da Biblioteca. Ir para o login agora? (o desenho atual fica guardado neste navegador)')) { try { localStorage.setItem('eojPranchetaRascunho', JSON.stringify(doc)); } catch (e) {} location.href = '/biblioteca/entrar?volta=' + encodeURIComponent('/biblioteca/prancheta'); } return true; }
    function salvar() {
      if (precisaLogin()) return; doc.titulo = (tit.value || '').trim() || 'Prancheta sem nome';
      var dados = { titulo: doc.titulo, dados: doc, atualizado_em: new Date().toISOString() };
      var op = idSalvo ? B.sb.from('pranchetas').update(dados).eq('id', idSalvo).select('id').single() : B.sb.from('pranchetas').insert(dados).select('id').single();
      status('Salvando…');
      return op.then(function (r) { if (r.error) throw r.error; idSalvo = r.data.id; somenteLeitura = false; status('Salvo ✓'); ev('prancheta_salvar'); minhas(); return idSalvo; })
        .catch(function (er) { status('Não foi possível salvar: ' + (er.message || er)); });
    }
    function compartilhar() {
      if (precisaLogin()) return;
      (idSalvo ? Promise.resolve(idSalvo) : salvar()).then(function (id) { if (!id) return;
        return B.sb.rpc('prancheta_codigo', { p: id }).then(function (r) { if (r.error) throw r.error;
          var url = location.origin + location.pathname.replace(/\/$/, '') + '?c=' + r.data;
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { status('Link copiado: ' + url); }).catch(function () { prompt('Copie o link da prancheta:', url); });
          ev('prancheta_compartilhar'); }); }).catch(function (er) { status('Não foi possível gerar o link: ' + (er.message || er)); });
    }
    function abrir(id) {
      B.sb.from('pranchetas').select('id,titulo,dados').eq('id', id).single().then(function (r) { if (r.error) return status(r.error.message);
        doc = r.data.dados; doc.titulo = r.data.titulo; idSalvo = r.data.id; somenteLeitura = false; q = 0; tudo(); status('Prancheta aberta.'); window.scrollTo({ top: raiz.offsetTop - 80, behavior: 'smooth' }); });
    }
    function excluir(id) {
      if (!confirm('Apagar esta prancheta? Não dá para desfazer.')) return;
      B.sb.from('pranchetas').delete().eq('id', id).then(function (r) { if (r.error) return status(r.error.message); if (idSalvo === id) idSalvo = null; minhas(); status('Prancheta apagada.'); });
    }
    function minhas() {
      var box = raiz.querySelector('[data-minhas]');
      if (!B || !B.user) { box.innerHTML = '<p class="pr-dica">Entre na sua conta grátis para salvar suas pranchetas e compartilhar com jogadores e comissão.</p>'; return; }
      B.sb.from('pranchetas').select('id,titulo,atualizado_em').order('atualizado_em', { ascending: false }).limit(50).then(function (r) {
        var L = r.data || [];
        box.innerHTML = '<h2 style="margin:6px 0 10px;font-size:18px;font-weight:800">Minhas pranchetas (' + L.length + ')</h2>' + (L.length ? '<ul class="pr-lista">' + L.map(function (p) {
          return '<li><span><strong>' + esc(p.titulo) + '</strong><br><span style="font-size:13px;color:#555555">' + new Date(p.atualizado_em).toLocaleDateString('pt-BR') + '</span></span><span style="display:flex;gap:6px"><button type="button" class="pr-b" data-acao="abrir" data-id="' + p.id + '">Abrir</button><button type="button" class="pr-b" data-acao="excluir" data-id="' + p.id + '" aria-label="Apagar ' + esc(p.titulo) + '">✕</button></span></li>'; }).join('') + '</ul>' : '<p class="pr-dica">Nenhuma prancheta salva ainda.</p>');
      });
    }
    function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function exemplo() { // prancheta inicial: um ataque simples em 3 quadros
      doc = novoDoc(); doc.titulo = 'Exemplo: terceiro homem';
      [[0.55, 0.5, 'a', '6'], [0.68, 0.32, 'a', '8'], [0.72, 0.62, 'a', '9'], [0.66, 0.5, 'b', '5'], [0.74, 0.45, 'b', '4'], [0.62, 0.38, 'b', '8']].forEach(function (c) { addPeca(c[2], { x: c[0], y: c[1] }, c[3]); });
      addPeca('bola', { x: 0.565, y: 0.52 });
      var P = doc.pecas, id = function (t, n) { return P.filter(function (x) { return x.tipo === t && x.n === n; })[0].id; }, bola = P.filter(function (x) { return x.tipo === 'bola'; })[0].id;
      doc.quadros[0].setas.push({ tipo: 'passe', x1: 0.565, y1: 0.52, x2: 0.71, y2: 0.6 });
      doc.quadros.push({ pos: clone(doc.quadros[0].pos), setas: [{ tipo: 'passe', x1: 0.71, y1: 0.6, x2: 0.76, y2: 0.36 }, { tipo: 'mov', x1: 0.68, y1: 0.32, x2: 0.78, y2: 0.34 }] });
      doc.quadros[1].pos[bola] = { x: 0.705, y: 0.6 }; doc.quadros[1].pos[id('b', '5')] = { x: 0.69, y: 0.56 };
      doc.quadros.push({ pos: clone(doc.quadros[1].pos), setas: [] });
      doc.quadros[2].pos[id('a', '8')] = { x: 0.78, y: 0.34 }; doc.quadros[2].pos[bola] = { x: 0.77, y: 0.355 }; doc.quadros[2].pos[id('b', '4')] = { x: 0.75, y: 0.42 };
    }

    // início: link compartilhado (?c=), rascunho guardado antes do login, ou exemplo
    setModo('mover');
    var cod = (new URLSearchParams(location.search)).get('c');
    (B && B.ready ? B.ready : Promise.resolve()).then(function () {
      if (cod) {
        return B.sb.rpc('prancheta_compartilhada', { cod: cod }).then(function (r) {
          if (r.error || !r.data || !r.data.length) { exemplo(); status('Link de prancheta inválido ou removido.'); return; }
          doc = r.data[0].dados; doc.titulo = r.data[0].titulo; somenteLeitura = true; idSalvo = null;
          raiz.querySelector('[data-dica]').innerHTML = 'Prancheta compartilhada (somente leitura). <button type="button" class="pr-b" data-acao="copiar">Fazer uma cópia para editar</button>';
        });
      }
      var rasc = null; try { rasc = JSON.parse(localStorage.getItem('eojPranchetaRascunho') || 'null'); localStorage.removeItem('eojPranchetaRascunho'); } catch (e) {}
      if (rasc && rasc.quadros) { doc = rasc; status('Seu desenho foi recuperado. Agora é só salvar.'); } else exemplo();
    }).then(function () { tudo(); tam(); minhas(); if (cod && somenteLeitura) { /* mantém a dica com o botão de cópia */ } });
    tam();
  } };
})();
