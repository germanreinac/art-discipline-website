// Design lab: a test homepage in a new visual direction. NOT part of the live
// site: `npm run build` ignores this folder. Run `node lab/build.mjs` and serve
// lab/out/ to look at it.
import fs from "node:fs/promises";
import config from "../site.config.mjs";

const root = new URL("../", import.meta.url);
const out = new URL("lab/out/", root);
const posts = JSON.parse(await fs.readFile(new URL("data/posts.json", root))).sort((a, b) => b.date.localeCompare(a.date));
const products = JSON.parse(await fs.readFile(new URL("data/products.json", root)));

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const img = (url, w) => {
  const m = url.match(/\/(https?%3A%2F%2F[^/?#]+)$/i);
  const src = m ? decodeURIComponent(m[1]) : url;
  return `https://substackcdn.com/image/fetch/w_${w},c_limit,f_auto,q_auto:good,fl_progressive:steep/${encodeURIComponent(src)}`;
};
const no = (p) => (p.title.match(/\.(\d+)/) || [])[1];
const issues = posts.filter(no);
const head = (p) => p.subtitle || p.title;
const date = (d) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
const live = (p) => `https://artdiscipline.com/p/${p.slug}/`;
const money = (p) => (p.price === 0 ? "Free" : `${p.payWhatYouWant ? "From " : ""}€${p.price}`);
const short = (n) => n.split(/:| [-–] /)[0].trim();
const gift = products.find((p) => p.slug === config.freebie);
const mentorship = config.links.find((l) => /mentorship/i.test(l.label));
const latest = issues[0];
const startHere = config.startHere.map((s) => posts.find((p) => p.slug === s)).filter(Boolean);

const disc = (n, name, href, kind, attrs = "") =>
  `<a class="stk ${kind}" href="${href}" draggable="false" ${attrs}><span class="disc"><b>${n}</b><span class="nm">${name}_</span><i>↘</i></span></a>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Art Discipline · design lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="lab.css">
<script>document.documentElement.classList.add("js"); if (/[?&]v=b/.test(location.search)) document.documentElement.dataset.v = "b";</script>
</head>
<body>
<canvas id="film" aria-hidden="true"></canvas>
<div id="grain" aria-hidden="true"></div>

<header id="home">
  <div id="brand">
    <p class="mark"><img src="flame.png" alt="" width="147" height="256"><span>Art Discipline<sup>®</sup></span></p>
    <h1>Find your voice<br>as an artist<i class="cur">_</i></h1>
    <p class="pitch">A monthly letter on character design, world building and careers in games. From the artist behind OlliOlli World (BAFTA-nominated).</p>
    <p class="hint"><a href="${live(latest)}">Latest_ .${no(latest)} ${esc(head(latest))} ↘</a></p>
  </div>
  <p class="corner tr">Stay creative, stay weird</p>
  <p class="corner br">${issues.length} issues · 2,000+ readers</p>
  <nav id="pile" aria-label="Main">
    ${disc("01", "Read", "#issues", "solid", 'style="--fs:.26"')}
    ${disc("02", "Shop", "#shop", "line", 'style="--fs:.26"')}
    ${disc("03", "About", "#about", "solid", 'style="--fs:.24"')}
    ${mentorship ? disc("04", "1-on-1", mentorship.url, "line", 'style="--fs:.24" target="_blank" rel="noopener"') : ""}
    ${disc("05", "Subscribe", "#subscribe", "pop", 'style="--fs:.17"')}
  </nav>
</header>

<main>
<section class="sec" id="issues">
  <div class="inner">
    <p class="label">01 — Read</p>
    <h2>Issues_</h2>
    <p class="big">One email a month on how game art really gets made: process breakdowns, career lessons and the mistakes nobody posts.</p>
  </div>
  <div class="strip">
    ${issues.slice(0, 8).map((p) => `<figure><a href="${live(p)}"><img src="${img(p.cover, 900)}" alt="Cover art for Art Discipline .${no(p)}: ${esc(head(p))}" loading="lazy" decoding="async"></a><figcaption><b>.${no(p)}</b> ${esc(head(p))}_</figcaption></figure>`).join("\n    ")}
  </div>
  <div class="inner">
    <p class="label">Start here</p>
    <ol class="index">
      ${startHere.map((p) => `<li><a href="${live(p)}" data-img="${img(p.cover, 600)}"><span class="n">.${no(p)}</span><span class="t">${esc(head(p))}</span><span class="d">${date(p.date)}</span></a></li>`).join("\n      ")}
    </ol>
    <p class="more"><a href="https://artdiscipline.com/archive/">All ${issues.length} issues ↘</a></p>
  </div>
</section>

<section class="sec" id="shop">
  <div class="inner">
    <p class="label">02 — Shop</p>
    <h2>Goods_</h2>
    <p class="big">Improve your creative skills with the tools I use, a character design tutorial and direct feedback on your work.</p>
    <ul class="goods">
      ${[gift, ...products.filter((p) => p !== gift).sort((a, b) => a.price - b.price)].map((p) => `<li${p === gift ? ' class="free"' : ""}><a href="${p.url}" target="_blank" rel="noopener"><img src="${p.image}" alt="" loading="lazy"><span class="t">${esc(short(p.name))}</span><span class="d">${money(p)}${p.ratings ? ` · ★ ${p.rating.toFixed(1)}` : ""}</span><span class="go">↘</span></a></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section class="sec" id="about">
  <div class="inner">
    <p class="label">03 — About</p>
    <h2>Hi, I'm Germán_</h2>
    <div class="about">
      <a class="skull" href="${config.instagram}" target="_blank" rel="noopener" title="Germán Reina on Instagram"><img src="skull.png" alt="Germán Reina" width="640" height="640"></a>
      <p class="big">${esc(config.author.bio)}</p>
    </div>
    <p class="more"><a href="https://artdiscipline.com/about/">More about me ↘</a></p>
  </div>
</section>

<section class="sec band" id="subscribe">
  <div class="inner">
    <p class="label">05 — Subscribe</p>
    <h2>Get Art Discipline<sup>®</sup> by email_</h2>
    <p class="big">Free, once a month. Join 2,000+ artists finding their own voice.</p>
    <div class="sub-embed"><iframe src="${config.substack}/embed" title="Subscribe to Art Discipline by email" loading="lazy" scrolling="no"></iframe></div>
  </div>
</section>
</main>

<footer class="foot">
  <span>Art Discipline<sup>®</sup></span>
  <span>Stay creative, stay weird.</span>
  <span>© ${new Date().getFullYear()} ${esc(config.author.name)}</span>
</footer>

<div id="peek" aria-hidden="true"><img alt=""></div>
<p id="switch"><a href="?v=a">A · paper</a><a href="?v=b">B · lavender</a></p>
<script src="lab.js" defer></script>
</body>
</html>`;

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.writeFile(new URL("index.html", out), html);
for (const f of ["lab.css", "lab.js"]) await fs.copyFile(new URL("lab/" + f, root), new URL(f, out));
for (const f of ["flame.png", "skull.png"]) await fs.copyFile(new URL("public/" + f, root), new URL(f, out));
console.log("lab built -> lab/out/");
