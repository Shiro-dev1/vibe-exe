// Кнопки RUN / RESET в уроках JavaScript.
// Код запускается в изолированном окошке (iframe с sandbox), поэтому не может сломать сам сайт.
(() => {
  const ru = document.documentElement.lang === "ru";
  const T = ru
    ? { run: "▶ Запустить", reset: "Сбросить", empty: "(ничего не выведено)", running: "..." }
    : { run: "▶ Run", reset: "Reset", empty: "(no output)", running: "..." };

  // Подгоняем высоту поля под количество строк
  const fit = ta => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + 4 + "px"; };

  document.querySelectorAll(".runbox").forEach(box => {
    const ta = box.querySelector("textarea");
    const out = box.nextElementSibling;          // блок OUTPUT сразу после
    const pre = out.querySelector("pre");
    const original = { code: ta.value, out: pre.textContent };
    const runBtn = box.querySelector(".run"), resetBtn = box.querySelector(".reset");
    runBtn.textContent = T.run; resetBtn.textContent = T.reset;
    fit(ta);
    ta.addEventListener("input", () => fit(ta));
    // Tab вставляет отступ, а не уходит с поля
    ta.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText("  ", s, ta.selectionEnd, "end");
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });

    let frame = null;
    function clear() { if (frame) { frame.remove(); frame = null; } }

    function run() {
      clear();
      const code = ta.value;
      const html = code.trim().startsWith("<");     // мини-проект со страницей и кнопкой
      const id = "r" + Math.random().toString(36).slice(2);
      const lines = [];
      pre.textContent = T.running;
      out.classList.add("live");

      const hook = "<script>(function(){" +
        "var id=" + JSON.stringify(id) + ";" +
        "function send(t,x){parent.postMessage({vibe:id,t:t,x:x},'*');}" +
        "function fmt(a){return Array.prototype.map.call(a,function(v){" +
        "if(typeof v==='string')return v;" +
        "if(v&&typeof v==='object'){try{return JSON.stringify(v);}catch(e){return String(v);}}" +
        "return String(v);}).join(' ');}" +
        "console.log=console.info=console.warn=function(){send('log',fmt(arguments));};" +
        "console.error=function(){send('err',fmt(arguments));};" +
        "window.onerror=function(m){send('err',String(m).replace(/^Uncaught /,''));};" +
        "})();<\/script>";
      const style = "<style>body{background:#0a0a0a;color:#f4f4f2;font:16px system-ui,sans-serif;margin:12px}" +
        "button{font:600 15px system-ui,sans-serif;padding:10px 18px;background:#f4f4f2;color:#0a0a0a;border:0;border-radius:8px;cursor:pointer}<\/style>";
      const body = html ? code : "<script>" + code.replace(/<\/script/gi, "<\\/script") + "<\/script>";
      const end = "<script>parent.postMessage({vibe:" + JSON.stringify(id) + ",t:'done'},'*');<\/script>";

      frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("title", "Result");
      frame.className = html ? "run-frame" : "run-frame hidden";
      frame.srcdoc = style + hook + body + end;

      function show() {
        pre.textContent = lines.length ? lines.join("\n") : (html ? "" : T.empty);
        pre.hidden = html && !lines.length;
      }
      function onMsg(e) {
        if (!frame || e.source !== frame.contentWindow || !e.data || e.data.vibe !== id) return;
        if (e.data.t === "log") lines.push(e.data.x);
        else if (e.data.t === "err") lines.push("Error: " + e.data.x);
        show();
        if (e.data.t === "done" && !html) { removeEventListener("message", onMsg); setTimeout(clear, 50); }
      }
      addEventListener("message", onMsg);
      if (html) out.appendChild(frame); else document.body.appendChild(frame);
    }

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", () => {
      clear();
      ta.value = original.code; fit(ta);
      pre.textContent = original.out; pre.hidden = false;
      out.classList.remove("live");
    });
  });
})();
