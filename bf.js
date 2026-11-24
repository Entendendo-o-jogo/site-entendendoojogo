/* Faixa de Black Friday no topo do site. Some sozinha depois de FIM. Desativar: tirar o <script> do build_site.py. */
(function () {
  'use strict';
  var FIM = new Date('2026-12-08T00:00:00-03:00'); // último dia: 07/12
  // Cupom dos cursos (50%, exceto Indicadores). Vazio = botão dos cursos abre o WhatsApp.
  var CUPOM = '';
  var OFERTAS_CURSOS = ['npblpgqb', 'mrzr2huv', 'z3eyd3rs', 'jqzqajq3', 'mktm71ps', 'hgb4v9ai'];
  if (Date.now() >= FIM.getTime() || window.__eojBF) return; window.__eojBF = 1;
  // aplica o cupom sozinho nos links de compra dos cursos em promoção
  if (CUPOM) document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href*="pay.hotmart.com"]'); if (!a) return;
    try { var u = new URL(a.href); if (OFERTAS_CURSOS.indexOf(u.searchParams.get('off')) >= 0 && !u.searchParams.get('offDiscount')) { u.searchParams.set('offDiscount', CUPOM); a.href = u.toString(); } } catch (e) {}
  }, true);
  if (/^\/(es\/|en\/)?(hub\/(admin|certificado)|biblioteca\/(admin|editor))/.test(location.pathname)) return;
  try { if (sessionStorage.getItem('eojBFx')) return; } catch (e) {}
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt';
  var T = {
    pt: { c1: 'Cursos', c1b: '50% OFF', c1s: 'Todos, exceto Indicadores táticos por posição', b1: CUPOM ? 'Ver cursos' : 'Quero o desconto', cup: 'Cupom', c2: 'EOJHub Premium anual', c2b: 'Menos de R$ 100/mês', c2s: 'Peça o link promocional no WhatsApp', b2: 'Quero o Premium', fim: 'Termina em', msg1: 'Olá! Vim pelo site e quero o desconto de 50% nos cursos da Black Friday do EOJ.', msg2: 'Olá! Vim pelo site e quero o link promocional do EOJHub Premium anual da Black Friday.', x: 'Fechar' },
    es: { c1: 'Cursos', c1b: '50% OFF', c1s: 'Todos, excepto Indicadores tácticos por posición', b1: CUPOM ? 'Ver cursos' : 'Quiero el descuento', cup: 'Cupón', c2: 'EOJHub Premium anual', c2b: 'Menos de R$ 100/mes', c2s: 'Pide el enlace promocional por WhatsApp', b2: 'Quiero el Premium', fim: 'Termina en', msg1: '¡Hola! Vengo del sitio y quiero el 50% de descuento en los cursos de Black Friday de EOJ.', msg2: '¡Hola! Vengo del sitio y quiero el enlace promocional de EOJHub Premium anual de Black Friday.', x: 'Cerrar' },
    en: { c1: 'Courses', c1b: '50% OFF', c1s: 'All except Tactical indicators by position', b1: CUPOM ? 'See courses' : 'Get the discount', cup: 'Coupon', c2: 'EOJHub Premium yearly', c2b: 'Under R$ 100/month', c2s: 'Ask for the promo link on WhatsApp', b2: 'Get Premium', fim: 'Ends in', msg1: 'Hi! I came from the website and want the 50% Black Friday discount on EOJ courses.', msg2: 'Hi! I came from the website and want the Black Friday promo link for EOJHub Premium yearly.', x: 'Close' }
  }[LG];
  var css = document.createElement('style');
  css.textContent =
    '#eoj-bf{position:relative;z-index:60;background:#111111;color:#FFFFFF;font-family:Montserrat,Inter,system-ui,sans-serif;border-bottom:3px solid #A1C4E6}' +
    '#eoj-bf .bf-in{max-width:1240px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 52px 10px 20px;flex-wrap:wrap}' +
    '#eoj-bf .bf-tag{background:#FFFFFF;color:#111111;font-weight:800;font-size:13px;letter-spacing:.06em;padding:7px 12px;border-radius:8px;text-transform:uppercase}' +
    '#eoj-bf .bf-off{display:flex;flex-direction:column;line-height:1}#eoj-bf .bf-off small{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A1C4E6}' +
    '#eoj-bf .bf-off b{font-size:22px;font-weight:900;letter-spacing:-.01em}' +
    '#eoj-bf .bf-of{display:flex;align-items:center;gap:12px;padding:0 14px;border-left:1px solid #333333}#eoj-bf .bf-tx{display:flex;flex-direction:column;line-height:1.25;max-width:190px}#eoj-bf .bf-tx span{font-size:12px;color:#BBBBBB}#eoj-bf .bf-cup{font-size:13px;color:#FFFFFF;letter-spacing:.06em}' +
    '#eoj-bf .bf-cd{background:#1E2A36;border-radius:8px;padding:6px 12px;text-align:center;line-height:1.15}#eoj-bf .bf-cd small{display:block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A1C4E6}#eoj-bf .bf-cd b{font-size:17px;font-variant-numeric:tabular-nums}' +
    '#eoj-bf .bf-btn{display:inline-flex;align-items:center;gap:8px;background:#A1C4E6;color:#111111;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.04em;padding:10px 14px;border-radius:10px;text-decoration:none;white-space:nowrap;animation:bfPisca 1.2s ease-in-out infinite}' +
    '#eoj-bf .bf-btn:focus-visible{outline:3px solid #FFFFFF;outline-offset:2px}' +
    '@keyframes bfPisca{0%,100%{background:#A1C4E6;color:#111111;box-shadow:0 0 0 0 rgba(161,196,230,.7)}50%{background:#FFFFFF;color:#111111;box-shadow:0 0 0 8px rgba(161,196,230,0)}}' +
    '@media (prefers-reduced-motion:reduce){#eoj-bf .bf-btn{animation:none}}' +
    '#eoj-bf .bf-x{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:0;color:#FFFFFF;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}' +
    '@media (max-width:1100px){#eoj-bf .bf-tag,#eoj-bf .bf-cd{display:none}}@media (max-width:760px){#eoj-bf .bf-tx{display:none}#eoj-bf .bf-in{gap:8px;padding:8px 38px 8px 10px}#eoj-bf .bf-of{border:0;padding:0;gap:8px}#eoj-bf .bf-off b{font-size:16px}#eoj-bf .bf-btn{padding:9px 10px;font-size:11px}}';
  document.head.appendChild(css);
  var d = document.createElement('div'); d.id = 'eoj-bf'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Black Friday');
  var WA = 'https://api.whatsapp.com/send?phone=6281385430917&text=';
  var pre = LG === 'pt' ? '' : '/' + LG;
  var l1 = CUPOM ? pre + '/cursos' : WA + encodeURIComponent(T.msg1), l2 = WA + encodeURIComponent(T.msg2);
  function of(t, b, sub, href, btn, ext, extra) { return '<span class="bf-of"><span class="bf-off"><small>' + t + '</small><b>' + b + '</b></span><span class="bf-tx"><span>' + sub + '</span>' + (extra || '') + '</span>' +
    '<a class="bf-btn" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + btn + ' →</a></span>'; }
  d.innerHTML = '<div class="bf-in"><span class="bf-tag">🏷 Black Friday</span>' +
    of(T.c1, T.c1b, T.c1s, l1, T.b1, !CUPOM, CUPOM ? '<b class="bf-cup">' + T.cup + ': ' + CUPOM + '</b>' : '') +
    of(T.c2, T.c2b, T.c2s, l2, T.b2, true) +
    '<span class="bf-cd"><small>' + T.fim + '</small><b data-cd>—</b></span></div><button type="button" class="bf-x" aria-label="' + T.x + '">×</button>';
  var cd = d.querySelector('[data-cd]');
  function tic() { var s = Math.max(0, Math.floor((FIM - Date.now()) / 1000)); if (!s) { d.remove(); return; } var dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); cd.textContent = (dd ? dd + 'd ' : '') + ('0' + h).slice(-2) + 'h ' + ('0' + m).slice(-2) + 'm'; }
  tic(); setInterval(tic, 30000);
  d.querySelector('.bf-x').onclick = function () { d.remove(); try { sessionStorage.setItem('eojBFx', '1'); } catch (e) {} };
  [].forEach.call(d.querySelectorAll('.bf-btn'), function (b, i) { b.addEventListener('click', function () { try { window.gtag && gtag('event', i ? 'bf_premium_clique' : 'bf_cursos_clique', { pagina: location.pathname }); } catch (e) {} }); });
  function por() { if (document.body) document.body.insertBefore(d, document.body.firstChild); else setTimeout(por, 50); }
  por();
})();
