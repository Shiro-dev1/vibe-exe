// Мини-тест в конце страницы языка
(() => {
  const ru = document.documentElement.lang === "ru";
  const T = ru
    ? { right: "Верно. ", wrong: "Неверно. ", score: "Результат: ", best: "лучший: ", perfect: " — идеально!", retry: "Пройти заново" }
    : { right: "Correct. ", wrong: "Not quite. ", score: "Score: ", best: "best: ", perfect: " — perfect!", retry: "Try again" };

  document.querySelectorAll(".quiz").forEach(quiz => {
    const lang = quiz.dataset.lang;
    const qs = [...quiz.querySelectorAll(".q")];
    const score = quiz.querySelector(".score");
    const retry = quiz.querySelector(".retry");
    retry.textContent = T.retry;
    let answered = 0, correct = 0;

    qs.forEach(q => {
      const why = q.querySelector(".why");
      const whyText = why.textContent;
      q.dataset.why = whyText;
      const buttons = [...q.querySelectorAll(".opts button")];
      buttons[+q.dataset.answer].dataset.correct = "1";   // запоминаем правильный вариант до перемешивания
      buttons.forEach(btn => {
        btn.addEventListener("click", () => {
          if (q.classList.contains("answered")) return;
          q.classList.add("answered");
          const ok = btn.dataset.correct === "1";
          btn.classList.add(ok ? "right" : "wrong");
          q.querySelector('.opts button[data-correct="1"]').classList.add("right");
          why.textContent = (ok ? T.right : T.wrong) + q.dataset.why;
          why.hidden = false;
          answered++; if (ok) correct++;
          if (answered === qs.length) finish();
        });
      });
    });

    // Варианты ответа в случайном порядке — каждый раз при открытии и при «Пройти заново»
    function shuffle() {
      qs.forEach(q => {
        const opts = q.querySelector(".opts");
        const list = [...opts.children];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        list.forEach(b => opts.appendChild(b));
      });
    }
    shuffle();

    function finish() {
      if (window.VibeProgress) VibeProgress.setQuiz(lang, correct);
      const best = window.VibeProgress ? VibeProgress.quizBest(lang) : correct;
      score.textContent = T.score + correct + "/" + qs.length + (correct === qs.length ? T.perfect : "") +
        "  ·  " + T.best + best + "/" + qs.length;
      score.hidden = false;
      retry.hidden = false;
    }

    retry.addEventListener("click", () => {
      answered = 0; correct = 0;
      qs.forEach(q => {
        q.classList.remove("answered");
        q.querySelectorAll(".opts button").forEach(b => b.classList.remove("right", "wrong"));
        const why = q.querySelector(".why"); why.hidden = true; why.textContent = q.dataset.why;
      });
      score.hidden = true; retry.hidden = true;
      shuffle();
      quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
