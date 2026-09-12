// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildAttentionModel, buildProvenanceModel, buildSite, validateCorpus } from "../src/index.mjs";

const corpus = { schema: "research-corpus/v1", generated_at: "2026-09-11T00:00:00.000Z", source_revision: "test", families: [{ id: "demo", title: "Demo" }], labnotes: [
  { id: "demo-001", family: "demo", title: "First", date: "2026-09-10", status: "complete", outcome: "mixed", question: "Does alpha work?", tags: ["alpha"], relations: [] },
  { id: "demo-002", family: "demo", title: "Second", date: "2026-09-11", status: "complete", outcome: "positive", question: "Does beta extend alpha?", tags: ["alpha", "beta"], relations: [{ target: "demo-001", type: "extends", rationale: "Uses the earlier protocol." }] },
] };

test("validates the public interchange boundary", () => assert.equal(validateCorpus(corpus), corpus));
test("keeps authored provenance direction and rationale", () => assert.deepEqual(buildProvenanceModel(corpus, "demo").edges, [{ source: "demo-001", target: "demo-002", type: "extends", rationale: "Uses the earlier protocol." }]));
test("projects attention without manufacturing provenance", () => { const model = buildAttentionModel(corpus.labnotes, corpus.labnotes); assert.deepEqual(Object.keys(model.projection.points), ["demo-001", "demo-002"]); assert.match(model.warning, /not evidence of causality/); });
test("rejects dangling provenance", () => { const broken = structuredClone(corpus); broken.labnotes[1].relations[0].target = "demo-999"; assert.throws(() => validateCorpus(broken), /invalid relation target/); });
test("builds an independent static site from only the public interchange", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-tools-site-"));
  const result = buildSite(corpus, { outDir, siteTitle: "Demo Research" });
  assert.deepEqual({ families: result.families, labnotes: result.labnotes }, { families: 1, labnotes: 2 });
  const family = fs.readFileSync(path.join(outDir, "families/demo/index.html"), "utf8");
  assert.match(family, /Authored provenance/); assert.match(family, /Corpus-relative attention/);
  assert.match(family, /Faint connectors are authored immediate neighbors only/);
  assert.match(family, /assets\/social\/demo\.svg/);
  assert.ok(fs.existsSync(path.join(outDir, "assets/social/demo.svg")));
  assert.ok(!family.includes("/home/"));
  fs.rmSync(outDir, { recursive: true, force: true });
});
