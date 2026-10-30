// Главный экран: сцены сменяют друг друга по кругу — глаз, потом руки, потом снова глаз.
// Между сценами — короткий цифровой «глюк». Сами сцены — в eye.js и hands.js.
(() => {
  const S = window.VibeScenes || {};
  const cv = document.getElementById("eye");
  if (!cv || !S.eye) return;
  window.VibeHeroRunning = true;
  const box = cv.parentElement;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LABELS = JSON.parse(cv.dataset.labels || "{}");

  // Порядок и длительность сцен (мс). Руки: сборка + два «касания».
  const PLAN = [["eye", 14000], ["hands", 15500]].filter(([k]) => S[k]);
  const FADE = 520;               // длительность перехода
  let idx = 0, sceneStart = 0, current = PLAN[0][0], switched = false;

  function layout() {
    S.eye.layout();               // глаз задаёт размер холста
    if (S.hands) S.hands.layout();
  }

  function show(k) {
    if (S[current] && S[current].stop) S[current].stop();
    current = k;
    S[k].start();
    if (LABELS[k]) cv.setAttribute("aria-label", LABELS[k]);
  }

  // Рисуем только когда главный экран виден на экране
  const onScreen = () => { const r = cv.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!onScreen()) { sceneStart += now - (last || now); last = now; return; }   // пока не видно — время сцены стоит
    // глаз рисуется ~30 кадров/с, руки — каждый кадр (у них физика по кадрам)
    if (current === "eye" && now - last < 30) return;
    last = now;

    const elapsed = now - sceneStart, len = PLAN[idx][1];
    if (!reduce && PLAN.length > 1 && elapsed > len) {          // пора менять сцену
      idx = (idx + 1) % PLAN.length; sceneStart = now; switched = true;
      show(PLAN[idx][0]);
    }
    try { S[current].draw(now); } catch (err) { console.error(err); }

    // Переход: в конце сцены картинка гаснет и «рвётся» полосками, в начале — проявляется
    const e = now - sceneStart;
    const out = PLAN.length > 1 && !reduce ? Math.max(0, 1 - (len - e) / FADE) : 0;
    const inn = switched ? Math.max(0, 1 - e / (FADE * 0.6)) : 0;
    const k = Math.max(out, inn);
    if (k > 0) glitch(k);
  }

  // Глюк перехода: сдвигаем горизонтальные полосы и гасим картинку
  function glitch(k) {
    const W = cv.width, H = cv.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let j = 0; j < 3 + k * 9; j++) {
      const y = Math.random() * H, h = 2 + Math.random() * H * 0.06, sh = (Math.random() - 0.5) * W * 0.12 * k;
      ctx.drawImage(cv, 0, y, W, h, sh, y, W, h);
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0," + Math.min(1, k * 1.05) + ")";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  addEventListener("resize", layout);
  // если размер блока поменялся (например, стили догрузились позже) — пересчитываем холст
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(box);
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);   // ширина букв глаза после загрузки шрифта
  sceneStart = performance.now();
  show(current);
  requestAnimationFrame(frame);
})();
