/* Entendendo o Jogo — runtime leve das páginas.
   Lê o modelo em <template id="eoj-tpl">, preenche {{campos}}, repete <sc-for>, mostra/oculta <sc-if>
   e liga os eventos (onClick, onInput, onChange, onSubmit) às funções devolvidas por renderVals(). */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var ONLY_HOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var shared = { menu: false };
  var instance = null, root = null, tpl = null, pending = false;

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state) : patch;
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) this.state[k] = p[k];
    schedule();
  };
  DCLogic.prototype.renderVals = function () { return {}; };
  window.DCLogic = DCLogic;

  function lookup(path, ctx) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.'), v = ctx;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function interp(str, ctx) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, ctx); return v == null ? '' : String(v); });
  }
  function eventName(attr, el) {
    var n = attr.slice(2).toLowerCase();
    if (n === 'change' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return 'input';
    return n;
  }

  function renderNode(node, ctx, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(interp(node.nodeValue, ctx))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === 'SC-FOR') {
      var list = lookup((node.getAttribute('list') || '').replace(/[{}]/g, ''), ctx) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var c = Object.create(ctx); c[as] = list[i];
        renderChildren(node, c, out);
      }
      return;
    }
    if (tag === 'SC-IF') {
      var m = ONLY_HOLE.exec(node.getAttribute('value') || '');
      var v = m ? lookup(m[1], ctx) : false;
      if (v && v !== 'false') renderChildren(node, ctx, out);
      return;
    }
    var el = node.cloneNode(false);
    var attrs = Array.prototype.slice.call(el.attributes);
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name, val = attrs[a].value;
      if (name.indexOf('hint-') === 0) { el.removeAttribute(name); continue; }
      if (name.indexOf('on') === 0 && name.length > 2) {
        el.removeAttribute(name);
        var mm = ONLY_HOLE.exec(val), fn = mm ? lookup(mm[1], ctx) : null;
        if (typeof fn === 'function') {
          (function (f, evt) {
            el.addEventListener(evt, function (ev) { if (evt === 'submit') ev.preventDefault(); f(ev); });
          })(fn, eventName(name, el));
        }
        continue;
      }
      if (val.indexOf('{{') >= 0) {
        var nv = interp(val, ctx);
        el.setAttribute(name, nv);
        if (name === 'value' && 'value' in el) el.value = nv;
      }
    }
    var kids = [];
    renderChildren(node, ctx, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    out.push(el);
  }
  function renderChildren(node, ctx, out) {
    var src = node.content || node; // <template> guarda os filhos em .content
    for (var c = src.firstChild; c; c = c.nextSibling) renderNode(c, ctx, out);
  }

  function pathOf(el) {
    var p = [];
    while (el && el !== root) { var i = 0, s = el; while ((s = s.previousSibling)) i++; p.unshift(i); el = el.parentNode; }
    return el === root ? p : null;
  }
  function byPath(p) { var el = root; for (var i = 0; i < p.length && el; i++) el = el.childNodes[p[i]]; return el; }

  function values() {
    var base = {
      menuOpen: shared.menu ? 'true' : 'false',
      toggleMenu: function () { shared.menu = !shared.menu; schedule(); }
    };
    var v = instance ? instance.renderVals() || {} : {};
    for (var k in v) base[k] = v[k];
    return base;
  }
  function render() {
    pending = false;
    var focus = document.activeElement, fp = focus && root.contains(focus) ? pathOf(focus) : null, sel = null;
    if (fp && focus.selectionStart != null) { try { sel = [focus.selectionStart, focus.selectionEnd]; } catch (e) { sel = null; } }
    var out = [];
    renderChildren(tpl, values(), out);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < out.length; i++) frag.appendChild(out[i]);
    // Elementos com data-keep já preenchidos por outro script (ex.: o mapa) são reaproveitados
    var antigos = {}, ks = root.querySelectorAll('[data-keep][data-pronto]');
    for (var k = 0; k < ks.length; k++) antigos[ks[k].getAttribute('data-keep')] = ks[k];
    var novos = frag.querySelectorAll('[data-keep]');
    for (var q = 0; q < novos.length; q++) { var velho = antigos[novos[q].getAttribute('data-keep')]; if (velho) novos[q].replaceWith(velho); }
    root.replaceChildren(frag);
    // <select data-value> e <input type=checkbox data-checked> mantêm o valor entre renderizações
    var sels = root.querySelectorAll('select[data-value]');
    for (var s = 0; s < sels.length; s++) sels[s].value = sels[s].getAttribute('data-value');
    var chks = root.querySelectorAll('input[data-checked]');
    for (var c = 0; c < chks.length; c++) chks[c].checked = chks[c].getAttribute('data-checked') === 'true';
    if (fp) {
      var n = byPath(fp);
      if (n && n.focus) { n.focus({ preventScroll: true }); if (sel && n.setSelectionRange) { try { n.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
    }
    if (window.__eojDD && window.eojDD) window.eojDD(true);
    if (instance && instance.componentDidUpdate) { try { instance.componentDidUpdate(); } catch (e) {} }
  }
  function schedule() { if (!pending && root) { pending = true; requestAnimationFrame(render); } }

  window.EOJ = {
    mount: function (Component) {
      root = document.getElementById('eoj-root');
      tpl = document.getElementById('eoj-tpl');
      instance = Component ? new Component({}) : null;
      render();
      if (instance && instance.componentDidMount) instance.componentDidMount();
    }
  };
})();

// Menu "Conteúdos" (submenu do cabeçalho): abre/fecha no clique, fecha com Esc ou clique fora
(function () {
  function set(on) {
    window.__eojDD = on;
    var dds = document.querySelectorAll('.eoj-dd');
    for (var i = 0; i < dds.length; i++) {
      dds[i].setAttribute('data-open', on ? 'true' : 'false');
      var b = dds[i].querySelector('.eoj-dd-b'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
  }
  window.eojDD = set;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.eoj-dd-b');
    if (b) { e.preventDefault(); set(b.parentNode.getAttribute('data-open') !== 'true'); return; }
    if (window.__eojDD && !(e.target.closest && e.target.closest('.eoj-dd'))) set(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && window.__eojDD) { set(false); var b = document.querySelector('.eoj-dd-b'); if (b) b.focus(); }
  });
})();
