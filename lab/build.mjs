// Design lab: a test homepage in a new visual direction. NOT part of the live
// site: `npm run build` ignores this folder. `node lab/build.mjs` writes
// lab/out/index.html (page content only, as the preview host expects) and
// lab/out/preview.html (the same page wrapped for a local browser).
import fs from "node:fs/promises";
import config from "../site.config.mjs";

const root = new URL("../", import.meta.url);
const out = new URL("lab/out/", root);
const read = (p) => fs.readFile(new URL(p, root), "utf8");
const posts = JSON.parse(await read("data/posts.json")).sort((a, b) => b.date.localeCompare(a.date));
const products = JSON.parse(await read("data/products.json"));

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const no = (p) => (p.title.match(/\.(\d+)/) || [])[1];
const issues = posts.filter(no);
const head = (p) => p.subtitle || p.title;
const live = (p) => `https://artdiscipline.com/p/${p.slug}/`;
const longDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const money = (p) => (p.price === 0 ? "Free" : `${p.payWhatYouWant ? "From " : ""}€${p.price}`);
const short = (n) => n.split(/:| [-–] /)[0].trim();
const gift = products.find((p) => p.slug === config.freebie);
const mentorship = config.links.find((l) => /mentorship/i.test(l.label));
const latest = issues[0];
const startHere = config.startHere.map((s) => posts.find((p) => p.slug === s)).filter(Boolean);

// The log: one cell per month since the first issue.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const first = new Date(issues.at(-1).date), last = new Date(latest.date);
const next = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));
const years = [];
for (let y = first.getUTCFullYear(); y <= next.getUTCFullYear(); y++) years.push(y);
const key = (d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
const byMonth = new Map();
[...issues].reverse().forEach((p) => { const k = key(new Date(p.date)); byMonth.set(k, [...(byMonth.get(k) || []), p]); });
const cell = (y, m) => {
  const k = `${y}-${m}`, d = Date.UTC(y, m, 1);
  if (k === key(next)) return `<span class="cell next" title="Next issue"><i class="cur">_</i></span>`;
  if (d < Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1) || d > next) return `<span class="cell off"></span>`;
  const ps = byMonth.get(k);
  if (!ps) return `<span class="cell skip" title="No issue in ${MONTHS[m]} ${y}"></span>`;
  return `<span class="cell${ps.length > 1 ? " two" : ""}">${ps.map((p) => `<button type="button" class="iss" data-n="${no(p)}" aria-label="Issue .${no(p)}: ${esc(head(p))}">.${no(p)}</button>`).join("")}</span>`;
};
const DATA = Object.fromEntries(issues.map((p) => [no(p), { t: head(p), d: longDate(p.date), u: live(p) }]));
const months = byMonth.size;
const span = (last.getUTCFullYear() - first.getUTCFullYear()) * 12 + last.getUTCMonth() - first.getUTCMonth() + 1;
const skipped = span - months;
const since = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

