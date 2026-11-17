/* Rodapé interativo (teste): faixa fixa no pé da página que alterna os principais produtos do EOJ.
   Fica fora da árvore do site (não some quando a página atualiza), pausa ao passar o mouse e pode ser fechada. */
(function () {
  'use strict';
  if (window.__eojRodape) return; window.__eojRodape = true;
  var P = [
    { tag: 'Grátis', titulo: 'Biblioteca EOJ', txt: 'Clipes táticos com filtros, para baixar e montar playlists.', cta: 'Acessar grátis', url: '/biblioteca/acervo', img: '/assets/007b5d7d533aa9647d741117e78c55d5.jpg' },
    { tag: 'Lançamento', titulo: 'Indicadores táticos por posição', txt: '14 aulas com critérios para avaliar e desenvolver atletas.', cta: 'Conhecer o curso', url: '/cursos/indicadores', img: '/assets/c88f4ebb380482960e9da9f9b3bb81c6.jpg' },
    { tag: 'Assinatura', titulo: 'EOJHub Premium', txt: 'Todos os cursos, masterclasses e materiais em um só lugar.', cta: 'Ver planos', url: '/eojhub', img: '/assets/9527a9f19ac2a623eaa3f9c35ae66cc1.jpg' },
    { tag: 'Livro', titulo: 'Sistemas Táticos', txt: '14 confrontos analisados, com vídeos por QR Code em cada capítulo.', cta: 'Ver o livro', url: '/livros/sistemas-taticos', img: '/assets/b1bd5708d475ba65092ac50c631b0e85.jpg' },
    { tag: 'Mentoria', titulo: 'Mentoria para profissionais', txt: 'Acompanhamento individual para a sua carreira no futebol.', cta: 'Saiba mais', url: '/mentoria' }
  ];
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
  var el = document.createElement('aside'); el.id = 'eoj-rod'; el.setAttribute('aria-label', 'Produtos do Entendendo o Jogo');
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
  function abrir() { el.classList.add('on'); window.removeEventListener('scroll', rolou); }
  function rolou() { if (window.scrollY > 400) abrir(); }
  window.addEventListener('scroll', rolou, { passive: true }); setTimeout(abrir, 4000);
})();
