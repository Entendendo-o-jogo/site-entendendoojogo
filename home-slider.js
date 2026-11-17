// Carrossel da abertura da home: frase central → vídeo da Biblioteca EOJ → vídeo do EOJHub.
// Passa sozinho (o 1º slide fica 7 s; os de vídeo, até o vídeo acabar). Para ao interagir, ao passar o mouse
// e com "reduzir movimento". A seção tem data-keep, então o runtime da página não a recria.
(function () {
  var TEMPO_TXT = 7000, TEMPO_MAX = 60000;
  function iniciar(sec) {
    if (sec.getAttribute('data-hs') === '1') return;
    sec.setAttribute('data-hs', '1');
    var track = sec.querySelector('.eoj-hs-track'), slides = [].slice.call(sec.querySelectorAll('.eoj-hs-slide'));
    var dots = [].slice.call(sec.querySelectorAll('[data-ir]')), atual = 0, ini = 0, dur = TEMPO_TXT, raf = 0;
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var parado = reduz, pausaHover = false, decorrido = 0;
    function marcarParado() { sec.setAttribute('data-parado', parado ? '1' : '0'); var b = sec.querySelector('[data-pausa]'); if (b) b.setAttribute('aria-label', parado ? 'Retomar a troca automática' : 'Pausar a troca automática'); }
    // Som ligado por padrão. O navegador só deixa tocar com som depois de um clique/toque na página:
    // até lá o vídeo toca mudo e o som liga sozinho no primeiro toque (a não ser que a pessoa tenha desligado).
    var querSom = true, liberado = false;
    function botaoSom(v) { var b = v.parentNode.querySelector('[data-som]'); if (!b) return; var on = !v.muted; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.querySelector('span').textContent = on ? (b.getAttribute('data-l-off') || 'Desativar som') : (b.getAttribute('data-l-on') || 'Ativar som'); }
    function tocar(v) {
      v.muted = !querSom;
      var pr = v.play();
      if (pr && pr.then) pr.then(function () { botaoSom(v); }).catch(function () { v.muted = true; botaoSom(v); var p2 = v.play(); if (p2 && p2.catch) p2.catch(function () { }); });
      else botaoSom(v);
    }
    function liberar() {
      if (liberado) return; liberado = true;
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, liberar, true); });
      var v = video(atual); if (v && querSom && v.muted) { v.muted = false; botaoSom(v); }
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, liberar, true); });
    function video(i) { return slides[i] && slides[i].querySelector('video'); }
    function ir(i, manual) {
      var n = slides.length; i = (i + n) % n;
      var vAnt = video(atual); if (vAnt && i !== atual) vAnt.pause();
      atual = i; track.style.transform = 'translateX(' + (-100 * i) + '%)';
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); s.querySelectorAll('a,button,video').forEach(function (el) { if (k === i) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1'); }); });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); var bar = d.querySelector('i'); if (bar) bar.style.setProperty('--p', k < i ? 1 : 0); });
      var v = video(i); dur = TEMPO_TXT; decorrido = 0; ini = performance.now();
      if (v) {
        if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.preload = 'auto'; }
        try { v.currentTime = 0; } catch (e) { }
        tocar(v);
        dur = isFinite(v.duration) && v.duration ? v.duration * 1000 : TEMPO_MAX;
      }
      if (manual) { parado = true; marcarParado(); }
      var prox = video((i + 1) % n); if (prox && !prox.getAttribute('src')) { prox.preload = 'metadata'; prox.src = prox.getAttribute('data-src'); }
    }
    function tick(t) {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      var v = video(atual), p;
      if (v && v.getAttribute('src')) {
        if (isFinite(v.duration) && v.duration) p = v.currentTime / v.duration; else p = 0;
      } else {
        if (parado || pausaHover) { ini = t - decorrido; } else decorrido = t - ini;
        p = Math.min(1, decorrido / dur);
      }
      var bar = dots[atual] && dots[atual].querySelector('i'); if (bar) bar.style.setProperty('--p', p);
      if (!parado && !pausaHover && !v && p >= 1) ir(atual + 1);
      if (v && !parado && !pausaHover && v.paused && v.currentTime < 0.5 && t - ini > TEMPO_TXT + 1500) ir(atual + 1); // autoplay bloqueado
    }
    slides.forEach(function (s, k) {
      var v = s.querySelector('video'); if (!v) return;
      v.addEventListener('ended', function () { if (k !== atual) return; if (!parado) ir(atual + 1); else { try { v.currentTime = 0; } catch (e) { } v.play().catch(function () { }); } });
    });
    sec.addEventListener('click', function (e) {
      var t = e.target, x;
      if ((x = t.closest('[data-ir]'))) return ir(+x.getAttribute('data-ir'), true);
      if (t.closest('[data-prox]')) return ir(atual + 1, true);
      if (t.closest('[data-ant]')) return ir(atual - 1, true);
      if (t.closest('[data-pausa]')) { parado = !parado; marcarParado(); var v = video(atual); if (v) { if (parado) v.pause(); else v.play().catch(function () { }); } return; }
      if ((x = t.closest('[data-som]'))) {
        var vv = x.parentNode.querySelector('video'); liberado = true;
        querSom = vv.muted; vv.muted = !querSom; botaoSom(vv);
        if (querSom) vv.play().catch(function () { });
      }
    });
    sec.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { ir(atual + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { ir(atual - 1, true); e.preventDefault(); }
    });
    sec.addEventListener('mouseenter', function () { pausaHover = true; });
    sec.addEventListener('mouseleave', function () { pausaHover = false; });
    // gestos no celular
    var x0 = null;
    sec.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    sec.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) ir(atual + (dx < 0 ? 1 : -1), true); }, { passive: true });
    // rótulos do botão de som no idioma da página
    var lang = (document.documentElement.lang || 'pt').slice(0, 2);
    var L = { es: ['Activar sonido', 'Desactivar sonido'], en: ['Turn sound on', 'Turn sound off'] }[lang];
    if (L) sec.querySelectorAll('[data-som]').forEach(function (b) { b.setAttribute('data-l-on', L[0]); b.setAttribute('data-l-off', L[1]); b.querySelector('span').textContent = L[0]; });
    sec.querySelectorAll('video').forEach(function (v) { v.removeAttribute('muted'); });
    // Entrada do 1º slide com Web Animations: sobrevive às re-renderizações da página (animação CSS reiniciava e piscava)
    sec.querySelectorAll('.eoj-t-in').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-d')) || 0;
      el.style.animation = 'none'; el.style.opacity = '1';
      if (!reduz && el.animate) el.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: d * 1000, easing: 'ease-out', fill: 'backwards' });
    });
    var bgi = sec.querySelector('.eoj-t-bg');
    if (bgi && !reduz && bgi.animate) bgi.animate([{ transform: 'scale(1.06)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 1800, easing: 'ease-out', fill: 'backwards' });
    marcarParado(); ir(0); raf = requestAnimationFrame(tick);
  }
  function procurar() { var s = document.querySelector('section.eoj-hs'); if (s) iniciar(s); }
  var n = 0, iv = setInterval(function () { procurar(); if (++n > 80 || document.querySelector('section.eoj-hs[data-hs="1"]')) clearInterval(iv); }, 150);
  document.addEventListener('DOMContentLoaded', procurar);
})();
