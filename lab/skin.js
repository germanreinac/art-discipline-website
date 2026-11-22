// Test skin interactions. The page reads and works without any of this.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lab = document.querySelector(".lab");

  /* headline: split into letters that lift as the pointer passes, like keys */
  const h1 = document.querySelector(".hero h1");
  const letters = [];
  const split = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((c) => {
          if (c === " ") { frag.append(" "); return; }
          const s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.setAttribute("aria-hidden", "true");
          frag.append(s); letters.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains("cursor")) split(n);
    });
  };
  h1.setAttribute("aria-label", h1.textContent.replace("_", "").replace(/\s+/g, " ").trim());
  split(h1);
  if (!reduce) {
    const wave = (x, y) => letters.forEach((s) => {
      const r = s.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      const k = Math.max(0, 1 - d / 190);
      s.style.transform = k ? `translateY(${-k * 34}px) rotate(${(k * 6 * (x < r.left + r.width / 2 ? 1 : -1)).toFixed(1)}deg)` : "";
      s.classList.toggle("hit", k > .55);
    });
    let raf = 0;
    addEventListener("pointermove", (e) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => wave(e.clientX, e.clientY)); }, { passive: true });
    addEventListener("pointerdown", (e) => wave(e.clientX, e.clientY), { passive: true });
  }

  /* framed pieces tilt toward the pointer */
  if (fine && !reduce) {
    document.querySelectorAll(".lab .card, .lab .gift").forEach((el) => {
      const max = el.classList.contains("gift") ? 2.5 : 7;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 2 * max + "deg");
        el.style.setProperty("--rx", -((e.clientY - r.top) / r.height - .5) * 2 * max + "deg");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }
  /* on touch screens covers turn full colour as they scroll into view */
  if (!fine && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("touched", e.isIntersecting)), { rootMargin: "-35% 0px -35% 0px" });
    document.querySelectorAll(".lab .card").forEach((c) => io.observe(c));
  }

  /* start here: the cover follows the pointer */
  if (fine) {
    const peek = document.createElement("div"); peek.id = "peek"; peek.setAttribute("aria-hidden", "true");
    const img = document.createElement("img"); img.alt = ""; peek.append(img); lab.append(peek);
    document.querySelectorAll(".lab .start a").forEach((a) => {
      const n = (a.href.match(/art-discipline-(\d+)/) || [])[1];
      if (!n) return;
      a.addEventListener("pointerenter", () => { img.src = `assets/covers/${n}.jpg`; peek.classList.add("on"); });
      a.addEventListener("pointerleave", () => peek.classList.remove("on"));
      a.addEventListener("pointermove", (e) => {
        const x = Math.min(e.clientX + 28, innerWidth - peek.offsetWidth - 20), y = Math.max(12, e.clientY - peek.offsetHeight - 16);
        peek.style.transform = `translate(${x}px, ${y}px) rotate(-3deg)`;
      });
    });
  }

  /* cards: issue number for the giant numeral, cover for the misprint layer */
  document.querySelectorAll(".lab .grid .card").forEach((c) => {
    const n = (c.href.match(/art-discipline-(\d+)/) || [])[1];
    if (n) c.dataset.n = "." + n;
    const im = c.querySelector(".card-img img");
    if (im) c.querySelector(".card-img").style.setProperty("--img", `url("${im.getAttribute("src")}")`);
  });

  /* section titles: repeat the title and slide it with the scroll */
  const tracks = [...document.querySelectorAll(".lab .section-head h2")].map((h, i) => {
    const text = h.textContent.trim();
    h.setAttribute("aria-label", text);
    const t = document.createElement("span"); t.className = "track"; t.setAttribute("aria-hidden", "true");
    for (let k = 0; k < 8; k++) { const s = document.createElement("span"); s.textContent = text + "_"; t.append(s); }
    h.textContent = ""; h.append(t);
    return { h, t, dir: i % 2 ? 1 : -1 };
  });
  const grid = document.querySelector(".lab .grid");
  let lastY = scrollY, skewT = 0;
  const onScroll = () => {
    if (!reduce) {
      tracks.forEach(({ h, t, dir }) => {
        const r = h.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const base = dir < 0 ? 0 : -t.scrollWidth / 3;
        t.style.transform = `translateX(${base + dir * (innerHeight - r.top) * .35}px)`;
      });
      // the grid leans with the scroll speed, then settles
      const v = Math.max(-1, Math.min(1, (scrollY - lastY) / 60)); lastY = scrollY;
      if (grid) { grid.style.setProperty("--skew", (v * 2.2).toFixed(2) + "deg"); clearTimeout(skewT); skewT = setTimeout(() => grid.style.setProperty("--skew", "0deg"), 120); }
    }
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* a cursor that inverts what it touches */
  if (fine && !reduce) {
    const cur = document.createElement("div"); cur.id = "cur"; cur.setAttribute("aria-hidden", "true"); lab.append(cur);
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add("on"); cur.classList.toggle("big", !!e.target.closest("a, button")); }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    const loop = () => { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
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
