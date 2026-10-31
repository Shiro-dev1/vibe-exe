// Тест «Какой язык выбрать?»: 5 вопросов, у каждого ответа — баллы языкам, в конце советуем язык.
(() => {
  const box = document.getElementById("pick");
  if (!box) return;
  const ru = document.documentElement.lang === "ru";
  const L = (en, r) => (ru ? r : en);

  // [вопрос en, ru, [[ответ en, ru, {язык: баллы}], ...]]. Первый вопрос (цель) весит больше остальных.
  const Q = [
    ["What do you want to make most?", "Что тебе больше всего хочется сделать?", [
      ["🎮  My own game", "🎮  Свою игру", { csharp: 5, cpp: 3 }],
      ["🌐  A website or web app", "🌐  Сайт или веб-приложение", { javascript: 5, html: 3, typescript: 1, php: 2 }],
      ["🤖  A Telegram bot or a script that does things for me", "🤖  Telegram-бота или скрипт, который всё делает сам", { python: 5, go: 2 }],
      ["📱  An app for phones", "📱  Приложение для телефона", { java: 5, csharp: 2 }],
    ]],
    ["What will you learn on?", "На чём ты будешь учиться?", [
      ["💻  Chromebook or just a browser", "💻  Chromebook или только браузер", { javascript: 2, html: 2, python: 1 }],
      ["🪟  A Windows computer", "🪟  Компьютер с Windows", { csharp: 2, cpp: 1, python: 1 }],
      ["🍎  Mac or Linux", "🍎  Mac или Linux", { python: 1, go: 1, rust: 1 }],
      ["📱  Only a phone", "📱  Только телефон", { javascript: 2, html: 1 }],
    ]],
    ["What do you like more?", "Что тебе больше нравится?", [
      ["✨  Seeing the result on screen right away", "✨  Сразу видеть результат на экране", { javascript: 2, html: 2, css: 1 }],
      ["🔧  Understanding how computers work inside", "🔧  Понимать, как компьютер устроен внутри", { c: 2, rust: 2, cpp: 1 }],
      ["📊  Working with data and automating boring tasks", "📊  Работать с данными и автоматизировать скучные дела", { python: 2, go: 1 }],
      ["🤷  I don't know yet", "🤷  Пока не знаю", { python: 1, javascript: 1 }],
    ]],
    ["How much time can you give to learning?", "Сколько времени ты готов уделять учёбе?", [
      ["⏱  15–20 minutes a day", "⏱  15–20 минут в день", { python: 2, html: 1 }],
      ["🕐  About an hour a day", "🕐  Около часа в день", { javascript: 1, java: 1, typescript: 1 }],
      ["🔥  A lot — I want to go deep", "🔥  Много — хочу разобраться глубоко", { cpp: 2, rust: 2, c: 1 }],
    ]],
    ["Do you already know some programming?", "Ты уже знаешь что-то из программирования?", [
      ["🌱  No, I'm starting from zero", "🌱  Нет, начинаю с нуля", { python: 2, html: 2, javascript: 1 }],
      ["🧩  A little HTML or CSS", "🧩  Немного HTML или CSS", { javascript: 3, typescript: 1, php: 1 }],
      ["🚀  I already know another language", "🚀  Уже знаю другой язык", { typescript: 1, go: 2, rust: 1, java: 1 }],
    ]],
  ];

  // Почему язык подходит и метки
  const WHY = {
    python: ["Python reads almost like English, so it's the easiest start. You'll be able to write bots and scripts that automate boring tasks.", "Python читается почти как английский текст, поэтому с него проще всего начать. Скоро сможешь писать ботов и скрипты, которые делают скучную работу за тебя.", ["bots", "scripts", "easy start"], ["боты", "скрипты", "лёгкий старт"]],
    javascript: ["You want to make websites and see the result right in the browser. JavaScript runs everywhere, and together with HTML and CSS you can build your first site within a week.", "Ты хочешь делать сайты и видеть результат сразу в браузере. JavaScript работает везде, а с HTML и CSS ты соберёшь свой первый сайт уже через неделю.", ["websites", "instant result", "works on Chromebook"], ["сайты", "быстрый результат", "работает на Chromebook"]],
    typescript: ["You already know a bit of code and want to build serious web apps. TypeScript is JavaScript with types — fewer bugs in big projects.", "Ты уже немного знаешь код и хочешь делать серьёзные веб-приложения. TypeScript — это JavaScript с типами: меньше ошибок в больших проектах.", ["web apps", "big projects"], ["веб-приложения", "большие проекты"]],
    html: ["Start with how web pages are built. HTML is the simplest step into coding, and you'll see every change in the browser right away.", "Начни с того, как устроены веб-страницы. HTML — самый простой шаг в программирование, и каждое изменение сразу видно в браузере.", ["web pages", "very easy", "works on Chromebook"], ["веб-страницы", "очень просто", "работает на Chromebook"]],
    css: ["You like making things look good. CSS controls colors, fonts and animations on every website.", "Тебе нравится делать красиво. CSS управляет цветами, шрифтами и анимациями на любом сайте.", ["design", "animations"], ["дизайн", "анимации"]],
    php: ["You want to build the server side of websites: sign-ups, forms, online shops. PHP powers WordPress and a huge part of the internet.", "Ты хочешь делать серверную часть сайтов: регистрацию, формы, интернет-магазины. На PHP работает WordPress и огромная часть интернета.", ["server side", "online shops"], ["сервер", "интернет-магазины"]],
    java: ["You want to make apps for Android. Java is strict and clear, and it's used in big companies all over the world.", "Ты хочешь делать приложения для Android. Java строгая и понятная, и её используют большие компании по всему миру.", ["Android", "big companies"], ["Android", "большие компании"]],
    c: ["You want to understand how a computer really works. C is close to the hardware — learn it and other languages will feel easy.", "Ты хочешь понять, как компьютер работает на самом деле. C близок к «железу»: выучишь его — и другие языки покажутся простыми.", ["how computers work", "fast"], ["как устроен компьютер", "скорость"]],
    cpp: ["You want to make games and fast programs. Big game engines like Unreal are written in C++. It's harder, but very powerful.", "Ты хочешь делать игры и быстрые программы. На C++ написаны большие игровые движки вроде Unreal. Он сложнее, но очень мощный.", ["games", "speed"], ["игры", "скорость"]],
    csharp: ["You want to make games. C# is the language of Unity — the most popular engine for indie games — and it's easier than C++.", "Ты хочешь делать игры. C# — язык Unity, самого популярного движка для инди-игр, и он проще, чем C++.", ["games in Unity", "Windows"], ["игры в Unity", "Windows"]],
    go: ["You already know some code and want to build fast servers and tools. Go is simple, quick to learn and loved by cloud companies.", "Ты уже знаешь немного кода и хочешь делать быстрые серверы и утилиты. Go простой, быстро учится и его любят облачные компании.", ["servers", "simple"], ["серверы", "простой"]],
    rust: ["You want to go deep and write fast, reliable programs. Rust is as fast as C, and its compiler catches mistakes before the program runs.", "Ты хочешь разобраться глубоко и писать быстрые и надёжные программы. Rust быстрый как C, а его компилятор ловит ошибки ещё до запуска.", ["speed", "reliability"], ["скорость", "надёжность"]],
  };
  const NAME = { python: "Python", javascript: "JavaScript", typescript: "TypeScript", html: "HTML", css: "CSS", php: "PHP", java: "Java", c: "C", cpp: "C++", csharp: "C#", go: "Go", rust: "Rust" };
  const FILE = { python: "python.html", javascript: "javascript.html", typescript: "typescript.html", html: "html.html", css: "css.html", php: "php.html", java: "java.html", c: "c.html", cpp: "cpp.html", csharp: "csharp.html", go: "go.html", rust: "rust.html" };
  const ORDER = Object.keys(NAME);   // при равных баллах — кто раньше в списке

  let step = 0;
  const answers = new Array(Q.length).fill(-1);

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function renderQuestion() {
    const [qen, qru, opts] = Q[step];
    box.innerHTML = `
      <div class="pick-steps">${Q.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <span class="pick-count">${L("Question", "Вопрос")} ${step + 1} ${L("of", "из")} ${Q.length}</span>
      <h2>${esc(L(qen, qru))}</h2>
      <div class="pick-opts">${opts.map((o, i) => `<button type="button" class="${answers[step] === i ? "sel" : ""}" data-i="${i}">${esc(L(o[0], o[1]))}</button>`).join("")}</div>
      <div class="btn-row">
        ${step > 0 ? `<button type="button" class="btn ghost" data-back>← ${L("Back", "Назад")}</button>` : ""}
        <button type="button" class="btn" data-next ${answers[step] < 0 ? "disabled" : ""}>${step === Q.length - 1 ? L("See my language", "Узнать результат") : L("Next", "Дальше")} →</button>
      </div>`;
    box.querySelectorAll(".pick-opts button").forEach(b => b.addEventListener("click", () => {
      answers[step] = +b.dataset.i; renderQuestion();
    }));
    const back = box.querySelector("[data-back]");
    if (back) back.addEventListener("click", () => { step--; renderQuestion(); });
    box.querySelector("[data-next]").addEventListener("click", () => {
      if (answers[step] < 0) return;
      if (step < Q.length - 1) { step++; renderQuestion(); } else renderResult();
    });
  }

  function renderResult() {
    const score = {};
    ORDER.forEach(k => { score[k] = 0; });
    answers.forEach((a, i) => { const pts = Q[i][2][a][2]; for (const k in pts) score[k] += pts[k]; });
    const ranked = ORDER.slice().sort((a, b) => score[b] - score[a] || ORDER.indexOf(a) - ORDER.indexOf(b));
    const top = ranked[0], also = ranked.slice(1, 3).filter(k => score[k] > 0);
    const [wen, wru, ten, tru] = WHY[top];
    box.innerHTML = `
      <span class="pick-count">${L("Your result", "Твой результат")}</span>
      <div class="pick-res">
        <span class="pick-muted">${L("This language suits you", "Тебе подойдёт")}</span>
        <div class="pick-big">${NAME[top]}</div>
        <p class="pick-muted">${esc(L(wen, wru))}</p>
        <div class="pick-tags">${(ru ? tru : ten).map(t => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="btn-row">
          <a class="btn" href="${FILE[top]}">${L("Start", "Начать уроки")} ${NAME[top]}${L(" lessons", "")} →</a>
          <button type="button" class="btn ghost" data-again>${L("Take it again", "Пройти заново")}</button>
        </div>
      </div>
      ${also.length ? `<p class="pick-also">${L("Also good for you", "Ещё подойдут")}: ${also.map(k => `<a href="${FILE[k]}">${NAME[k]}</a>`).join(", ")}</p>` : ""}`;
    box.querySelector("[data-again]").addEventListener("click", () => { step = 0; answers.fill(-1); renderQuestion(); });
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderQuestion();
})();
