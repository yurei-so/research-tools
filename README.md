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

## License

AGPL-3.0-only.
