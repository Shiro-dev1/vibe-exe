// Достижения: значки за пройденные уроки, тесты, запуск кода и заходы на сайт подряд.
// Хранятся в браузере посетителя. Новое достижение — всплывающая плашка и точка у пункта меню.
window.VibeAch = (() => {
  const ru = document.documentElement.lang === "ru";
  const KEY = "vibe-ach-v1";
  const P = window.VibeProgress;

  // ---------- Хранилище ----------
  let st = { got: {}, seen: [], runs: 0, linux: false, days: { last: "", streak: 0 } };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.got) st = Object.assign(st, d); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  // ---------- Данные прогресса ----------
  const prog = () => (P ? P.data() : { lessons: {}, quiz: {} });
  const doneTotal = () => Object.values(prog().lessons).reduce((n, l) => n + l.length, 0);
  const langsStarted = () => Object.values(prog().lessons).filter(l => l.length).length;
  const quizzes = () => Object.keys(prog().quiz).length;
  const bestQuiz = () => Math.max(0, ...Object.values(prog().quiz));
  const mastered = () => {   // лучший язык по шкале 0–9: 8 частей за уроки и ещё 1 за тест
    let best = 0;
    for (const k in (P ? P.TOTAL : {})) {
      const n = (prog().lessons[k] || []).length;
      best = Math.max(best, Math.floor(n / P.TOTAL[k] * 8) + (n === P.TOTAL[k] && prog().quiz[k] !== undefined ? 1 : 0));
    }
    return best;
  };
  const LANGS = P ? Object.keys(P.TOTAL).length : 12;

  // ---------- Список достижений ----------
  // [id, значок, название en, ru, условие en, ru, текущее значение, цель]
  const LIST = [
    ["first", "1", "First step", "Первый шаг", "Mark your first lesson as done", "Отметь первый урок пройденным", doneTotal, 1],
    ["five", "5", "Warming up", "Разогрев", "Finish 5 lessons", "Пройди 5 уроков", doneTotal, 5],
    ["twenty", "20", "Persistence", "Упорство", "Finish 20 lessons", "Пройди 20 уроков", doneTotal, 20],
    ["perfect", "5/5", "Top student", "Отличник", "Pass a quiz without mistakes", "Пройди тест без ошибок", bestQuiz, 5],
    ["quizzes", "?", "Examiner", "Экзаменатор", "Take quizzes in 3 languages", "Пройди тесты по 3 языкам", quizzes, 3],
    ["poly", "{ }", "Polyglot", "Полиглот", "Start lessons in 3 languages", "Начни уроки в 3 языках", langsStarted, 3],
    ["all", String(LANGS), "Every language", "Все языки", "At least one lesson in every language", "Хотя бы один урок в каждом языке", langsStarted, LANGS],
    ["master", "★", "Language master", "Мастер языка", "All lessons and the quiz of one language", "Все уроки и тест одного языка", mastered, 9],
    ["run", "▶", "Launch!", "Запуск!", "Run code with the Run button", "Запусти код кнопкой «Запустить»", () => st.runs, 1],
    ["linux", "$", "Terminal fan", "Терминальщик", "Read the Linux page to the end", "Дочитай страницу про Linux до конца", () => (st.linux ? 1 : 0), 1],
    ["days3", "3", "Three days", "Три дня", "Visit the site 3 days in a row", "Заходи на сайт 3 дня подряд", () => st.days.streak, 3],
    ["days7", "7", "Marathon", "Марафон", "Visit the site 7 days in a row", "Заходи на сайт 7 дней подряд", () => st.days.streak, 7],
  ];
  const T = ru ? { got: "получено ", newAch: "Новое достижение", of: " из ", none: "не получено", count: "получено", streak: "дней подряд", lessons: "уроков пройдено" }
               : { got: "earned ", newAch: "New achievement", of: " of ", none: "not earned", count: "earned", streak: "days in a row", lessons: "lessons done" };
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = iso => iso.split("-").reverse().join(".");

  // ---------- Проверка: выдаём новые достижения ----------
  function check(quiet) {
    const fresh = [];
    for (const [id, , en, rn, , , cur, goal] of LIST) {
      if (!st.got[id] && cur() >= goal) { st.got[id] = today(); fresh.push(ru ? rn : en); }
    }
    if (fresh.length) { save(); if (!quiet) fresh.forEach((n, i) => setTimeout(() => toast(n), i * 1600)); }
    markNav(); renderPage();
  }

  // Заходы подряд: считаем один раз в день
  (function visit() {
    const d = today();
    if (st.days.last === d) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    st.days.streak = st.days.last === y ? st.days.streak + 1 : 1;
    st.days.last = d; save();
  })();

  // ---------- Плашка «Новое достижение» ----------
  function toast(name) {
    const el = document.createElement("div");
    el.className = "ach-toast"; el.setAttribute("role", "status");
    el.innerHTML = '<span class="ach-cup">🏆</span><span><b></b><span></span></span>';
    el.querySelector("b").textContent = T.newAch;
    el.querySelector("b + span").textContent = name;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 4200);
  }

  // ---------- Точка у пункта меню, пока есть непросмотренные ----------
  function markNav() {
    const unseen = Object.keys(st.got).some(id => !st.seen.includes(id));
    document.querySelectorAll('a[href="achievements.html"]').forEach(a => a.classList.toggle("has-new", unseen));
  }

  // ---------- Страница «Достижения» ----------
  function renderPage() {
    const grid = document.getElementById("ach-grid");
    if (!grid) return;
    const got = Object.keys(st.got).length;
    document.getElementById("ach-stats").innerHTML =
      `<span><b>${got} / ${LIST.length}</b>${T.count}</span><span><b>${st.days.streak}</b>${T.streak}</span><span><b>${doneTotal()}</b>${T.lessons}</span>`;
    grid.innerHTML = "";
    for (const [id, icon, en, rn, de, dr, cur, goal] of LIST) {
      const on = !!st.got[id];
      const el = document.createElement("div");
      el.className = "ach" + (on ? "" : " off");
      const v = Math.min(cur(), goal);
      el.innerHTML = `<div class="ach-ic"></div><h3></h3><p></p><small></small>`;
      el.querySelector(".ach-ic").textContent = icon;
      el.querySelector("h3").textContent = ru ? rn : en;
      el.querySelector("p").textContent = ru ? dr : de;
      el.querySelector("small").textContent = on ? T.got + fmt(st.got[id]) : (goal > 1 ? v + T.of + goal : T.none);
      grid.appendChild(el);
    }
    // открыли страницу — все достижения просмотрены
    st.seen = Object.keys(st.got); save(); markNav();
  }

  // ---------- События ----------
  document.addEventListener("vibe:progress", () => check());
  document.addEventListener("vibe:quiz", () => check());
  document.addEventListener("vibe:run", () => { st.runs++; save(); check(); });
  // страница Linux дочитана до конца
  const end = document.querySelector("[data-ach-end]");
  if (end && "IntersectionObserver" in window) {
    new IntersectionObserver((es, ob) => {
      if (es[0].isIntersecting) { st.linux = true; save(); check(); ob.disconnect(); }
    }).observe(end);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => check());
  else check();
  return { check };
})();
