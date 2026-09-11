// SPDX-License-Identifier: AGPL-3.0-only
import { validateCorpus } from "./interchange.mjs";

export function buildProvenanceModel(corpus, familyId) {
  validateCorpus(corpus);
  const notes = corpus.labnotes.filter((note) => note.family === familyId)
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
  if (!notes.length) throw new Error(`unknown or empty family ${familyId}`);
  const included = new Set(notes.map((note) => note.id));
  const edges = notes.flatMap((note) => note.relations
    .filter((relation) => included.has(relation.target))
    .map((relation) => ({ source: relation.target, target: note.id, type: relation.type, rationale: relation.rationale })));
  return { family: corpus.families.find((family) => family.id === familyId), notes, edges };
}
