// Прогресс: пройденные уроки и лучший результат теста. Хранится в браузере посетителя.
window.VibeProgress = (() => {
  const TOTAL = { python: 8, javascript: 8, html: 6, css: 8, c: 8, cpp: 8, csharp: 8, rust: 8 };
  const CMD = { python: "python", javascript: "js", html: "html", css: "css", c: "c", cpp: "c++", csharp: "c#", rust: "rust" };
  const QUESTIONS = 5;
  const KEY = "vibe-progress-v1";
  const ru = document.documentElement.lang === "ru";
  const T = ru
    ? { progress: "ПРОГРЕСС", quiz: "ТЕСТ", mark: "[ ] ОТМЕТИТЬ ПРОЙДЕННЫМ", done: "[x] ПРОЙДЕНО" }
    : { progress: "PROGRESS", quiz: "QUIZ", mark: "[ ] MARK AS DONE", done: "[x] DONE" };

  // Если браузер не даёт сохранять (приватный режим), просто работаем без сохранения
  let mem = { lessons: {}, quiz: {} };
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.lessons) mem = d; } catch (e) {}
    mem.quiz = mem.quiz || {};
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }

  const doneList = lang => (load().lessons[lang] || []);
  const isDone = (lang, n) => doneList(lang).includes(n);
  function toggle(lang, n) {
    const list = doneList(lang).filter(x => x !== n);
    if (!isDone(lang, n)) list.push(n);
    mem.lessons[lang] = list.sort((a, b) => a - b);
    save(); render();
  }
  const quizBest = lang => load().quiz[lang];
  function setQuiz(lang, score) {
    const best = quizBest(lang);
    if (best === undefined || score > best) { mem.quiz[lang] = score; save(); }
    render();
  }

  // [####----] из ASCII: в пиксельном шрифте нет символов-блоков
  function bar(n, total, width = 8) {
    const f = Math.round(n / total * width);
    return "[" + "#".repeat(f) + "-".repeat(width - f) + "]";
  }
  function line(lang) {
    const n = doneList(lang).length, q = quizBest(lang);
    return T.progress + " " + bar(n, TOTAL[lang]) + " " + n + "/" + TOTAL[lang] +
      "  ·  " + T.quiz + " " + (q === undefined ? "-" : q + "/" + QUESTIONS);
  }

  // Рисуем всё, что есть на странице
  function render() {
    document.querySelectorAll("[data-progress]").forEach(el => { el.textContent = line(el.dataset.progress); });
    document.querySelectorAll(".done-btn").forEach(b => {
      const on = isDone(b.dataset.lang, +b.dataset.n);
      b.textContent = on ? T.done : T.mark;
      b.classList.toggle("on", on);
      const doc = b.closest(".doc");
      if (doc) doc.classList.toggle("is-done", on);
    });
  }

  document.addEventListener("click", e => {
    const b = e.target.closest(".done-btn");
    if (b) toggle(b.dataset.lang, +b.dataset.n);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();

  // Строки для команды progress в терминале
  function report() {
    return Object.keys(TOTAL).map(lang => {
      const n = doneList(lang).length, q = quizBest(lang);
      return "  " + CMD[lang].padEnd(7) + bar(n, TOTAL[lang]) + " " + n + "/" + TOTAL[lang] +
        "  " + (ru ? "тест " : "quiz ") + (q === undefined ? "-" : q + "/" + QUESTIONS);
    });
  }

  return { TOTAL, toggle, setQuiz, quizBest, render, report };
})();
