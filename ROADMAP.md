# SpecStream — Roadmap

Status tracker only. For what each feature is and why it's in scope, see `CLAUDE.md`. Update this as work progresses — check it at the start of each session.

**Status legend:** ✅ Done &nbsp;·&nbsp; 🚧 In progress &nbsp;·&nbsp; ⏳ Planned &nbsp;·&nbsp; 🧊 Stretch / backlog &nbsp;·&nbsp; ❌ Blocked

## Status

| Feature | Status |
|---|---|
| PDF text + bbox extraction (backend) | ✅ Done |
| Multi-page support | ✅ Done |
| XY-cut reading-order solver | ✅ Prototype · ✅ Backend port |
| Threshold tuning (gap thresholds derived from doc stats) | ✅ Done |
| Heuristic type classifier | ✅ Prototype · ✅ Backend port |
| Parent-child hierarchy builder | ✅ Prototype · ✅ Backend port |
| Accuracy evaluation (labeled dataset) | ✅ Done |
| Bounding-box overlay visualization | ✅ Done |
| Click-to-inspect cross-highlight | ✅ Done |
| JSON hierarchy export | ✅ Done |
| Real PDF upload (pdf.js) | ✅ Done |
| Table cell structure | 🧊 Backlog |
| Footnote-marker linking | ✅ Done |
| Grid/Excel reconstruction mode | 🧊 Backlog |

---

## Timeline

| Phase | Goal | Target date | Status |
|---|---|---|---|
| 1 | Real extraction backend + port XY-cut from prototype | `[ ]` | ✅ Done |
| 2 | Port classification + hierarchy builder, stabilize JSON export | `[ ]` | ✅ Done |
| 3 | Frontend wired to real backend output | `[ ]` | ✅ Done |
| 4 | Evaluation + one stretch goal | `[ ]` | ✅ Done |
| 5 | Thesis writeup + defense prep | `[ ]` | ⏳ Planned |

---

## Open questions

- Thesis vs. report format — confirm against department requirements.
- Evaluation dataset source — self-labeled, public corpus, or synthetic?
- Which single stretch goal is worth the time before the defense, if any.
