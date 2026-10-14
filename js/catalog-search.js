// Busca no catálogo de equipamentos: filtra por nome ou modelo e abre os grupos com resultados
(function () {
  var input = document.querySelector('[data-catalog-search]');
  if (!input) return;

  var scope = input.closest('section');
  var clear = scope.querySelector('.search__clear');
  var status = scope.querySelector('.search__status');
  var tools = scope.querySelector('.acc__tools');
  var saved = null; // estado aberto/fechado dos grupos antes da busca

  function norm(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var rows = Array.prototype.map.call(scope.querySelectorAll('.acc__item'), function (item) {
    var btn = item.querySelector('.acc__btn');
    var count = item.querySelector('.acc__count');
    var parts = Array.prototype.map.call(item.querySelectorAll('.part'), function (el) {
      var name = el.querySelector('.part__name');
      var model = el.querySelector('.part__model');
      return {
        el: el,
        hay: norm((name ? name.textContent : '') + ' ' + (model ? model.textContent : ''))
      };
    });
    return {
      item: item,
      btn: btn,
      panel: document.getElementById(btn.getAttribute('aria-controls')),
      count: count,
      total: count ? count.textContent : '',
      parts: parts
    };
  });

  var totalItems = rows.reduce(function (sum, r) { return sum + r.parts.length; }, 0);

  function setOpen(row, open) {
    row.btn.setAttribute('aria-expanded', String(open));
    row.panel.hidden = !open;
  }

  function reset() {
    rows.forEach(function (row, i) {
      row.item.hidden = false;
      row.parts.forEach(function (p) { p.el.hidden = false; });
      if (row.count) row.count.textContent = row.total;
      if (saved) setOpen(row, saved[i]);
    });
    saved = null;
    if (tools) tools.hidden = false;
    status.textContent = '';
  }

  function run() {
    var raw = input.value;
    var terms = norm(raw).trim().split(/\s+/).filter(Boolean);
    clear.hidden = !raw;

    if (!terms.length) { reset(); return; }

    if (!saved) {
      saved = rows.map(function (r) { return r.btn.getAttribute('aria-expanded') === 'true'; });
      if (tools) tools.hidden = true;
    }

    var found = 0;
    rows.forEach(function (row) {
      var n = 0;
      row.parts.forEach(function (p) {
        var ok = terms.every(function (t) { return p.hay.indexOf(t) !== -1; });
        p.el.hidden = !ok;
        if (ok) n++;
      });
      found += n;
      row.item.hidden = n === 0;
      setOpen(row, n > 0);
      if (row.count) row.count.textContent = n + ' de ' + row.total;
    });

    if (found === 0) {
      status.textContent = 'Nenhum equipamento encontrado. Tente outro nome ou parte do modelo.';
    } else {
      status.textContent = found + (found === 1 ? ' equipamento encontrado' : ' equipamentos encontrados') + ' (de ' + totalItems + ')';
    }
  }

  function clearSearch() {
    input.value = '';
    run();
    input.focus();
  }

  input.addEventListener('input', run);
  clear.addEventListener('click', clearSearch);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && input.value) clearSearch();
  });
})();
