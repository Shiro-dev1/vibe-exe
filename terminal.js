// Окошко VIBE.EXE с командной строкой — одно на все страницы.
// Использование: VibeTerm.create({ intro: [...], place: (win, size) => {...} })
window.VibeTerm = (() => {
  const PAGES = {
    1: { file: "index.html", name: "home — the hands" },
    2: { file: "page2.html", name: "languages.doc" },
    3: { file: "page3.html", name: "linux.man" },
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
      prompt.classList.remove("on");
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
      print("type help and press Enter", true);
      prompt.classList.add("on");
      if (!touch) input.focus({ preventScroll: true });
    }

    // ---------- Команды ----------
    const history = [];
    let hi = 0;
    function run(raw) {
      const cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
      print("> " + raw);
      if (!cmd) return;
      history.push(raw); hi = history.length;

      if (cmd === "help") {
        print("commands:");
        print("  help      show this list");
        print("  ls        list all pages");
        print("  page 1    " + PAGES[1].name);
        print("  page 2    " + PAGES[2].name);
        print("  page 3    " + PAGES[3].name);
        print("  clear     clear the screen");
        print("lessons:");
        print("  python  js  html  css");
        print("  c  cpp  csharp  rust");
        print("  back      return to languages");
        return;
      }
      if (cmd === "ls") {
        for (const n in PAGES) print("  page " + n + "  " + PAGES[n].name + (+n === current ? "  <- you are here" : ""));
        return;
      }
      if (cmd === "clear") { log.innerHTML = ""; return; }

      if (cmd === "back") {
        if (current === 2) { print("you are on the languages page. type page 1 for home", true); return; }
        go("page2.html", "languages.doc");
        return;
      }
      if (LANGS[cmd]) {
        if (location.pathname.endsWith("/" + LANGS[cmd])) { print("you are already here", true); return; }
        go(LANGS[cmd], cmd + " lessons");
        return;
      }

      const m = cmd.match(/^page ?(\d+)$/);
      if (m) {
        const n = +m[1];
        if (!PAGES[n]) { print("page " + n + " not found. type ls", true); return; }
        if (n === current) { print("you are already here", true); return; }
        go(PAGES[n].file, PAGES[n].name);
        return;
      }
      print("unknown command: " + cmd + ". type help", true);
    }

    function go(file, name) {
      print("loading " + name + " ...", true);
      input.disabled = true;
      setTimeout(() => { location.href = file; }, reduce ? 0 : 450);
    }

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { run(input.value); input.value = ""; }
      else if (e.key === "ArrowUp" && history.length) {
        hi = Math.max(0, hi - 1); input.value = history[hi]; e.preventDefault();
      } else if (e.key === "ArrowDown" && history.length) {
        hi = Math.min(history.length, hi + 1); input.value = history[hi] || ""; e.preventDefault();
      }
    });
    term.addEventListener("click", () => {
      if (prompt.classList.contains("on") && !getSelection().toString()) input.focus({ preventScroll: true });
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
      show() { place(); win.classList.add("show"); intro(); },
      place,
    };
  }

  return { create };
})();
