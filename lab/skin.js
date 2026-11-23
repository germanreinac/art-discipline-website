// Test skin "Draft": your movement is wind. One rule drives every reaction.
// The page reads and works without any of this.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lab = document.querySelector(".lab");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- the wind: smoothed speed of whatever you are doing ---------- */
  const wind = { x: 0, y: 0, px: -9999, py: -9999, has: false };
  let lastX = null, lastY = null, lastScroll = scrollY, awake = false;
  const gust = (x, y) => {
    if (lastX !== null) { wind.x += clamp(x - lastX, -60, 60) * .5; wind.y += clamp(y - lastY, -60, 60) * .5; }
    lastX = x; lastY = y; wind.px = x; wind.py = y; wind.has = true; wake();
  };
  addEventListener("pointermove", (e) => gust(e.clientX, e.clientY), { passive: true });
  addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) gust(t.clientX, t.clientY); }, { passive: true });
  addEventListener("touchend", () => { lastX = lastY = null; }, { passive: true });
  document.addEventListener("pointerleave", () => { lastX = lastY = null; wind.has = false; });
  addEventListener("scroll", () => { const d = scrollY - lastScroll; lastScroll = scrollY; wind.y += clamp(d, -80, 80) * .35; scrollGust = clamp(d, -80, 80); wake(); }, { passive: true });
  let scrollGust = 0;

  /* ---------- the sheet: rows of practice strokes that comb over and settle ---------- */
  const cv = document.createElement("canvas"); cv.id = "field"; cv.setAttribute("aria-hidden", "true"); lab.prepend(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, cols = 0, rows = 0, gap = 26, A, V, dpr = 1;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    gap = W < 700 ? 22 : 28; cols = Math.ceil(W / gap) + 1; rows = Math.ceil(H / gap) + 1;
    A = new Float32Array(cols * rows); V = new Float32Array(cols * rows); draw();
  };
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = "round";
    const len = gap * .34;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = A[r * cols + c], e = Math.min(1, Math.abs(a) * 1.4);
      // the paper is clean at rest: a stroke only shows while the wind has hold of it
      if (e < .03) continue;
      const x = c * gap + gap / 2, y = r * gap + gap / 2, s = Math.sin(a), k = Math.cos(a), l = len * (.8 + e * .7);
      ctx.strokeStyle = `rgba(${60 + 63 * e | 0}, ${55 + 24 * e | 0}, ${70 + 124 * e | 0}, ${e * .42})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - s * l, y + k * l); ctx.lineTo(x + s * l, y - k * l); ctx.stroke();
    }
  };
  const stepField = () => {
    let energy = 0;
    const R = W < 700 ? 90 : 130, R2 = R * R, sp = Math.hypot(wind.x, wind.y);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = c * gap + gap / 2, y = r * gap + gap / 2;
      let f = 0;
      if (wind.has && sp > .3) {
        const d2 = (x - wind.px) ** 2 + (y - wind.py) ** 2;
        if (d2 < R2) { const fall = 1 - d2 / R2; f += (wind.x * .012 + wind.y * .004 * Math.sign(x - wind.px)) * fall * fall; }
      }
      V[i] = (V[i] + f - A[i] * .07) * .88; A[i] = clamp(A[i] + V[i], -1.35, 1.35);
      energy += Math.abs(V[i]) + Math.abs(A[i]) * .02;
    }
    scrollGust *= .6; if (Math.abs(scrollGust) < .5) scrollGust = 0;
    return energy;
  };

  /* ---------- things that feel the wind ---------- */
  // headline letters sway
  const h1 = document.querySelector(".hero h1"), letters = [];
  const split = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      [...n.textContent].forEach((ch) => {
        if (ch === " ") { frag.append(" "); return; }
        const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.setAttribute("aria-hidden", "true");
        frag.append(s); letters.push({ el: s, a: 0, v: 0, x: 0, y: 0 });
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && !n.classList.contains("cursor")) split(n);
  });
  if (h1) { h1.setAttribute("aria-label", h1.textContent.replace("_", "").replace(/\s+/g, " ").trim()); split(h1); }
  const measure = () => letters.forEach((l) => { const r = l.el.getBoundingClientRect(); l.x = r.left + r.width / 2; l.y = r.top + r.height / 2 + scrollY; });
  // flames lean
  const flames = [...document.querySelectorAll(".lab .flame, .lab .sticky-flame")].map((el) => ({ el, a: 0, v: 0 }));

  let wxs = 0, wys = 0;
  const frame = () => {
    const energy = stepField(); draw();
    const sp = Math.hypot(wind.x, wind.y);
    letters.forEach((l) => {
      const d = Math.hypot(l.x - wind.px, l.y - scrollY - wind.py), fall = wind.has ? Math.max(0, 1 - d / 260) : 0;
      l.v = (l.v + wind.x * .05 * fall * fall - l.a * .08) * .86; l.a = clamp(l.a + l.v, -32, 32);
      l.el.style.transform = Math.abs(l.a) > .05 ? `rotate(${l.a.toFixed(2)}deg) translateY(${(-Math.abs(l.a) * .25).toFixed(1)}px)` : "";
    });
    flames.forEach((f) => {
      f.v = (f.v + wind.x * .07 - f.a * .1) * .85; f.a = clamp(f.a + f.v, -20, 20);
      const flick = Math.sin(performance.now() / 260 + f.a) * Math.min(3, sp * .4);
      f.el.style.transform = `skewX(${(-f.a * .4).toFixed(2)}deg) rotate(${(f.a * .3 + flick).toFixed(2)}deg) scaleY(${(1 + Math.min(.18, sp * .012)).toFixed(3)})`;
    });
    // covers drift inside their frames
    wxs += (clamp(wind.x, -9, 9) - wxs) * .12; wys += (clamp(wind.y, -9, 9) - wys) * .12;
    lab.style.setProperty("--wx", wxs.toFixed(2)); lab.style.setProperty("--wy", wys.toFixed(2));
    wind.x *= .86; wind.y *= .86;
    const moving = energy > .02 || sp > .05 || Math.abs(wxs) + Math.abs(wys) > .05 || letters.some((l) => Math.abs(l.a) > .05) || flames.some((f) => Math.abs(f.a) > .05);
    if (moving) requestAnimationFrame(frame); else { awake = false; lab.style.setProperty("--wx", 0); lab.style.setProperty("--wy", 0); }
  };
  function wake() { if (!awake && !reduce) { awake = true; requestAnimationFrame(frame); } }

  size(); measure();
  addEventListener("resize", () => { size(); measure(); });
  document.fonts?.ready.then(measure);
  // a first breath across the page, so it is clear the sheet is alive
  if (!reduce) setTimeout(() => { wind.px = innerWidth * .3; wind.py = innerHeight * .4; wind.has = true; wind.x = 26; wake(); setTimeout(() => { if (lastX === null) wind.has = false; }, 900); }, 500);

  /* covers turn to colour when pointed at; on touch, as they pass the middle of the screen */
  if (!fine && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("lit", e.isIntersecting)), { rootMargin: "-35% 0px -35% 0px" });
    document.querySelectorAll(".lab .card").forEach((c) => io.observe(c));
  }

  /* subscribe bar: appears once the reader scrolls, hides at the footer */
  const bar = document.querySelector(".sticky-sub"), foot = document.querySelector(".foot");
  if (bar) {
    let closed = false;
    const update = () => { bar.hidden = closed || scrollY < 60 || foot.getBoundingClientRect().top < innerHeight; };
    addEventListener("scroll", update, { passive: true });
    bar.querySelector(".sticky-close").addEventListener("click", () => { closed = true; update(); });
  }
})();
