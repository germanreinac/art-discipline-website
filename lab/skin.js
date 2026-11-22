// Test skin interactions. The page reads and works without any of this.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lab = document.querySelector(".lab");

  /* intro paragraph ends where the headline ends (as on the live site) */
  const nb = document.querySelector(".hero h1 .nb");
  const fit = () => {
    const copy = nb.closest(".hero-copy");
    copy.style.setProperty("--dot-w", nb.getBoundingClientRect().right - copy.getBoundingClientRect().left + "px");
  };

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
  fit(); addEventListener("resize", fit); document.fonts?.ready.then(fit);
  if (!reduce) {
    const wave = (x, y) => letters.forEach((s) => {
      const r = s.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      const k = Math.max(0, 1 - d / 150);
      s.style.transform = k ? `translateY(${-k * 22}px) rotate(${(k * 6 * (x < r.left + r.width / 2 ? 1 : -1)).toFixed(1)}deg)` : "";
      s.classList.toggle("hit", k > .55);
    });
    h1.addEventListener("pointermove", (e) => wave(e.clientX, e.clientY));
    h1.addEventListener("pointerleave", () => wave(-9999, -9999));
    // a tap presses one key
    letters.forEach((s) => s.addEventListener("pointerdown", () => {
      s.animate([{ transform: "translateY(0)" }, { transform: "translateY(10px) scale(.9)" }, { transform: "translateY(0)" }], { duration: 260, easing: "ease-out" });
    }));
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

  /* subscribe bar: appears once the reader scrolls, hides at the footer */
  const bar = document.querySelector(".sticky-sub"), foot = document.querySelector(".foot");
  if (bar) {
    let closed = false;
    const update = () => { bar.hidden = closed || scrollY < 60 || foot.getBoundingClientRect().top < innerHeight; };
    addEventListener("scroll", update, { passive: true });
    bar.querySelector(".sticky-close").addEventListener("click", () => { closed = true; update(); });
  }
})();
