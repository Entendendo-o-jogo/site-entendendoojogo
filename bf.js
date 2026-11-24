/* Black Friday EOJ: faixa no topo + links de compra dos cursos trocados pelas ofertas de 50%.
   Tudo some sozinho em FIM (preços e links voltam ao normal). Desativar de vez: tirar o <script> do build_site.py. */
(function () {
  'use strict';
  var FIM = new Date('2026-12-08T00:00:00-03:00'); // último dia: 07/12
  if (Date.now() >= FIM.getTime() || window.__eojBF) return; window.__eojBF = 1;

  // oferta normal -> [oferta Black Friday, preço normal, preço promocional]
  var PROMO = {
    npblpgqb: ['lyiu66nw', 'R$ 429,00', 'R$ 214,50', '12x de R$ 44,37', '12x de R$ 22,18'],  // Jogo de Posição
    mrzr2huv: ['sxf92srw', 'R$ 499,99', 'R$ 250,00', '3x de R$ 178,43', '3x de R$ 89,22'],  // Treinamento tático 1
    z3eyd3rs: ['ireybyzg', 'R$ 499,99', 'R$ 250,00'],  // Treinamento tático 2
    jqzqajq3: ['sphdd0hc', 'R$ 399,99', 'R$ 200,00', '3x de R$ 142,74', '3x de R$ 71,37'],  // Bolas paradas
    mktm71ps: ['o2gcf3l5', 'R$ 299,99', 'R$ 150,00', '3x de R$ 107,06', '3x de R$ 53,53'],  // Sistemas táticos
    hgb4v9ai: ['16gxwqro', 'R$ 299,99', 'R$ 150,00', '3x de R$ 107,06', '3x de R$ 53,53'],  // Tática individual
    f10fzg6x: ['jfgd8fi4', 'R$ 299,99', 'R$ 150,00', '3x de R$ 107,06', '3x de R$ 53,53']   // Consultoria
  };
  function trocar(a) {
    if (a.__bf) return;
    try {
      var u = new URL(a.href); var p = PROMO[u.searchParams.get('off')]; if (!p) return;
      a.__bf = 1; u.searchParams.set('off', p[0]); u.searchParams.delete('bid'); a.href = u.toString();
      if (a.textContent.indexOf(p[1]) >= 0) a.innerHTML = a.innerHTML.split(p[1]).join(p[2] + ' (50% OFF)');
      var sec = a.parentElement; while (sec && sec.tagName !== 'SECTION' && sec.textContent.indexOf(p[1]) < 0) sec = sec.parentElement; if (sec && sec.tagName !== 'SECTION' && sec.tagName !== 'BODY') { [].forEach.call(sec.querySelectorAll('span, b, strong, p'), function (el) {
        if (!el.__bf && el.children.length === 0 && el.textContent.trim() === p[1]) { el.__bf = 1; el.innerHTML = '<s style="opacity:.55;font-size:.55em;margin-right:8px">' + p[1] + '</s>' + p[2]; } });
        [].forEach.call(sec.querySelectorAll('span, p, small, div'), function (el) { if (el.__bf2 || el.children.length) return; var t = el.textContent.trim();
          if (/^De R\$/.test(t)) { el.__bf2 = 1; el.style.display = 'none'; }
          else if (p[3] && t.indexOf(p[3]) >= 0) { el.__bf2 = 1; el.textContent = el.textContent.split(p[3]).join(p[4]); }
          else if (!p[3] && /\d+x de R\$/.test(t)) { el.__bf2 = 1; el.textContent = 'à vista'; } }); }
    } catch (e) {}
  }
  function varrer() { [].forEach.call(document.querySelectorAll('a[href*="pay.hotmart.com"]'), trocar); }
  document.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('a[href*="pay.hotmart.com"]'); if (a) trocar(a); }, true);
  varrer(); var nV = 0, iv = setInterval(function () { varrer(); if (++nV > 40) clearInterval(iv); }, 500);
  if (window.MutationObserver) new MutationObserver(function () { varrer(); }).observe(document.documentElement, { childList: true, subtree: true });

  if (/^\/(es\/|en\/)?(hub\/(admin|certificado)|biblioteca\/(admin|editor))/.test(location.pathname)) return;
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt';
  var T = {
    pt: { c1: 'Cursos', c1b: '50% OFF', c1s: 'Exceto Indicadores táticos por posição', b1: 'Ver cursos', c2: 'EOJHub Premium anual', c2b: 'Menos de R$ 100/mês', c2s: 'Link promocional pelo WhatsApp', b2: 'Quero o Premium', fim: 'Termina em', msg2: 'Olá! Vim pelo site e quero o link promocional do EOJHub Premium anual da Black Friday.' },
    es: { c1: 'Cursos', c1b: '50% OFF', c1s: 'Excepto Indicadores tácticos por posición', b1: 'Ver cursos', c2: 'EOJHub Premium anual', c2b: 'Menos de R$ 100/mes', c2s: 'Enlace promocional por WhatsApp', b2: 'Quiero el Premium', fim: 'Termina en', msg2: '¡Hola! Vengo del sitio y quiero el enlace promocional de EOJHub Premium anual de Black Friday.' },
    en: { c1: 'Courses', c1b: '50% OFF', c1s: 'Except Tactical indicators by position', b1: 'See courses', c2: 'EOJHub Premium yearly', c2b: 'Under R$ 100/month', c2s: 'Promo link on WhatsApp', b2: 'Get Premium', fim: 'Ends in', msg2: 'Hi! I came from the website and want the Black Friday promo link for EOJHub Premium yearly.' }
  }[LG];
  var Y = '#FFD400';
  var css = document.createElement('style');
  css.textContent =
    '#eoj-bf{position:relative;z-index:60;background:#111111;color:#FFFFFF;font-family:Montserrat,Inter,system-ui,sans-serif}' +
    '#eoj-bf .bf-in{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:20px;padding:10px 20px}' +
    '#eoj-bf .bf-tag{flex:0 0 auto;background:' + Y + ';color:#111111;font-weight:900;font-size:14px;letter-spacing:.06em;padding:8px 14px;border-radius:8px;text-transform:uppercase;white-space:nowrap}' +
    '#eoj-bf .bf-ofs{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap}' +
    '#eoj-bf .bf-of{display:flex;align-items:center;gap:12px}' +
    '#eoj-bf .bf-of+.bf-of{border-left:1px solid #333333;padding-left:28px}' +
    '#eoj-bf .bf-off{display:flex;flex-direction:column;line-height:1.05}#eoj-bf .bf-off small{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:' + Y + '}' +
    '#eoj-bf .bf-off b{font-size:22px;font-weight:900;white-space:nowrap}#eoj-bf .bf-off span{font-size:12px;color:#BBBBBB;margin-top:2px}' +
    '#eoj-bf .bf-btn{display:inline-flex;align-items:center;gap:6px;background:' + Y + ';color:#111111;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em;padding:10px 14px;border-radius:10px;text-decoration:none;white-space:nowrap;animation:bfPisca 1.2s ease-in-out infinite}' +
    '#eoj-bf .bf-btn:focus-visible{outline:3px solid #FFFFFF;outline-offset:2px}' +
    '@keyframes bfPisca{0%,100%{background:' + Y + ';box-shadow:0 0 0 0 rgba(255,212,0,.7)}50%{background:#FFFFFF;box-shadow:0 0 0 8px rgba(255,212,0,0)}}' +
    '#eoj-bf .bf-cd{flex:0 0 auto;background:' + Y + ';color:#111111;border-radius:10px;padding:8px 16px;text-align:center;line-height:1.1}' +
    '#eoj-bf .bf-cd small{display:block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}#eoj-bf .bf-cd b{font-size:26px;font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '#eoj-bf .bf-fita{height:12px;background:repeating-linear-gradient(-45deg,' + Y + ' 0 12px,#111111 12px 24px);background-size:34px 34px;animation:bfFita 1s linear infinite}' +
    '@keyframes bfFita{to{background-position:34px 0}}' +
    '@media (prefers-reduced-motion:reduce){#eoj-bf .bf-btn,#eoj-bf .bf-fita{animation:none}}' +
    '@media (max-width:1180px){#eoj-bf .bf-off span{display:none}#eoj-bf .bf-ofs{gap:16px}#eoj-bf .bf-of+.bf-of{padding-left:16px}#eoj-bf .bf-cd b{font-size:20px}}' +
    '@media (max-width:900px){#eoj-bf .bf-in{flex-wrap:wrap;justify-content:space-between;gap:8px 12px;padding:8px 12px}#eoj-bf .bf-ofs{order:3;flex-basis:100%;gap:8px}#eoj-bf .bf-of+.bf-of{border:0;padding-left:0}' +
    '#eoj-bf .bf-tag{font-size:12px;padding:6px 10px}#eoj-bf .bf-off b{font-size:16px}#eoj-bf .bf-btn{font-size:11px;padding:8px 10px}#eoj-bf .bf-cd{padding:4px 10px}#eoj-bf .bf-cd b{font-size:16px}}';
  document.head.appendChild(css);
  var WA = 'https://api.whatsapp.com/send?phone=6281385430917&text=';
  var pre = LG === 'pt' ? '' : '/' + LG;
  function of(t, b, sub, href, btn, ext) { return '<span class="bf-of"><span class="bf-off"><small>' + t + '</small><b>' + b + '</b><span>' + sub + '</span></span>' +
    '<a class="bf-btn" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + btn + ' →</a></span>'; }
  var d = document.createElement('div'); d.id = 'eoj-bf'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Black Friday');
  d.innerHTML = '<div class="bf-in"><span class="bf-tag">🏷 Black Friday</span><span class="bf-ofs">' +
    of(T.c1, T.c1b, T.c1s, pre + '/cursos', T.b1, false) + of(T.c2, T.c2b, T.c2s, WA + encodeURIComponent(T.msg2), T.b2, true) +
    '</span><span class="bf-cd"><small>' + T.fim + '</small><b data-cd>—</b></span></div><div class="bf-fita" aria-hidden="true"></div>';
  var cd = d.querySelector('[data-cd]');
  function tic() { var s = Math.max(0, Math.floor((FIM - Date.now()) / 1000)); if (!s) { d.remove(); return; } var dd = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); cd.textContent = (dd ? dd + 'd ' : '') + ('0' + h).slice(-2) + 'h ' + ('0' + m).slice(-2) + 'm'; }
  tic(); setInterval(tic, 30000);
  [].forEach.call(d.querySelectorAll('.bf-btn'), function (b, i) { b.addEventListener('click', function () { try { window.gtag && gtag('event', i ? 'bf_premium_clique' : 'bf_cursos_clique', { pagina: location.pathname }); } catch (e) {} }); });
  function por() { if (document.body) document.body.insertBefore(d, document.body.firstChild); else setTimeout(por, 50); }
  por();
})();
