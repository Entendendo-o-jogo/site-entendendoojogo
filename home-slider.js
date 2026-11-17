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
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () { });
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
      if (v && !parado && !pausaHover && v.paused && t - ini > TEMPO_TXT + 1500) ir(atual + 1); // autoplay bloqueado
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
        var vv = x.parentNode.querySelector('video'), lig = vv.muted; vv.muted = !lig;
        x.setAttribute('aria-pressed', lig ? 'true' : 'false'); x.querySelector('span').textContent = lig ? (x.getAttribute('data-l-off') || 'Desativar som') : (x.getAttribute('data-l-on') || 'Ativar som');
        if (lig) { parado = true; marcarParado(); vv.play().catch(function () { }); }
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
    marcarParado(); ir(0); raf = requestAnimationFrame(tick);
  }
  function procurar() { var s = document.querySelector('section.eoj-hs'); if (s) iniciar(s); }
  var n = 0, iv = setInterval(function () { procurar(); if (++n > 80 || document.querySelector('section.eoj-hs[data-hs="1"]')) clearInterval(iv); }, 150);
  document.addEventListener('DOMContentLoaded', procurar);
})();
