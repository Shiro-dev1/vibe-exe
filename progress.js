// Прогресс: пройденные уроки и лучший результат теста. Хранится в браузере посетителя.
window.VibeProgress = (() => {
  const TOTAL = { python: 8, javascript: 8, typescript: 8, html: 6, css: 8, php: 8, java: 8, c: 8, cpp: 8, csharp: 8, go: 8, rust: 8 };
  const CMD = { python: "python", javascript: "js", typescript: "ts", html: "html", css: "css", php: "php", java: "java", c: "c", cpp: "c++", csharp: "c#", go: "go", rust: "rust" };
  const QUESTIONS = 5;
  const KEY = "vibe-progress-v1";
  const ru = document.documentElement.lang === "ru";
  const T = ru
    ? { of: " из ", lessons: " уроков", quiz: "тест ", noQuiz: "тест не пройден", mark: "Отметить пройденным", done: "Пройдено ✓" }
    : { of: " of ", lessons: " lessons", quiz: "quiz ", noQuiz: "quiz not taken", mark: "Mark as done", done: "Done ✓" };

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
    return n + T.of + TOTAL[lang] + T.lessons + " · " + (q === undefined ? T.noQuiz : T.quiz + q + "/" + QUESTIONS);
  }

  // Рисуем всё, что есть на странице: полоски прогресса, кнопки «пройдено», галочки в меню уроков
  function render() {
    document.querySelectorAll("[data-progress]").forEach(el => {
      const lang = el.dataset.progress;
      if (!el.firstChild) el.innerHTML = '<span class="pbar-track"><span class="pbar-fill"></span></span><span class="pbar-text"></span>';
      el.querySelector(".pbar-fill").style.width = (doneList(lang).length / TOTAL[lang] * 100) + "%";
      el.querySelector(".pbar-text").textContent = line(lang);
    });
    document.querySelectorAll(".done-btn").forEach(b => {
      const on = isDone(b.dataset.lang, +b.dataset.n);
      b.textContent = on ? T.done : T.mark;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
      const lesson = b.closest(".lesson");
      if (lesson) lesson.classList.toggle("is-done", on);
    });
    document.querySelectorAll(".side a[data-n]").forEach(a => {
      a.classList.toggle("done", isDone(a.dataset.lang, +a.dataset.n));
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
