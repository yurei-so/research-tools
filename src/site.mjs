// SPDX-License-Identifier: AGPL-3.0-only
import fs from "node:fs";
import path from "node:path";
import { buildAttentionModel } from "./attention-map.mjs";
import { buildProvenanceModel } from "./provenance.mjs";
import { validateCorpus } from "./interchange.mjs";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const frame = (title, site, body, depth = "", social = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self';style-src 'self';img-src 'self' data:;object-src 'none';base-uri 'none'"><title>${esc(title)} | ${esc(site)}</title><meta property="og:title" content="${esc(title)}"><meta property="og:site_name" content="${esc(site)}">${social ? `<meta property="og:image" content="${esc(social)}"><meta name="twitter:card" content="summary_large_image">` : ""}<link rel="stylesheet" href="${depth}assets/site.css"></head><body><header><a href="${depth}index.html">${esc(site)}</a></header><main>${body}</main><footer>Built from a deliberate public corpus export.</footer></body></html>`;

const socialSvg = (site, family, count) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#090b11"/><path d="M0 0h8v630H0z" fill="#9d72ff"/><text x="76" y="92" fill="#b79aff" font-family="monospace" font-size="22" letter-spacing="5">${esc(site.toUpperCase())}</text><text x="76" y="286" fill="#e1e4ec" font-family="system-ui" font-size="72" font-weight="700">${esc(family.title)}</text><text x="76" y="520" fill="#929bad" font-family="monospace" font-size="22">${count} PUBLISHED LABNOTES · PROVENANCE + ATTENTION</text></svg>`;

function points(raw, width = 720, height = 420) {
  const values = Object.values(raw); const xs = values.map((p) => p[0]); const ys = values.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return Object.fromEntries(Object.entries(raw).map(([id, p]) => [id, [maxX === minX ? width / 2 : 60 + (p[0] - minX) / (maxX - minX) * (width - 120), maxY === minY ? height / 2 : 50 + (p[1] - minY) / (maxY - minY) * (height - 100)]]));
}

function attentionSvg(model, relations) {
  const mapped = points(model.projection.points);
  const edges = relations.filter((edge) => mapped[edge.source] && mapped[edge.target]).map((edge) => `<line class="context" x1="${mapped[edge.source][0]}" y1="${mapped[edge.source][1]}" x2="${mapped[edge.target][0]}" y2="${mapped[edge.target][1]}"/>`).join("");
  const heat = Object.values(mapped).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="82"/>`).join("");
  const nodes = Object.entries(mapped).map(([id, [x, y]]) => `<a href="../../notes/${encodeURIComponent(id)}/index.html"><circle cx="${x}" cy="${y}" r="7"/><text x="${x + 12}" y="${y - 10}">${esc(id)}</text></a>`).join("");
  return `<svg viewBox="0 0 720 420" role="img" aria-label="Corpus-relative attention projection"><g class="heat">${heat}</g><g>${edges}</g>${nodes}</svg>`;
}

function provenanceSvg(model) {
  const height = Math.max(300, model.notes.length * 90);
  const mapped = Object.fromEntries(model.notes.map((note, index) => [note.id, [120 + index % 2 * 400, 55 + index * 80]]));
  const edges = model.edges.map((edge) => `<line x1="${mapped[edge.source][0]}" y1="${mapped[edge.source][1]}" x2="${mapped[edge.target][0]}" y2="${mapped[edge.target][1]}"/>`).join("");
  const nodes = model.notes.map((note) => `<a href="../../notes/${encodeURIComponent(note.id)}/index.html"><rect x="${mapped[note.id][0] - 90}" y="${mapped[note.id][1] - 25}" width="180" height="50"/><text x="${mapped[note.id][0]}" y="${mapped[note.id][1] + 4}" text-anchor="middle">${esc(note.id)}</text></a>`).join("");
  return `<svg viewBox="0 0 720 ${height}" role="img" aria-label="Authored provenance graph"><g class="provenance">${edges}</g>${nodes}</svg>`;
}

export function buildSite(corpus, { outDir = "dist", siteTitle = "Research Library" } = {}) {
  validateCorpus(corpus); outDir = path.resolve(outDir); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
  const cards = corpus.families.map((family) => { const count = corpus.labnotes.filter((note) => note.family === family.id).length; return `<article><p class="eyebrow">${count} PUBLISHED NOTES</p><h2><a href="families/${encodeURIComponent(family.id)}/index.html">${esc(family.title)}</a></h2></article>`; }).join("");
  fs.writeFileSync(path.join(outDir, "index.html"), frame(siteTitle, siteTitle, `<h1>${esc(siteTitle)}</h1><p>Published records, authored provenance, and corpus-relative attention.</p><section class="cards">${cards}</section>`));
  for (const family of corpus.families) {
    const provenance = buildProvenanceModel(corpus, family.id); const attention = buildAttentionModel(corpus.labnotes, provenance.notes);
    const dir = path.join(outDir, "families", family.id); fs.mkdirSync(dir, { recursive: true });
    const socialDir = path.join(outDir, "assets", "social"); fs.mkdirSync(socialDir, { recursive: true });
    fs.writeFileSync(path.join(socialDir, `${family.id}.svg`), socialSvg(siteTitle, family, provenance.notes.length));
    const disclosure = `Semantic geometry is approximate (stress ${attention.projection.normalized_stress}) and creates no provenance. Faint connectors are authored immediate neighbors only.`;
    fs.writeFileSync(path.join(dir, "index.html"), frame(family.title, siteTitle, `<a href="../../index.html">← Library</a><h1>${esc(family.title)}</h1><p>${esc(disclosure)}</p><h2>Authored provenance</h2>${provenanceSvg(provenance)}<h2>Corpus-relative attention</h2>${attentionSvg(attention, provenance.edges)}`, "../../", `../../assets/social/${encodeURIComponent(family.id)}.svg`));
  }
  for (const note of corpus.labnotes) { const dir = path.join(outDir, "notes", note.id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "index.html"), frame(note.title, siteTitle, `<a href="../../families/${encodeURIComponent(note.family)}/index.html">← ${esc(note.family)}</a><p class="eyebrow">${esc(note.id)} · ${esc(note.date)} · ${esc(note.outcome)}</p><h1>${esc(note.title)}</h1><p>${esc(note.question)}</p>`, "../../")); }
  fs.writeFileSync(path.join(outDir, "assets", "site.css"), `:root{color-scheme:dark;font-family:system-ui;background:#090b11;color:#d9dde7}*{box-sizing:border-box}body{margin:0}header,footer{padding:1rem max(5vw,1rem);border-bottom:1px solid #293040}a{color:#b79aff}main{max-width:1080px;margin:auto;padding:4rem max(5vw,1rem)}h1{font-size:clamp(2.2rem,7vw,5rem);max-width:18ch}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}.cards article{border:1px solid #30384a;padding:1.2rem;background:#10131c}.eyebrow{font:12px ui-monospace;letter-spacing:.12em;color:#9ca5b8}svg{display:block;width:100%;max-height:65vh;border:1px solid #30384a;background:#0d1018;margin:1rem 0 3rem}svg text{fill:#c7cddd;font:12px ui-monospace}svg rect{fill:#151a25;stroke:#69738b}.provenance line{stroke:#68738d;stroke-width:2}.heat circle{fill:#8061d9;opacity:.13}.context{stroke:#b79aff;stroke-width:1;stroke-dasharray:3 9;opacity:.28}svg>a>circle{fill:#82dfbd;stroke:#090b11;stroke-width:3}footer{border-top:1px solid #293040;border-bottom:0;color:#788197}`);
  return { outDir, families: corpus.families.length, labnotes: corpus.labnotes.length };
}
