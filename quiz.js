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
      q.querySelectorAll(".opts button").forEach((btn, i) => {
        btn.addEventListener("click", () => {
          if (q.classList.contains("answered")) return;
          q.classList.add("answered");
          const ok = i === +q.dataset.answer;
          btn.classList.add(ok ? "right" : "wrong");
          q.querySelectorAll(".opts button")[+q.dataset.answer].classList.add("right");
          why.textContent = (ok ? T.right : T.wrong) + q.dataset.why;
          why.hidden = false;
          answered++; if (ok) correct++;
          if (answered === qs.length) finish();
        });
      });
    });

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
      quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
