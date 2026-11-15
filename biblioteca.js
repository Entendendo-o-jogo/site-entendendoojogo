/* Biblioteca EOJ — acesso ao Supabase (login, clipes, favoritos e playlists).
   A chave publicável é pública por natureza; a segurança fica nas regras (RLS) do banco. */
(function () {
  'use strict';
  var URL = 'https://ragqlotjxwfdzggrhlez.supabase.co';
  var KEY = 'sb_publishable_-Rwplnf-81gMXQij5sOwGQ_wCH1QvmR';
  var sb = window.supabase.createClient(URL, KEY);
  var B = window.EOJB = { sb: sb, user: null, perfil: null };

  function carregarPerfil() {
    if (!B.user) { B.perfil = null; return Promise.resolve(null); }
    return sb.from('perfis').select('*').eq('id', B.user.id).maybeSingle()
      .then(function (r) { B.perfil = r.data || null; return B.user; });
  }
  B.ready = sb.auth.getSession().then(function (r) {
    B.user = r.data && r.data.session ? r.data.session.user : null;
    return carregarPerfil();
  }).catch(function () { return null; });

  B.isAdmin = function () { return !!(B.perfil && B.perfil.papel === 'admin'); };
  B.nome = function () { return (B.perfil && B.perfil.nome) || (B.user && B.user.email) || ''; };

  function ok(r) { if (r.error) throw r.error; return r.data; }
  B.msg = function (e) {
    var m = (e && (e.message || e.error_description)) || String(e || '');
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered|already been registered|User already/i.test(m)) return 'Este e-mail já tem conta. Use "Entrar".';
    if (/Password should be at least|weak/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return 'Digite um e-mail válido.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
    if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão. Verifique a internet e tente de novo.';
    return 'Não foi possível concluir agora. Tente de novo em instantes.';
  };

  // ---------- Conta ----------
  B.cadastrar = function (nome, email, senha, funcao) {
    return sb.auth.signUp({ email: email, password: senha, options: { data: { nome: nome, funcao: funcao }, emailRedirectTo: location.origin + '/biblioteca/acervo' } })
      .then(ok).then(function (d) { B.user = d.user && d.session ? d.user : null; return carregarPerfil().then(function () { return d; }); });
  };
  B.entrar = function (email, senha) {
    return sb.auth.signInWithPassword({ email: email, password: senha })
      .then(ok).then(function (d) { B.user = d.user; return carregarPerfil(); });
  };
  B.sair = function () { return sb.auth.signOut().then(function () { B.user = null; B.perfil = null; }); };
  B.esqueci = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/biblioteca/entrar?modo=nova-senha' }).then(ok);
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
  B.inserirVarios = function (lista) { return sb.from('clipes').insert(lista).select('id').then(ok); };
  B.excluirClipe = function (id) { return sb.from('clipes').delete().eq('id', id).then(ok); };

  // ---------- Favoritos ----------
  B.favIds = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.from('favoritos').select('clipe').then(ok).then(function (rows) { return rows.map(function (r) { return r.clipe; }); });
  };
  B.favoritar = function (clipe, on) {
    return (on ? sb.from('favoritos').insert({ clipe: clipe }) : sb.from('favoritos').delete().eq('clipe', clipe).eq('usuario', B.user.id)).then(ok);
  };

  // ---------- Playlists ----------
  B.playlists = function () {
    if (!B.user) return Promise.resolve([]);
    return sb.from('playlists').select('id, nome, criado_em, playlist_clipes(clipe, ordem)').order('criado_em', { ascending: true }).then(ok);
  };
  B.novaPlaylist = function (nome) { return sb.from('playlists').insert({ nome: nome }).select().single().then(ok); };
  B.renomearPlaylist = function (id, nome) { return sb.from('playlists').update({ nome: nome }).eq('id', id).then(ok); };
  B.excluirPlaylist = function (id) { return sb.from('playlists').delete().eq('id', id).then(ok); };
  B.adicionar = function (playlist, clipe) {
    return sb.from('playlist_clipes').upsert({ playlist: playlist, clipe: clipe, ordem: Date.now() % 2147483647 }, { onConflict: 'playlist,clipe', ignoreDuplicates: true }).then(ok);
  };
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
  B.linkDownload = function (id) { return B.funcao({ acao: 'baixar', id: id }); };

  // Lê o nome do arquivo: início com sistema (4-3-3) = Sistemas táticos; com posição = Tática individual.
  var POS = ['goleiro', 'zagueiro', 'lateral', 'ala', 'volante', 'meia', 'meio-campista', 'ponta', 'extremo', 'atacante', 'centroavante', 'segundo atacante'];
  function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  B.lerNome = function (nome) {
    var titulo = String(nome || '').replace(/\.(mp4|mov|m4v|avi|mkv)$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    var n = semAcento(titulo), c = { titulo: titulo, tipo: 'Clipe separado' };
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
    return c;
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
      gateTitle: st.gate === 'entrar' ? 'Entre na sua conta' : st.gate === 'esqueci' ? 'Recuperar a senha' : (st.gateTitle || 'Crie sua conta grátis'),
      gateErr: st.gerr || '', gateMsg: st.gmsg || '',
      gateBtn: st.gbusy ? 'Aguarde…' : st.gate === 'entrar' ? 'Entrar' : st.gate === 'esqueci' ? 'Enviar link' : 'Criar conta',
      gf: f,
      gset: function (ev) { f[ev.target.name] = ev.target.value; },
      gateClose: function () { self.setState({ gate: null, gerr: '', gmsg: '' }); },
      gateToEnt: ir('entrar'), gateToCad: ir('cadastro'), gateToEsq: ir('esqueci'),
      gateSubmit: function () {
        if (st.gbusy) return;
        var em = f.email.trim(), modo = st.gate;
        if (modo === 'cadastro' && f.nome.trim().length < 2) return self.setState({ gerr: 'Digite seu nome.' });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return self.setState({ gerr: 'Digite um e-mail válido.' });
        if (modo !== 'esqueci' && f.senha.length < 6) return self.setState({ gerr: 'A senha precisa ter pelo menos 6 caracteres.' });
        self.setState({ gbusy: true, gerr: '', gmsg: '' });
        var p = modo === 'entrar' ? B.entrar(em, f.senha) : modo === 'esqueci' ? B.esqueci(em) : B.cadastrar(f.nome.trim(), em, f.senha, f.funcao);
        p.then(function (d) {
          if (modo === 'esqueci') return self.setState({ gbusy: false, gmsg: 'Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.' });
          if (!B.user) return self.setState({ gbusy: false, gmsg: 'Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre.' });
          f.senha = '';
          self.setState({ gbusy: false, gate: null });
          if (depois) depois(modo);
        }).catch(function (e) { self.setState({ gbusy: false, gerr: B.msg(e) }); });
      }
    };
  };
})();