const page = `<title>Art Discipline Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap">
<style>
${await read("lab/page.css")}
</style>

<div class="grain" aria-hidden="true"></div>

<header class="top"><div class="wrap">
  <a class="brand" href="#top"><img src="assets/flame.png" alt="" width="147" height="256"><span>Art Discipline<b class="reg">R</b></span></a>
  <nav><a href="#log">Read</a><a href="#shop">Shop</a><a href="#about">About</a></nav>
  <a class="pill" href="${config.substack}/subscribe" target="_blank" rel="noopener">Subscribe</a>
</div></header>

<main id="top">
<section class="hero"><div class="wrap">
  <p class="label">A monthly newsletter by ${esc(config.author.name)}</p>
  <h1>Find your voice<br>as an artist<i class="cur">_</i></h1>
  <div class="hero-row">
    <p class="lede">Character design, world building and careers in games, from the artist behind OlliOlli World (BAFTA-nominated).</p>
    <p class="motto">Stay creative,<br>stay weird.</p>
    ${mentorship ? `<a class="ghost" href="${mentorship.url}" target="_blank" rel="noopener">Book a private 1-on-1 session →</a>` : ""}
  </div>
</div></section>

<section class="log" id="log"><div class="wrap">
  <div class="sec-head">
    <h2>The log<i class="cur">_</i></h2>
    <p>${issues.length} issues since ${since}, with ${skipped === 1 ? "one month" : skipped + " months"} skipped. Pick a month.</p>
  </div>
  <div class="log-grid">
    <div class="cal" role="group" aria-label="Issues by month">
      <div class="cal-row cal-months"><span></span>${MONTHS.map((m) => `<span>${m}</span>`).join("")}</div>
      ${years.map((y) => `<div class="cal-row"><span class="yr">${y}</span>${MONTHS.map((_, m) => cell(y, m)).join("")}</div>`).join("\n      ")}
      <p class="legend"><span><i class="k k-on"></i>Issue</span><span><i class="k k-skip"></i>Skipped month</span><span><i class="k k-next"></i>Next one</span></p>
    </div>
    <a class="print" id="print" href="${live(latest)}" target="_blank" rel="noopener">
      <span class="print-img"><img id="p-img" src="assets/covers/${no(latest)}.jpg" alt="Cover art for the selected issue"></span>
      <span class="print-cap"><b id="p-no">.${no(latest)}</b><span id="p-date">${longDate(latest.date)}</span></span>
      <strong id="p-title">${esc(head(latest))}</strong>
      <span class="print-go">Read this issue →</span>
    </a>
  </div>
</div></section>

<section class="start"><div class="wrap">
  <div class="sec-head"><h2>Start here</h2><p>New here? These four show what Art Discipline is about.</p></div>
  <ol class="rows">
    ${startHere.map((p) => `<li><a href="${live(p)}" target="_blank" rel="noopener"><span class="duo"><img src="assets/covers/${no(p)}.jpg" alt="" loading="lazy"></span><span class="n">.${no(p)}</span><span class="t">${esc(head(p))}</span><span class="go">→</span></a></li>`).join("\n    ")}
  </ol>
</div></section>

<section class="shop" id="shop"><div class="wrap">
  <div class="sec-head"><h2>Shop</h2><p>The tools I use, a character design tutorial and direct feedback on your work.</p></div>
  <ul class="rows goods">
    ${[gift, ...products.filter((p) => p !== gift).sort((a, b) => a.price - b.price)].map((p) => `<li${p === gift ? ' class="free"' : ""}><a href="${p.url}" target="_blank" rel="noopener"><span class="duo"><img src="assets/goods/${p.slug}.jpg" alt="" loading="lazy"></span><span class="n">${money(p)}</span><span class="t">${esc(short(p.name))}</span><span class="go">→</span></a></li>`).join("\n    ")}
  </ul>
</div></section>

<section class="about" id="about"><div class="wrap about-in">
  <a class="skull" href="${config.instagram}" target="_blank" rel="noopener" title="${esc(config.author.name)} on Instagram"><img src="assets/skull.png" alt="${esc(config.author.name)}" width="640" height="640"></a>
  <div>
    <h2>Hi, I'm Germán.</h2>
    <p class="bio">${esc(config.author.bio)}</p>
    <a class="ghost" href="https://artdiscipline.com/about/" target="_blank" rel="noopener">More about me →</a>
  </div>
</div></section>

<section class="sub"><div class="wrap sub-in">
  <img class="sub-flame" src="assets/flame.png" alt="" width="147" height="256">
  <div>
    <h2>Get the next issue by email.</h2>
    <p>Free, once a month. Join 2,000+ artists finding their own voice.</p>
    <a class="pill pill-pop" href="${config.substack}/subscribe" target="_blank" rel="noopener">Subscribe free →</a>
    <p class="note">Preview only: the live site would keep the one-step email box here.</p>
  </div>
</div></section>
</main>

<footer class="foot"><div class="wrap foot-in">
  <span class="brand"><span>Art Discipline<b class="reg">R</b></span></span>
  <span class="foot-motto">Stay creative, stay weird.</span>
  <span class="label">© ${new Date().getFullYear()} ${esc(config.author.name)}</span>
</div></footer>

<script>
const ISSUES = ${JSON.stringify(DATA)};
${await read("lab/page.js")}
</script>
`;

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(new URL("lab/assets/", root), new URL("assets/", out), { recursive: true });
await fs.writeFile(new URL("index.html", out), page);
await fs.writeFile(new URL("preview.html", out), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body>${page}</body></html>`);
console.log(`lab built: ${issues.length} issues, ${months} months with an issue, ${skipped} skipped`);
