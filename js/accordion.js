// Acordeões: cada título azul abre/fecha seu conteúdo; "Abrir todos" controla o grupo
(function () {
  function setItem(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  document.querySelectorAll('.acc').forEach(function (acc) {
    var btns = acc.querySelectorAll('.acc__btn');
    var all = acc.querySelector('.acc__all');

    function sync() {
      if (!all) return;
      var allOpen = Array.prototype.every.call(btns, function (b) {
        return b.getAttribute('aria-expanded') === 'true';
      });
      all.textContent = allOpen ? 'Fechar todos' : 'Abrir todos';
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        setItem(b, b.getAttribute('aria-expanded') !== 'true');
        sync();
      });
    });

    if (all) {
      all.addEventListener('click', function () {
        var openAll = all.textContent === 'Abrir todos';
        btns.forEach(function (b) { setItem(b, openAll); });
        sync();
      });
    }

    sync();
  });
})();
