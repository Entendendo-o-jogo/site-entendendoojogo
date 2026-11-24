/* Rodapé interativo (teste): faixa fixa no pé da página que alterna os principais produtos do EOJ.
   Fica fora da árvore do site (não some quando a página atualiza), pausa ao passar o mouse e pode ser fechada. */
(function () {
  'use strict';
  if (window.__eojRodape) return; window.__eojRodape = true;
  var L = /^\/(es|en)(\/|$)/.exec(location.pathname), LG = L ? L[1] : 'pt', PF = L ? '/' + LG : '';
  var CAPA = 'https://ragqlotjxwfdzggrhlez.supabase.co/storage/v1/object/public/capas/memberkit/';
  var TX = {
    pt: [['Grátis', 'Aulas gratuitas de tática', 'Lives, informes táticos e masterclasses da Copa, com índice por minuto.', 'Ver as aulas'],
         ['Grátis', 'Biblioteca EOJ', 'Clipes táticos com filtros, para baixar e montar playlists.', 'Acessar grátis'],
         ['Assinatura', 'EOJHub Premium', 'Todos os cursos, masterclasses e materiais em um só lugar.', 'Ver planos'],
         ['Curso', 'Indicadores táticos por posição', 'Critérios para avaliar e desenvolver atletas em cada posição.', 'Conhecer o curso'],
         ['Livro', 'Sistemas Táticos', '14 confrontos analisados, com vídeos por QR Code em cada capítulo.', 'Ver o livro'],
         ['Mentoria', 'Mentoria para profissionais', 'Acompanhamento individual para a sua carreira no futebol.', 'Saiba mais']],
    es: [['Gratis', 'Clases gratuitas de táctica', 'Lives, informes tácticos y masterclasses del Mundial, con índice por minuto.', 'Ver las clases'],
         ['Gratis', 'Biblioteca EOJ', 'Clips tácticos con filtros, para descargar y armar playlists.', 'Acceder gratis'],
         ['Suscripción', 'EOJHub Premium', 'Todos los cursos, masterclasses y materiales en un solo lugar.', 'Ver planes'],
         ['Curso', 'Indicadores tácticos por posición', 'Criterios para evaluar y desarrollar jugadores en cada posición.', 'Conocer el curso'],
         ['Libro', 'Sistemas Tácticos', '14 enfrentamientos analizados, con videos por código QR en cada capítulo.', 'Ver el libro'],
         ['Mentoría', 'Mentoría para profesionales', 'Acompañamiento individual para tu carrera en el fútbol.', 'Saber más']],
    en: [['Free', 'Free tactics classes', 'Live sessions, tactical reports and World Cup masterclasses, with a minute-by-minute index.', 'See the classes'],
         ['Free', 'EOJ Library', 'Tactical clips with filters, to download and build playlists.', 'Access for free'],
         ['Subscription', 'EOJHub Premium', 'All courses, masterclasses and materials in one place.', 'See plans'],
         ['Course', 'Tactical indicators by position', 'Criteria to assess and develop players in each position.', 'See the course'],
         ['Book', 'Tactical Systems', '14 match-ups analysed, with videos via QR code in every chapter.', 'See the book'],
         ['Mentoring', 'Mentoring for professionals', 'One-to-one support for your career in football.', 'Learn more']]
  };
  var BASE = [
    { url: PF + '/aulas-gratuitas', img: CAPA + 'modulo-4-600.jpg' },
    { url: PF + '/biblioteca/acervo', img: '/assets/007b5d7d533aa9647d741117e78c55d5.jpg' },
    { url: PF + '/eojhub', img: '/assets/9527a9f19ac2a623eaa3f9c35ae66cc1.jpg' },
    { url: PF + '/cursos/indicadores', img: '/assets/b6191f9b17aca187400ff31c996a0e99.jpg' },
    { url: PF + '/livros/sistemas-taticos', img: '/assets/b1bd5708d475ba65092ac50c631b0e85.jpg' },
    { url: PF + '/mentoria' }
  ];
  var aqui = location.pathname.replace(/\/$/, '') || '/';
  var P = BASE.map(function (b, k) { var t = TX[LG][k]; return { tag: t[0], titulo: t[1], txt: t[2], cta: t[3], url: b.url, img: b.img }; })
    .filter(function (p) { return p.url !== aqui; });

  try { if (sessionStorage.getItem('eojRodapeFechado')) return; } catch (e) {}
  var css = '#eoj-rod{position:fixed;left:16px;right:16px;bottom:16px;z-index:45;max-width:980px;margin:0 auto;background:#111111;color:#FFFFFF;border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.35);display:flex;align-items:center;gap:14px;padding:10px 12px 10px 10px;font-family:Montserrat,sans-serif;transform:translateY(140%);transition:transform .5s cubic-bezier(.2,.7,.2,1)}' +
    '#eoj-rod.on{transform:none}#eoj-rod .r-img{width:84px;height:56px;border-radius:9px;background:#1C1C1C center/cover;flex:0 0 auto}' +
    '#eoj-rod .r-tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '#eoj-rod .r-tag{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#A1C4E6}' +
    '#eoj-rod .r-t{font-size:16px;font-weight:800;line-height:1.2}#eoj-rod .r-d{font-size:13px;color:#CFCFCF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#eoj-rod .r-cta{flex:0 0 auto;background:#A1C4E6;color:#111111;text-decoration:none;font-size:14px;font-weight:700;padding:11px 16px;border-radius:8px;white-space:nowrap}' +
    '#eoj-rod .r-nav{display:flex;align-items:center;gap:6px;flex:0 0 auto}#eoj-rod .r-nav button{font:inherit;width:30px;height:30px;border-radius:50%;border:1px solid #3A3A3A;background:none;color:#FFFFFF;cursor:pointer}' +
    '#eoj-rod .r-dots{display:flex;gap:5px}#eoj-rod .r-dots i{width:6px;height:6px;border-radius:50%;background:#4A4A4A;display:block}#eoj-rod .r-dots i.on{background:#A1C4E6;width:16px;border-radius:3px}' +
    '#eoj-rod .r-x{position:absolute;top:-10px;right:-10px;width:28px;height:28px;border-radius:50%;border:0;background:#FFFFFF;color:#111111;font-size:16px;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.25)}' +
    '#eoj-rod .r-anim{display:flex;align-items:center;gap:14px;flex:1 1 auto;min-width:0;transition:opacity .25s,transform .25s}#eoj-rod .r-anim.sai{opacity:0;transform:translateY(8px)}' +
    '@media (max-width:1140px){#eoj-rod{right:88px}}' +
    '@media (max-width:640px){#eoj-rod{left:10px;right:80px;bottom:12px;gap:10px}#eoj-rod .r-img{width:56px;height:56px}#eoj-rod .r-d,#eoj-rod .r-nav{display:none}#eoj-rod .r-cta{padding:10px 12px;font-size:13px}}' +
    '@media (prefers-reduced-motion:reduce){#eoj-rod,#eoj-rod .r-anim{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var el = document.createElement('aside'); el.id = 'eoj-rod'; el.setAttribute('aria-label', LG === 'en' ? 'Entendendo o Jogo products' : LG === 'es' ? 'Productos de Entendendo o Jogo' : 'Produtos do Entendendo o Jogo');
  el.innerHTML = '<div class="r-anim"><span class="r-img" aria-hidden="true"></span><span class="r-tx"><span class="r-tag"></span><span class="r-t"></span><span class="r-d"></span></span><a class="r-cta" href="#"></a></div>' +
    '<span class="r-nav"><button type="button" class="r-ant" aria-label="Anterior">‹</button><span class="r-dots">' + P.map(function () { return '<i></i>'; }).join('') + '</span><button type="button" class="r-prox" aria-label="Próximo">›</button></span>' +
    '<button type="button" class="r-x" aria-label="Fechar">×</button>';
  document.body.appendChild(el);
  var i = 0, timer = null, parado = false, anim = el.querySelector('.r-anim');
  function mostrar(n, sem) {
    i = (n + P.length) % P.length; var p = P[i];
    function troca() {
      var im = el.querySelector('.r-img'); im.style.backgroundImage = p.img ? 'url(' + p.img + ')' : 'none'; im.style.display = p.img ? '' : 'none';
      el.querySelector('.r-tag').textContent = p.tag; el.querySelector('.r-t').textContent = p.titulo; el.querySelector('.r-d').textContent = p.txt;
      var a = el.querySelector('.r-cta'); a.textContent = p.cta; a.href = p.url;
      el.querySelectorAll('.r-dots i').forEach(function (d, k) { d.className = k === i ? 'on' : ''; });
      anim.classList.remove('sai');
    }
    if (sem) troca(); else { anim.classList.add('sai'); setTimeout(troca, 250); }
  }
  function ciclo() { clearInterval(timer); timer = setInterval(function () { if (!parado) mostrar(i + 1); }, 6000); }
  el.addEventListener('mouseenter', function () { parado = true; }); el.addEventListener('mouseleave', function () { parado = false; });
  el.addEventListener('focusin', function () { parado = true; }); el.addEventListener('focusout', function () { parado = false; });
  el.querySelector('.r-ant').onclick = function () { mostrar(i - 1); ciclo(); };
  el.querySelector('.r-prox').onclick = function () { mostrar(i + 1); ciclo(); };
  el.querySelector('.r-x').onclick = function () { el.classList.remove('on'); try { sessionStorage.setItem('eojRodapeFechado', '1'); } catch (e) {} setTimeout(function () { el.remove(); }, 500); };
  el.querySelector('.r-cta').addEventListener('click', function () { try { if (window.__eojGA && window.gtag) gtag('event', 'rodape_clique', { produto: P[i].titulo }); } catch (e) {} });
  mostrar(0, true); ciclo();
  // aparece depois de rolar um pouco (ou após 4 s)
  function escolheuCookies() { try { return !!localStorage.getItem('eoj-cookies'); } catch (e) { return true; } }
  function abrir() { if (!escolheuCookies()) { setTimeout(abrir, 2000); return; } el.classList.add('on'); window.removeEventListener('scroll', rolou); }
  function rolou() { if (window.scrollY > 400) abrir(); }
  window.addEventListener('scroll', rolou, { passive: true }); setTimeout(abrir, 4000);
})();
