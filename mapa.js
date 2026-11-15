/* Mapa "Onde estão nossos alunos": países com alunos em azul. Geometria carregada sob demanda (world-atlas). */
(function () {
  'use strict';
  var PAISES = { // código ISO numérico → [pt, es, en]
    '076': ['Brasil', 'Brasil', 'Brazil'], '032': ['Argentina', 'Argentina', 'Argentina'], '858': ['Uruguai', 'Uruguay', 'Uruguay'],
    '170': ['Colômbia', 'Colombia', 'Colombia'], '862': ['Venezuela', 'Venezuela', 'Venezuela'], '068': ['Bolívia', 'Bolivia', 'Bolivia'],
    '600': ['Paraguai', 'Paraguay', 'Paraguay'], '620': ['Portugal', 'Portugal', 'Portugal'], '724': ['Espanha', 'España', 'Spain'],
    '792': ['Turquia', 'Turquía', 'Türkiye'], '840': ['Estados Unidos', 'Estados Unidos', 'United States'], '484': ['México', 'México', 'Mexico'],
    '036': ['Austrália', 'Australia', 'Australia'], '360': ['Indonésia', 'Indonesia', 'Indonesia'], '764': ['Tailândia', 'Tailandia', 'Thailand'],
    '156': ['China', 'China', 'China'], '392': ['Japão', 'Japón', 'Japan'], '410': ['Coreia do Sul', 'Corea del Sur', 'South Korea'],
    '276': ['Alemanha', 'Alemania', 'Germany'], '250': ['França', 'Francia', 'France']
  };
  var L = (document.documentElement.lang || 'pt').slice(0, 2), IDX = L === 'es' ? 1 : L === 'en' ? 2 : 0;
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  function carregar(src) {
    return new Promise(function (ok, erro) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = erro; document.head.appendChild(s); });
  }
  function desenhar(el) {
    if (el.getAttribute('data-pronto')) return;
    el.setAttribute('data-pronto', '1');
    var libs = window.d3 && window.d3.geoPath && window.topojson ? Promise.resolve() :
      carregar(CDN + 'd3-array@3/dist/d3-array.min.js').then(function () { return carregar(CDN + 'd3-geo@3/dist/d3-geo.min.js'); })
        .then(function () { return carregar(CDN + 'topojson-client@3/dist/topojson-client.min.js'); });
    Promise.all([libs, fetch(CDN + 'world-atlas@2/countries-110m.json').then(function (r) { return r.json(); })]).then(function (r) {
      var mundo = r[1], d3 = window.d3;
      var paises = window.topojson.feature(mundo, mundo.objects.countries).features.filter(function (f) { return f.id !== '010'; }); // sem Antártida
      var W = 960, H = 470, proj = d3.geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features: paises }), path = d3.geoPath(proj);
      var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', ['Mapa-múndi com os países onde há alunos do Entendendo o Jogo destacados em azul', 'Mapamundi con los países donde hay alumnos de Entendendo o Jogo destacados en azul', 'World map highlighting in blue the countries where Entendendo o Jogo has students'][IDX]);
      svg.style.cssText = 'width:100%;height:auto;display:block';
      var dica = document.createElement('div');
      dica.style.cssText = 'position:absolute;pointer-events:none;background:#111111;color:#FFFFFF;font-size:13px;font-weight:600;padding:6px 10px;border-radius:6px;white-space:nowrap;transform:translate(-50%,-130%);display:none;z-index:2';
      paises.forEach(function (f) {
        var p = document.createElementNS(ns, 'path'), info = PAISES[f.id];
        p.setAttribute('d', path(f));
        p.setAttribute('fill', info ? '#A1C4E6' : '#E6E6E6');
        p.setAttribute('stroke', '#FFFFFF'); p.setAttribute('stroke-width', '0.6');
        if (info) {
          p.style.cursor = 'pointer'; p.style.transition = 'fill .15s';
          p.addEventListener('mouseenter', function () { p.setAttribute('fill', '#4A79A6'); dica.textContent = info[IDX]; dica.style.display = 'block'; });
          p.addEventListener('mouseleave', function () { p.setAttribute('fill', '#A1C4E6'); dica.style.display = 'none'; });
          p.addEventListener('mousemove', function (e) { var b = el.getBoundingClientRect(); dica.style.left = (e.clientX - b.left) + 'px'; dica.style.top = (e.clientY - b.top) + 'px'; });
          var t = document.createElementNS(ns, 'title'); t.textContent = info[IDX]; p.appendChild(t);
        }
        svg.appendChild(p);
      });
      el.innerHTML = ''; el.style.position = 'relative'; el.appendChild(svg); el.appendChild(dica);
    }).catch(function () { el.removeAttribute('data-pronto'); el.innerHTML = ''; });
  }
  function procurar() {
    var el = document.querySelector('[data-keep="mapa-alunos"]');
    if (!el) return false;
    desenhar(el);
    return true;
  }
  function iniciar() { var n = 0, t = setInterval(function () { if (procurar() || ++n > 40) clearInterval(t); }, 250); }
  if (document.readyState === 'complete') setTimeout(iniciar, 300); else window.addEventListener('load', function () { setTimeout(iniciar, 300); });
})();
