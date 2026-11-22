// Design lab interactions: mosaic background, throwable menu discs,
// draggable cover strip, cover preview on the index.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const B = root.dataset.v === "b";

  /* ---------- pixel mosaic background ---------- */
  const film = document.getElementById("film");
  const fctx = film.getContext && film.getContext("2d");
  const FILM = B
    ? { base: [220, 203, 243], blobs: [[196, 172, 236], [236, 222, 250], [206, 190, 240], [228, 214, 246]] }
    : { base: [228, 228, 226], blobs: [[206, 206, 204], [240, 240, 238], [218, 192, 240], [214, 214, 212]] };
  function sizeFilm() {
    const cell = innerWidth < 700 ? 34 : 48;
    film.width = Math.max(8, Math.round(innerWidth / cell));
    film.height = Math.max(8, Math.round(innerHeight / cell));
  }
  function drawFilm(t) {
    const w = film.width, h = film.height, im = fctx.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = FILM.base[0], g = FILM.base[1], b = FILM.base[2];
      FILM.blobs.forEach((c, i) => {
        const cx = (.5 + .45 * Math.sin(t * (.07 + i * .023) + i * 2.1)) * w;
        const cy = (.5 + .45 * Math.cos(t * (.05 + i * .031) + i * 1.3)) * h;
        const k = Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 1.4) / (w * .42)) * .8;
        r += (c[0] - r) * k; g += (c[1] - g) * k; b += (c[2] - b) * k;
      });
      // per-cell jitter gives the mosaic its checkered look
      const j = ((Math.sin(x * 12.9898 + y * 78.233 + Math.floor(t * .6) * .37) * 43758.5453) % 1) * 7;
      const o = (y * w + x) * 4;
      d[o] = r + j; d[o + 1] = g + j; d[o + 2] = b + j; d[o + 3] = 255;
    }
    fctx.putImageData(im, 0, 0);
  }
  if (fctx) {
    sizeFilm(); drawFilm(0);
    addEventListener("resize", () => { sizeFilm(); drawFilm(performance.now() / 1000); });
    if (!reduce) { let last = 0; const loop = (ms) => { if (ms - last > 90) { drawFilm(ms / 1000); last = ms; } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }

  /* ---------- throwable discs ---------- */
  const home = document.getElementById("home");
  const stks = [...document.querySelectorAll(".stk")];
  if (reduce || !stks.length) { root.classList.add("static"); }
  else {
    const SIZE = innerWidth < 700 ? [.36, .3, .3, .28, .34] : [.2, .16, .17, .15, .19];
    const S = stks.map((el, i) => ({ el, i, x: 0, y: 0, vx: 0, vy: 0, r: 0, held: false, moved: 0 }));
    let W = 0, H = 0, top = 0;
    function layout(first) {
      W = home.clientWidth; H = home.clientHeight;
      const base = Math.min(W, H * 1.5);
      const brand = document.getElementById("brand").getBoundingClientRect();
      top = Math.min(H * .62, brand.bottom - home.getBoundingClientRect().top + 16);
      let x = W * .02;
      S.forEach((s, i) => {
        s.r = Math.max(46, Math.min(170, base * SIZE[i] / 2));
        s.el.style.setProperty("--d", s.r * 2 + "px");
        if (first) { s.x = x + s.r; s.y = H - s.r - 10 - (i % 2) * s.r * .25; x += s.r * 2 + W * .012; s.vx = (Math.random() - .5) * 2; s.vy = -Math.random() * 2; }
      });
      if (first && x > W) { const k = (W - 8) / x; S.forEach((s) => { s.x *= k; }); }
    }
    layout(true);
    addEventListener("resize", () => layout(false));
    const FLOOR = 34;
    function step() {
      S.forEach((s) => {
        if (!s.held) {
          s.vy += .35; s.vx *= .992; s.vy *= .992; s.x += s.vx; s.y += s.vy;
          if (s.x < s.r) { s.x = s.r; s.vx *= -.55; } if (s.x > W - s.r) { s.x = W - s.r; s.vx *= -.55; }
          if (s.y > H - s.r - FLOOR) { s.y = H - s.r - FLOOR; s.vy *= -.45; s.vx *= .94; if (Math.abs(s.vy) < .8) s.vy = 0; }
          if (s.y < s.r) { s.y = s.r; s.vy *= -.5; }
        }
      });
      for (let a = 0; a < S.length; a++) for (let b = a + 1; b < S.length; b++) {
        const p = S[a], q = S[b], dx = q.x - p.x, dy = q.y - p.y, dist = Math.hypot(dx, dy) || 1, min = p.r + q.r;
        if (dist < min) {
          const nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
          if (!p.held) { p.x -= nx * push; p.y -= ny * push; } if (!q.held) { q.x += nx * push; q.y += ny * push; }
          const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (rel < 0) { const imp = rel * .8; if (!p.held) { p.vx += imp * nx; p.vy += imp * ny; } if (!q.held) { q.vx -= imp * nx; q.vy -= imp * ny; } }
        }
      }
      S.forEach((s) => { s.el.style.transform = `translate(${s.x - s.r}px, ${s.y - s.r}px) rotate(${(s.x / W - .5) * 14}deg)`; });
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    S.forEach((s) => {
      let lx = 0, ly = 0, ox = 0, oy = 0;
      s.el.addEventListener("pointerdown", (e) => {
        s.held = true; s.moved = 0; s.el.classList.add("held"); s.el.setPointerCapture(e.pointerId);
        const r = home.getBoundingClientRect(); ox = e.clientX - r.left - s.x; oy = e.clientY - r.top - s.y; lx = e.clientX; ly = e.clientY;
      });
      s.el.addEventListener("pointermove", (e) => {
        if (!s.held) return;
        const r = home.getBoundingClientRect();
        s.x = e.clientX - r.left - ox; s.y = e.clientY - r.top - oy;
        s.vx = (e.clientX - lx) * .9; s.vy = (e.clientY - ly) * .9; s.moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly); lx = e.clientX; ly = e.clientY;
      });
      const up = () => { s.held = false; s.el.classList.remove("held"); };
      s.el.addEventListener("pointerup", up); s.el.addEventListener("pointercancel", up);
      // a throw is not a click
      s.el.addEventListener("click", (e) => { if (s.moved > 8) e.preventDefault(); });
    });
  }

  /* ---------- drag the cover strip sideways ---------- */
  document.querySelectorAll(".strip").forEach((st) => {
    let down = false, sx = 0, sl = 0, moved = 0;
    st.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = st.scrollLeft; });
    addEventListener("pointermove", (e) => { if (!down) return; moved = Math.abs(e.clientX - sx); if (moved > 4) st.classList.add("drag"); st.scrollLeft = sl - (e.clientX - sx); });
    addEventListener("pointerup", () => { down = false; setTimeout(() => st.classList.remove("drag"), 0); });
    st.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }, true);
    st.querySelectorAll("img").forEach((i) => i.setAttribute("draggable", "false"));
  });

  /* ---------- cover preview following the cursor on the index ---------- */
  const peek = document.getElementById("peek"), pimg = peek.querySelector("img");
  document.querySelectorAll(".index a[data-img]").forEach((a) => {
    a.addEventListener("pointerenter", () => { pimg.src = a.dataset.img; peek.classList.add("on"); });
    a.addEventListener("pointerleave", () => peek.classList.remove("on"));
    a.addEventListener("pointermove", (e) => { peek.style.transform = `translate(${Math.min(e.clientX + 24, innerWidth - peek.offsetWidth - 12)}px, ${e.clientY - peek.offsetHeight / 2}px) rotate(-3deg)`; });
  });
})();
