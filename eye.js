// Сцена «глаз» для главной: глаз из символов следит за курсором, моргает, оглядывается.
// Рисует и переключает сцены hero.js; здесь только сама сцена.
(() => {
  const RAMP = " .',:;clodxkO0KXNWM";            // от тусклого к яркому
  const SHADES = ["#565654", "#a3a3a0", "#f4f4f2"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cv = document.getElementById("eye");
  if (!cv) return;
  const box = cv.parentElement;
  const ctx = cv.getContext("2d");
  let W, H, dpr, cw, ch, cols, rows, cx, cy, R, font;

  function layout() {
    W = box.clientWidth; H = box.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    R = Math.min(W * 0.46, H * 1.12);              // половина ширины глаза
    cx = W / 2; cy = H / 2;
    const size = Math.max(7, Math.min(14, R / 48));
    font = size + "px 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
    ctx.font = font;
    cw = ctx.measureText("M").width;
    ch = Math.round(size * 1.08);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
  }

  // ---------- Куда смотрит ----------
  let lastMove = -1e9, wanderAt = 0;
  const gaze = { x: 0, y: 0, tx: 0, ty: 0 };
  let pupil = 0.13, pupilT = 0.13;
  function pointer(e) {
    const r = cv.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    lastMove = performance.now();
    const gx = Math.max(-1, Math.min(1, (mx - cx) / (innerWidth * 0.45)));
    const gy = Math.max(-1, Math.min(1, (my - cy) / (innerHeight * 0.45)));
    gaze.tx = gx * 0.42; gaze.ty = gy * 0.13;
    pupilT = 0.075 + 0.075 * Math.min(1, Math.hypot(mx - cx, my - cy) / R / 1.3);
  }
  addEventListener("pointermove", pointer);
  cv.addEventListener("pointerdown", e => {   // клик по глазу — моргает
    if (!active) return;
    pointer(e);
    blinkStart = performance.now() - t0; blinkLen = 170; doubleBlink = false; pupilT = 0.06;
  });

  // ---------- Моргание ----------
  let blinkStart = -1e9, blinkLen = 220, nextBlink = 2500, doubleBlink = false;
  function openness(t) {
    if (reduce) return 1;
    if (t < 1300) return Math.min(1, Math.max(0, (t - 300) / 1000)) ** 0.7;   // открывается при входе
    if (t > nextBlink) {
      blinkStart = t; blinkLen = 200 + Math.random() * 80;
      doubleBlink = Math.random() < 0.2;
      nextBlink = t + 2800 + Math.random() * 3600;
    }
    const p = (t - blinkStart) / blinkLen;
    if (p >= 0 && p < 1) return Math.abs(Math.cos(p * Math.PI)) ** 1.4;
    if (doubleBlink && p >= 1.4 && p < 2.4) return Math.abs(Math.cos((p - 1.4) * Math.PI)) ** 1.4;
    return 1;
  }
  function hash(x, y, k) {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  let t0 = performance.now(), active = false;
  function draw(now) {
    const t = now - t0;

    if (now - lastMove > 3500 && now > wanderAt) {
      wanderAt = now + 1400 + Math.random() * 2200;
      gaze.tx = (Math.random() * 2 - 1) * 0.4; gaze.ty = (Math.random() * 2 - 1) * 0.11;
      pupilT = 0.11 + Math.random() * 0.04;
    }
    const ease = reduce ? 1 : 0.18;
    gaze.x += (gaze.tx - gaze.x) * ease; gaze.y += (gaze.ty - gaze.y) * ease;
    pupil += (pupilT - pupil) * 0.12;
    const open = openness(t);
    const tick = reduce ? 0 : Math.floor(t / 120);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = font; ctx.textBaseline = "middle";

    const TOP = 0.42, BOT = 0.36, RI = 0.30, AURA = 0.15;
    const ix = gaze.x, iy = gaze.y;
    const hx = ix - pupil * 0.38, hy = iy - pupil * 0.38;
    const c0 = Math.max(0, Math.floor((cx - R * 1.12) / cw)), c1 = Math.min(cols - 1, Math.ceil((cx + R * 1.12) / cw));
    const r0 = Math.max(0, Math.floor((cy - R * (TOP + AURA + 0.05)) / ch)), r1 = Math.min(rows - 1, Math.ceil((cy + R * (BOT + AURA + 0.05)) / ch));
    const span = c1 - c0 + 1;
    const lines = [new Array(span), new Array(span), new Array(span)];

    for (let r = r0; r <= r1; r++) {
      lines[0].fill(" "); lines[1].fill(" "); lines[2].fill(" ");
      let any = false;
      const y = ((r + 0.5) * ch - cy) / R;
      for (let c = c0; c <= c1; c++) {
        const x = ((c + 0.5) * cw - cx) / R;
        const n = hash(c, r, tick);
        const k = 1 - x * x;
        const top = k > 0 ? TOP * Math.pow(k, 0.85) * open : 0;
        const bot = k > 0 ? BOT * Math.pow(k, 0.95) * open : 0;
        const dTop = y + top, dBot = bot - y;
        let b = 0;
        if (k > 0 && dTop > 0 && dBot > 0) {
          const dx = x - ix, dy = y - iy, rr = Math.sqrt(dx * dx + dy * dy);
          if (rr < pupil) {
            b = Math.hypot(x - hx, y - hy) < pupil * 0.3 ? 1 : 0.02;       // зрачок с бликом
          } else if (rr < RI) {
            const tt = (rr - pupil) / (RI - pupil);
            const ang = Math.atan2(dy, dx);
            const rays = 0.5 + 0.5 * Math.sin(ang * 13 + Math.sin(ang * 5) * 1.7);
            b = 0.55 + 0.4 * rays * (1 - tt * 0.35);                        // радужка с «лучами»
            if (tt < 0.12) b = 0.95;
            if (tt > 0.86) b *= 0.62;
          } else {
            b = 0.2 + 0.2 * Math.max(0, 1 - (rr - RI) / 0.55);              // белок
          }
          if (dTop < 0.07) b *= 0.55;                                        // тень под веком
          if (Math.min(dTop, dBot) < 0.026) b = 0.42 + 0.3 * n;              // контур века
          b += (n - 0.5) * 0.1;
        } else {
          const out = k > 0 ? Math.max(-dTop, -dBot) : Math.max(Math.sqrt(x * x + y * y * 4) - 1, 0) + 0.03;
          if (out < AURA) {                                                   // точки вокруг
            const f = 1 - out / AURA;
            b = n < 0.55 + 0.35 * f ? 0.06 + 0.2 * f * f : 0;
            if (out < 0.025 && open > 0.08) b = Math.max(b, 0.3 + 0.25 * n);
          }
          if (open < 0.12 && k > 0 && Math.abs(y - 0.01) < 0.03) b = 0.6;    // закрытый глаз
        }
        if (b < 0.05) continue;
        if (b > 1) b = 1;
        const i = Math.min(RAMP.length - 1, 1 + Math.floor(b * (RAMP.length - 1.001)));
        lines[b < 0.3 ? 0 : b < 0.65 ? 1 : 2][c - c0] = RAMP[i]; any = true;
      }
      if (!any) continue;
      for (let l = 0; l < 3; l++) {
        ctx.fillStyle = SHADES[l];
        ctx.fillText(lines[l].join(""), c0 * cw, (r + 0.5) * ch);
      }
    }
  }

  window.VibeScenes = window.VibeScenes || {};
  window.VibeScenes.eye = {
    layout,
    draw,
    start() { t0 = performance.now(); nextBlink = 2500; blinkStart = -1e9; active = true; },  // глаз заново открывается
    stop() { active = false; },
  };
})();
