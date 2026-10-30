// Окошко VIBE.EXE с командной строкой — одно на все страницы.
// Использование: VibeTerm.create({ intro: [...], place: (win, size) => {...} })
window.VibeTerm = (() => {
  const RU = document.documentElement.lang === "ru";

  // ---------- Язык сайта: английский в корне, русский в папке ru/ ----------
  function langUrl(target) {
    const path = location.pathname;
    const cut = path.lastIndexOf("/") + 1;
    const file = path.slice(cut) || "index.html";
    let dir = path.slice(0, cut);
    if (RU) dir = dir.replace(/ru\/$/, "");
    return dir + (target === "ru" ? "ru/" : "") + file + location.hash;
  }
  // Если посетитель раньше выбрал другой язык — сразу открываем его версию
  try {
    const want = localStorage.getItem("vibe-lang");
    if ((want === "ru" && !RU) || (want === "en" && RU)) location.replace(langUrl(want));
  } catch (e) {}

  // Все тексты терминала на двух языках
  const T = RU ? {
    p1: "главная — руки", p2: "языки.doc", p3: "linux.man",
    hint: "введи help и нажми Enter",
    help: [
      "команды:",
      "  help      этот список",
      "  ls        все страницы",
      "  page 1    главная — руки",
      "  page 2    языки программирования",
      "  page 3    linux и терминал",
      "  progress  твой прогресс в уроках",
      "  lang en   english version",
      "  clear     очистить экран",
      "уроки:",
      "  python  js  html  css",
      "  c  c++  c#  rust",
      "  back      назад к языкам",
    ],
    here: "  <- ты здесь", already: "ты уже здесь",
    onLangs: "ты на странице языков. page 1 — на главную",
    notFound: n => "страница " + n + " не найдена. введи ls",
    unknown: c => "неизвестная команда: " + c + ". введи help",
    loading: n => "загрузка: " + n + " ...",
    lessons: c => "уроки " + c, ready: "готово",
    progressTitle: "твой прогресс:",
    langNow: "сейчас: русский. lang en — english",
    langSame: "уже русский",
    langSwitch: "переключаю на english ...",
  } : {
    p1: "home — the hands", p2: "languages.doc", p3: "linux.man",
    hint: "type help and press Enter",
    help: [
      "commands:",
      "  help      show this list",
      "  ls        list all pages",
      "  page 1    home — the hands",
      "  page 2    languages.doc",
      "  page 3    linux.man",
      "  progress  your lesson progress",
      "  lang ru   русская версия",
      "  clear     clear the screen",
      "lessons:",
      "  python  js  html  css",
      "  c  c++  c#  rust",
      "  back      return to languages",
    ],
    here: "  <- you are here", already: "you are already here",
    onLangs: "you are on the languages page. type page 1 for home",
    notFound: n => "page " + n + " not found. type ls",
    unknown: c => "unknown command: " + c + ". type help",
    loading: n => "loading " + n + " ...",
    lessons: c => c + " lessons", ready: "ready",
    progressTitle: "your progress:",
    langNow: "now: english. lang ru — русский",
    langSame: "already english",
    langSwitch: "switching to русский ...",
  };

  const PAGES = {
    1: { file: "index.html", name: T.p1 },
    2: { file: "page2.html", name: T.p2 },
    3: { file: "page3.html", name: T.p3 },
  };
  // Уроки по языкам: команда -> страница
  const LANGS = {
    python: "python.html",
    js: "javascript.html", javascript: "javascript.html",
    html: "html.html",
    css: "css.html",
    c: "c.html",
    cpp: "cpp.html", "c++": "cpp.html",
    csharp: "csharp.html", "c#": "csharp.html", cs: "csharp.html",
    rust: "rust.html",
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(pointer: coarse)").matches;

  function create(opts) {
    const current = opts.page;
    const win = document.createElement("div");
    win.className = "win" + (opts.solid ? " solid" : "");
    win.innerHTML = `
      <div class="bar">
        <span>VIBE.EXE</span>
        <div class="btns">
          <button class="b-min" aria-label="Minimize">_</button>
          <button class="b-close" aria-label="Close">x</button>
        </div>
      </div>
      <div class="term">
        <div class="log"></div>
        <label class="prompt"><span>&gt;</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Command"></label>
      </div>`;
    document.body.appendChild(win);

    const reopen = document.createElement("button");
    reopen.className = "reopen";
    reopen.textContent = "[ RUN VIBE.EXE ]";
    document.body.appendChild(reopen);

    const bar = win.querySelector(".bar");
    const term = win.querySelector(".term");
    const log = win.querySelector(".log");
    const prompt = win.querySelector(".prompt");
    const input = win.querySelector("input");
    let moved = false;

    // ---------- Вывод текста ----------
    function print(text, dim) {
      const s = document.createElement("span");
      s.className = "txt" + (dim ? " dim" : "");
      s.textContent = text + "\n";
      log.appendChild(s);
      term.scrollTop = term.scrollHeight;
      return s;
    }

    let typing = 0;
    async function intro() {
      const id = ++typing;
      log.innerHTML = "";
      prompt.classList.add("on");
      input.disabled = false;
      const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
      for (const line of opts.intro) {
        const s = print("");
        for (const ch of line) {
          if (id !== typing) return;
          s.textContent = s.textContent.slice(0, -1) + ch + "\n";
          await wait(30 + Math.random() * 35);
        }
        await wait(300);
      }
      if (id !== typing) return;
      print(T.hint, true);
    }

    // ---------- Команды ----------
    const history = [];
    let hi = 0;
    function run(raw) {
      const cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
      print("> " + raw);
      if (!cmd) return;
      history.push(raw); hi = history.length;

      if (cmd === "help") { T.help.forEach(l => print(l)); return; }
      if (cmd === "ls") {
        for (const n in PAGES) print("  page " + n + "  " + PAGES[n].name + (+n === current ? T.here : ""));
        return;
      }
      if (cmd === "progress") {
        print(T.progressTitle);
        if (window.VibeProgress) VibeProgress.report().forEach(l => print(l));
        return;
      }
      if (cmd === "lang") { print(T.langNow, true); return; }
      const lm = cmd.match(/^lang (ru|en)$/);
      if (lm) {
        try { localStorage.setItem("vibe-lang", lm[1]); } catch (e) {}
        if ((lm[1] === "ru") === RU) { print(T.langSame, true); return; }
        print(T.langSwitch, true);
        input.disabled = true;
        setTimeout(() => { location.href = langUrl(lm[1]); }, reduce ? 0 : 450);
        setTimeout(unlock, 4000);
        return;
      }
      if (cmd === "clear") { log.innerHTML = ""; return; }

      if (cmd === "back") {
        if (current === 2) { print(T.onLangs, true); return; }
        go("page2.html", T.p2);
        return;
      }
      if (LANGS[cmd]) {
        if (location.pathname.endsWith("/" + LANGS[cmd])) { print(T.already, true); return; }
        go(LANGS[cmd], T.lessons(cmd));
        return;
      }

      const m = cmd.match(/^page ?(\d+)$/);
      if (m) {
        const n = +m[1];
        if (!PAGES[n]) { print(T.notFound(n), true); return; }
        if (n === current) { print(T.already, true); return; }
        go(PAGES[n].file, PAGES[n].name);
        return;
      }
      print(T.unknown(cmd), true);
    }

    function go(file, name) {
      print(T.loading(name), true);
      input.disabled = true;
      setTimeout(() => { location.href = file; }, reduce ? 0 : 450);
      setTimeout(unlock, 4000);
    }

    function unlock() {
      input.disabled = false;
      input.value = "";
    }
    // Chrome может вернуть страницу кнопкой «Назад» из памяти — вместе с заблокированным полем
    addEventListener("pageshow", e => {
      if (e.persisted) { unlock(); print(T.ready, true); }
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { run(input.value); input.value = ""; }
      else if (e.key === "ArrowUp" && history.length) {
        hi = Math.max(0, hi - 1); input.value = history[hi]; e.preventDefault();
      } else if (e.key === "ArrowDown" && history.length) {
        hi = Math.min(history.length, hi + 1); input.value = history[hi] || ""; e.preventDefault();
      }
    });
    term.addEventListener("click", () => {
      if (!getSelection().toString()) input.focus({ preventScroll: true });
    });

    // ---------- Перетаскивание ----------
    let dragX = 0, dragY = 0, dragging = false;
    bar.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      dragging = true; moved = true;
      win.classList.add("dragging");
      dragX = e.clientX - win.offsetLeft; dragY = e.clientY - win.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove", e => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(innerWidth - win.offsetWidth, e.clientX - dragX));
      const y = Math.max(0, Math.min(innerHeight - 30, e.clientY - dragY));
      win.style.left = x + "px"; win.style.top = y + "px";
    });
    const stopDrag = () => { dragging = false; win.classList.remove("dragging"); };
    bar.addEventListener("pointerup", stopDrag);
    bar.addEventListener("pointercancel", stopDrag);

    // ---------- Кнопки окна ----------
    win.querySelector(".b-min").addEventListener("click", () => win.classList.toggle("min"));
    win.querySelector(".b-close").addEventListener("click", () => {
      win.classList.remove("show");
      setTimeout(() => { win.style.display = "none"; reopen.style.display = "block"; }, 400);
    });
    reopen.addEventListener("click", () => {
      reopen.style.display = "none";
      win.style.display = "";
      win.classList.remove("min");
      moved = false; place();
      requestAnimationFrame(() => win.classList.add("show"));
      intro();
    });

    function place() { if (!moved) opts.place(win); }
    addEventListener("resize", place);
    place();

    return {
      show() {
        place(); win.classList.add("show"); intro();
        if (!touch) input.focus({ preventScroll: true });
      },
      place,
    };
  }

  return { create };
})();
