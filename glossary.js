// Словарь: поиск по словам и фильтр по первой букве
(() => {
  const input = document.getElementById("glos-search");
  if (!input) return;
  const cards = [...document.querySelectorAll(".term")];
  const btns = [...document.querySelectorAll(".abc button")];
  const empty = document.getElementById("glos-empty");
  let letter = "";
  function apply() {
    const q = input.value.trim().toLowerCase();
    // сначала ищем по названиям; если ни одно не подошло — ещё и в объяснениях
    const byName = q && cards.some(c => c.dataset.name.includes(q));
    let shown = 0;
    cards.forEach(c => {
      const hit = !q || (byName ? c.dataset.name.includes(q) : c.dataset.text.includes(q));
      const ok = (!letter || c.dataset.letter === letter) && hit;
      c.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown > 0;
  }
  btns.forEach(b => b.addEventListener("click", () => {
    letter = b.dataset.letter;
    btns.forEach(x => x.setAttribute("aria-pressed", x === b));
    apply();
  }));
  input.addEventListener("input", apply);
})();
