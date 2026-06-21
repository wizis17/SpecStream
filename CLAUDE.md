# CLAUDE.md — SpecStream

Context file for Claude Code when working in this repository. SpecStream is a final-year IT Engineering project: a layout-aware parser for technical datasheets and engineering spec sheets that preserves multi-column reading order and parent-child structure, which generic PDF/text extractors destroy.

## Problem statement

Standard PDF text extraction reads in raw stream order, which bleeds left-to-right across multi-column layouts (e.g. two specification columns get interleaved line-by-line instead of read fully top-to-bottom per column). It also flattens nested structure: section numbering, sub-bullets, tables, footnotes, and warning callouts all come out as one undifferentiated text blob with no parent-child relationships.

SpecStream fixes the reading-order problem with a spatial XY-cut algorithm (recursive projection-profile cuts, the same family of technique used by OpenDataLoader) and reconstructs hierarchy with heuristic classification, then exposes both as bounding-box overlays a frontend can use for interactive source highlighting.

## Scope

**Core deliverable (must work, this is the thesis):**
- Text + bounding-box extraction from PDF pages
- XY-cut recursive reading-order solver (horizontal cut first, then vertical, recursing until no valid gap remains)
- Heuristic parent-child hierarchy builder (numbering depth, font size, keyword-based type classification: heading / spec / warning / footnote / table)
- Bounding-box visualization layer, exported as page-relative coordinates so a frontend can highlight exact source regions
- JSON export of the resulting hierarchy tree

**Stretch goals (do not block the core deliverable on these):**
- True table cell structure (rows/columns/merged cells) — likely needs an existing model (e.g. table-transformer) rather than hand-rolled heuristics
- Footnote-marker-to-source linking (superscript/bracket markers resolved back to their referent)
- Grid/Excel-export reconstruction mode: column/row clustering by x/y position for PDFs that are flat exported spreadsheets rather than multi-column prose. This is a different algorithm from XY-cut (clustering, not recursive cuts) and should live as a separate pipeline path, not be bolted onto the XY-cut function.

**Explicitly out of scope:** OCR for scanned/non-text PDFs, arbitrary document layouts unrelated to engineering datasheets, multi-language support beyond English.

## Pipeline architecture

```
PDF page
  → extract text items with bounding boxes (x, y, w, h, font size)
  → XY-cut(blocks) → reading-order sequence
  → classify(text, fontSize) → semantic type per block
  → buildHierarchy(orderedBlocks) → parent-child tree (stack-based on heading depth)
  → render bbox overlay (page-relative coords, color-coded by type)
  → export JSON tree + bbox layer
```

### XY-cut algorithm notes
- At each recursion: look for a horizontal whitespace gap spanning the full region first (merge blocks' y-intervals, find gaps ≥ `H_GAP` threshold). If found, split into top/bottom bands and recurse.
- If no horizontal cut, look for a vertical gap (merge x-intervals, find gaps ≥ `V_GAP` threshold). If found, split into left/right columns and recurse — this is what fixes multi-column bleed, since each column becomes its own subtree read fully before moving to the next.
- If neither cut is found, it's a leaf: sort remaining blocks by (y, then x) as a fallback.
- Thresholds need tuning per document family — too low over-splits on normal line spacing, too high misses real column/section breaks. Don't hardcode one global value if the project grows beyond the prototype; consider deriving thresholds from the median line-height of the document.

### Classification heuristics (current, hand-rolled)
- Warning: keyword match (`WARNING`, `CAUTION`, `NOTE:`, `⚠`)
- Footnote: small font size relative to body text
- Heading: leading numbering pattern (`1`, `1.1`, `1.1.1`...), depth = number of dot-separated groups
- Table row: pipe-delimited or otherwise column-aligned text
- Fallback: spec/body line

These are intentionally simple for the prototype. If accuracy becomes a thesis evaluation criterion, this is the part most worth replacing with a small trained classifier rather than more regex.

## Suggested tech stack

- **Extraction:** PyMuPDF (`fitz`) or `pdfplumber` for text + bbox extraction; both expose word/line-level coordinates needed for XY-cut.
- **Stretch table parsing:** table-transformer or similar, not custom-built.
- **Visualization:** render page to image (PyMuPDF or `pdf2image`) and overlay bboxes, or do it client-side with `pdf.js` + canvas (already prototyped this way in the browser demo).
- **Output format:** JSON tree with `{type, label, bbox: {page, x, y, w, h}, children}` shape — keep this stable since the frontend highlight feature depends on it.

## Known prototype artifact

A standalone single-file HTML/JS proof-of-concept exists (`specstream-demo.html`) demonstrating the XY-cut reading-order fix and bbox visualization on a synthetic two-column datasheet, with optional experimental real-PDF upload via `pdf.js`. It is a demo, not the production pipeline — it draws synthetic sample text directly to canvas rather than using a real extraction backend. Treat it as a reference for the intended UX (naive-order vs. XY-cut-order toggle, click-to-inspect bbox/hierarchy cross-highlighting, JSON export), not as code to extend in place for the thesis backend.

## Working conventions

- Keep the XY-cut function and the hierarchy/classification logic decoupled — reading order and semantic typing are separate concerns and should be testable independently.
- Any new document-family support (e.g. grid/Excel reconstruction) should be its own pipeline module, not a branch grafted into the XY-cut function.
- Favor explicit, inspectable heuristics over opaque ones early on — this is a thesis project, and being able to explain *why* a block was classified or cut a certain way matters as much as raw accuracy.
- When in doubt about scope creep, default to the core deliverable list above and flag stretch-goal work explicitly rather than silently expanding scope.
