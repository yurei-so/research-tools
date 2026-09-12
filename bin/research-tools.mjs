#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
import fs from "node:fs";
import { buildSite } from "../src/site.mjs";
const args = process.argv.slice(2); if (args[0] !== "build") throw new Error("usage: research-tools build --corpus corpus.json --out dist [--title Name]");
const value = (flag, fallback) => { const index = args.indexOf(flag); return index < 0 ? fallback : args[index + 1]; };
const result = buildSite(JSON.parse(fs.readFileSync(value("--corpus", "corpus.json"), "utf8")), { outDir: value("--out", "dist"), siteTitle: value("--title", "Research Library") });
console.log(`Built ${result.labnotes} labnotes across ${result.families} families in ${result.outDir}`);
