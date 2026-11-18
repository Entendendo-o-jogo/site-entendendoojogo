/* Prancheta tática da Biblioteca EOJ (/biblioteca/prancheta).
   Campo com jogadores, bola, cones e setas; vários quadros que viram animação; baixar vídeo/imagem;
   salvar na conta (tabela pranchetas) e compartilhar por link (?c=CODIGO). Tudo no navegador. */
(function () {
  'use strict';
  var W = 105, H = 68; // proporção do campo (metros)
  var COR = { a: '#2F6FB5', b: '#C8322F', bola: '#FFFFFF', cone: '#F28C28' };
  var PALETA = ['#2F6FB5', '#C8322F', '#F2C230', '#2E9E5B', '#111111', '#FFFFFF', '#F28C28', '#7B4FC9', '#E85D9E', '#7FC8F0'];
  var CAMPOS = { verde: { f1: '#2A7341', f2: '#2E7D46', l: 'rgba(255,255,255,0.85)', nome: 'Verde listrado' }, liso: { f1: '#2C7843', f2: '#2C7843', l: 'rgba(255,255,255,0.85)', nome: 'Verde liso' },
    branco: { f1: '#F4F4F2', f2: '#F4F4F2', l: '#3A3A3A', nome: 'Quadro branco' }, noite: { f1: '#1E3550', f2: '#213A57', l: 'rgba(255,255,255,0.8)', nome: 'Azul noite' } };
  var CUR = null; // cores da prancheta que está sendo desenhada
  function corDe(t) { return (CUR && CUR[t]) || COR[t]; }
  function claro(hex) { var h = String(hex || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 165; }
  var FORM = {
    '4-3-3': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [33, 30], [31, 50], [33, 70], [45, 20], [47, 50], [45, 80]],
    '4-4-2': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [33, 15], [32, 38], [32, 62], [33, 85], [45, 40], [45, 60]],
    '4-2-3-1': [[5, 50], [20, 15], [20, 38], [20, 62], [20, 85], [30, 40], [30, 60], [39, 20], [39, 50], [39, 80], [47, 50]],
    '3-5-2': [[5, 50], [20, 28], [19, 50], [20, 72], [33, 10], [31, 35], [30, 50], [31, 65], [33, 90], [45, 40], [45, 60]],
    '5-3-2': [[5, 50], [22, 8], [19, 30], [18, 50], [19, 70], [22, 92], [32, 30], [31, 50], [32, 70], [44, 40], [44, 60]]
  };
  var LG = (/^\/(es|en)\//.exec(location.pathname) || [])[1] || 'pt', PF = LG === 'pt' ? '' : '/' + LG;
  var DIC = {"✋ Mover":["✋ Mover", "✋ Move"],"Time A":["Equipo A", "Team A"],"Time B":["Equipo B", "Team B"],"⚽ Bola":["⚽ Balón", "⚽ Ball"],"▲ Cone":["▲ Cono", "▲ Cone"],"⤏ Passe":["⤏ Pase", "⤏ Pass"],"→ Movimento":["→ Movimiento", "→ Run"],"〰 Condução":["〰 Conducción", "〰 Dribble"],"✕ Apagar":["✕ Borrar", "✕ Erase"],"Formação…":["Formación…", "Formation…"],"Limpar tudo":["Borrar todo", "Clear all"],"📷 Montar a partir de uma foto":["📷 Armar a partir de una foto", "📷 Build from a photo"],"Campo":["Campo", "Pitch"],"Verde listrado":["Verde a rayas", "Striped green"],"Verde liso":["Verde liso", "Plain green"],"Quadro branco":["Pizarra blanca", "Whiteboard"],"Azul noite":["Azul noche", "Night blue"],"Quadros:":["Cuadros:", "Frames:"],"+ Novo quadro":["+ Nuevo cuadro", "+ New frame"],"Apagar quadro":["Borrar cuadro", "Delete frame"],"▶ Reproduzir":["▶ Reproducir", "▶ Play"],"Velocidade":["Velocidad", "Speed"],"Lenta":["Lenta", "Slow"],"Normal":["Normal", "Normal"],"Rápida":["Rápida", "Fast"],"⬇ Baixar vídeo":["⬇ Descargar video", "⬇ Download video"],"⬇ Baixar imagem":["⬇ Descargar imagen", "⬇ Download image"],"Salvar":["Guardar", "Save"],"Nova":["Nueva", "New"],"🔗 Compartilhar link":["🔗 Compartir enlace", "🔗 Share link"],"Nome da prancheta":["Nombre de la pizarra", "Board name"],"Ferramentas":["Herramientas", "Tools"],"Campo da prancheta tática":["Campo de la pizarra táctica", "Tactics board pitch"],"Quadros da animação":["Cuadros de la animación", "Animation frames"],"Cores":["Colores", "Colors"],"Outra cor":["Otro color", "Other color"],"Outra cor para o time ":["Otro color para el equipo ", "Other color for team "],"Cor do time ":["Color del equipo ", "Team color "],"Cor ":["Color ", "Color "],"Quadro ":["Cuadro ", "Frame "],"Apagar ":["Borrar ", "Delete "],"Minhas pranchetas":["Mis pizarras", "My boards"],"Nenhuma prancheta salva ainda.":["Todavía no hay pizarras guardadas.", "No saved boards yet."],"Abrir":["Abrir", "Open"],"Entre na sua conta grátis para salvar suas pranchetas e compartilhar com jogadores e comissão.":["Entra en tu cuenta gratuita para guardar tus pizarras y compartirlas con jugadores y cuerpo técnico.", "Sign in to your free account to save your boards and share them with players and staff."],"Prancheta compartilhada (somente leitura).":["Pizarra compartida (solo lectura).", "Shared board (read only)."],"Fazer uma cópia para editar":["Hacer una copia para editar", "Make a copy to edit"],"Arraste as peças. Duplo clique em um jogador para mudar o número.":["Arrastra las piezas. Doble clic en un jugador para cambiar el número.", "Drag the pieces. Double-click a player to change the number."],"Clique no campo para colocar jogadores do time A.":["Haz clic en el campo para colocar jugadores del equipo A.", "Click the pitch to place team A players."],"Clique no campo para colocar jogadores do time B.":["Haz clic en el campo para colocar jugadores del equipo B.", "Click the pitch to place team B players."],"Clique no campo para colocar a bola.":["Haz clic en el campo para colocar el balón.", "Click the pitch to place the ball."],"Clique no campo para colocar cones.":["Haz clic en el campo para colocar conos.", "Click the pitch to place cones."],"Arraste para desenhar um passe (seta tracejada).":["Arrastra para dibujar un pase (flecha discontinua).", "Drag to draw a pass (dashed arrow)."],"Arraste para desenhar um movimento sem bola.":["Arrastra para dibujar un movimiento sin balón.", "Drag to draw an off-ball run."],"Arraste para desenhar uma condução de bola.":["Arrastra para dibujar una conducción.", "Drag to draw a dribble."],"Clique em uma peça ou seta para apagar.":["Haz clic en una pieza o flecha para borrarla.", "Click a piece or arrow to erase it."],"Apagar todas as peças e quadros?":["¿Borrar todas las piezas y cuadros?", "Delete all pieces and frames?"],"Começar uma prancheta nova? O que não foi salvo será perdido.":["¿Empezar una pizarra nueva? Lo que no se guardó se perderá.", "Start a new board? Anything not saved will be lost."],"Apagar esta prancheta? Não dá para desfazer.":["¿Borrar esta pizarra? No se puede deshacer.", "Delete this board? This cannot be undone."],"Número ou letra do jogador (até 3 caracteres):":["Número o letra del jugador (hasta 3 caracteres):", "Player number or letter (up to 3 characters):"],"Copie o link da prancheta:":["Copia el enlace de la pizarra:", "Copy the board link:"],"Crie pelo menos 2 quadros para animar (botão “+ Novo quadro”).":["Crea al menos 2 cuadros para animar (botón “+ Nuevo cuadro”).", "Create at least 2 frames to animate (“+ New frame” button)."],"Agora é uma cópia sua: edite e salve.":["Ahora es una copia tuya: edítala y guárdala.", "It is now your copy: edit and save it."],"Gravando…":["Grabando…", "Recording…"],"Vídeo pronto":["Video listo", "Video ready"]," (formato WebM; abre no Chrome, VLC e no WhatsApp Web).":[" (formato WebM; se abre en Chrome, VLC y WhatsApp Web).", " (WebM format; opens in Chrome, VLC and WhatsApp Web)."],"Seu navegador não grava vídeo. Use o Chrome ou o Edge, ou baixe a imagem.":["Tu navegador no graba video. Usa Chrome o Edge, o descarga la imagen.", "Your browser cannot record video. Use Chrome or Edge, or download the image."],"Não foi possível gravar o vídeo neste navegador.":["No fue posible grabar el video en este navegador.", "Could not record video in this browser."],"Para salvar e compartilhar, entre na sua conta grátis da Biblioteca. Ir para o login agora? (o desenho atual fica guardado neste navegador)":["Para guardar y compartir, entra en tu cuenta gratuita de la Biblioteca. ¿Ir al inicio de sesión ahora? (el dibujo actual queda guardado en este navegador)", "To save and share, sign in to your free Library account. Go to sign in now? (your current drawing stays saved in this browser)"],"Salvando…":["Guardando…", "Saving…"],"Salvo ✓":["Guardado ✓", "Saved ✓"],"Não foi possível salvar: ":["No fue posible guardar: ", "Could not save: "],"Link copiado: ":["Enlace copiado: ", "Link copied: "],"Não foi possível gerar o link: ":["No fue posible generar el enlace: ", "Could not create the link: "],"Prancheta aberta.":["Pizarra abierta.", "Board opened."],"Prancheta apagada.":["Pizarra borrada.", "Board deleted."],"Link de prancheta inválido ou removido.":["Enlace de pizarra inválido o eliminado.", "Invalid or removed board link."],"Seu desenho foi recuperado. Agora é só salvar.":["Tu dibujo fue recuperado. Ahora solo tienes que guardarlo.", "Your drawing was recovered. Now just save it."],"Faça uma cópia para editar.":["Haz una copia para editar.", "Make a copy to edit."],"Envie uma imagem (foto do papel).":["Envía una imagen (foto del papel).", "Send an image (photo of the paper)."],"Lendo o seu desenho… (leva uns segundos)":["Leyendo tu dibujo… (tarda unos segundos)", "Reading your drawing… (takes a few seconds)"],"A leitura de fotos está sendo ativada. Tente de novo em breve.":["La lectura de fotos se está activando. Inténtalo de nuevo pronto.", "Photo reading is being activated. Try again soon."],"Você já usou as leituras de foto de hoje (":["Ya usaste las lecturas de foto de hoy (", "You have used today’s photo readings ("]," por dia). Amanhã tem mais.":[" por día). Mañana hay más.", " per day). More tomorrow."],"Entre na sua conta para enviar fotos.":["Entra en tu cuenta para enviar fotos.", "Sign in to send photos."],"A imagem é grande demais. Tente uma foto menor.":["La imagen es demasiado grande. Prueba con una foto más pequeña.", "The image is too large. Try a smaller photo."],"Não encontrei um campo com jogadores nessa foto. Tente uma foto mais de perto, com boa luz e o papel inteiro.":["No encontré un campo con jugadores en esta foto. Prueba con una foto más cerca, con buena luz y el papel entero.", "I could not find a pitch with players in this photo. Try a closer photo, with good light and the whole sheet."],"Não foi possível ler a foto: ":["No fue posible leer la foto: ", "Could not read the photo: "],"Pronto! Montei o quadro a partir da foto":["¡Listo! Armé el cuadro a partir de la foto", "Done! I built the frame from the photo"]," (restam ":[" (quedan ", " ("]," leituras hoje)":[" lecturas hoy)", " readings left today)"],". Confira e ajuste o que precisar.":[". Revisa y ajusta lo que necesites.", ". Check it and adjust as needed."],"Não encontrei jogadores nem setas na foto.":["No encontré jugadores ni flechas en la foto.", "I found no players or arrows in the photo."],"Trocar o que está na prancheta pelo desenho da foto?":["¿Reemplazar lo que hay en la pizarra por el dibujo de la foto?", "Replace what is on the board with the drawing from the photo?"],"Mantive a prancheta como estava.":["Dejé la pizarra como estaba.", "I kept the board as it was."],"Não consegui abrir essa imagem. Envie uma foto em JPG ou PNG.":["No pude abrir esa imagen. Envía una foto en JPG o PNG.", "I could not open that image. Send a JPG or PNG photo."],"Nova prancheta":["Nueva pizarra", "New board"],"Exemplo: terceiro homem":["Ejemplo: tercer hombre", "Example: third man"],"Desenho da foto":["Dibujo de la foto", "Drawing from photo"],"Prancheta sem nome":["Pizarra sin nombre", "Untitled board"]," (cópia)":[" (copia)", " (copy)"],"Prancheta tática animada — Biblioteca EOJ":["Pizarra táctica animada — Biblioteca EOJ", "Animated tactics board — EOJ Library"]};
  var CHAVES = Object.keys(DIC).sort(function (a, b) { return b.length - a.length; });
  function L(t) { // traduz frases da interface (exatas ou pelo começo)
    if (LG === 'pt' || t == null) return t; t = String(t); var k = LG === 'es' ? 0 : 1;
    if (DIC[t]) return DIC[t][k];
    for (var i = 0; i < CHAVES.length; i++) if (CHAVES[i].length > 3 && t.indexOf(CHAVES[i]) === 0) return DIC[CHAVES[i]][k] + t.slice(CHAVES[i].length);
    return t;
  }
  function traduzir(raiz) {
    if (LG === 'pt') return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n, lista = [];
    while ((n = w.nextNode())) lista.push(n);
    lista.forEach(function (x) { var t = x.nodeValue, tr = t.trim(); if (!tr || x.parentNode.nodeName === 'STYLE') return; var v = L(tr); if (v !== tr) x.nodeValue = t.replace(tr, v); });
    raiz.querySelectorAll('[aria-label],[placeholder],[title]').forEach(function (e) { ['aria-label', 'placeholder', 'title'].forEach(function (at) { if (e.hasAttribute(at)) e.setAttribute(at, L(e.getAttribute(at))); }); });
  }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function novoDoc() { return { titulo: L('Nova prancheta'), dur: 1.2, cores: { a: COR.a, b: COR.b, campo: 'verde' }, pecas: [], quadros: [{ pos: {}, setas: [] }] }; }

  /* ---------- desenho ---------- */
  function campo(ctx, w, h) {
    var s = w / W, E = CAMPOS[(CUR && CUR.campo) || 'verde'] || CAMPOS.verde;
    for (var i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? E.f2 : E.f1; ctx.fillRect(i * w / 10, 0, w / 10 + 1, h); }
    ctx.strokeStyle = E.l; ctx.lineWidth = Math.max(1.5, s * 0.25);
    var m = 2 * s; ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    ctx.beginPath(); ctx.moveTo(w / 2, m); ctx.lineTo(w / 2, h - m); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 9.15 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = E.l; ctx.beginPath(); ctx.arc(w / 2, h / 2, 0.5 * s, 0, Math.PI * 2); ctx.fill();
    [[m, 1], [w - m, -1]].forEach(function (g) {
      var x = g[0], d = g[1];
      ctx.strokeRect(Math.min(x, x + d * 16.5 * s), h / 2 - 20.16 * s, 16.5 * s, 40.32 * s);
      ctx.strokeRect(Math.min(x, x + d * 5.5 * s), h / 2 - 9.16 * s, 5.5 * s, 18.32 * s);
      ctx.beginPath(); ctx.arc(x + d * 11 * s, h / 2, 0.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + d * 11 * s, h / 2, 9.15 * s, d > 0 ? -0.93 : Math.PI - 0.93, d > 0 ? 0.93 : Math.PI + 0.93); ctx.stroke();
    });
  }
  function seta(ctx, a, w, h, alfa) {
    var s = w / W, x1 = a.x1 * w, y1 = a.y1 * h, x2 = a.x2 * w, y2 = a.y2 * h;
    ctx.save(); ctx.globalAlpha = alfa == null ? 1 : alfa;
    var br = CUR && CUR.campo === 'branco'; ctx.strokeStyle = a.tipo === 'passe' ? (br ? '#222222' : '#FFFFFF') : (br ? '#D9480F' : '#FFE27A'); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(2, s * 0.45); ctx.lineCap = 'round';
    var ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1), cab = Math.max(9, s * 2);
    ctx.beginPath();
    if (a.tipo === 'cond') { // condução: linha ondulada
      var n = Math.max(4, Math.floor(L / (s * 2.2)));
      for (var i = 0; i <= n; i++) { var t = i / n, px = x1 + (x2 - x1) * t * (1 - cab / L / 1.2), py = y1 + (y2 - y1) * t * (1 - cab / L / 1.2), off = (i % 2 ? 1 : -1) * s * 0.7 * (i === 0 || i === n ? 0 : 1);
        px += Math.cos(ang + Math.PI / 2) * off; py += Math.sin(ang + Math.PI / 2) * off; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    } else {
      if (a.tipo === 'passe') ctx.setLineDash([s * 1.4, s * 1.1]);
      ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * cab * 0.8, y2 - Math.sin(ang) * cab * 0.8);
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(ang - 0.42) * cab, y2 - Math.sin(ang - 0.42) * cab); ctx.lineTo(x2 - Math.cos(ang + 0.42) * cab, y2 - Math.sin(ang + 0.42) * cab); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function peca(ctx, p, x, y, w, sel) {
    var s = w / W;
    if (p.tipo === 'bola') {
      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#111111'; ctx.lineWidth = Math.max(1, s * 0.2);
      ctx.beginPath(); ctx.arc(x, y, s * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.arc(x, y, s * 0.35, 0, Math.PI * 2); ctx.fill();
    } else if (p.tipo === 'cone') {
      ctx.fillStyle = COR.cone; ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s * 1.1, y + s * 0.9); ctx.lineTo(x - s * 1.1, y + s * 0.9); ctx.closePath(); ctx.fill();
    } else {
      var r = s * 1.75;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + s * 0.25, y + s * 0.3, r, 0, Math.PI * 2); ctx.fill();
      var cp = corDe(p.tipo); ctx.fillStyle = cp; ctx.strokeStyle = sel ? '#FFE27A' : (claro(cp) ? '#333333' : '#FFFFFF'); ctx.lineWidth = Math.max(1.5, s * (sel ? 0.5 : 0.3));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (p.n) { ctx.fillStyle = claro(cp) ? '#111111' : '#FFFFFF'; ctx.font = '700 ' + Math.round(s * 1.7) + 'px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(p.n).slice(0, 3), x, y + s * 0.08); }
    }
  }
  function desenhar(ctx, w, h, doc, pos, setas, selId, alfaSetas) {
    CUR = doc.cores || null; ctx.clearRect(0, 0, w, h); campo(ctx, w, h);
    (setas || []).forEach(function (a) { seta(ctx, a, w, h, alfaSetas); });
    var ordem = doc.pecas.slice().sort(function (p, q) { return (p.tipo === 'bola') - (q.tipo === 'bola'); });
    ordem.forEach(function (p) { var q = pos[p.id]; if (q) peca(ctx, p, q.x * w, q.y * h, w, p.id === selId); });
  }

  /* ---------- tela ---------- */
  window.EOJPrancheta = { iniciar: function (raiz) {
    var B = window.EOJB, doc = novoDoc(), q = 0, modo = 'mover', sel = null, arr = null, novaSeta = null, tocando = false, idSalvo = null, somenteLeitura = false;
    var css = '.pr{display:flex;flex-direction:column;gap:14px}.pr-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.pr-b{font:inherit;font-size:14px;font-weight:600;padding:9px 12px;border-radius:8px;border:1.5px solid #CCCCCC;background:#FFFFFF;color:#111111;cursor:pointer;display:inline-flex;gap:6px;align-items:center}' +
      '.pr-b[aria-pressed="true"]{background:#111111;border-color:#111111;color:#FFFFFF}.pr-b.p{background:#A1C4E6;border-color:#A1C4E6;color:#111111}.pr-b:disabled{opacity:.5;cursor:default}' +
      '.pr-sel{font:inherit;font-size:14px;padding:8px;border-radius:8px;border:1.5px solid #CCCCCC;background:#FFFFFF}.pr-sep{width:1px;height:28px;background:#DDDDDD;margin:0 4px}' +
      '.pr-cv{width:100%;aspect-ratio:105/68;border-radius:12px;touch-action:none;display:block;box-shadow:0 10px 30px rgba(0,0,0,.15);background:#2A7341}' +
      '.pr-q{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.pr-q .pr-b{min-width:44px;justify-content:center}.pr-dica{font-size:13px;color:#555555;margin:0}' +
      '.pr-in{font:inherit;font-size:15px;padding:9px 11px;border-radius:8px;border:1.5px solid #CCCCCC;min-width:220px;flex:1 1 220px}' +
      '.pr-cores{gap:8px 18px}.pr-cg{display:inline-flex;align-items:center;gap:5px;font-size:14px}.pr-cg strong{margin-right:4px}' +
      '.pr-sw{width:24px;height:24px;border-radius:50%;border:1.5px solid #BBBBBB;cursor:pointer;padding:0;position:relative;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#555555;background:#FFFFFF}.pr-sw[aria-pressed="true"]{box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px #111111}' +
      '.pr-mais input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}' +
      '.pr-lista{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}.pr-lista li{display:flex;gap:10px;align-items:center;justify-content:space-between;background:#FFFFFF;border:1px solid #E2E2E2;border-radius:10px;padding:10px 12px}';
    raiz.innerHTML = '<style>' + css + '</style><div class="pr">' +
      '<div class="pr-bar" role="toolbar" aria-label="Ferramentas">' +
        b('mover', '✋ Mover') + b('a', '<span data-dot="a" style="width:14px;height:14px;border-radius:50%;border:1px solid #999999;background:' + COR.a + '"></span> Time A') + b('b', '<span data-dot="b" style="width:14px;height:14px;border-radius:50%;border:1px solid #999999;background:' + COR.b + '"></span> Time B') +
        b('bola', '⚽ Bola') + b('cone', '▲ Cone') + '<span class="pr-sep"></span>' + b('passe', '⤏ Passe') + b('mov', '→ Movimento') + b('cond', '〰 Condução') + '<span class="pr-sep"></span>' + b('apagar', '✕ Apagar') +
      '</div>' +
      '<div class="pr-bar"><label style="font-size:14px;font-weight:600">Time A <select class="pr-sel" data-form="a"><option value="">Formação…</option>' + Object.keys(FORM).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
        '<label style="font-size:14px;font-weight:600">Time B <select class="pr-sel" data-form="b"><option value="">Formação…</option>' + Object.keys(FORM).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
        '<button type="button" class="pr-b" data-acao="limpar">Limpar tudo</button><span class="pr-sep"></span>' +
        '<button type="button" class="pr-b p" data-acao="foto">📷 Montar a partir de uma foto</button><input type="file" accept="image/*" data-foto hidden></div>' +
      '<div class="pr-bar pr-cores" aria-label="Cores">' + ['a', 'b'].map(function (t) { return '<span class="pr-cg" role="group" aria-label="Cor do time ' + t.toUpperCase() + '"><strong>Time ' + t.toUpperCase() + '</strong>' +
          PALETA.map(function (c) { return '<button type="button" class="pr-sw" data-cor="' + t + '" data-c="' + c + '" style="background:' + c + '" aria-label="Cor ' + c + '" aria-pressed="false"></button>'; }).join('') +
          '<label class="pr-sw pr-mais" title="Outra cor"><input type="color" data-corlivre="' + t + '" aria-label="Outra cor para o time ' + t.toUpperCase() + '">+</label></span>'; }).join('') +
        '<label style="font-size:14px;font-weight:600">Campo <select class="pr-sel" data-campo>' + Object.keys(CAMPOS).map(function (k) { return '<option value="' + k + '">' + CAMPOS[k].nome + '</option>'; }).join('') + '</select></label></div>' +
      '<canvas class="pr-cv" aria-label="Campo da prancheta tática" role="img"></canvas>' +
      '<p class="pr-dica" data-dica></p>' +
      '<div class="pr-q" aria-label="Quadros da animação"><strong style="font-size:14px">Quadros:</strong><span data-quadros style="display:flex;flex-wrap:wrap;gap:6px"></span>' +
        '<button type="button" class="pr-b" data-acao="novoq">+ Novo quadro</button><button type="button" class="pr-b" data-acao="apagarq">Apagar quadro</button></div>' +
      '<div class="pr-bar"><button type="button" class="pr-b p" data-acao="play">▶ Reproduzir</button>' +
        '<label style="font-size:14px;font-weight:600">Velocidade <select class="pr-sel" data-vel><option value="1.8">Lenta</option><option value="1.2" selected>Normal</option><option value="0.7">Rápida</option></select></label>' +
        '<button type="button" class="pr-b" data-acao="video">⬇ Baixar vídeo</button><button type="button" class="pr-b" data-acao="png">⬇ Baixar imagem</button><span data-status style="font-size:14px;color:#555555"></span></div>' +
      '<div class="pr-bar" style="border-top:1px solid #E2E2E2;padding-top:14px"><input class="pr-in" data-titulo maxlength="80" aria-label="Nome da prancheta" placeholder="Nome da prancheta">' +
        '<button type="button" class="pr-b p" data-acao="salvar">Salvar</button><button type="button" class="pr-b" data-acao="nova">Nova</button><button type="button" class="pr-b" data-acao="link">🔗 Compartilhar link</button></div>' +
      '<div data-minhas></div></div>';
    function b(m, t) { return '<button type="button" class="pr-b" data-modo="' + m + '" aria-pressed="false">' + t + '</button>'; }
    traduzir(raiz);
    var cv = raiz.querySelector('canvas'), ctx = cv.getContext('2d'), stEl = raiz.querySelector('[data-status]'), tit = raiz.querySelector('[data-titulo]');
    var DICAS = { mover: 'Arraste as peças. Duplo clique em um jogador para mudar o número.', a: 'Clique no campo para colocar jogadores do time A.', b: 'Clique no campo para colocar jogadores do time B.', bola: 'Clique no campo para colocar a bola.', cone: 'Clique no campo para colocar cones.',
      passe: 'Arraste para desenhar um passe (seta tracejada).', mov: 'Arraste para desenhar um movimento sem bola.', cond: 'Arraste para desenhar uma condução de bola.', apagar: 'Clique em uma peça ou seta para apagar.' };
    function tam() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * H / W * d); render(); }
    function pos() { var Q = doc.quadros[q]; return Q.pos; }
    function render() { if (tocando) return; var setas = doc.quadros[q].setas.slice(); if (novaSeta) setas.push(novaSeta); desenhar(ctx, cv.width, cv.height, doc, pos(), setas, sel); }
    function ponto(e) { var r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; }
    function acha(p) { var P = pos(), melhor = null, d0 = 2.6 / W; doc.pecas.forEach(function (x) { var c = P[x.id]; if (!c) return; var d = Math.hypot((c.x - p.x) * W / H * 0.647 * 1.546, c.y - p.y); d = Math.hypot((c.x - p.x), (c.y - p.y) * H / W); if (d < d0) { d0 = d; melhor = x; } }); return melhor; }
    function achaSeta(p) { var S = doc.quadros[q].setas, k = -1, d0 = 1.5 / W; S.forEach(function (a, i) { var dx = a.x2 - a.x1, dy = (a.y2 - a.y1) * H / W, L = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p.x - a.x1) * dx + (p.y - a.y1) * H / W * dy) / L)), d = Math.hypot(a.x1 + t * dx - p.x, (a.y1 * H / W + t * dy) - p.y * H / W); if (d < d0) { d0 = d; k = i; } }); return k; }
    function addPeca(tipo, p, n) {
      if (tipo === 'bola' && doc.pecas.some(function (x) { return x.tipo === 'bola'; })) { var bo = doc.pecas.filter(function (x) { return x.tipo === 'bola'; })[0]; pos()[bo.id] = { x: p.x, y: p.y }; return; }
      var id = uid(), num = n;
      if (num == null && (tipo === 'a' || tipo === 'b')) { var usados = doc.pecas.filter(function (x) { return x.tipo === tipo; }).map(function (x) { return +x.n; }); num = 1; while (usados.indexOf(num) >= 0) num++; }
      doc.pecas.push({ id: id, tipo: tipo, n: num == null ? '' : String(num) });
      doc.quadros.forEach(function (Q) { Q.pos[id] = { x: p.x, y: p.y }; });
    }
    function setModo(m) { modo = m; raiz.querySelectorAll('[data-modo]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-modo') === m ? 'true' : 'false'); }); raiz.querySelector('[data-dica]').textContent = L(DICAS[m] || ''); }
    function quadros() {
      var box = raiz.querySelector('[data-quadros]');
      box.innerHTML = doc.quadros.map(function (Q, i) { return '<button type="button" class="pr-b" data-q="' + i + '" aria-pressed="' + (i === q) + '" aria-label="Quadro ' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('');
      traduzir(box); raiz.querySelector('[data-acao="apagarq"]').disabled = doc.quadros.length < 2;
    }
    function cores() {
      if (!doc.cores) doc.cores = { a: COR.a, b: COR.b, campo: 'verde' };
      ['a', 'b'].forEach(function (t) { var c = (doc.cores[t] || COR[t]).toLowerCase(); raiz.querySelector('[data-dot="' + t + '"]').style.background = c;
        raiz.querySelectorAll('[data-cor="' + t + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-c').toLowerCase() === c ? 'true' : 'false'); });
        raiz.querySelector('[data-corlivre="' + t + '"]').value = c; });
      raiz.querySelector('[data-campo]').value = doc.cores.campo || 'verde';
      raiz.querySelectorAll('.pr-cores button, .pr-cores input, .pr-cores select').forEach(function (x) { x.disabled = somenteLeitura; });
    }
    function tudo() { quadros(); cores(); tit.value = doc.titulo || ''; render(); }

    cv.addEventListener('pointerdown', function (e) {
      if (tocando || somenteLeitura) return; var p = ponto(e); cv.setPointerCapture(e.pointerId);
      if (modo === 'mover') { var x = acha(p); sel = x ? x.id : null; arr = x ? { id: x.id } : null; render(); }
      else if (modo === 'a' || modo === 'b' || modo === 'bola' || modo === 'cone') { addPeca(modo, p); render(); }
      else if (modo === 'passe' || modo === 'mov' || modo === 'cond') { novaSeta = { tipo: modo, x1: p.x, y1: p.y, x2: p.x, y2: p.y }; }
      else if (modo === 'apagar') {
        var y = acha(p);
        if (y) { doc.pecas = doc.pecas.filter(function (z) { return z.id !== y.id; }); doc.quadros.forEach(function (Q) { delete Q.pos[y.id]; }); }
        else { var k = achaSeta(p); if (k >= 0) doc.quadros[q].setas.splice(k, 1); }
        render();
      }
    });
    cv.addEventListener('pointermove', function (e) {
      if (arr) { var p = ponto(e); pos()[arr.id] = { x: p.x, y: p.y }; render(); }
      else if (novaSeta) { var p2 = ponto(e); novaSeta.x2 = p2.x; novaSeta.y2 = p2.y; render(); }
    });
    cv.addEventListener('pointerup', function () {
      arr = null;
      if (novaSeta) { if (Math.hypot(novaSeta.x2 - novaSeta.x1, (novaSeta.y2 - novaSeta.y1) * H / W) > 0.02) doc.quadros[q].setas.push(novaSeta); novaSeta = null; render(); }
    });
    cv.addEventListener('dblclick', function (e) {
      if (somenteLeitura) return; var x = acha(ponto(e)); if (!x || (x.tipo !== 'a' && x.tipo !== 'b')) return;
      var n = prompt(L('Número ou letra do jogador (até 3 caracteres):'), x.n || ''); if (n != null) { x.n = n.trim().slice(0, 3); render(); }
    });
    raiz.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-modo')) return setModo(t.getAttribute('data-modo'));
      if (t.hasAttribute('data-cor')) { doc.cores[t.getAttribute('data-cor')] = t.getAttribute('data-c'); cores(); render(); return; }
      if (t.hasAttribute('data-q')) { q = +t.getAttribute('data-q'); sel = null; quadros(); render(); return; }
      var a = t.getAttribute('data-acao');
      if (a === 'novoq') { doc.quadros.splice(q + 1, 0, { pos: clone(pos()), setas: [] }); q++; quadros(); render(); }
      if (a === 'apagarq' && doc.quadros.length > 1) { doc.quadros.splice(q, 1); q = Math.max(0, q - 1); quadros(); render(); }
      if (a === 'limpar' && confirm(L('Apagar todas as peças e quadros?'))) { var t0 = doc.titulo; doc = novoDoc(); doc.titulo = t0; q = 0; tudo(); }
      if (a === 'play') tocar(false);
      if (a === 'video') tocar(true);
      if (a === 'png') { var c2 = document.createElement('canvas'); c2.width = 1600; c2.height = Math.round(1600 * H / W); desenhar(c2.getContext('2d'), c2.width, c2.height, doc, pos(), doc.quadros[q].setas, null); baixar(c2.toDataURL('image/png'), nomeArq() + '.png'); ev('prancheta_imagem'); }
      if (a === 'salvar') salvar();
      if (a === 'nova') { if (!confirm(L('Começar uma prancheta nova? O que não foi salvo será perdido.'))) return; doc = novoDoc(); q = 0; idSalvo = null; somenteLeitura = false; history.replaceState(null, '', location.pathname); tudo(); }
      if (a === 'link') compartilhar();
      if (a === 'foto') { if (somenteLeitura) return status('Faça uma cópia para editar.'); if (precisaLogin()) return; inFoto.click(); }
      if (a === 'abrir') abrir(+t.getAttribute('data-id'));
      if (a === 'excluir') excluir(+t.getAttribute('data-id'));
      if (a === 'copiar') { somenteLeitura = false; idSalvo = null; doc.titulo = (doc.titulo || 'Prancheta') + L(' (cópia)'); tit.value = doc.titulo; status('Agora é uma cópia sua: edite e salve.'); }
    });
    raiz.querySelector('[data-vel]').addEventListener('change', function (e) { doc.dur = +e.target.value; });
    raiz.querySelectorAll('[data-form]').forEach(function (s) { s.addEventListener('change', function () {
      var tipo = s.getAttribute('data-form'), f = FORM[s.value]; s.value = ''; if (!f) return;
      doc.pecas.filter(function (x) { return x.tipo === tipo; }).forEach(function (x) { doc.quadros.forEach(function (Q) { delete Q.pos[x.id]; }); });
      doc.pecas = doc.pecas.filter(function (x) { return x.tipo !== tipo; });
      var nums = [1, 2, 3, 4, 6, 5, 8, 10, 7, 9, 11];
      f.forEach(function (c, i) { var x = c[0] / 100, y = 1 - c[1] / 100; if (tipo === 'b') { x = 1 - x; y = 1 - y; } addPeca(tipo, { x: x, y: y }, nums[i] || i + 1); });
      render();
    }); });
    tit.addEventListener('input', function () { doc.titulo = tit.value; });
    raiz.querySelectorAll('[data-corlivre]').forEach(function (inp) { inp.addEventListener('input', function () { doc.cores[inp.getAttribute('data-corlivre')] = inp.value; cores(); render(); }); });
    raiz.querySelector('[data-campo]').addEventListener('change', function (e) { doc.cores.campo = e.target.value; render(); });
    var inFoto = raiz.querySelector('[data-foto]');
    inFoto.addEventListener('change', function () { var f = inFoto.files && inFoto.files[0]; inFoto.value = ''; if (f) lerFoto(f); });
    window.addEventListener('resize', tam);

    /* ---------- animação e vídeo ---------- */
    function eas(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function tocar(gravar) {
      if (tocando) return; if (doc.quadros.length < 2 && !gravar) { status('Crie pelo menos 2 quadros para animar (botão “+ Novo quadro”).'); return; }
      var alvo = cv, actx = ctx, rec = null, partes = [];
      if (gravar) {
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { status('Seu navegador não grava vídeo. Use o Chrome ou o Edge, ou baixe a imagem.'); return; }
        alvo = document.createElement('canvas'); alvo.width = 1280; alvo.height = 830; actx = alvo.getContext('2d');
        var tipos = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'], mime = tipos.filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
        try { rec = new MediaRecorder(alvo.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 6000000 } : {}); } catch (er) { status('Não foi possível gravar o vídeo neste navegador.'); return; }
        rec.ondataavailable = function (ev2) { if (ev2.data.size) partes.push(ev2.data); };
        rec.onstop = function () { var tp = rec.mimeType || 'video/webm', bl = new Blob(partes, { type: tp }); baixar(URL.createObjectURL(bl), nomeArq() + (/mp4/.test(tp) ? '.mp4' : '.webm')); stEl.textContent = L('Vídeo pronto') + (/mp4/.test(tp) ? '.' : L(' (formato WebM; abre no Chrome, VLC e no WhatsApp Web).')); ev('prancheta_video'); };
        rec.start(); status('Gravando…');
      }
      tocando = true; sel = null;
      var dur = (doc.dur || 1.2) * 1000, k = 0, t0 = null, n = doc.quadros.length, pausaFim = 900, pausaIni = gravar ? 600 : 250;
      function interp(A, Bq, t) { var o = {}; doc.pecas.forEach(function (p) { var a = A.pos[p.id], b2 = Bq.pos[p.id] || a; if (!a) return; o[p.id] = { x: a.x + (b2.x - a.x) * t, y: a.y + (b2.y - a.y) * t }; }); return o; }
      function passo(ts) {
        if (t0 == null) t0 = ts;
        var dt = ts - t0, W2 = alvo.width, H2 = alvo.height;
        if (n < 2) { desenhar(actx, W2, H2, doc, doc.quadros[0].pos, doc.quadros[0].setas, null); if (dt > 2500) return fim(); return requestAnimationFrame(passo); }
        var total = pausaIni + (n - 1) * dur + pausaFim;
        if (dt >= total) { desenhar(actx, W2, H2, doc, doc.quadros[n - 1].pos, doc.quadros[n - 1].setas, null); return fim(); }
        var u = dt - pausaIni;
        if (u < 0) desenhar(actx, W2, H2, doc, doc.quadros[0].pos, doc.quadros[0].setas, null);
        else { k = Math.min(n - 2, Math.floor(u / dur)); var t = Math.min(1, (u - k * dur) / dur); if (u >= (n - 1) * dur) { k = n - 2; t = 1; }
          desenhar(actx, W2, H2, doc, interp(doc.quadros[k], doc.quadros[k + 1], eas(t)), doc.quadros[k].setas, null, 1 - t * 0.7); }
        requestAnimationFrame(passo);
      }
      function fim() { tocando = false; if (rec) setTimeout(function () { rec.stop(); }, 200); render(); }
      requestAnimationFrame(passo);
    }
    function baixar(url, nome) { var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); }
    function nomeArq() { return (doc.titulo || 'prancheta').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'prancheta'; }
    function status(t) { stEl.textContent = L(t); }
    function ev(n) { try { if (window.__eojGA && window.gtag) gtag('event', n); } catch (e) {} }

    /* ---------- salvar, abrir, compartilhar ---------- */
    function precisaLogin() { if (B && B.user) return false; if (confirm(L('Para salvar e compartilhar, entre na sua conta grátis da Biblioteca. Ir para o login agora? (o desenho atual fica guardado neste navegador)'))) { try { localStorage.setItem('eojPranchetaRascunho', JSON.stringify(doc)); } catch (e) {} location.href = PF + '/biblioteca/entrar?volta=' + encodeURIComponent(PF + '/biblioteca/prancheta'); } return true; }
    function salvar() {
      if (precisaLogin()) return; doc.titulo = (tit.value || '').trim() || L('Prancheta sem nome');
      var dados = { titulo: doc.titulo, dados: doc, atualizado_em: new Date().toISOString() };
      var op = idSalvo ? B.sb.from('pranchetas').update(dados).eq('id', idSalvo).select('id').single() : B.sb.from('pranchetas').insert(dados).select('id').single();
      status('Salvando…');
      return op.then(function (r) { if (r.error) throw r.error; idSalvo = r.data.id; somenteLeitura = false; status('Salvo ✓'); ev('prancheta_salvar'); minhas(); return idSalvo; })
        .catch(function (er) { status('Não foi possível salvar: ' + (er.message || er)); });
    }
    function compartilhar() {
      if (precisaLogin()) return;
      (idSalvo ? Promise.resolve(idSalvo) : salvar()).then(function (id) { if (!id) return;
        return B.sb.rpc('prancheta_codigo', { p: id }).then(function (r) { if (r.error) throw r.error;
          var url = location.origin + location.pathname.replace(/\/$/, '') + '?c=' + r.data;
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { status('Link copiado: ' + url); }).catch(function () { prompt(L('Copie o link da prancheta:'), url); });
          ev('prancheta_compartilhar'); }); }).catch(function (er) { status('Não foi possível gerar o link: ' + (er.message || er)); });
    }
    function abrir(id) {
      B.sb.from('pranchetas').select('id,titulo,dados').eq('id', id).single().then(function (r) { if (r.error) return status(r.error.message);
        doc = r.data.dados; doc.titulo = r.data.titulo; idSalvo = r.data.id; somenteLeitura = false; q = 0; tudo(); status('Prancheta aberta.'); window.scrollTo({ top: raiz.offsetTop - 80, behavior: 'smooth' }); });
    }
    function excluir(id) {
      if (!confirm(L('Apagar esta prancheta? Não dá para desfazer.'))) return;
      B.sb.from('pranchetas').delete().eq('id', id).then(function (r) { if (r.error) return status(r.error.message); if (idSalvo === id) idSalvo = null; minhas(); status('Prancheta apagada.'); });
    }
    function minhas() {
      var box = raiz.querySelector('[data-minhas]');
      if (!B || !B.user) { box.innerHTML = '<p class="pr-dica">Entre na sua conta grátis para salvar suas pranchetas e compartilhar com jogadores e comissão.</p>'; traduzir(box); return; }
      B.sb.from('pranchetas').select('id,titulo,atualizado_em').order('atualizado_em', { ascending: false }).limit(50).then(function (r) {
        var L = r.data || [];
        box.innerHTML = '<h2 style="margin:6px 0 10px;font-size:18px;font-weight:800">Minhas pranchetas (' + L.length + ')</h2>' + (L.length ? '<ul class="pr-lista">' + L.map(function (p) {
          return '<li><span><strong>' + esc(p.titulo) + '</strong><br><span style="font-size:13px;color:#555555">' + new Date(p.atualizado_em).toLocaleDateString(LG === 'pt' ? 'pt-BR' : LG) + '</span></span><span style="display:flex;gap:6px"><button type="button" class="pr-b" data-acao="abrir" data-id="' + p.id + '">Abrir</button><button type="button" class="pr-b" data-acao="excluir" data-id="' + p.id + '" aria-label="Apagar ' + esc(p.titulo) + '">✕</button></span></li>'; }).join('') + '</ul>' : '<p class="pr-dica">Nenhuma prancheta salva ainda.</p>'); traduzir(box);
      });
    }
    /* ---------- foto de um desenho no papel -> prancheta ---------- */
    function reduzir(f) {
      return new Promise(function (ok, erro) {
        var url = URL.createObjectURL(f), im = new Image();
        im.onload = function () { var m = 1400, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82).split(',')[1]); };
        im.onerror = function () { erro(new Error('Não consegui abrir essa imagem. Envie uma foto em JPG ou PNG.')); }; im.src = url;
      });
    }
    function lerFoto(f) {
      if (!/^image\//.test(f.type)) return status('Envie uma imagem (foto do papel).');
      var btn = raiz.querySelector('[data-acao="foto"]'); btn.disabled = true; status('Lendo o seu desenho… (leva uns segundos)');
      reduzir(f).then(function (b64) { return B.sb.functions.invoke('ia', { body: { acao: 'prancheta_foto', imagem: b64 } }); })
        .then(function (r) {
          var d = r.data || {}; if (r.error) throw r.error;
          var M = { sem_chave: 'A leitura de fotos está sendo ativada. Tente de novo em breve.', limite: L('Você já usou as leituras de foto de hoje (') + (d.limite || '') + L(' por dia). Amanhã tem mais.'), login: 'Entre na sua conta para enviar fotos.', imagem: 'A imagem é grande demais. Tente uma foto menor.', nada: 'Não encontrei um campo com jogadores nessa foto. Tente uma foto mais de perto, com boa luz e o papel inteiro.' };
          if (d.erro) return status(M[d.erro] || ('Não foi possível ler a foto: ' + d.erro));
          montar(d.desenho || {}); ev('prancheta_foto');
          stEl.textContent = L('Pronto! Montei o quadro a partir da foto') + (d.restantes != null ? L(' (restam ') + d.restantes + L(' leituras hoje)') : '') + L('. Confira e ajuste o que precisar.');
        })
        .catch(function (er) { status('Não foi possível ler a foto: ' + (er.message || er)); })
        .then(function () { btn.disabled = false; });
    }
    function montar(D) {
      var J = D.jogadores || [], tem = doc.pecas.length || doc.quadros.some(function (Q) { return Q.setas.length; });
      if (!J.length && !(D.setas || []).length) { status('Não encontrei jogadores nem setas na foto.'); return; }
      if (tem && !confirm(L('Trocar o que está na prancheta pelo desenho da foto?'))) { status('Mantive a prancheta como estava.'); return; }
      { var c0 = doc.cores, t0 = doc.titulo; doc = novoDoc(); doc.cores = c0 || doc.cores; doc.titulo = t0 === 'Nova prancheta' || t0 === L('Nova prancheta') || /^(Exemplo|Ejemplo|Example)/.test(t0 || '') ? L('Desenho da foto') : t0; q = 0; }
      var vert = D.orientacao === 'vertical', meio = D.campo === 'metade';
      function conv(x, y) { // coordenadas da foto (0–1 dentro do campo desenhado) -> campo deitado
        x = Math.max(0, Math.min(1, +x || 0)); y = Math.max(0, Math.min(1, +y || 0));
        var X = vert ? 1 - y : x, Y = vert ? x : y;
        if (meio) X = 0.5 + X * 0.5;
        return { x: X, y: Y };
      }
      J.forEach(function (j) { var t = j.time === 'b' ? 'b' : 'a', p = conv(j.x, j.y); addPeca(t, p, j.n ? String(j.n).slice(0, 3) : null); var id = doc.pecas[doc.pecas.length - 1].id; doc.quadros[q].pos[id] = p; });
      if (D.bola) { var pb = conv(D.bola.x, D.bola.y); addPeca('bola', pb); var bo = doc.pecas.filter(function (x) { return x.tipo === 'bola'; })[0]; doc.quadros[q].pos[bo.id] = pb; }
      (D.cones || []).forEach(function (c) { var pc = conv(c.x, c.y); addPeca('cone', pc); doc.quadros[q].pos[doc.pecas[doc.pecas.length - 1].id] = pc; });
      (D.setas || []).forEach(function (a) { var p1 = conv(a.x1, a.y1), p2 = conv(a.x2, a.y2), tp = a.tipo === 'passe' ? 'passe' : a.tipo === 'conducao' ? 'cond' : 'mov'; doc.quadros[q].setas.push({ tipo: tp, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }); });
      somenteLeitura = false; tudo();
    }
    function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function exemplo() { // prancheta inicial: um ataque simples em 3 quadros
      doc = novoDoc(); doc.titulo = L('Exemplo: terceiro homem');
      [[0.55, 0.5, 'a', '6'], [0.68, 0.32, 'a', '8'], [0.72, 0.62, 'a', '9'], [0.66, 0.5, 'b', '5'], [0.74, 0.45, 'b', '4'], [0.62, 0.38, 'b', '8']].forEach(function (c) { addPeca(c[2], { x: c[0], y: c[1] }, c[3]); });
      addPeca('bola', { x: 0.565, y: 0.52 });
      var P = doc.pecas, id = function (t, n) { return P.filter(function (x) { return x.tipo === t && x.n === n; })[0].id; }, bola = P.filter(function (x) { return x.tipo === 'bola'; })[0].id;
      doc.quadros[0].setas.push({ tipo: 'passe', x1: 0.565, y1: 0.52, x2: 0.71, y2: 0.6 });
      doc.quadros.push({ pos: clone(doc.quadros[0].pos), setas: [{ tipo: 'passe', x1: 0.71, y1: 0.6, x2: 0.76, y2: 0.36 }, { tipo: 'mov', x1: 0.68, y1: 0.32, x2: 0.78, y2: 0.34 }] });
      doc.quadros[1].pos[bola] = { x: 0.705, y: 0.6 }; doc.quadros[1].pos[id('b', '5')] = { x: 0.69, y: 0.56 };
      doc.quadros.push({ pos: clone(doc.quadros[1].pos), setas: [] });
      doc.quadros[2].pos[id('a', '8')] = { x: 0.78, y: 0.34 }; doc.quadros[2].pos[bola] = { x: 0.77, y: 0.355 }; doc.quadros[2].pos[id('b', '4')] = { x: 0.75, y: 0.42 };
    }

    // início: link compartilhado (?c=), rascunho guardado antes do login, ou exemplo
    setModo('mover');
    var cod = (new URLSearchParams(location.search)).get('c');
    (B && B.ready ? B.ready : Promise.resolve()).then(function () {
      if (cod) {
        return B.sb.rpc('prancheta_compartilhada', { cod: cod }).then(function (r) {
          if (r.error || !r.data || !r.data.length) { exemplo(); status('Link de prancheta inválido ou removido.'); return; }
          doc = r.data[0].dados; doc.titulo = r.data[0].titulo; somenteLeitura = true; idSalvo = null;
          raiz.querySelector('[data-dica]').innerHTML = 'Prancheta compartilhada (somente leitura). <button type="button" class="pr-b" data-acao="copiar">Fazer uma cópia para editar</button>'; traduzir(raiz.querySelector('[data-dica]'));
        });
      }
      var rasc = null; try { rasc = JSON.parse(localStorage.getItem('eojPranchetaRascunho') || 'null'); localStorage.removeItem('eojPranchetaRascunho'); } catch (e) {}
      if (rasc && rasc.quadros) { doc = rasc; status('Seu desenho foi recuperado. Agora é só salvar.'); } else exemplo();
    }).then(function () { tudo(); tam(); minhas(); if (cod && somenteLeitura) { /* mantém a dica com o botão de cópia */ } });
    tam();
  } };
})();
