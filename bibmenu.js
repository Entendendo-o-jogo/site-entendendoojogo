/* Botão "Acessar Biblioteca EOJ" do cabeçalho: abre duas opções (Acervo de vídeos / Prancheta tática). */
(function () {
  'use strict';
  if (window.__eojBibMenu) return; window.__eojBibMenu = 1;
  var ROTULOS = ['Acessar Biblioteca EOJ', 'Acceder a Biblioteca EOJ', 'Go to EOJ Library'];
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt', PF = LG === 'pt' ? '' : '/' + LG;
  var T = {
    pt: [['Acervo de vídeos', 'Clipes táticos com filtros'], ['Prancheta tática', 'Monte jogadas no quadro tático']],
    es: [['Acervo de videos', 'Clips tácticos con filtros'], ['Pizarra táctica', 'Arma jugadas en la pizarra']],
    en: [['Video library', 'Tactical clips with filters'], ['Tactics board', 'Build plays on the board']]
  }[LG];
  var css = document.createElement('style');
  css.textContent = '#eoj-bibm{position:fixed;z-index:120;width:300px;background:#FFFFFF;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:8px;font-family:Montserrat,Inter,system-ui,sans-serif}' +
    '#eoj-bibm a{display:flex;gap:12px;align-items:center;padding:12px;border-radius:10px;text-decoration:none;color:#111111}' +
    '#eoj-bibm a:hover,#eoj-bibm a:focus-visible{background:#EEF4FA;outline:none}' +
    '#eoj-bibm i{flex:0 0 auto;width:42px;height:42px;border-radius:10px;background:#111111;display:flex;align-items:center;justify-content:center}' +
    '#eoj-bibm b{display:block;font-size:15px;font-weight:700}#eoj-bibm small{display:block;font-size:12px;color:#555555;margin-top:2px}';
  document.head.appendChild(css);
  var menu = null, dono = null;
  var ICO = ['<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1C4E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4-2.5z" fill="#A1C4E6"/></svg>',
             '<svg width="24" height="22" viewBox="0 0 24 22"><rect x="1" y="2" width="22" height="18" rx="2" fill="#2E7D46"/><path d="M12 2v18M1 11h0" stroke="#FFFFFF" stroke-width="1.2"/><circle cx="12" cy="11" r="3.2" fill="none" stroke="#FFFFFF" stroke-width="1.2"/><circle cx="7" cy="8" r="1.6" fill="#2F6FB5"/><circle cx="17" cy="14" r="1.6" fill="#C8322F"/></svg>'];
  function fechar() { if (menu) { menu.remove(); menu = null; } if (dono) dono.setAttribute('aria-expanded', 'false'); dono = null; }
  function abrir(a) {
    fechar(); dono = a; a.setAttribute('aria-expanded', 'true');
    menu = document.createElement('div'); menu.id = 'eoj-bibm'; menu.setAttribute('role', 'menu');
    var links = [a.getAttribute('href') || PF + '/biblioteca/acervo', PF + '/biblioteca/prancheta'];
    links.forEach(function (h, i) {
      var o = document.createElement('a'); o.href = h; o.setAttribute('role', 'menuitem');
      o.innerHTML = '<i>' + ICO[i] + '</i><span><b></b><small></small></span>';
      o.querySelector('b').textContent = T[i][0]; o.querySelector('small').textContent = T[i][1];
      menu.appendChild(o);
    });
    document.body.appendChild(menu);
    var r = a.getBoundingClientRect(), w = 300, x = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    menu.style.left = x + 'px'; menu.style.top = (r.bottom + 8) + 'px';
    var p = menu.querySelector('a'); if (p) p.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (menu && !menu.contains(e.target) && a !== dono) fechar();
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    if (menu && menu.contains(a)) return; // clique numa das opções: segue o link normalmente
    if (menu && a === dono) { e.preventDefault(); fechar(); return; }
    // o botão "Acessar Biblioteca EOJ" e o item "Biblioteca EOJ" do menu do topo (qualquer idioma)
    var txt = (a.textContent || '').trim(), href = a.getAttribute('href') || '';
    var doTopo = /\/biblioteca\/acervo$/.test(href) && (a.closest('header, nav, [role="navigation"]') || a.getBoundingClientRect().top < 220 || /^(Biblioteca EOJ|Conheça a Biblioteca EOJ|Conoce la Biblioteca EOJ|Discover the EOJ Library)/.test(txt));
    if (ROTULOS.indexOf(txt) < 0 && !doTopo) return;
    e.preventDefault(); abrir(a);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) { var d = dono; fechar(); if (d) d.focus(); } });
  window.addEventListener('scroll', function () { if (menu) fechar(); }, { passive: true });
  window.addEventListener('resize', fechar);
})();
