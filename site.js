// Меню на телефоне и переключатель языка EN / RU
(() => {
  // Запоминаем выбранный язык (при следующем заходе страница сразу откроется на нём — см. скрипт в <head>)
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-setlang]");
    if (a) { try { localStorage.setItem("vibe-lang", a.dataset.setlang); } catch (err) {} }
  });

  // Кнопка «Меню» на узком экране
  const btn = document.querySelector(".menu-btn");
  if (btn) btn.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    btn.setAttribute("aria-expanded", open);
  });

  // На телефоне список уроков свёрнут; на компьютере всегда открыт
  const side = document.querySelector("details.side");
  if (side) {
    const wide = matchMedia("(min-width: 901px)");
    const sync = () => { side.open = wide.matches; };
    sync(); wide.addEventListener("change", sync);
    // после выбора урока на телефоне сворачиваем список
    side.addEventListener("click", e => { if (e.target.closest("ol a") && !wide.matches) side.open = false; });
  }
})();
