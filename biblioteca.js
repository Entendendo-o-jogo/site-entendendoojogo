/* Biblioteca EOJ — acesso ao Supabase (login, clipes, favoritos e playlists).
   A chave publicável é pública por natureza; a segurança fica nas regras (RLS) do banco. */
(function () {
  'use strict';
  var URL = 'https://ragqlotjxwfdzggrhlez.supabase.co';
  var KEY = 'sb_publishable_-Rwplnf-81gMXQij5sOwGQ_wCH1QvmR';
  // lock simples: o padrão (Navigator Locks) às vezes trava a sessão quando há várias abas do site abertas
  var sb = window.supabase.createClient(URL, KEY, { auth: { lock: function (nome, espera, fn) { return fn(); } } });
  var B = window.EOJB = { sb: sb, user: null, perfil: null };

  // ---------- Idioma (pt / es / en, pelo endereço da página) ----------
  var LG = (/^\/(es|en)(\/|$)/.exec(location.pathname) || [])[1] || 'pt';
  B.lang = LG;
  B.u = function (path) { return (LG === 'pt' ? '' : '/' + LG) + path; };
  // Textos deste arquivo
  var TX = {
    es: {
      'E-mail ou senha incorretos.': 'Correo o contraseña incorrectos.',
      'Este e-mail já tem conta. Use "Entrar".': 'Este correo ya tiene cuenta. Usa "Entrar".',
      'A senha precisa ter pelo menos 6 caracteres.': 'La contraseña debe tener al menos 6 caracteres.',
      'Digite um e-mail válido.': 'Escribe un correo válido.',
      'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.': 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.',
      'Confirme seu e-mail pelo link que enviamos antes de entrar.': 'Confirma tu correo con el enlace que te enviamos antes de entrar.',
      'Sem conexão. Verifique a internet e tente de novo.': 'Sin conexión. Revisa internet e inténtalo de nuevo.',
      'Não foi possível concluir agora. Tente de novo em instantes.': 'No se pudo completar ahora. Inténtalo de nuevo en unos instantes.',
      'Entre na sua conta': 'Entra en tu cuenta', 'Recuperar a senha': 'Recuperar la contraseña', 'Crie sua conta grátis': 'Crea tu cuenta gratis',
      'Aguarde…': 'Espera…', 'Entrar': 'Entrar', 'Enviar link': 'Enviar enlace', 'Criar conta': 'Crear cuenta',
      'Digite seu nome.': 'Escribe tu nombre.',
      'Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.': 'Si existe una cuenta con ese correo, te enviamos un enlace para crear una nueva contraseña.',
      'Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre.': '¡Cuenta creada! Confirma tu correo con el enlace que te enviamos y luego entra.',
      'Continue na Biblioteca EOJ': 'Sigue en la Biblioteca EOJ', 'Assistir de novo': 'Ver de nuevo', 'Ver o acervo': 'Ver el acervo'
    },
    en: {
      'E-mail ou senha incorretos.': 'Wrong email or password.',
      'Este e-mail já tem conta. Use "Entrar".': 'This email already has an account. Use "Sign in".',
      'A senha precisa ter pelo menos 6 caracteres.': 'Your password needs at least 6 characters.',
      'Digite um e-mail válido.': 'Enter a valid email.',
      'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.': 'Too many attempts in a row. Wait a few minutes and try again.',
      'Confirme seu e-mail pelo link que enviamos antes de entrar.': 'Confirm your email with the link we sent before signing in.',
      'Sem conexão. Verifique a internet e tente de novo.': 'No connection. Check your internet and try again.',
      'Não foi possível concluir agora. Tente de novo em instantes.': "Couldn't finish that now. Try again in a moment.",
      'Entre na sua conta': 'Sign in to your account', 'Recuperar a senha': 'Reset your password', 'Crie sua conta grátis': 'Create your free account',
      'Aguarde…': 'Please wait…', 'Entrar': 'Sign in', 'Enviar link': 'Send link', 'Criar conta': 'Create account',
      'Digite seu nome.': 'Enter your name.',
      'Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.': "If there's an account with that email, we've sent a link to create a new password.",
      'Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre.': 'Account created. Confirm your email with the link we sent, then sign in.',
      'Continue na Biblioteca EOJ': 'Keep going in the EOJ Library', 'Assistir de novo': 'Watch again', 'Ver o acervo': 'Browse the library'
    }
  };
  function L(t) { return (TX[LG] && TX[LG][t]) || t; }
  B.L = L;
  // Valores dos filtros e da ficha (no banco ficam em português; aqui só muda o texto exibido)
  var VAL = {
    es: { 'Todos': 'Todos', 'Todas': 'Todas', 'Org. ofensiva': 'Org. ofensiva', 'Org. defensiva': 'Org. defensiva', 'Transição ofensiva': 'Transición ofensiva', 'Transição defensiva': 'Transición defensiva',
      'Bolas paradas': 'Balón parado', 'Sistemas táticos': 'Sistemas tácticos', 'Tática individual': 'Táctica individual', 'Comportamento por posição': 'Comportamiento por posición',
      'Clipe separado': 'Clip individual', 'Compilado': 'Compilado', 'Cortes de jogos': 'Cortes de partidos', 'Jogos completos': 'Partidos completos', 'Treinos': 'Entrenamientos', 'Positivo': 'Positivo', 'Negativo': 'Negativo', 'Câmera tática': 'Cámara táctica', 'Câmera da TV': 'Cámara de TV',
      'Masculino': 'Masculino', 'Feminino': 'Femenino', 'Profissional': 'Profesional', 'Base': 'Formativo', 'Amador': 'Amateur',
      'Goleiro': 'Portero', 'Zagueiro': 'Central', 'Lateral': 'Lateral', 'Ala': 'Carrilero', 'Volante': 'Pivote', 'Meia': 'Mediapunta', 'Meio-campista': 'Centrocampista', 'Ponta': 'Extremo', 'Extremo': 'Extremo', 'Atacante': 'Delantero', 'Centroavante': 'Delantero centro', 'Segundo atacante': 'Segundo delantero',
      'Treinador(a)': 'Entrenador(a)', 'Analista de desempenho': 'Analista de rendimiento', 'Auxiliar técnico(a)': 'Asistente técnico(a)', 'Preparador(a) físico(a)': 'Preparador(a) físico(a)', 'Coordenador(a) de base': 'Coordinador(a) de cantera', 'Jogador(a)': 'Jugador(a)', 'Estudante': 'Estudiante', 'Outro': 'Otro',
      'Construção': 'Construcción', 'Criação': 'Creación', 'Finalização': 'Finalización', 'Saída de bola': 'Salida de balón', 'Pressão alta': 'Presión alta', 'Bloco médio': 'Bloque medio', 'Bloco baixo': 'Bloque bajo', 'Contra-ataque': 'Contraataque', 'Contrapressão': 'Contrapresión', 'Escanteio': 'Córner', 'Escanteios': 'Córners', 'Falta': 'Falta', 'Faltas': 'Faltas', 'Arremesso lateral': 'Saque de banda', 'Arremessos laterais': 'Saques de banda', 'Pênalti': 'Penalti',
      'Terceiro homem': 'Tercer hombre', 'Vantagem posicional': 'Ventaja posicional', 'Superioridade numérica': 'Superioridad numérica', 'Amplitude': 'Amplitud', 'Profundidade': 'Profundidad', 'Apoio': 'Apoyo', 'Cobertura': 'Cobertura', 'Flutuação': 'Flotación', 'Homem livre': 'Hombre libre', 'Atração': 'Atracción', 'Ruptura': 'Ruptura', 'Desmarque': 'Desmarque', 'Compactação': 'Compactación', 'Basculação': 'Basculación' },
    en: { 'Todos': 'All', 'Todas': 'All', 'Org. ofensiva': 'In possession', 'Org. defensiva': 'Out of possession', 'Transição ofensiva': 'Attacking transition', 'Transição defensiva': 'Defensive transition',
      'Bolas paradas': 'Set pieces', 'Sistemas táticos': 'Tactical systems', 'Tática individual': 'Individual tactics', 'Comportamento por posição': 'Positional behaviour',
      'Clipe separado': 'Single clip', 'Compilado': 'Compilation', 'Cortes de jogos': 'Match cuts', 'Jogos completos': 'Full matches', 'Treinos': 'Training sessions', 'Positivo': 'Positive', 'Negativo': 'Negative', 'Câmera tática': 'Tactical camera', 'Câmera da TV': 'TV camera',
      'Masculino': "Men's", 'Feminino': "Women's", 'Profissional': 'Professional', 'Base': 'Youth', 'Amador': 'Amateur',
      'Goleiro': 'Goalkeeper', 'Zagueiro': 'Centre-back', 'Lateral': 'Full-back', 'Ala': 'Wing-back', 'Volante': 'Defensive midfielder', 'Meia': 'Attacking midfielder', 'Meio-campista': 'Midfielder', 'Ponta': 'Winger', 'Extremo': 'Winger', 'Atacante': 'Forward', 'Centroavante': 'Striker', 'Segundo atacante': 'Second striker',
      'Treinador(a)': 'Coach', 'Analista de desempenho': 'Performance analyst', 'Auxiliar técnico(a)': 'Assistant coach', 'Preparador(a) físico(a)': 'Fitness coach', 'Coordenador(a) de base': 'Academy coordinator', 'Jogador(a)': 'Player', 'Estudante': 'Student', 'Outro': 'Other',
      'Construção': 'Build-up', 'Criação': 'Chance creation', 'Finalização': 'Finishing', 'Saída de bola': 'Playing out from the back', 'Pressão alta': 'High press', 'Bloco médio': 'Mid block', 'Bloco baixo': 'Low block', 'Contra-ataque': 'Counter-attack', 'Contrapressão': 'Counter-press', 'Escanteio': 'Corner', 'Escanteios': 'Corners', 'Falta': 'Free kick', 'Faltas': 'Free kicks', 'Arremesso lateral': 'Throw-in', 'Arremessos laterais': 'Throw-ins', 'Pênalti': 'Penalty',
      'Terceiro homem': 'Third man', 'Vantagem posicional': 'Positional advantage', 'Superioridade numérica': 'Numerical superiority', 'Amplitude': 'Width', 'Profundidade': 'Depth', 'Apoio': 'Support', 'Cobertura': 'Cover', 'Flutuação': 'Floating', 'Homem livre': 'Free man', 'Atração': 'Drawing in', 'Ruptura': 'Run in behind', 'Desmarque': 'Movement off the ball', 'Compactação': 'Compactness', 'Basculação': 'Shifting' }
  };
  B.t = function (v) { if (!v || LG === 'pt') return v; var d = VAL[LG]; return d[v] || d[String(v).charAt(0).toUpperCase() + String(v).slice(1)] || v; };

  function carregarPerfil() {
    if (!B.user) { B.perfil = null; return Promise.resolve(null); }
    return sb.from('perfis').select('*').eq('id', B.user.id).maybeSingle()
      .then(function (r) { B.perfil = r.data || null; return B.user; });
  }
  // Se a sessão demorar demais (rede ruim, aba antiga), a página segue sem travar em "Carregando…"
  B.ready = Promise.race([
    sb.auth.getSession().then(function (r) {
      B.user = r.data && r.data.session ? r.data.session.user : null;
      return carregarPerfil();
    }),
    new Promise(function (ok) { setTimeout(function () { ok(null); }, 9000); })
  ]).catch(function () { return null; });

  B.isAdmin = function () { return !!(B.perfil && B.perfil.papel === 'admin'); };
  B.nome = function () { return (B.perfil && B.perfil.nome) || (B.user && B.user.email) || ''; };

  // ---------- Medição (GA4) — só envia se a pessoa aceitou os cookies ----------
  B.ev = function (nome, dados) {
    try { if (window.__eojGA && window.gtag) window.gtag('event', nome, Object.assign({ area: 'biblioteca' }, dados || {})); } catch (e) {}
  };
  var _ultBusca = '', _tBusca = null;
  B.filtros = function (f, total) {
    var sig = JSON.stringify(f);
    if (sig === _ultBusca) return;
    clearTimeout(_tBusca);
    _tBusca = setTimeout(function () {
      _ultBusca = sig;
      var ativos = Object.keys(f).filter(function (k) { return k !== 'q' && f[k] && !/^(Todos|Todas)$/.test(f[k]); });
      if (f.q && f.q.trim().length >= 2) B.ev('search', { search_term: f.q.trim().slice(0, 100), resultados: total });
      if (ativos.length) B.ev('bib_filtro', { filtros: ativos.map(function (k) { return k + ':' + f[k]; }).join(' | ').slice(0, 100), resultados: total });
    }, 1500);
  };

  function ok(r) { if (r.error) throw r.error; return r.data; }
  B.msg = function (e) {
    var m = (e && (e.message || e.error_description)) || String(e || '');
    if (/Invalid login credentials/i.test(m)) return L('E-mail ou senha incorretos.');
    if (/already registered|already been registered|User already/i.test(m)) return L('Este e-mail já tem conta. Use "Entrar".');
    if (/Password should be at least|weak/i.test(m)) return L('A senha precisa ter pelo menos 6 caracteres.');
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return L('Digite um e-mail válido.');
    if (/rate limit|too many/i.test(m)) return L('Muitas tentativas seguidas. Espere alguns minutos e tente de novo.');
    if (/Email not confirmed/i.test(m)) return L('Confirme seu e-mail pelo link que enviamos antes de entrar.');
    if (/Failed to fetch|NetworkError/i.test(m)) return L('Sem conexão. Verifique a internet e tente de novo.');
    return L('Não foi possível concluir agora. Tente de novo em instantes.');
  };

  // ---------- Conta ----------
  B.cadastrar = function (nome, email, senha, funcao) {
    return sb.auth.signUp({ email: email, password: senha, options: { data: { nome: nome, funcao: funcao }, emailRedirectTo: location.origin + B.u('/biblioteca/acervo') } })
      .then(ok).then(function (d) { B.ev('sign_up', { method: 'email', funcao: funcao || '' }); B.user = d.user && d.session ? d.user : null; return carregarPerfil().then(function () { return d; }); });
  };
  B.entrar = function (email, senha) {
    return sb.auth.signInWithPassword({ email: email, password: senha })
      .then(ok).then(function (d) { B.ev('login', { method: 'email' }); B.user = d.user; return carregarPerfil(); });
  };
  B.sair = function () { return sb.auth.signOut().then(function () { B.user = null; B.perfil = null; }); };
  B.esqueci = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + B.u('/biblioteca/entrar') + '?modo=nova-senha' }).then(ok);
  };
  B.novaSenha = function (senha) { return sb.auth.updateUser({ password: senha }).then(ok); };

  // ---------- Clipes ----------
  B.clipes = function (todos) {
    var q = sb.from('clipes').select('*').order('criado_em', { ascending: false });
    if (!todos) q = q.eq('publicado', true);
    return q.then(ok);
  };
  B.clipe = function (id) { return sb.from('clipes').select('*').eq('id', id).maybeSingle().then(ok); };
  B.salvarClipe = function (c) {
    var id = c.id; var d = {}; for (var k in c) if (k !== 'id' && k !== 'criado_em') d[k] = c[k];
    return (id ? sb.from('clipes').update(d).eq('id', id) : sb.from('clipes').insert(d)).select().single().then(ok);
  };
  // ---------- Equipes e escudos ----------
  // Seleções: bandeira automática (flagcdn) quando não há escudo cadastrado. Aceita "Itália", "Seleção da Itália", "Itália Sub-20", "Itália (feminino)"...
  var PAISES = { 'brasil': 'br', 'argentina': 'ar', 'uruguai': 'uy', 'paraguai': 'py', 'chile': 'cl', 'colombia': 'co', 'peru': 'pe', 'equador': 'ec', 'bolivia': 'bo', 'venezuela': 've',
    'mexico': 'mx', 'estados unidos': 'us', 'eua': 'us', 'canada': 'ca', 'costa rica': 'cr', 'panama': 'pa', 'honduras': 'hn', 'jamaica': 'jm',
    'italia': 'it', 'espanha': 'es', 'franca': 'fr', 'alemanha': 'de', 'inglaterra': 'gb-eng', 'escocia': 'gb-sct', 'pais de gales': 'gb-wls', 'gales': 'gb-wls', 'irlanda do norte': 'gb-nir', 'irlanda': 'ie',
    'portugal': 'pt', 'holanda': 'nl', 'paises baixos': 'nl', 'belgica': 'be', 'croacia': 'hr', 'suica': 'ch', 'dinamarca': 'dk', 'suecia': 'se', 'noruega': 'no', 'finlandia': 'fi', 'islandia': 'is',
    'polonia': 'pl', 'austria': 'at', 'servia': 'rs', 'turquia': 'tr', 'grecia': 'gr', 'ucrania': 'ua', 'russia': 'ru', 'hungria': 'hu', 'republica tcheca': 'cz', 'tchequia': 'cz', 'eslovaquia': 'sk',
    'eslovenia': 'si', 'romenia': 'ro', 'albania': 'al', 'georgia': 'ge', 'bosnia': 'ba', 'macedonia do norte': 'mk', 'montenegro': 'me', 'bulgaria': 'bg',
    'marrocos': 'ma', 'senegal': 'sn', 'nigeria': 'ng', 'gana': 'gh', 'camaroes': 'cm', 'costa do marfim': 'ci', 'egito': 'eg', 'argelia': 'dz', 'tunisia': 'tn', 'africa do sul': 'za', 'mali': 'ml',
    'japao': 'jp', 'coreia do sul': 'kr', 'australia': 'au', 'arabia saudita': 'sa', 'ira': 'ir', 'catar': 'qa', 'china': 'cn', 'indonesia': 'id', 'nova zelandia': 'nz', 'uzbequistao': 'uz', 'iraque': 'iq', 'emirados arabes': 'ae' };
  B.bandeira = function (nome) {
    var n = semAcento(nome || '').replace(/\(.*?\)/g, ' ').replace(/^selecao (da |do |de |dos |das )?/, '').replace(/\b(sub|u)[- ]?\d+\b|\bfeminin[oa]\b|\bmasculin[oa]\b|\bolimpic[oa]\b/g, ' ').replace(/\s+/g, ' ').trim();
    var cod = PAISES[n];
    return cod ? 'https://flagcdn.com/w160/' + cod + '.png' : '';
  };
  B.equipes = function () {
    return sb.from('equipes').select('nome, escudo').then(ok).then(function (rows) {
      var m = {}; rows.forEach(function (r) { m[r.nome] = r.escudo || ''; });
      return typeof Proxy === 'function' ? new Proxy(m, { get: function (t, k) { return typeof k === 'string' ? (t[k] || B.bandeira(k)) : t[k]; } }) : m;
    });
  };
  // Um clipe pode ter mais de uma equipe: "Flamengo vs. Santos", "Elche/Hull City", "Brasil x Argentina"
  B.times = function (eq) { return String(eq || '').split(/\s+vs\.?\s+|\s+x\s+|\s*\/\s*/i).map(function (t) { return t.trim(); }).filter(Boolean); };
  B.escudoDe = function (esc, eq) { var ts = B.times(eq); for (var i = 0; i < ts.length; i++) { var u = esc && esc[ts[i]]; if (u) return u; } return ''; };
  B.salvarEquipe = function (nome, escudo) { return sb.from('equipes').upsert({ nome: nome, escudo: escudo }, { onConflict: 'nome' }).then(ok); };
  B.enviarEscudo = function (nome, arquivo) {
    var ext = (String(arquivo.name || '').match(/\.(png|svg|webp|jpe?g)$/i) || ['', 'png'])[1].toLowerCase();
    var slug = semAcento(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'equipe';
    var caminho = slug + '-' + Date.now() + '.' + ext;
    return sb.storage.from('escudos').upload(caminho, arquivo, { upsert: true, contentType: arquivo.type || undefined }).then(ok).then(function () {
      var url = sb.storage.from('escudos').getPublicUrl(caminho).data.publicUrl;
      return B.salvarEquipe(nome, url).then(function () { return url; });
    });
  };
  B.contas = function () { return sb.rpc('admin_contas').then(ok); };
  // ---------- Pedidos de vídeo e avisos ----------
  B.pedir = function (texto) { return sb.from('pedidos').insert({ texto: texto }).then(ok).then(function () { B.ev('bib_pedido'); }); };
  B.meusPedidos = function () { return B.user ? sb.from('pedidos').select('id,texto,status,clipe_id,criado_em').eq('usuario_id', B.user.id).eq('area', 'biblioteca').order('criado_em', { ascending: false }).then(ok) : Promise.resolve([]); };
  B.apagarPedido = function (id) { return sb.from('pedidos').delete().eq('id', id).then(ok); };
  B.pedidosAdmin = function () { return sb.rpc('admin_pedidos').then(ok); };
  B.arquivarPedido = function (id, st) { return sb.from('pedidos').update({ status: st || 'arquivado' }).eq('id', id).then(ok); };
  B.atenderPedidos = function (clipe, ids) { return ids && ids.length ? sb.rpc('atender_pedidos', { clipe: clipe, ids: ids }).then(ok) : Promise.resolve(0); };
  // Tutorial em vídeo numa janela por cima da página (fica fora da árvore re-renderizada)
  B.tutorial = function (src, poster, titulo) {
    var f = document.createElement('div');
    f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', titulo || 'Tutorial');
    f.style.cssText = 'position:fixed;inset:0;background:rgba(17,17,17,.88);z-index:70;display:flex;align-items:center;justify-content:center;padding:24px';
    f.innerHTML = '<div style="position:relative;width:100%;max-width:1100px"><button type="button" aria-label="Fechar" style="position:absolute;right:0;top:-52px;width:44px;height:44px;border:0;border-radius:8px;background:#FFFFFF;color:#111111;font-size:24px;cursor:pointer">×</button>' +
      '<video controls autoplay playsinline poster="' + poster + '" style="width:100%;display:block;border-radius:12px;background:#000"><source src="' + src + '" type="video/mp4"></video></div>';
    function fechar() { f.remove(); document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') fechar(); }
    f.addEventListener('click', function (e) { if (e.target === f) fechar(); });
    f.querySelector('button').addEventListener('click', fechar);
    document.addEventListener('keydown', tecla); document.body.appendChild(f); f.querySelector('button').focus();
    B.ev('bib_tutorial');
  };
  B.avisos = function () { return B.user ? sb.from('avisos').select('*').eq('usuario_id', B.user.id).order('criado_em', { ascending: false }).limit(30).then(ok) : Promise.resolve([]); };
  B.naoLidos = function () { return B.user ? sb.from('avisos').select('id', { count: 'exact', head: true }).eq('usuario_id', B.user.id).eq('lido', false).then(function (r) { return r.count || 0; }) : Promise.resolve(0); };
  B.lerAvisos = function () { return B.user ? sb.from('avisos').update({ lido: true }).eq('usuario_id', B.user.id).eq('lido', false).then(ok) : Promise.resolve(); };
  B.inserirVarios = function (lista) { return sb.from('clipes').insert(lista).select('id').then(ok); };
  B.excluirClipe = function (id) { return sb.from('clipes').delete().eq('id', id).then(ok); };

  // ---------- Favoritos ----------
  B.favIds = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.from('favoritos').select('clipe').then(ok).then(function (rows) { return rows.map(function (r) { return r.clipe; }); });
  };
  B.favoritar = function (clipe, on) {
    return (on ? sb.from('favoritos').insert({ clipe: clipe }) : sb.from('favoritos').delete().eq('clipe', clipe).eq('usuario', B.user.id)).then(ok).then(function (d) { B.ev(on ? 'bib_salvar' : 'bib_remover_salvo', { clipe_id: clipe }); return d; });
  };

  // ---------- Playlists ----------
  B.playlists = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.from('playlists').select('id, nome, criado_em, codigo, playlist_clipes(clipe, ordem)').order('criado_em', { ascending: true }).then(ok);
  };
  B.novaPlaylist = function (nome) { return sb.from('playlists').insert({ nome: nome }).select().single().then(ok).then(function (d) { B.ev('bib_playlist_criar'); return d; }); };
  B.renomearPlaylist = function (id, nome) { return sb.from('playlists').update({ nome: nome }).eq('id', id).then(ok); };
  B.excluirPlaylist = function (id) { return sb.from('playlists').delete().eq('id', id).then(ok); };
  B.adicionar = function (playlist, clipe) {
    return sb.from('playlist_clipes').upsert({ playlist: playlist, clipe: clipe, ordem: Date.now() % 2147483647 }, { onConflict: 'playlist,clipe', ignoreDuplicates: true }).then(ok).then(function (d) { B.ev('bib_playlist_adicionar', { clipe_id: clipe }); return d; });
  };
  // Compartilhar por link: código aleatório (sem ele, a playlist é privada)
  function novoCodigo() {
    var b = new Uint8Array(9); (window.crypto || window.msCrypto).getRandomValues(b);
    return btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  B.compartilhar = function (id, on) {
    var cod = on ? novoCodigo() : null;
    return sb.from('playlists').update({ codigo: cod }).eq('id', id).then(ok).then(function () { B.ev(on ? 'bib_playlist_compartilhar' : 'bib_playlist_privar'); return cod; });
  };
  B.linkPlaylist = function (cod) { return location.origin + B.u('/biblioteca/playlist') + '?c=' + encodeURIComponent(cod); };
  B.playlistPublica = function (cod) { return sb.rpc('playlist_compartilhada', { cod: cod }).then(ok); };
  B.copiarTexto = function (t) { return navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject(new Error('clip')); };
  B.remover = function (playlist, clipe) { return sb.from('playlist_clipes').delete().eq('playlist', playlist).eq('clipe', clipe).then(ok); };

  // ---------- Vimeo ----------
  B.lerVimeo = function (txt) {
    txt = String(txt || '').trim();
    var m = txt.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([0-9a-f]{6,}))?/i);
    if (!m) m = txt.match(/^(\d{5,})(?:\/([0-9a-f]{6,}))?$/i);
    if (!m) return null;
    var h = m[2] || ((txt.match(/[?&]h=([0-9a-f]+)/i) || [])[1]) || '';
    return { id: m[1], hash: h };
  };
  B.oembed = function (id, hash) {
    var u = 'https://vimeo.com/' + id + (hash ? '/' + hash : '');
    return fetch('https://vimeo.com/api/oembed.json?width=1280&url=' + encodeURIComponent(u)).then(function (r) {
      if (!r.ok) throw new Error('vimeo ' + r.status); return r.json();
    });
  };
  B.player = function (c) {
    return 'https://player.vimeo.com/video/' + c.vimeo_id + '?' + (c.vimeo_hash ? 'h=' + c.vimeo_hash + '&' : '') + 'title=0&byline=0&portrait=0&dnt=1';
  };
  // ---------- Função segura no Supabase (pasta do Vimeo e download) ----------
  B.funcao = function (corpo) {
    return sb.functions.invoke('vimeo', { body: corpo }).then(function (r) {
      if (r.error) {
        var ctx = r.error.context;
        return (ctx && ctx.json ? ctx.json() : Promise.resolve({})).then(function (d) { var e = new Error((d && d.erro) || 'falha'); e.codigo = d && d.erro; throw e; });
      }
      return r.data;
    });
  };
  B.videosDaPasta = function (pasta) { return B.funcao({ acao: 'pasta', pasta: pasta }).then(function (d) { return d.videos || []; }); };
  B.auditarVimeo = function (pastaBib) { return B.funcao({ acao: 'auditar', pastaBiblioteca: pastaBib }); };
  B.protegerVimeo = function (ids) { return B.funcao({ acao: 'proteger', ids: ids }); };
  // Baixa vários clipes em sequência (cada arquivo num iframe escondido, para não sair da página)
  B.baixarVarios = function (ids, progresso) {
    var feitos = 0, falhas = 0, i = 0;
    return new Promise(function (fim) {
      function proximo() {
        if (i >= ids.length) { B.ev('bib_download_playlist', { quantidade: feitos, falhas: falhas }); return fim({ feitos: feitos, falhas: falhas }); }
        var id = ids[i++];
        B.funcao({ acao: 'baixar', id: id }).then(function (d) {
          var f = document.createElement('iframe'); f.style.display = 'none'; f.src = d.link; document.body.appendChild(f);
          setTimeout(function () { f.remove(); }, 120000);
          feitos++;
        }).catch(function () { falhas++; }).then(function () { if (progresso) progresso(feitos + falhas, ids.length); setTimeout(proximo, 1500); });
      }
      proximo();
    });
  };
  B.linkDownload = function (id, qualidade) { return B.funcao({ acao: 'baixar', id: id, qualidade: qualidade || 720 }).then(function (d) { B.ev('bib_download', { clipe_id: id, qualidade: d.altura }); return d; }); };

  // Lê o nome do arquivo: início com sistema (4-3-3) = Sistemas táticos; com posição = Tática individual.
  var POS = ['goleiro', 'zagueiro', 'lateral', 'ala', 'volante', 'meia', 'meio-campista', 'ponta', 'extremo', 'atacante', 'centroavante', 'segundo atacante'];
  var PLURAL = { goleiros: 'goleiro', zagueiros: 'zagueiro', laterais: 'lateral', alas: 'ala', volantes: 'volante', meias: 'meia', 'meio-campistas': 'meio-campista', pontas: 'ponta', extremos: 'extremo', atacantes: 'atacante', centroavantes: 'centroavante' };
  function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  B.lerNome = function (nome) {
    var base = String(nome || '').replace(/\.(mp4|mov|m4v|avi|mkv)$/i, '');
    var partes = base.split('_').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var titulo = partes.join(' - ');
    var n = semAcento(titulo), c = { titulo: titulo, tipo: 'Clipe separado' };
    var w0 = semAcento(partes[0] || '').split(/[\s-]/)[0];
    if (PLURAL[w0]) n = PLURAL[w0] + n.slice(w0.length);
    if (/^\d(\s*[-.]\s*\d){2,3}\b/.test(n)) c.subtema = 'Sistemas táticos';
    else {
      var p = POS.slice().sort(function (a, b) { return b.length - a.length; }).find(function (x) { return n === x || n.indexOf(x + ' ') === 0 || n.indexOf(x + '-') === 0 || n.indexOf(x + ':') === 0; });
      if (p) { c.subtema = 'Tática individual'; c.posicao = p.charAt(0).toUpperCase() + p.slice(1); }
    }
    function tem(re) { return re.test(n); }
    if (tem(/\b(org(\.|anizacao)?\s*ofensiva)\b/)) c.momento = 'Org. ofensiva';
    else if (tem(/\b(org(\.|anizacao)?\s*defensiva)\b/)) c.momento = 'Org. defensiva';
    else if (tem(/\btransicao\s*ofensiva\b/)) c.momento = 'Transição ofensiva';
    else if (tem(/\btransicao\s*defensiva\b/)) c.momento = 'Transição defensiva';
    else if (tem(/\b(bolas? paradas?|escanteio|tiro livre)\b/)) c.momento = 'Bolas paradas';
    if (tem(/\bcamera\s*tatica\b/)) c.camera = 'Câmera tática';
    else if (tem(/\b(camera\s*(da\s*)?tv|tv)\b/)) c.camera = 'Câmera da TV';
    if (tem(/\bpositivo\b/)) c.resultado = 'Positivo'; else if (tem(/\bnegativo\b/)) c.resultado = 'Negativo';
    if (tem(/\bcompilado\b/)) c.tipo = 'Compilado';
    if (tem(/\bfeminino\b/)) c.genero = 'Feminino'; else c.genero = 'Masculino';
    if (partes.length >= 3) {
      var ult = partes[partes.length - 1];
      if (!/^\d/.test(ult) && !/^(tv|camera.*|positivo|negativo|compilado|clipe separado|feminino|masculino|org\.?\s.*|organizacao.*|transicao.*|bolas? paradas?)$/.test(semAcento(ult))) { c.equipe = ult; titulo = partes.slice(0, -1).join(' - '); }
    }
    c.titulo = B.limparTitulo(titulo);
    return c;
  };

  // Tira do título as palavras que já viraram filtro (momento, câmera, resultado, compilado, gênero)
  var FRASES = [['org', 'ofensiva'], ['org', 'defensiva'], ['organizacao', 'ofensiva'], ['organizacao', 'defensiva'],
    ['transicao', 'ofensiva'], ['transicao', 'defensiva'], ['camera', 'tatica'], ['camera', 'da', 'tv'], ['camera', 'tv'], ['tv'],
    ['positivo'], ['negativo'], ['compilado'], ['clipe', 'separado'], ['feminino'], ['masculino']];
  B.limparTitulo = function (t) {
    var w = String(t || '').split(/\s+/).filter(Boolean), n = w.map(function (x) { return semAcento(x).replace(/[.,;:()]/g, ''); }), out = [];
    for (var i = 0; i < w.length;) {
      var f = FRASES.find(function (p) { return p.every(function (x, j) { return n[i + j] === x; }); });
      if (f) { i += f.length; continue; }
      out.push(w[i]); i++;
    }
    var s = (' ' + out.join(' ') + ' ').replace(/(\s+[-–|])+\s+/g, ' - ').replace(/^\s*-\s+|\s+-\s*$/g, '').trim();
    if (!s) return String(t || '').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // ---------- Player do clipe ----------
  // Fica fora da área que a página redesenha (assim o vídeo não recomeça ao salvar/favoritar)
  // e, ao terminar, cobre a "tela de fim" do Vimeo com sugestões só da Biblioteca.
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  B.montarPlayer = function (c, rel) {
    var velho = document.getElementById('eoj-player'); if (velho) velho.remove();
    var host = document.createElement('div');
    host.id = 'eoj-player';
    host.style.cssText = 'position:absolute;z-index:5;background:#000;border-radius:12px;overflow:hidden;display:none';
    host.innerHTML = '<iframe src="' + esc(B.player(c)) + '" title="' + esc(c.titulo) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>' +
      '<div class="eoj-fim" style="position:absolute;inset:0;background:#111111;color:#FFFFFF;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px;text-align:center;overflow:auto"></div>';
    document.body.appendChild(host);
    host.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('.eoj-fim a[href]'); if (a) B.ev('bib_fim_clique', { destino: a.getAttribute('href') }); });
    var fim = host.querySelector('.eoj-fim'), iframe = host.querySelector('iframe'), player = null, tocou = false;
    var lista = (rel || []).slice(0, 3);
    fim.innerHTML = '<p style="margin:0;color:#A1C4E6;font-weight:600;font-size:13px;letter-spacing:0.12em;text-transform:uppercase">' + L('Continue na Biblioteca EOJ') + '</p>' +
      (lista.length ? '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;max-width:820px;width:100%">' + lista.map(function (r) {
        return '<a href="' + B.u('/biblioteca/clipe') + '?id=' + r.id + '" style="flex:1 1 200px;max-width:260px;color:#FFFFFF;text-decoration:none;display:flex;flex-direction:column;gap:8px;text-align:left">' +
          '<span style="display:block;aspect-ratio:16/10;background:#1C1C1C;border-radius:8px;overflow:hidden">' + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : '') + '</span>' +
          '<span style="font-size:14px;font-weight:600;line-height:1.35">' + esc(r.titulo) + '</span></a>';
      }).join('') + '</div>' : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' +
      '<button type="button" class="eoj-denovo" style="font:inherit;font-size:15px;font-weight:700;background:#A1C4E6;color:#111111;border:0;border-radius:8px;padding:12px 18px;cursor:pointer">' + L('Assistir de novo') + '</button>' +
      '<a href="' + B.u('/biblioteca/acervo') + '" style="font:inherit;font-size:15px;font-weight:600;color:#FFFFFF;border:1.5px solid #4A4A4A;border-radius:8px;padding:11px 18px;text-decoration:none">' + L('Ver o acervo') + '</a></div>';
    function ligar() {
      if (!window.Vimeo || !window.Vimeo.Player) return;
      player = new window.Vimeo.Player(iframe);
      var info = { clipe_id: c.id, titulo: String(c.titulo || '').slice(0, 100) };
      player.on('ended', function () { fim.style.display = 'flex'; B.ev('bib_clipe_completo', info); });
      player.on('play', function () { fim.style.display = 'none'; if (!tocou) { tocou = true; B.ev('bib_play', info); } });
    }
    // "Assistir de novo": recarrega o player do início (mais confiável que voltar o tempo depois do fim)
    fim.querySelector('.eoj-denovo').addEventListener('click', function () {
      fim.style.display = 'none'; B.ev('bib_assistir_de_novo', { clipe_id: c.id });
      var novo = iframe.cloneNode(false);
      novo.src = B.player(c) + '&autoplay=1';
      iframe.replaceWith(novo); iframe = novo; player = null;
      novo.addEventListener('load', ligar, { once: true });
    });
    if (window.Vimeo && window.Vimeo.Player) ligar();
    else {
      var s = document.createElement('script'); s.src = 'https://player.vimeo.com/api/player.js'; s.onload = ligar; document.head.appendChild(s);
    }
    function posicionar() {
      var slot = document.querySelector('[data-player-slot]');
      if (!slot || !slot.offsetParent) { host.style.display = 'none'; return; }
      var r = slot.getBoundingClientRect();
      host.style.display = 'block'; host.style.fontFamily = getComputedStyle(slot).fontFamily;
      host.style.top = (r.top + window.scrollY) + 'px'; host.style.left = (r.left + window.scrollX) + 'px';
      host.style.width = r.width + 'px'; host.style.height = r.height + 'px';
    }
    window.addEventListener('resize', posicionar);
    if (window.ResizeObserver) new ResizeObserver(posicionar).observe(document.body);
    posicionar();
    function ir(seg) {
      fim.style.display = 'none';
      var slot = document.querySelector('[data-player-slot]');
      if (slot && slot.getBoundingClientRect().top < 0) slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (player) player.setCurrentTime(seg).then(function () { return player.play(); }).catch(function () {});
    }
    return { posicionar: posicionar, ir: ir };
  };

  B.dur = function (s) { s = Math.round(+s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  B.param = function (k) { return new URLSearchParams(location.search).get(k); };

  // ---------- Janela de login/cadastro (usada no acervo e na página do clipe) ----------
  // estado no componente: gate ('cadastro' | 'entrar' | 'esqueci' | null), gerr, gmsg, gbusy
  B.gate = function (self, depois) {
    var st = self.state;
    var f = self._gf || (self._gf = { nome: '', email: '', senha: '', funcao: 'Treinador(a)' });
    function ir(m) { return function () { self.setState({ gate: m, gerr: '', gmsg: '' }); }; }
    return {
      gateOpen: !!st.gate, gateCad: st.gate === 'cadastro', gateEnt: st.gate === 'entrar', gateEsq: st.gate === 'esqueci',
      gateTitle: st.gate === 'entrar' ? L('Entre na sua conta') : st.gate === 'esqueci' ? L('Recuperar a senha') : (st.gateTitle || L('Crie sua conta grátis')),
      gateErr: st.gerr || '', gateMsg: st.gmsg || '',
      gateBtn: st.gbusy ? L('Aguarde…') : st.gate === 'entrar' ? L('Entrar') : st.gate === 'esqueci' ? L('Enviar link') : L('Criar conta'),
      gf: f,
      gset: function (ev) { f[ev.target.name] = ev.target.value; },
      gateClose: function () { self.setState({ gate: null, gerr: '', gmsg: '' }); },
      gateToEnt: ir('entrar'), gateToCad: ir('cadastro'), gateToEsq: ir('esqueci'),
      gateSubmit: function () {
        if (st.gbusy) return;
        var em = f.email.trim(), modo = st.gate;
        if (modo === 'cadastro' && f.nome.trim().length < 2) return self.setState({ gerr: L('Digite seu nome.') });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return self.setState({ gerr: L('Digite um e-mail válido.') });
        if (modo !== 'esqueci' && f.senha.length < 6) return self.setState({ gerr: L('A senha precisa ter pelo menos 6 caracteres.') });
        self.setState({ gbusy: true, gerr: '', gmsg: '' });
        var p = modo === 'entrar' ? B.entrar(em, f.senha) : modo === 'esqueci' ? B.esqueci(em) : B.cadastrar(f.nome.trim(), em, f.senha, f.funcao);
        p.then(function (d) {
          if (modo === 'esqueci') return self.setState({ gbusy: false, gmsg: L('Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.') });
          if (!B.user) return self.setState({ gbusy: false, gmsg: L('Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre.') });
          f.senha = '';
          self.setState({ gbusy: false, gate: null });
          if (depois) depois(modo);
        }).catch(function (e) { self.setState({ gbusy: false, gerr: B.msg(e) }); });
      }
    };
  };
})();
