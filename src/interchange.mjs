// SPDX-License-Identifier: AGPL-3.0-only

const schema = "research-corpus/v1";
const relationTypes = new Set(["motivated-by", "reuses-data", "reuses-apparatus", "extends", "ablates", "replicates", "supports", "challenges", "supersedes", "follows"]);

function assert(condition, message) {
  if (!condition) throw new Error(`invalid research corpus: ${message}`);
}

export function validateCorpus(corpus) {
  assert(corpus && typeof corpus === "object" && !Array.isArray(corpus), "document must be an object");
  assert(corpus.schema === schema, `schema must be ${schema}`);
  assert(typeof corpus.generated_at === "string" && !Number.isNaN(Date.parse(corpus.generated_at)), "generated_at must be an ISO date");
  assert(typeof corpus.source_revision === "string" && corpus.source_revision.length > 0, "source_revision is required");
  assert(Array.isArray(corpus.families), "families must be an array");
  assert(Array.isArray(corpus.labnotes), "labnotes must be an array");
  const familyIds = new Set();
  for (const family of corpus.families) {
    assert(family && typeof family.id === "string" && typeof family.title === "string", "family id and title are required");
    assert(!familyIds.has(family.id), `duplicate family ${family.id}`);
    familyIds.add(family.id);
  }
  const noteIds = new Set();
  for (const note of corpus.labnotes) {
    assert(note && typeof note.id === "string", "labnote id is required");
    assert(!noteIds.has(note.id), `duplicate labnote ${note.id}`);
    assert(familyIds.has(note.family), `${note.id} references unknown family ${note.family}`);
    for (const field of ["title", "date", "status", "outcome", "question"]) assert(typeof note[field] === "string", `${note.id}.${field} must be a string`);
    assert(Array.isArray(note.tags) && note.tags.every((tag) => typeof tag === "string"), `${note.id}.tags must be strings`);
    assert(Array.isArray(note.relations), `${note.id}.relations must be an array`);
    noteIds.add(note.id);
  }
  for (const note of corpus.labnotes) for (const relation of note.relations) {
    assert(relation && relationTypes.has(relation.type), `${note.id} has unknown relation type`);
    assert(noteIds.has(relation.target) && relation.target !== note.id, `${note.id} has invalid relation target ${relation.target}`);
    assert(typeof relation.rationale === "string" && relation.rationale.trim().length > 0, `${note.id} relation rationale is required`);
  }
  return corpus;
}

export function toInterchange(manifest) {
  const corpus = {
    schema,
    generated_at: manifest.generated_at,
    source_revision: manifest.source_revision,
    families: manifest.families.map(({ id, title }) => ({ id, title })),
    labnotes: manifest.labnotes.map((note) => ({
      id: note.id, family: note.family, title: note.title, date: note.date,
      status: note.status, outcome: note.outcome, question: note.question,
      tags: [...note.tags], relations: note.relations.map(({ target, type, rationale }) => ({ target, type, rationale })),
    })),
  };
  return validateCorpus(corpus);
}
