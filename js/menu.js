// Menu: abre/fecha e troca o ícone + / −
(function () {
  var btn = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  var icon = document.querySelector('.menu-toggle__icon');
  if (!btn || !menu) return;

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    icon.textContent = open ? '−' : '+';
  }

  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  // Fecha ao escolher um item ou apertar Esc
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
