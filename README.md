# Yurei Research Tools

Reusable instruments for inspecting deliberately published research corpora.
This repository contains tooling, not Yurei's research records or private
working state.

## Boundary

The tools accept a versioned JSON interchange document. They do not require,
discover, or connect to a private database. A publisher is responsible for
selecting, sanitizing, and exporting records before the tools receive them.

```text
private working state -> explicit publication export -> public corpus -> tools
```

The canonical provenance graph and the semantic attention view are intentionally
separate. Provenance edges must be authored and justified by the exported
record. Vector proximity never creates, supports, or edits an edge.

## Interchange

The package validates `research-corpus/v1` documents:

```json
{
  "schema": "research-corpus/v1",
  "generated_at": "2026-09-11T00:00:00.000Z",
  "source_revision": "abc123",
  "families": [{ "id": "example", "title": "Example" }],
  "labnotes": [{
    "id": "example-001",
    "family": "example",
    "title": "A published result",
    "date": "2026-09-11",
    "status": "complete",
    "outcome": "positive",
    "question": "What happened?",
    "tags": ["example"],
    "relations": []
  }]
}
```

Consumers may add fields, but the core validator rejects unknown relation types,
dangling targets, duplicate IDs, and provenance edges without a rationale.

## Deployment kit

This repository is also a working GitHub Pages starter. Replace `corpus.json` with a
deliberate `research-corpus/v1` public export, edit the site title in the build command if
desired, and enable Pages with **GitHub Actions** as its source. The included workflow
validates, tests, builds, and deploys the static library on every push to `main`.

```sh
npm ci
npm test
npm run build
```

The generated site includes family cards, standalone note pages, authored provenance,
and corpus-relative attention maps. Faint connectors in attention space are copied only
from explicit authored relations; vector proximity never creates them. The builder reads
only the supplied interchange file and has no Context Server, database, private-path, or
network integration.

For another repository or a custom export path:

```sh
npx research-tools build --corpus public/corpus.json --out dist --title "My Research"
```

## License

AGPL-3.0-only.
