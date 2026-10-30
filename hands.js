// Сцена «руки» для главной: две руки из точек собираются, тянутся друг к другу,
// при касании пальцев — искры и «глюк», точки разбегаются от курсора.
// Картинка рук — в hands-data.js (736×268 точек, 1 бит на точку). Переключает сцены hero.js.
(() => {
  const W = 736, H = 268;
  const GAP_X = 378, GAP_Y = 134;   // место между пальцами
  const SPLIT_X = 378;              // левее — левая рука, правее — правая
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(pointer: coarse)").matches;
  const cv = document.getElementById("eye");
  if (!cv || !window.VIBE_HANDS) return;
  const ctx = cv.getContext("2d");

  // ---------- Разбираем картинку на точки ----------
  const bytes = Uint8Array.from(atob(window.VIBE_HANDS), c => c.charCodeAt(0));
  let n = 0;
  for (const b of bytes) for (let k = 0; k < 8; k++) n += (b >> k) & 1;
  const hx = new Int16Array(n), hy = new Int16Array(n), side = new Uint8Array(n);
  const sx = new Float32Array(n), sy = new Float32Array(n), delay = new Float32Array(n);
  const dx = new Float32Array(n), dy = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n);
  for (let p = 0, i = 0; p < W * H; p++) {
    if (bytes[p >> 3] & (128 >> (p & 7))) {
      hx[i] = p % W; hy[i] = (p / W) | 0; side[i] = hx[i] < SPLIT_X ? 0 : 1; i++;
    }
  }

  // Сетка для быстрого поиска точек рядом с курсором (ячейки 16×16)
  const CELL = 16, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
  const cellStart = new Uint32Array(GW * GH + 1), cellItems = new Uint32Array(n);
  {
    const cnt = new Uint32Array(GW * GH);
    for (let j = 0; j < n; j++) cnt[((hy[j] / CELL) | 0) * GW + ((hx[j] / CELL) | 0)]++;
    for (let c = 0; c < GW * GH; c++) cellStart[c + 1] = cellStart[c] + cnt[c];
    const fill = cellStart.slice(0, GW * GH);
    for (let j = 0; j < n; j++) cellItems[fill[((hy[j] / CELL) | 0) * GW + ((hx[j] / CELL) | 0)]++] = j;
  }
  const awake = new Uint32Array(n), isAwake = new Uint8Array(n);
  let awakeN = 0;

  // Маленький холст в «родном» размере, потом растягиваем без сглаживания
  const buf = document.createElement("canvas");
  buf.width = W; buf.height = H;
  const bctx = buf.getContext("2d");
  const img = bctx.createImageData(W, H);
  const pix = new Uint32Array(img.data.buffer);
  const LIGHT = 0xfff2f4f4, GREY = 0xff545656;   // #f4f4f2 и #565654 (байты идут как ABGR)

  let BW = 0, BH = 0, dpr = 1, s = 1, ox = 0, oy = 0;
  function layout() {
    BW = cv.clientWidth; BH = cv.clientHeight;
    dpr = cv.width / Math.max(1, BW);
    // На широком экране руки целиком, на узком — крупнее, видно пальцы
    s = Math.max(BW / (W * 1.02), Math.min(BH * 0.92 / H, BW / 220));
    s = Math.min(s, BH * 1.1 / H);
    ox = BW / 2 - GAP_X * s; oy = BH / 2 - GAP_Y * s;
  }

  // ---------- Курсор / палец в координатах картинки ----------
  let mx = -999, my = -999, near = false, active = false;
  function pointer(e) {
    const r = cv.getBoundingClientRect();
    mx = (e.clientX - r.left - ox) / s; my = (e.clientY - r.top - oy) / s;
    near = true;
  }
  addEventListener("pointermove", pointer);
  addEventListener("pointerdown", pointer);
  document.addEventListener("pointerout", e => { if (!e.relatedTarget) near = false; });
  addEventListener("pointerup", e => { if (e.pointerType === "touch") near = false; });

  // ---------- Анимация ----------
  let glitch = 0, flash = 0, sparked = false;
  const sparks = [];
  const T = 7000;                 // один «вдох» рук, мс
  const INTRO = 1900, INTRO_END = INTRO + 700;
  const RAD = touch ? 34 : 26, RAD2 = RAD * RAD;
  let t0 = performance.now();

  function start() {
    // Точки снова разлетаются и собираются в руки
    for (let j = 0; j < n; j++) {
      // облако вокруг рук, без ровных краёв
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6);
      sx[j] = hx[j] + Math.cos(a) * r * 260; sy[j] = hy[j] + Math.sin(a) * r * 150; delay[j] = Math.random() * 700;
      dx[j] = dy[j] = vx[j] = vy[j] = 0; isAwake[j] = 0;
    }
    awakeN = 0; sparks.length = 0; sparked = false; glitch = 0; flash = 0;
    t0 = performance.now(); active = true;
  }

  function draw(now) {
    const t = now - t0;
    const d = reduce ? 0.3 : (1 - Math.cos((t / T) * Math.PI * 2)) / 2;   // 0 — разошлись, 1 — почти касаются
    const reach = d * 6.2, float = Math.sin(t / 1300) * 1.6;
    const offX0 = reach, offY0 = float, offX1 = -reach, offY1 = -float;

    if (!reduce) {
      if (d > 0.985 && !sparked) {                       // касание: искры, вспышка, глюк
        sparked = true; glitch = 12; flash = 1;
        for (let j = 0; j < 46; j++) {
          const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 2.6;
          sparks.push({ x: GAP_X, y: GAP_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
        }
      }
      if (d < 0.5) sparked = false;
    }

    pix.fill(0);
    for (let j = 0; j < 50; j++) pix[((Math.random() * H) | 0) * W + ((Math.random() * W) | 0)] = GREY;   // лёгкий шум

    if (!reduce && t < INTRO_END) {
      // Сборка: у каждой точки готовый путь, без физики
      for (let j = 0; j < n; j++) {
        let q = (t - delay[j]) / INTRO;
        q = q <= 0 ? 0 : q >= 1 ? 1 : 1 - (1 - q) * (1 - q) * (1 - q);
        const tx = hx[j] + (side[j] ? offX1 : offX0), ty = hy[j] + (side[j] ? offY1 : offY0);
        const x = (sx[j] + (tx - sx[j]) * q) | 0, y = (sy[j] + (ty - sy[j]) * q) | 0;
        if (x >= 0 && x < W && y >= 0 && y < H) pix[y * W + x] = LIGHT;
      }
    } else {
      // Точки рядом с курсором «просыпаются» и разбегаются
      if (near && active) {
        const c0 = Math.max(0, ((mx - RAD - 8) / CELL) | 0), c1 = Math.min(GW - 1, ((mx + RAD + 8) / CELL) | 0);
        const r0 = Math.max(0, ((my - RAD - 4) / CELL) | 0), r1 = Math.min(GH - 1, ((my + RAD + 4) / CELL) | 0);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          const cell = r * GW + c;
          for (let k = cellStart[cell]; k < cellStart[cell + 1]; k++) {
            const j = cellItems[k];
            const px = hx[j] + (side[j] ? offX1 : offX0) + dx[j] - mx;
            const py = hy[j] + (side[j] ? offY1 : offY0) + dy[j] - my;
            const q = px * px + py * py;
            if (q < RAD2 && q > 0.01) {
              const dist = Math.sqrt(q), f = (1 - dist / RAD) * 2.4;
              vx[j] += px / dist * f; vy[j] += py / dist * f;
              if (!isAwake[j]) { isAwake[j] = 1; awake[awakeN++] = j; }
            }
          }
        }
      }
      // Двигаем только проснувшиеся точки: пружина обратно к своему месту
      for (let k = awakeN - 1; k >= 0; k--) {
        const j = awake[k];
        vx[j] = (vx[j] - dx[j] * 0.06) * 0.86; vy[j] = (vy[j] - dy[j] * 0.06) * 0.86;
        dx[j] += vx[j]; dy[j] += vy[j];
        if (Math.abs(dx[j]) < 0.2 && Math.abs(dy[j]) < 0.2 && Math.abs(vx[j]) < 0.05 && Math.abs(vy[j]) < 0.05) {
          dx[j] = dy[j] = vx[j] = vy[j] = 0; isAwake[j] = 0; awake[k] = awake[--awakeN];
        }
      }
      for (let j = 0; j < n; j++) {
        const sd = side[j];
        const x = (hx[j] + (sd ? offX1 : offX0) + dx[j]) | 0, y = (hy[j] + (sd ? offY1 : offY0) + dy[j]) | 0;
        if (x >= 0 && x < W && y >= 0 && y < H) pix[y * W + x] = LIGHT;
      }
    }

    for (let j = sparks.length - 1; j >= 0; j--) {          // искры
      const p = sparks[j];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life -= 0.018;
      if (p.life <= 0) { sparks.splice(j, 1); continue; }
      const x = p.x | 0, y = p.y | 0;
      if (x >= 0 && x < W && y >= 0 && y < H) pix[y * W + x] = p.life > 0.4 ? LIGHT : GREY;
    }
    if (flash > 0.02) {                                       // кольцо в точке касания
      const r = (1 - flash) * 22;
      for (let a = 0; a < 64; a++) {
        const x = (GAP_X + Math.cos(a / 64 * Math.PI * 2) * r) | 0, y = (GAP_Y + Math.sin(a / 64 * Math.PI * 2) * r) | 0;
        if (x >= 0 && x < W && y >= 0 && y < H) pix[y * W + x] = LIGHT;
      }
    }
    bctx.putImageData(img, 0, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BW, BH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, ox, oy, W * s, H * s);
    if (glitch > 0) {                                         // помехи: сдвигаем полоски
      for (let j = 0; j < 5; j++) {
        const gy = Math.random() * H, gh = 2 + Math.random() * 14, shift = (Math.random() - 0.5) * 40;
        ctx.clearRect(0, oy + gy * s, BW, gh * s);
        ctx.drawImage(buf, 0, gy, W, gh, ox + shift * s, oy + gy * s, W * s, gh * s);
      }
      glitch--;
    }
    if (flash > 0) {
      ctx.fillStyle = "rgba(244,244,242," + (flash * 0.08) + ")";
      ctx.fillRect(0, 0, BW, BH);
      flash *= 0.9;
    }
  }

  window.VibeScenes = window.VibeScenes || {};
  window.VibeScenes.hands = { layout, draw, start, stop() { active = false; } };
})();
