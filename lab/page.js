// The log: picking a month swaps the print beside it.
(() => {
  const buttons = [...document.querySelectorAll(".iss")];
  const print = document.getElementById("print");
  const el = (id) => document.getElementById(id);
  const select = (n) => {
    const it = ISSUES[n];
    if (!it) return;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.n === n)));
    el("p-img").src = `assets/covers/${n}.jpg`;
    el("p-no").textContent = "." + n;
    el("p-date").textContent = it.d;
    el("p-title").textContent = it.t;
    print.href = it.u;
  };
  buttons.forEach((b) => {
    b.addEventListener("click", () => select(b.dataset.n));
    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") select(b.dataset.n); });
  });
  const latest = Object.keys(ISSUES).sort().pop();
  select(latest);
})();
