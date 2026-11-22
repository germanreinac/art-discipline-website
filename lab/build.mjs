// Design lab: the real homepage with a test skin on top. NOT part of the live
// site. It takes dist/index.html exactly as `npm run build` makes it (same
// structure, same content), swaps the stylesheet for the live one plus
// lab/skin.css, and adds lab/skin.js. Run `npm run build && node lab/build.mjs`.
// Output: lab/out/index.html (page content only, as the preview host expects)
// and lab/out/preview.html (wrapped for a local browser).
import fs from "node:fs/promises";

const root = new URL("../", import.meta.url);
const out = new URL("lab/out/", root);
const read = (p) => fs.readFile(new URL(p, root), "utf8");
const LIVE = "https://artdiscipline.com";

let html = await read("dist/index.html");
let body = html.slice(html.indexOf(">", html.indexOf("<body")) + 1, html.indexOf("</body>"));
body = body
  .replace(/<script[\s\S]*?<\/script>/g, "")
  // the preview host can't load images from other sites: use the saved copies
  .replace(/<a class="card[^"]*" href="\/p\/art-discipline-(\d+)\/">[\s\S]*?<\/a>/g, (m, n) =>
    m.replace(/<img [^>]*?alt="([^"]*)"[^>]*>/, `<img src="assets/covers/${n}.jpg" alt="$1">`))
  .replace(/<img src="https:\/\/public-files\.gumroad\.com[^"]*"/g, '<img src="assets/goods/photoshoptools.jpg"')
  .replace(/src="\/(flame|skull)\.png"/g, 'src="assets/$1.png"')
  // ...or embed Substack's form: show a stand-in that opens Substack
  .replace(/<div class="sub-embed"[^>]*>[\s\S]*?<\/div>/g,
    `<a class="sub-embed sub-mock" href="https://artdiscipline.substack.com/subscribe" target="_blank" rel="noopener"><span>Type your email…</span><b>Subscribe</b></a>`)
  .replace(/href="\/(?!\/)([^"]*)"/g, (m, p) => (p === "" ? 'href="#top"' : `href="${LIVE}/${p}" target="_blank" rel="noopener"`));

const liveCss = (await read("src/styles.css")).replace(/@font-face\s*{[^}]*}\s*/g, "");
const page = `<title>Art Discipline Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap">
<style>
${liveCss}
/* ================= lab skin ================= */
${await read("lab/skin.css")}
</style>
<div id="top" class="home lab js">
${body}
</div>
<script>
${await read("lab/skin.js")}
</script>
`;

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(new URL("lab/assets/", root), new URL("assets/", out), { recursive: true });
await fs.writeFile(new URL("index.html", out), page);
await fs.writeFile(new URL("preview.html", out), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body>${page}</body></html>`);
console.log("lab built from dist/index.html");
