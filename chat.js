/* Conversa com o EOJ — balão no canto do site para quem está logado.
   Aluno: conversa individual com a equipe. Admin: caixa de entrada com todas as conversas.
   Só carrega o Supabase quando há sessão salva neste navegador. */
(function () {
  'use strict';
  if (window.__eojChat) return; window.__eojChat = 1;
  var URL = 'https://ragqlotjxwfdzggrhlez.supabase.co', KEY = 'sb_publishable_-Rwplnf-81gMXQij5sOwGQ_wCH1QvmR';
  var CHAVE = 'sb-ragqlotjxwfdzggrhlez-auth-token';
  if (!/^\/(es\/|en\/)?(hub|biblioteca)(\/|$)/.test(location.pathname) || /^\/(es\/|en\/)?(hub\/certificado|biblioteca\/editor)/.test(location.pathname)) return;
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt';
  var T = {
    pt: { abrir: 'Conversar com o EOJ', titulo: 'Fale com o EOJ', sub: 'Respondemos por aqui assim que possível.', ola: 'Olá! Aqui você fala direto com a equipe do Entendendo o Jogo: dúvidas, pedidos de vídeos, sugestões. Escreva sua mensagem.', ph: 'Escreva sua mensagem…', env: 'Enviar', conv: 'Conversas', busca: 'Buscar aluno por nome ou e-mail para iniciar conversa', sem: 'Nenhuma conversa ainda.', voltar: 'Voltar', vc: 'Você', eoj: 'EOJ', erro: 'Não foi possível enviar. Tente de novo.', nada: 'Nenhum aluno encontrado.' },
    es: { abrir: 'Hablar con EOJ', titulo: 'Habla con EOJ', sub: 'Respondemos por aquí lo antes posible.', ola: '¡Hola! Aquí hablas directamente con el equipo de Entendendo o Jogo: dudas, pedidos de videos, sugerencias. Escribe tu mensaje.', ph: 'Escribe tu mensaje…', env: 'Enviar', conv: 'Conversaciones', busca: 'Buscar alumno', sem: 'Aún no hay conversaciones.', voltar: 'Volver', vc: 'Tú', eoj: 'EOJ', erro: 'No se pudo enviar. Inténtalo de nuevo.', nada: 'Ningún alumno encontrado.' },
    en: { abrir: 'Chat with EOJ', titulo: 'Talk to EOJ', sub: 'We reply here as soon as possible.', ola: 'Hi! Here you talk directly to the Entendendo o Jogo team: questions, video requests, suggestions. Write your message.', ph: 'Write your message…', env: 'Send', conv: 'Conversations', busca: 'Search student', sem: 'No conversations yet.', voltar: 'Back', vc: 'You', eoj: 'EOJ', erro: 'Could not send. Try again.', nada: 'No student found.' }
  }[LG];
  function temSessao() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); return !!(s && (s.access_token || (s.currentSession && s.currentSession.access_token))); } catch (e) { return false; } }
  if (!temSessao()) return;

  var sb, eu = null, admin = false, aberto = false, alunoAtual = null, ultimoId = 0, timer = null, timerBadge = null;
  function carregarSupabase() {
    if (window.EOJB && window.EOJB.sb) return Promise.resolve(window.EOJB.sb);
    return new Promise(function (ok, falha) {
      function criar() { try { ok(window.supabase.createClient(URL, KEY, { auth: { lock: function (n, e, fn) { return fn(); } } })); } catch (e) { falha(e); } }
      if (window.supabase && window.supabase.createClient) return criar();
      var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js';
      s.onload = criar; s.onerror = falha; document.head.appendChild(s);
    });
  }
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  function hora(iso) { var d = new Date(iso), h = new Date(); var hh = d.toLocaleTimeString(LG === 'en' ? 'en-GB' : LG === 'es' ? 'es-ES' : 'pt-BR', { hour: '2-digit', minute: '2-digit' }); return d.toDateString() === h.toDateString() ? hh : d.toLocaleDateString(LG === 'en' ? 'en-GB' : 'pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + hh; }
  // texto com links clicáveis, sem HTML
  function preencher(node, texto) {
    String(texto).split(/(https?:\/\/[^\s<>"]+)/g).forEach(function (p, i) {
      if (i % 2) { var a = el('a', 'color:inherit;text-decoration:underline;word-break:break-all', p); a.href = p; a.target = '_blank'; a.rel = 'noopener'; node.appendChild(a); }
      else if (p) node.appendChild(document.createTextNode(p));
    });
  }

  // ---------- Interface ----------
  var css = document.createElement('style');
  css.textContent =
    '#eoj-chat-b{position:fixed;right:24px;bottom:24px;z-index:85;width:60px;height:60px;border-radius:50%;border:0;background:#111111;color:#FFFFFF;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '#eoj-chat-b:focus-visible{outline:3px solid #A1C4E6;outline-offset:3px}' +
    '#eoj-chat-n{position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#C62828;color:#FFFFFF;font:700 12px/22px Montserrat,Inter,system-ui,sans-serif;text-align:center}' +
    '#eoj-chat-p{position:fixed;right:20px;bottom:20px;z-index:96;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 40px);background:#FFFFFF;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;font-family:Montserrat,Inter,system-ui,sans-serif;color:#111111}' +
    '#eoj-chat-p[hidden]{display:none}' +
    '.ec-h{background:#111111;color:#FFFFFF;padding:16px 18px;display:flex;align-items:center;gap:12px}' +
    '.ec-h b{display:block;font-size:17px}.ec-h small{display:block;font-size:12px;color:#BBBBBB;margin-top:2px}' +
    '.ec-x{margin-left:auto;background:none;border:0;color:#FFFFFF;font-size:24px;line-height:1;cursor:pointer;padding:4px 6px}' +
    '.ec-v{background:none;border:0;color:#A1C4E6;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;padding:4px 0}' +
    '.ec-m{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#F4F4F4}' +
    '.ec-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}' +
    '.ec-msg small{display:block;font-size:11px;opacity:.65;margin-top:4px}' +
    '.ec-eu{align-self:flex-end;background:#111111;color:#FFFFFF;border-bottom-right-radius:4px}' +
    '.ec-ele{align-self:flex-start;background:#FFFFFF;color:#111111;border:1px solid #E2E2E2;border-bottom-left-radius:4px}' +
    '.ec-f{display:flex;gap:8px;padding:12px;border-top:1px solid #E2E2E2;background:#FFFFFF;align-items:flex-end}' +
    '.ec-f textarea{flex:1;resize:none;border:1.5px solid #CCCCCC;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;line-height:1.4;max-height:120px;min-height:42px;outline:none}' +
    '.ec-f textarea:focus{border-color:#4A79A6}' +
    '.ec-f button{border:0;border-radius:10px;background:#A1C4E6;color:#111111;font-family:inherit;font-weight:700;font-size:14px;padding:0 16px;height:42px;cursor:pointer}' +
    '.ec-l{flex:1;overflow-y:auto;background:#FFFFFF}' +
    '.ec-i{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #EEEEEE;padding:12px 16px;cursor:pointer;font:inherit;color:inherit}' +
    '.ec-i:hover{background:#F6F6F6}.ec-i span{flex:1;min-width:0}.ec-i b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ec-i em{display:block;font-style:normal;font-size:12px;color:#666666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ec-i i{font-style:normal;background:#C62828;color:#FFFFFF;border-radius:10px;font-size:11px;font-weight:700;padding:2px 7px}' +
    '.ec-s{padding:10px 12px;border-bottom:1px solid #E2E2E2}.ec-s input{width:100%;box-sizing:border-box;border:1.5px solid #CCCCCC;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;outline:none}' +
    '.ec-vz{padding:24px 16px;color:#666666;font-size:14px;text-align:center}' +
    '@media (max-width:560px){#eoj-chat-p{right:8px;left:8px;bottom:8px;width:auto;height:calc(100vh - 16px);max-height:none}#eoj-chat-b{right:16px;bottom:16px;width:54px;height:54px}}';
  document.head.appendChild(css);

  var botao = el('button'); botao.id = 'eoj-chat-b'; botao.type = 'button'; botao.setAttribute('aria-label', T.abrir); botao.title = T.abrir;
  botao.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/></svg>';
  var badge = el('span'); badge.id = 'eoj-chat-n'; badge.hidden = true; botao.appendChild(badge);
  var painel = el('div'); painel.id = 'eoj-chat-p'; painel.hidden = true; painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-label', T.titulo);

  function marcar(n) { badge.hidden = !n; badge.textContent = n > 9 ? '9+' : String(n || ''); }
  function atualizarBadge() { if (!sb) return; sb.rpc('chat_nao_lidas').then(function (r) { if (!r.error) marcar(r.data || 0); }); }

  function cabecalho(titulo, sub, voltar) {
    var h = el('div'); h.className = 'ec-h';
    if (voltar) { var v = el('button', '', '← ' + T.voltar); v.className = 'ec-v'; v.type = 'button'; v.onclick = voltar; h.appendChild(v); }
    var t = el('div', 'min-width:0'); t.appendChild(el('b', 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', titulo)); if (sub) t.appendChild(el('small', '', sub)); h.appendChild(t);
    var x = el('button', '', '×'); x.className = 'ec-x'; x.type = 'button'; x.setAttribute('aria-label', 'Fechar'); x.onclick = fechar; h.appendChild(x);
    return h;
  }

  // ---- conversa (aluno com o EOJ, ou admin com um aluno) ----
  var lista, campo;
  function abrirConversa(aluno, nome) {
    alunoAtual = aluno; ultimoId = 0; clearInterval(timer);
    painel.innerHTML = '';
    painel.appendChild(admin ? cabecalho(nome || 'Aluno', null, mostrarCaixa) : cabecalho(T.titulo, T.sub));
    lista = el('div'); lista.className = 'ec-m'; lista.setAttribute('aria-live', 'polite'); painel.appendChild(lista);
    if (!admin) { var b = el('div'); b.className = 'ec-msg ec-ele'; b.textContent = T.ola; lista.appendChild(b); }
    var f = el('form'); f.className = 'ec-f';
    campo = el('textarea'); campo.rows = 1; campo.placeholder = T.ph; campo.maxLength = 2000; campo.setAttribute('aria-label', T.ph);
    var env = el('button', '', T.env); env.type = 'submit';
    f.appendChild(campo); f.appendChild(env); painel.appendChild(f);
    campo.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit ? f.requestSubmit() : enviar(); } });
    campo.addEventListener('input', function () { campo.style.height = 'auto'; campo.style.height = Math.min(120, campo.scrollHeight) + 'px'; });
    f.addEventListener('submit', function (e) { e.preventDefault(); enviar(); });
    buscarNovas(true); timer = setInterval(function () { if (aberto && !document.hidden) buscarNovas(); }, 8000);
    setTimeout(function () { campo.focus(); }, 50);
  }
  function mostrar(m) {
    var minha = admin ? m.de_admin : !m.de_admin;
    var d = el('div'); d.className = 'ec-msg ' + (minha ? 'ec-eu' : 'ec-ele');
    preencher(d, m.texto);
    d.appendChild(el('small', '', (minha ? T.vc : (m.de_admin ? T.eoj : '')) + (minha || m.de_admin ? ' · ' : '') + hora(m.criado_em)));
    lista.appendChild(d);
  }
  function buscarNovas(primeira) {
    var q = sb.from('chat_mensagens').select('id, de_admin, texto, criado_em').eq('aluno', alunoAtual).gt('id', ultimoId).order('id', { ascending: true }).limit(200);
    return q.then(function (r) {
      if (r.error || !r.data) return;
      var perto = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
      r.data.forEach(function (m) { mostrar(m); ultimoId = Math.max(ultimoId, m.id); });
      if (r.data.length || primeira) { if (primeira || perto) lista.scrollTop = lista.scrollHeight; }
      var temNova = r.data.some(function (m) { return admin ? !m.de_admin : m.de_admin; });
      if (primeira || temNova) sb.rpc('chat_marcar_lidas', admin ? { p_aluno: alunoAtual } : {}).then(atualizarBadge);
    });
  }
  var enviando = false;
  function enviar() {
    var t = (campo.value || '').trim(); if (!t || enviando) return;
    enviando = true;
    sb.from('chat_mensagens').insert({ aluno: alunoAtual, de_admin: admin, texto: t }).then(function (r) {
      enviando = false;
      if (r.error) { alert(/Muitas/.test(r.error.message) ? r.error.message : T.erro); return; }
      campo.value = ''; campo.style.height = ''; buscarNovas(); campo.focus();
    });
  }

  // ---- caixa de entrada do admin ----
  function mostrarCaixa() {
    alunoAtual = null; clearInterval(timer);
    painel.innerHTML = '';
    painel.appendChild(cabecalho(T.conv, null));
    var s = el('div'); s.className = 'ec-s'; var inp = el('input'); inp.type = 'search'; inp.placeholder = T.busca; inp.setAttribute('aria-label', T.busca); s.appendChild(inp); painel.appendChild(s);
    var l = el('div'); l.className = 'ec-l'; painel.appendChild(l);
    function item(nome, sub, n, fn) {
      var b = el('button'); b.type = 'button'; b.className = 'ec-i';
      var sp = el('span'); sp.appendChild(el('b', '', nome)); sp.appendChild(el('em', '', sub)); b.appendChild(sp);
      if (n) b.appendChild(el('i', '', String(n)));
      b.onclick = fn; l.appendChild(b);
    }
    function conversas() {
      sb.rpc('chat_conversas').then(function (r) {
        if (inp.value.trim().length >= 2) return;
        l.innerHTML = '';
        if (r.error || !r.data || !r.data.length) { l.appendChild(el('div', '', T.sem)).className = 'ec-vz'; return; }
        r.data.forEach(function (c) {
          var nome = c.nome || c.email || 'Aluno';
          item(nome, (c.ultima_admin ? T.vc + ': ' : '') + c.ultima + ' · ' + hora(c.ultima_em), c.nao_lidas, function () { abrirConversa(c.aluno, nome); });
        });
      });
    }
    var tb;
    inp.addEventListener('input', function () {
      clearTimeout(tb); var q = inp.value.trim();
      if (q.length < 2) return conversas();
      tb = setTimeout(function () {
        sb.rpc('chat_buscar_alunos', { q: q }).then(function (r) {
          l.innerHTML = '';
          if (r.error || !r.data || !r.data.length) { l.appendChild(el('div', '', T.nada)).className = 'ec-vz'; return; }
          r.data.forEach(function (a) { var nome = a.nome || a.email; item(nome, a.email || '', 0, function () { abrirConversa(a.id, nome); }); });
        });
      }, 300);
    });
    conversas();
    timer = setInterval(function () { if (aberto && !document.hidden && !alunoAtual) conversas(); }, 15000);
  }

  function abrir() { aberto = true; painel.hidden = false; botao.hidden = true; if (admin) mostrarCaixa(); else abrirConversa(eu.id); }
  function fechar() { aberto = false; painel.hidden = true; botao.hidden = false; clearInterval(timer); atualizarBadge(); botao.focus(); }
  botao.addEventListener('click', abrir);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aberto) fechar(); });

  function iniciar() {
    carregarSupabase().then(function (c) {
      sb = c;
      return sb.auth.getSession();
    }).then(function (r) {
      var s = r && r.data && r.data.session; if (!s) return;
      eu = s.user;
      return sb.rpc('eh_admin').then(function (a) {
        admin = !!a.data;
        document.body.appendChild(botao); document.body.appendChild(painel);
        atualizarBadge();
        timerBadge = setInterval(function () { if (!aberto && !document.hidden) atualizarBadge(); }, 60000);
        document.addEventListener('visibilitychange', function () { if (!document.hidden && !aberto) atualizarBadge(); });
      });
    }).catch(function () {});
  }
  if (document.readyState === 'complete') setTimeout(iniciar, 600); else window.addEventListener('load', function () { setTimeout(iniciar, 600); });
})();
