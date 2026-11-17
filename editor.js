/* Editor de vídeo da Biblioteca EOJ: junta os clipes de uma playlist, corta o trecho de cada um e gera um vídeo
   no próprio navegador (canvas + MediaRecorder; sem servidor). Página: /biblioteca/editor?pl=<id> ou ?pl=fav */
(function () {
  'use strict';
  var B = window.EOJB;
  var raiz, st = { itens: [], sel: 0, titulos: true, gerando: false };
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tm(s) { s = Math.max(0, s || 0); var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
  function L(t) { return B.L ? B.L(t) : t; }

  var CSS = '.ed{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}' +
    '.ed-main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:14px}' +
    '.ed-side{flex:1 1 340px;max-width:440px;display:flex;flex-direction:column;gap:10px}' +
    '.ed-video{width:100%;aspect-ratio:16/9;background:#111111;border-radius:12px;display:block}' +
    '.ed-box{background:#FFFFFF;border:1px solid #E2E2E2;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px}' +
    '.ed-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.ed-lbl{font-size:13px;font-weight:700;color:#555555;text-transform:uppercase;letter-spacing:.06em;min-width:52px}' +
    '.ed-t{font-variant-numeric:tabular-nums;font-weight:800;font-size:18px;min-width:66px}' +
    '.ed-b{font:inherit;font-size:14px;font-weight:600;background:#FFFFFF;color:#111111;border:1.5px solid #CCCCCC;border-radius:8px;padding:8px 12px;cursor:pointer}' +
    '.ed-b:hover{border-color:#4A79A6}.ed-b[disabled]{opacity:.45;cursor:default}' +
    '.ed-p{font:inherit;font-size:16px;font-weight:700;background:#A1C4E6;color:#111111;border:0;border-radius:8px;padding:13px 20px;cursor:pointer}' +
    '.ed-p[disabled]{opacity:.5;cursor:default}' +
    '.ed-it{display:flex;gap:10px;align-items:center;background:#FFFFFF;border:1.5px solid #E2E2E2;border-radius:10px;padding:8px;cursor:pointer}' +
    '.ed-it[aria-current="true"]{border-color:#4A79A6;box-shadow:0 0 0 2px #E6EFF8}' +
    '.ed-it.off{opacity:.5}' +
    '.ed-it img,.ed-it .ed-ph{width:96px;height:54px;border-radius:6px;object-fit:cover;background:#1C1C1C;flex:0 0 auto}' +
    '.ed-it .ed-tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '.ed-it .ed-tx b{font-size:14px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
    '.ed-it .ed-tx span{font-size:12px;color:#555555;font-variant-numeric:tabular-nums}' +
    '.ed-mv{display:flex;flex-direction:column;gap:4px}.ed-mv button{font:inherit;width:30px;height:26px;border:1px solid #CCCCCC;background:#FFFFFF;border-radius:6px;cursor:pointer;font-size:13px}' +
    '.ed-bar{height:10px;background:#EEEEEE;border-radius:5px;overflow:hidden}.ed-bar i{display:block;height:100%;width:0;background:#4A79A6}' +
    '.ed-tl{position:relative;height:58px;background:repeating-linear-gradient(90deg,#E9E9E9 0 1px,#F4F4F4 1px 10%);border-radius:10px;cursor:pointer;touch-action:none;user-select:none;margin:6px 0 18px}' +
    '.ed-tl .sel{position:absolute;top:0;bottom:0;background:rgba(74,121,166,.22);border-top:3px solid #4A79A6;border-bottom:3px solid #4A79A6;box-sizing:border-box;cursor:grab}' +
    '.ed-tl .sel:active{cursor:grabbing}' +
    '.ed-tl .pos{position:absolute;top:-4px;bottom:-4px;width:2px;background:#111111;pointer-events:none}' +
    '.ed-tl .hd{position:absolute;top:-3px;bottom:-3px;width:18px;margin-left:-9px;background:#4A79A6;border-radius:6px;cursor:ew-resize;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25);outline:none}' +
    '.ed-tl .hd::before{content:"";width:2px;height:20px;border-left:2px solid rgba(255,255,255,.85);border-right:2px solid rgba(255,255,255,.85);box-sizing:content-box;width:2px}' +
    '.ed-tl .hd:focus-visible{box-shadow:0 0 0 3px #A1C4E6}' +
    '.ed-tl .hd span{position:absolute;top:100%;margin-top:4px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:#3A6894;white-space:nowrap}' +
    '.ed-dica{font-size:13px;color:#555555;margin:0}' +
    '@media (max-width:900px){.ed-side{max-width:none}}';

  function render() {
    var it = st.itens[st.sel];
    var total = st.itens.reduce(function (a, x) { return a + (x.on && x.dur ? x.fim - x.ini : 0); }, 0);
    var nOn = st.itens.filter(function (x) { return x.on; }).length;
    raiz.querySelector('.ed-list').innerHTML = st.itens.map(function (x, i) {
      return '<div class="ed-it' + (x.on ? '' : ' off') + '" data-i="' + i + '" aria-current="' + (i === st.sel) + '" role="button" tabindex="0">' +
        '<input type="checkbox" data-on="' + i + '" ' + (x.on ? 'checked' : '') + ' aria-label="' + esc(L('Incluir no vídeo')) + '" style="width:18px;height:18px;margin:0;flex:0 0 auto;accent-color:#4A79A6">' +
        (x.thumb ? '<img src="' + esc(x.thumb) + '" alt="">' : '<span class="ed-ph"></span>') +
        '<span class="ed-tx"><b>' + (i + 1) + '. ' + esc(x.titulo) + '</b><span>' + (x.dur ? tm(x.ini) + ' → ' + tm(x.fim) + ' · ' + Math.round(x.fim - x.ini) + ' s' : (x.erro ? esc(L('Não foi possível carregar')) : esc(L('Carregando…')))) + '</span></span>' +
        '<span class="ed-mv"><button type="button" data-up="' + i + '" aria-label="' + esc(L('Subir')) + '"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-down="' + i + '" aria-label="' + esc(L('Descer')) + '"' + (i === st.itens.length - 1 ? ' disabled' : '') + '>↓</button></span></div>';
    }).join('');
    raiz.querySelector('.ed-total').textContent = nOn + ' ' + (nOn === 1 ? L('clipe') : L('clipes')) + ' · ' + L('duração') + ' ' + B.dur(total);
    raiz.querySelector('.ed-gerar').disabled = st.gerando || !nOn || st.itens.some(function (x) { return x.on && !x.dur; });
    if (it) {
      raiz.querySelector('.ed-nome').textContent = (st.sel + 1) + '. ' + it.titulo;
      raiz.querySelector('.ed-ini').textContent = tm(it.ini);
      raiz.querySelector('.ed-fim').textContent = tm(it.fim);
      timeline();
    }
  }
  function timeline() {
    var it = st.itens[st.sel], v = raiz.querySelector('.ed-video'); if (!it || !it.dur) return;
    var s = raiz.querySelector('.ed-tl .sel'), p = raiz.querySelector('.ed-tl .pos'), hi = raiz.querySelector('.ed-tl .h-ini'), hf = raiz.querySelector('.ed-tl .h-fim');
    s.style.left = (it.ini / it.dur * 100) + '%'; s.style.width = ((it.fim - it.ini) / it.dur * 100) + '%';
    p.style.left = ((v.currentTime || 0) / it.dur * 100) + '%';
    hi.style.left = (it.ini / it.dur * 100) + '%'; hf.style.left = (it.fim / it.dur * 100) + '%';
    hi.querySelector('span').textContent = tm(it.ini); hf.querySelector('span').textContent = tm(it.fim);
    hi.setAttribute('aria-valuenow', it.ini); hi.setAttribute('aria-valuetext', tm(it.ini)); hi.setAttribute('aria-valuemax', it.dur);
    hf.setAttribute('aria-valuenow', it.fim); hf.setAttribute('aria-valuetext', tm(it.fim)); hf.setAttribute('aria-valuemax', it.dur);
  }
  function selecionar(i) {
    st.sel = i; var it = st.itens[i], v = raiz.querySelector('.ed-video');
    if (it && it.link && v.getAttribute('data-src') !== it.link) { v.setAttribute('data-src', it.link); v.src = it.link; v.currentTime = 0; }
    render();
  }
  function ajustar(campo, valor) {
    var it = st.itens[st.sel]; if (!it || !it.dur) return;
    if (campo === 'ini') it.ini = Math.max(0, Math.min(valor, it.fim - 0.5));
    else it.fim = Math.min(it.dur, Math.max(valor, it.ini + 0.5));
    it.ini = Math.round(it.ini * 10) / 10; it.fim = Math.round(it.fim * 10) / 10;
    render();
  }

  function montar() {
    raiz.innerHTML = '';
    var s = el('style', {}, CSS); raiz.appendChild(s);
    var ed = el('div', { class: 'ed' });
    ed.innerHTML =
      '<div class="ed-main">' +
      '<video class="ed-video" controls playsinline crossorigin="anonymous" preload="auto"></video>' +
      '<div class="ed-box"><div class="ed-row" style="justify-content:space-between"><b class="ed-nome" style="font-size:17px"></b>' +
      '<button type="button" class="ed-b ed-trecho">▶ ' + esc(L('Assistir o trecho')) + '</button></div>' +
      '<p class="ed-dica">' + esc(L('Arraste as alças azuis para marcar onde o trecho começa e termina. Arraste a faixa para mover o trecho inteiro.')) + '</p>' +
      '<div class="ed-tl"><span class="sel"></span><span class="pos"></span>' +
      '<span class="hd h-ini" tabindex="0" role="slider" aria-label="' + esc(L('Início')) + '" aria-valuemin="0"><span></span></span>' +
      '<span class="hd h-fim" tabindex="0" role="slider" aria-label="' + esc(L('Fim')) + '" aria-valuemin="0"><span></span></span></div>' +
      '<div class="ed-row" style="justify-content:space-between"><div class="ed-row"><span class="ed-lbl">' + esc(L('Início')) + '</span><span class="ed-t ed-ini">0:00.0</span>' +
      '<button type="button" class="ed-b" data-aj="ini" data-d="-1">−1 s</button><button type="button" class="ed-b" data-aj="ini" data-d="1">+1 s</button></div>' +
      '<div class="ed-row"><span class="ed-lbl">' + esc(L('Fim')) + '</span><span class="ed-t ed-fim">0:00.0</span>' +
      '<button type="button" class="ed-b" data-aj="fim" data-d="-1">−1 s</button><button type="button" class="ed-b" data-aj="fim" data-d="1">+1 s</button></div></div></div>' +
      '<div class="ed-box ed-res" style="display:none"></div>' +
      '</div>' +
      '<div class="ed-side"><div class="ed-list" style="display:flex;flex-direction:column;gap:8px"></div>' +
      '<div class="ed-box"><span class="ed-total" style="font-weight:700"></span>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:14px;cursor:pointer"><input type="checkbox" class="ed-tit" checked style="width:18px;height:18px;margin:0;accent-color:#4A79A6">' + esc(L('Mostrar o título de cada clipe no vídeo')) + '</label>' +
      '<button type="button" class="ed-p ed-gerar">' + esc(L('Gerar vídeo')) + '</button>' +
      '<div class="ed-prog" style="display:none;flex-direction:column;gap:6px"><div class="ed-bar"><i></i></div><span class="ed-ptx" style="font-size:13px;color:#555555"></span></div>' +
      '<p style="margin:0;font-size:13px;line-height:1.5;color:#555555">' + esc(L('O vídeo é montado no seu navegador, em 720p, e leva o mesmo tempo da duração final. Deixe esta aba aberta até terminar.')) + '</p></div></div>';
    raiz.appendChild(ed);
    var v = raiz.querySelector('.ed-video');
    v.addEventListener('timeupdate', function () {
      timeline();
      var it = st.itens[st.sel];
      if (st.tocandoTrecho && it && v.currentTime >= it.fim) { v.pause(); st.tocandoTrecho = false; }
    });
    // Linha do tempo: arrastar as alças (início/fim), arrastar a faixa (move o trecho) ou clicar para ir ao ponto
    var tl = raiz.querySelector('.ed-tl'), arr = null;
    function seg(e) { var it = st.itens[st.sel], r = tl.getBoundingClientRect(); return Math.max(0, Math.min(it.dur, (e.clientX - r.left) / r.width * it.dur)); }
    tl.addEventListener('pointerdown', function (e) {
      var it = st.itens[st.sel]; if (!it || !it.dur) return;
      var t = e.target, modo = t.closest('.h-ini') ? 'ini' : t.closest('.h-fim') ? 'fim' : t.closest('.sel') ? 'mover' : 'ir';
      arr = { modo: modo, x0: seg(e), ini0: it.ini, fim0: it.fim, moveu: false };
      tl.setPointerCapture(e.pointerId); e.preventDefault();
      if (modo === 'ir') { v.currentTime = arr.x0; timeline(); }
    });
    tl.addEventListener('pointermove', function (e) {
      if (!arr) return; var it = st.itens[st.sel], x = seg(e); arr.moveu = true;
      if (arr.modo === 'ini') { it.ini = Math.round(Math.max(0, Math.min(x, it.fim - 0.5)) * 10) / 10; v.currentTime = it.ini; }
      else if (arr.modo === 'fim') { it.fim = Math.round(Math.min(it.dur, Math.max(x, it.ini + 0.5)) * 10) / 10; v.currentTime = it.fim; }
      else if (arr.modo === 'mover') { var d = x - arr.x0, len = arr.fim0 - arr.ini0, ni = Math.max(0, Math.min(it.dur - len, arr.ini0 + d)); it.ini = Math.round(ni * 10) / 10; it.fim = Math.round((ni + len) * 10) / 10; v.currentTime = it.ini; }
      else { v.currentTime = x; }
      if (!v.paused) v.pause();
      timeline(); raiz.querySelector('.ed-ini').textContent = tm(it.ini); raiz.querySelector('.ed-fim').textContent = tm(it.fim);
    });
    function soltar() { if (!arr) return; var m = arr.modo; arr = null; if (m !== 'ir') render(); }
    tl.addEventListener('pointerup', soltar); tl.addEventListener('pointercancel', soltar);
    tl.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('.hd'); if (!h) return; var it = st.itens[st.sel]; if (!it || !it.dur) return;
      var d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.5 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.5 : 0; if (!d) return;
      e.preventDefault(); var c = h.classList.contains('h-ini') ? 'ini' : 'fim'; ajustar(c, it[c] + d * (e.shiftKey ? 4 : 1)); v.currentTime = it[c];
      var nh = raiz.querySelector('.ed-tl .h-' + c); if (nh) nh.focus();
    });
    raiz.addEventListener('click', function (e) {
      var t = e.target, it = st.itens[st.sel];
      if (t.closest('[data-up]')) { var i = +t.closest('[data-up]').getAttribute('data-up'); var x = st.itens.splice(i, 1)[0]; st.itens.splice(i - 1, 0, x); if (st.sel === i) st.sel = i - 1; else if (st.sel === i - 1) st.sel = i; render(); return; }
      if (t.closest('[data-down]')) { var j = +t.closest('[data-down]').getAttribute('data-down'); var y = st.itens.splice(j, 1)[0]; st.itens.splice(j + 1, 0, y); if (st.sel === j) st.sel = j + 1; else if (st.sel === j + 1) st.sel = j; render(); return; }
      if (t.hasAttribute('data-on')) { st.itens[+t.getAttribute('data-on')].on = t.checked; render(); return; }
      if (t.closest('.ed-it')) { selecionar(+t.closest('.ed-it').getAttribute('data-i')); return; }
      if (t.hasAttribute('data-aj')) { var c = t.getAttribute('data-aj'); ajustar(c, it[c] + (+t.getAttribute('data-d'))); return; }
      if (t.hasAttribute('data-marca')) { ajustar(t.getAttribute('data-marca'), v.currentTime || 0); return; }
      if (t.closest('.ed-trecho') && it && it.dur) { v.currentTime = it.ini; st.tocandoTrecho = true; v.play().catch(function () {}); return; }
      if (t.closest('.ed-gerar')) { gerar(); return; }
    });
    raiz.addEventListener('keydown', function (e) { var it = e.target.closest && e.target.closest('.ed-it'); if (it && (e.key === 'Enter' || e.key === ' ') && e.target === it) { e.preventDefault(); selecionar(+it.getAttribute('data-i')); } });
    raiz.querySelector('.ed-tit').addEventListener('change', function (e) { st.titulos = e.target.checked; });
  }

  function carregarDuracao(x) {
    return new Promise(function (res) {
      var v = document.createElement('video'); v.preload = 'metadata'; v.crossOrigin = 'anonymous'; v.muted = true;
      v.onloadedmetadata = function () { x.dur = v.duration; x.ini = 0; x.fim = Math.round(v.duration * 10) / 10; v.removeAttribute('src'); v.load(); res(); };
      v.onerror = function () { x.erro = true; res(); };
      v.src = x.link;
    });
  }

  function escolherMime() {
    var op = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < op.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(op[i])) return op[i];
    return '';
  }

  function gerar() {
    if (st.gerando) return;
    var lista = st.itens.filter(function (x) { return x.on && x.dur; });
    if (!lista.length) return;
    var mime = escolherMime();
    if (!mime) { alert(L('Este navegador não consegue gerar vídeos. Use o Chrome, o Edge ou o Safari atualizados.')); return; }
    st.gerando = true; render();
    var prev = raiz.querySelector('.ed-video'); prev.pause();
    var prog = raiz.querySelector('.ed-prog'), bar = prog.querySelector('i'), ptx = raiz.querySelector('.ed-ptx');
    prog.style.display = 'flex'; raiz.querySelector('.ed-res').style.display = 'none';
    var W = 1280, H = 720, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var cx = cv.getContext('2d');
    var vid = document.createElement('video'); vid.crossOrigin = 'anonymous'; vid.playsInline = true; vid.preload = 'auto';
    vid.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none';
    document.body.appendChild(vid);
    var AC = window.AudioContext || window.webkitAudioContext, ac = AC ? new AC() : null, audioTrack = null;
    if (ac) { try { var src = ac.createMediaElementSource(vid), dest = ac.createMediaStreamDestination(); src.connect(dest); audioTrack = dest.stream.getAudioTracks()[0]; } catch (e) { audioTrack = null; } }
    var stream = cv.captureStream(30); if (audioTrack) stream.addTrack(audioTrack);
    var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 }), partes = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) partes.push(e.data); };
    var total = lista.reduce(function (a, x) { return a + x.fim - x.ini; }, 0), feito = 0, atual = null, tituloAte = 0, desenhando = true;
    function desenhar() {
      if (!desenhando) return;
      if (vid.readyState >= 2) {
        var vw = vid.videoWidth || W, vh = vid.videoHeight || H, k = Math.min(W / vw, H / vh), dw = vw * k, dh = vh * k;
        cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H); cx.drawImage(vid, (W - dw) / 2, (H - dh) / 2, dw, dh);
        if (st.titulos && atual && vid.currentTime < tituloAte) {
          var a = Math.min(1, (tituloAte - vid.currentTime) / 0.4);
          cx.globalAlpha = a; cx.fillStyle = 'rgba(17,17,17,0.82)'; cx.font = '700 30px Montserrat, Arial, sans-serif';
          var tw = Math.min(W - 80, cx.measureText(atual.titulo).width + 48); cx.fillRect(40, H - 110, tw, 64);
          cx.fillStyle = '#A1C4E6'; cx.fillRect(40, H - 110, 6, 64);
          cx.fillStyle = '#FFFFFF'; cx.fillText(atual.titulo.length > 60 ? atual.titulo.slice(0, 58) + '…' : atual.titulo, 64, H - 67); cx.globalAlpha = 1;
        }
        if (atual) { var f = feito + Math.max(0, vid.currentTime - atual.ini); bar.style.width = Math.min(100, f / total * 100) + '%'; ptx.textContent = L('Gerando') + ' ' + B.dur(f) + ' / ' + B.dur(total); }
      }
      requestAnimationFrame(desenhar);
    }
    function tocar(x) {
      return new Promise(function (res, rej) {
        atual = x;
        vid.onerror = function () { rej(new Error('video')); };
        vid.onloadedmetadata = function () { vid.currentTime = x.ini; };
        vid.onseeked = function () {
          vid.onseeked = null; tituloAte = x.ini + 2.6;
          if (rec.state === 'inactive') rec.start(1000); else if (rec.state === 'paused') rec.resume();
          vid.play().catch(rej);
          var timer = setInterval(function () {
            if (vid.currentTime >= x.fim - 0.03 || vid.ended) { clearInterval(timer); vid.pause(); if (rec.state === 'recording') rec.pause(); feito += x.fim - x.ini; res(); }
          }, 15);
        };
        vid.src = x.link;
      });
    }
    if (ac && ac.state === 'suspended') ac.resume();
    requestAnimationFrame(desenhar);
    var cadeia = Promise.resolve();
    lista.forEach(function (x) { cadeia = cadeia.then(function () { return tocar(x); }); });
    cadeia.then(function () {
      return new Promise(function (res) { rec.onstop = res; if (rec.state === 'paused') rec.resume(); setTimeout(function () { rec.stop(); }, 120); });
    }).then(function () {
      desenhando = false; vid.remove(); if (ac) ac.close();
      var tipo = mime.split(';')[0], ext = tipo === 'video/mp4' ? 'mp4' : 'webm', blob = new Blob(partes, { type: tipo });
      var nome = (st.nome || 'video-eoj').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '.' + ext;
      var url = URL.createObjectURL(blob), res = raiz.querySelector('.ed-res');
      res.style.display = 'flex';
      res.innerHTML = '<b style="font-size:18px">' + esc(L('Seu vídeo está pronto')) + '</b>' +
        '<video src="' + url + '" controls playsinline style="width:100%;border-radius:10px;background:#111111"></video>' +
        '<div class="ed-row"><a class="ed-p" href="' + url + '" download="' + esc(nome) + '" style="text-decoration:none">' + esc(L('Baixar vídeo')) + ' (' + (blob.size / 1048576).toFixed(1).replace('.', ',') + ' MB)</a>' +
        '<button type="button" class="ed-b ed-share" style="display:none">' + esc(L('Compartilhar')) + '</button></div>' +
        (ext === 'webm' ? '<p style="margin:0;font-size:13px;color:#555555">' + esc(L('Este navegador gera o vídeo em WebM. Para enviar pelo WhatsApp, prefira gerar no Safari ou no Chrome atualizado, que geram MP4.')) + '</p>' : '');
      try {
        var arq = new File([blob], nome, { type: tipo });
        if (navigator.canShare && navigator.canShare({ files: [arq] })) {
          var sb = res.querySelector('.ed-share'); sb.style.display = 'inline-block';
          sb.onclick = function () { navigator.share({ files: [arq], title: st.nome || 'Biblioteca EOJ' }).catch(function () {}); };
        }
      } catch (e) {}
      res.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ptx.textContent = L('Pronto'); bar.style.width = '100%';
      B.ev && B.ev('bib_editor_gerar', { quantidade: lista.length, duracao: Math.round(total), formato: ext });
      st.gerando = false; render();
    }).catch(function () {
      desenhando = false; try { rec.state !== 'inactive' && rec.stop(); } catch (e) {} vid.remove(); if (ac) ac.close();
      ptx.textContent = L('Não foi possível gerar o vídeo. Tente de novo.'); st.gerando = false; render();
    });
  }

  window.EOJEditor = {
    iniciar: function (alvo, onTitulo) {
      raiz = alvo; raiz.setAttribute('data-pronto', '1');
      var pl = B.param('pl'), clipe = B.param('clipe');
      raiz.innerHTML = '<p style="margin:0;color:#555555">' + esc(L('Carregando…')) + '</p>';
      B.ready.then(function () {
        if (!B.user) { raiz.innerHTML = '<p style="margin:0;font-size:16px">' + esc(L('Entre na sua conta para usar o editor.')) + ' <a href="' + B.u('/biblioteca/entrar') + '?volta=' + encodeURIComponent(location.pathname + location.search) + '">' + esc(L('Entrar')) + '</a></p>'; return; }
        return Promise.all([B.clipes(), clipe ? Promise.resolve([]) : pl === 'fav' ? B.favIds() : B.playlists()]).then(function (r) {
          var M = {}; r[0].forEach(function (c) { M[c.id] = c; });
          var ids;
          if (clipe) { if (!M[clipe]) { raiz.innerHTML = '<p style="margin:0">' + esc(L('Clipe não encontrado.')) + '</p>'; return; } ids = [M[clipe].id]; st.nome = M[clipe].titulo; }
          else if (pl === 'fav') { ids = r[1]; st.nome = L('Favoritos'); }
          else {
            var p = r[1].filter(function (x) { return String(x.id) === String(pl); })[0];
            if (!p) { raiz.innerHTML = '<p style="margin:0">' + esc(L('Playlist não encontrada.')) + ' <a href="' + B.u('/biblioteca/minha-area') + '#playlists">' + esc(L('Voltar para Minha área')) + '</a></p>'; return; }
            st.nome = p.nome; ids = (p.playlist_clipes || []).slice().sort(function (a, b) { return a.ordem - b.ordem; }).map(function (x) { return x.clipe; });
          }
          ids = ids.filter(function (id) { return M[id]; });
          if (onTitulo) onTitulo(st.nome);
          if (!ids.length) { raiz.innerHTML = '<p style="margin:0">' + esc(L('Esta playlist ainda não tem clipes.')) + '</p>'; return; }
          st.itens = ids.map(function (id) { var c = M[id]; return { id: id, titulo: c.titulo, thumb: c.thumb || '', on: true, dur: 0, ini: 0, fim: 0 }; });
          montar(); render();
          var fila = st.itens.slice(), ativos = 0;
          function proximo() {
            if (!fila.length) return;
            var x = fila.shift(); ativos++;
            B.funcao({ acao: 'baixar', id: x.id, qualidade: 720 }).then(function (d) { x.link = d.link; return carregarDuracao(x); })
              .catch(function () { x.erro = true; x.on = false; })
              .then(function () { ativos--; if (x === st.itens[st.sel]) selecionar(st.sel); else render(); proximo(); });
          }
          proximo(); proximo(); proximo();
        });
      }).catch(function (e) { raiz.innerHTML = '<p style="margin:0">' + esc(B.msg ? B.msg(e) : String(e)) + '</p>'; });
    }
  };
})();
