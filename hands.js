// Сцена «руки» для главной: две руки, нарисованные символами (как глаз), тянутся друг к другу.
// Движение: рука плавно тянется, слегка поворачиваясь в запястье, перед касанием замирает и дрожит,
// при касании — искры из символов и «глюк» строк, потом руки отходят. Рядом с курсором символы расступаются.
// Карта яркости рук — в hands-data.js. Переключает сцены hero.js.
(() => {
  const RAMP = " .',:;clodxkO0KXNWM";
  const SHADES = ["#565654", "#a3a3a0", "#f4f4f2"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.getElementById("eye");
  const D = window.VIBE_HANDS;
  if (!cv || !D) return;
  const ctx = cv.getContext("2d");

  // ---------- Карта яркости (4 бита на точку) ----------
  const MW = D.w, MH = D.h;
  const raw = Uint8Array.from(atob(D.data), c => c.charCodeAt(0));
  const map = new Float32Array(MW * MH);
  for (let i = 0; i < raw.length; i++) { map[i * 2] = (raw[i] >> 4) / 15; map[i * 2 + 1] = (raw[i] & 15) / 15; }
  const SPLIT = D.split, TIP_L = D.tipL, TIP_R = D.tipR;    // граница рук и кончики пальцев
  const PIV_L = [-20, TIP_L[1] - 10], PIV_R = [MW + 20, TIP_R[1] - 6]; // «запястья» — точки поворота
  const GAP = TIP_R[0] - TIP_L[0];                           // расстояние между пальцами на картинке

  function sample(u, v, left) {
    // яркость карты в точке (u, v) с плавным смешиванием соседей
    if (u < 0 || v < 0 || u >= MW - 1 || v >= MH - 1) return 0;
    if (left ? u > SPLIT : u < SPLIT) return 0;
    const x = u | 0, y = v | 0, fx = u - x, fy = v - y, i = y * MW + x;
    const a = map[i] + (map[i + 1] - map[i]) * fx, b = map[i + MW] + (map[i + MW + 1] - map[i + MW]) * fx;
    // у краёв картинки руки плавно растворяются, без ровного среза
    const e = Math.min(1, (left ? u : MW - u) / 40);
    return (a + (b - a) * fy) * e * e;
  }

  // ---------- Размеры ----------
  let BW = 0, BH = 0, dpr = 1, s = 1, ox = 0, oy = 0, cw = 6, ch = 10, font = "";
  const midX = (TIP_L[0] + TIP_R[0]) / 2, midY = (TIP_L[1] + TIP_R[1]) / 2;
  function layout() {
    BW = cv.clientWidth; BH = cv.clientHeight;
    dpr = cv.width / Math.max(1, BW);
    // на широком экране руки целиком, на узком — крупнее, видно пальцы
    s = Math.max(BW / (MW * 1.02), Math.min(BH * 0.95 / MH, BW / 150));
    s = Math.min(s, BH * 1.2 / MH);
    ox = BW / 2 - midX * s; oy = BH / 2 - midY * s;
    const size = Math.max(7, Math.min(13, s * 2.6));
    font = size + "px 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
    ctx.font = font; cw = ctx.measureText("M").width; ch = Math.round(size * 1.08);
  }

  // ---------- Курсор ----------
  let mx = -1e4, my = -1e4;
  function pointer(e) { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }
  addEventListener("pointermove", pointer);
  addEventListener("pointerdown", pointer);
  document.addEventListener("pointerout", e => { if (!e.relatedTarget) mx = my = -1e4; });

  // ---------- Движение ----------
  const T = 8200;                                   // один цикл: тянутся → замирают → касание → отходят
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function pose(t, side) {
    // reach: 0 — руки на месте с картинки, 1 — пальцы касаются
    const p = (t % T) / T;
    let reach;
    if (p < 0.42) reach = ease(p / 0.42) * 0.86;                            // плавно тянутся
    else if (p < 0.6) reach = 0.86 + (p - 0.42) / 0.18 * 0.14;               // замирают и медленно сближаются
    else if (p < 0.68) reach = 1;                                            // касание
    else reach = 1 - ease((p - 0.68) / 0.32);                                // отходят
    const tremor = p > 0.42 && p < 0.68 ? Math.sin(t / 37 + side * 2) * 0.35 + Math.sin(t / 23) * 0.2 : 0;
    const breath = Math.sin(t / 1400 + side * 1.3) * 1.2;
    const dir = side ? -1 : 1;
    return {
      dx: dir * (reach * GAP / 2 - 1) + tremor * 0.4,
      dy: breath + (side ? -1 : 1) * reach * (TIP_L[1] - TIP_R[1]) / 2 * -1 + tremor * 0.3,
      ang: dir * (reach * 0.03 - 0.008 + Math.sin(t / 1900 + side) * 0.005),  // небольшой поворот в запястье, радианы
      reach,
    };
  }

  let t0 = performance.now(), active = false, touched = false, glitch = 0, flash = 0;
  const sparks = [];
  function start() { t0 = performance.now(); active = true; touched = false; glitch = 0; flash = 0; sparks.length = 0; }

  function hash(x, y, k) {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function draw(now) {
    const t = now - t0;
    const intro = reduce ? 1 : Math.min(1, t / 1400);           // руки проявляются при появлении
    const L = pose(t, 0), R = pose(t, 1);
    if (L.reach > 0.99 && !touched && !reduce) {                 // касание: искры, вспышка, глюк
      touched = true; glitch = 10; flash = 1;
      const gx = ox + midX * s, gy = oy + midY * s;
      for (let j = 0; j < 40; j++) {
        const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 5;
        sparks.push({ x: gx, y: gy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 1, c: "*+x.:'"[j % 6] });
      }
    }
    if (L.reach < 0.5) touched = false;

    const cosL = Math.cos(-L.ang), sinL = Math.sin(-L.ang), cosR = Math.cos(-R.ang), sinR = Math.sin(-R.ang);
    const tick = reduce ? 0 : Math.floor(t / 110);
    const cols = Math.ceil(BW / cw), rows = Math.ceil(BH / ch);
    const lines = [new Array(cols), new Array(cols), new Array(cols)];
    const RAD = Math.max(50, s * 18), RAD2 = RAD * RAD;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BW, BH);
    ctx.font = font; ctx.textBaseline = "middle";

    // строки выше и ниже рук не считаем
    const r0 = Math.max(0, Math.floor((oy - 14 * s) / ch)), r1 = Math.min(rows - 1, Math.ceil((oy + (MH + 14) * s) / ch));
    for (let r = r0; r <= r1; r++) {
      lines[0].fill(" "); lines[1].fill(" "); lines[2].fill(" ");
      let any = false;
      const py = (r + 0.5) * ch;
      // глюк: некоторые строки сдвигаются
      const shift = glitch > 0 && hash(r, 7, glitch) < 0.18 ? ((hash(r, 3, glitch) - 0.5) * 16) | 0 : 0;
      for (let c = 0; c < cols; c++) {
        const px = (c + 0.5) * cw;
        const u = (px - ox) / s, v = (py - oy) / s;
        // левая рука: обратный поворот вокруг запястья и сдвиг
        let x = u - L.dx - PIV_L[0], y = v - L.dy - PIV_L[1];
        const bl = sample(PIV_L[0] + x * cosL - y * sinL, PIV_L[1] + x * sinL + y * cosL, true);
        x = u - R.dx - PIV_R[0]; y = v - R.dy - PIV_R[1];
        const br = sample(PIV_R[0] + x * cosR - y * sinR, PIV_R[1] + x * sinR + y * cosR, false);
        let b = Math.max(bl, br);
        if (b < 0.04) continue;
        const n = hash(c, r, tick);
        b = b * intro * (0.88 + n * 0.24);
        // курсор: символы вокруг расступаются и перемешиваются
        const ddx = px - mx, ddy = py - my, q = ddx * ddx + ddy * ddy;
        let scramble = false;
        if (q < RAD2) {
          const k = Math.sqrt(q) / RAD;
          b *= k * k * (3 - 2 * k);
          scramble = k > 0.45 && n < 0.5;
        }
        if (b < 0.05) continue;
        if (b > 1) b = 1;
        const i = scramble ? 1 + ((n * 97) | 0) % (RAMP.length - 1)
                           : Math.min(RAMP.length - 1, 1 + Math.floor(b * (RAMP.length - 1.001)));
        const cc = Math.min(cols - 1, Math.max(0, c + shift));
        lines[b < 0.3 ? 0 : b < 0.62 ? 1 : 2][cc] = RAMP[i]; any = true;
      }
      if (!any) continue;
      // выводим только куски строки, где есть символы (пустые промежутки пропускаем — так в разы быстрее)
      for (let l = 0; l < 3; l++) {
        const line = lines[l];
        ctx.fillStyle = SHADES[l];
        let c = 0;
        while (c < cols) {
          while (c < cols && line[c] === " ") c++;
          if (c >= cols) break;
          let end = c, gap = 0;
          for (let k = c; k < cols && gap < 6; k++) { if (line[k] === " ") gap++; else { gap = 0; end = k; } }
          ctx.fillText(line.slice(c, end + 1).join(""), c * cw, py);
          c = end + 1;
        }
      }
    }
    if (glitch > 0) glitch--;

    // искры из символов
    ctx.fillStyle = SHADES[2];
    for (let j = sparks.length - 1; j >= 0; j--) {
      const p = sparks[j];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life -= 0.022;
      if (p.life <= 0) { sparks.splice(j, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.4);
      ctx.fillText(p.c, p.x, p.y);
    }
    // кольцо из точек в месте касания
    if (flash > 0.03) {
      const rr = (1 - flash) * s * 26, gx = ox + midX * s, gy = oy + midY * s;
      ctx.globalAlpha = flash;
      for (let a = 0; a < 28; a++) ctx.fillText("·", gx + Math.cos(a / 28 * Math.PI * 2) * rr, gy + Math.sin(a / 28 * Math.PI * 2) * rr * 0.7);
      flash *= 0.9;
    }
    ctx.globalAlpha = 1;
  }

  window.VibeScenes = window.VibeScenes || {};
  window.VibeScenes.hands = { layout, draw, start, stop() { active = false; } };
})();
