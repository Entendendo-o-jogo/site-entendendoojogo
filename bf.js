/* Faixa de Black Friday no topo do site. Some sozinha depois de FIM. Desativar: tirar o <script> do build_site.py. */
(function () {
  'use strict';
  var FIM = new Date('2026-12-01T00:00:00-03:00');
  if (Date.now() >= FIM.getTime() || window.__eojBF) return; window.__eojBF = 1;
  if (/^\/(es\/|en\/)?(hub\/(admin|certificado)|biblioteca\/(admin|editor))/.test(location.pathname)) return;
  try { if (sessionStorage.getItem('eojBFx')) return; } catch (e) {}
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt';
  var T = {
    pt: { ate: 'Até', off: '50% OFF', t: 'Cursos, EOJHub e mentorias', s: 'Descontos por tempo limitado', fim: 'Termina em', btn: 'Quero meu desconto', msg: 'Olá! Vim pelo site e quero saber dos descontos da Black Friday do EOJ.', x: 'Fechar' },
    es: { ate: 'Hasta', off: '50% OFF', t: 'Cursos, EOJHub y mentorías', s: 'Descuentos por tiempo limitado', fim: 'Termina en', btn: 'Quiero mi descuento', msg: '¡Hola! Vengo del sitio y quiero saber de los descuentos de Black Friday de EOJ.', x: 'Cerrar' },
    en: { ate: 'Up to', off: '50% OFF', t: 'Courses, EOJHub and mentorships', s: 'Limited-time discounts', fim: 'Ends in', btn: 'Get my discount', msg: 'Hi! I came from the website and want to know about the EOJ Black Friday discounts.', x: 'Close' }
  }[LG];
  var css = document.createElement('style');
  css.textContent =
    '#eoj-bf{position:relative;z-index:60;background:#111111;color:#FFFFFF;font-family:Montserrat,Inter,system-ui,sans-serif;border-bottom:3px solid #A1C4E6}' +
    '#eoj-bf .bf-in{max-width:1240px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 52px 10px 20px;flex-wrap:wrap}' +
    '#eoj-bf .bf-tag{background:#FFFFFF;color:#111111;font-weight:800;font-size:13px;letter-spacing:.06em;padding:7px 12px;border-radius:8px;text-transform:uppercase}' +
    '#eoj-bf .bf-off{display:flex;flex-direction:column;line-height:1}#eoj-bf .bf-off small{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A1C4E6}' +
    '#eoj-bf .bf-off b{font-size:30px;font-weight:900;letter-spacing:-.01em}' +
    '#eoj-bf .bf-tx{display:flex;flex-direction:column;line-height:1.25;border-left:1px solid #444444;padding-left:18px}#eoj-bf .bf-tx b{font-size:16px}#eoj-bf .bf-tx span{font-size:13px;color:#BBBBBB}' +
    '#eoj-bf .bf-cd{background:#1E2A36;border-radius:8px;padding:6px 12px;text-align:center;line-height:1.15}#eoj-bf .bf-cd small{display:block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A1C4E6}#eoj-bf .bf-cd b{font-size:17px;font-variant-numeric:tabular-nums}' +
    '#eoj-bf .bf-btn{display:inline-flex;align-items:center;gap:8px;background:#A1C4E6;color:#111111;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.04em;padding:12px 18px;border-radius:10px;text-decoration:none;animation:bfPisca 1.2s ease-in-out infinite}' +
    '#eoj-bf .bf-btn:focus-visible{outline:3px solid #FFFFFF;outline-offset:2px}' +
    '@keyframes bfPisca{0%,100%{background:#A1C4E6;color:#111111;box-shadow:0 0 0 0 rgba(161,196,230,.7)}50%{background:#FFFFFF;color:#111111;box-shadow:0 0 0 8px rgba(161,196,230,0)}}' +
    '@media (prefers-reduced-motion:reduce){#eoj-bf .bf-btn{animation:none}}' +
    '#eoj-bf .bf-x{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:0;color:#FFFFFF;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}' +
    '@media (max-width:760px){#eoj-bf .bf-tx,#eoj-bf .bf-tag{display:none}#eoj-bf .bf-in{gap:10px;padding:8px 40px 8px 12px}#eoj-bf .bf-off b{font-size:22px}#eoj-bf .bf-btn{padding:10px 12px;font-size:12px}}';
  document.head.appendChild(css);
  var d = document.createElement('div'); d.id = 'eoj-bf'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Black Friday');
  var wa = 'https://api.whatsapp.com/send?phone=6281385430917&text=' + encodeURIComponent(T.msg);
  d.innerHTML = '<div class="bf-in"><span class="bf-tag">🏷 Black Friday</span><span class="bf-off"><small>' + T.ate + '</small><b>' + T.off + '</b></span>' +
    '<span class="bf-tx"><b>' + T.t + '</b><span>' + T.s + '</span></span><span class="bf-cd"><small>' + T.fim + '</small><b data-cd>—</b></span>' +
    '<a class="bf-btn" href="' + wa + '" target="_blank" rel="noopener">' + T.btn + ' →</a></div><button type="button" class="bf-x" aria-label="' + T.x + '">×</button>';
  var cd = d.querySelector('[data-cd]');
  function tic() { var s = Math.max(0, Math.floor((FIM - Date.now()) / 1000)); if (!s) { d.remove(); return; } var dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); cd.textContent = (dd ? dd + 'd ' : '') + ('0' + h).slice(-2) + 'h ' + ('0' + m).slice(-2) + 'm'; }
  tic(); setInterval(tic, 30000);
  d.querySelector('.bf-x').onclick = function () { d.remove(); try { sessionStorage.setItem('eojBFx', '1'); } catch (e) {} };
  d.querySelector('.bf-btn').addEventListener('click', function () { try { window.gtag && gtag('event', 'bf_whatsapp_clique', { pagina: location.pathname }); } catch (e) {} });
  function por() { if (document.body) document.body.insertBefore(d, document.body.firstChild); else setTimeout(por, 50); }
  por();
})();
