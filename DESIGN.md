# SpecStream — Visual Design Specification

**Source of truth:** `specstream-demo.html`  
**Purpose:** Document the exact visual language of the demo so any future frontend can reproduce it without consulting the HTML file directly.

---

## 1. Color Palette

All colors are declared as CSS custom properties on `:root`.

### Background Layers

| Variable | Hex | Used for |
|---|---|---|
| `--bg-main` | `#0b0f19` | Page body background; deepest layer; also used as the JSON textarea background and scrollbar track |
| `--bg-card` | `#151f32` | Header, right sidebar panel, viewer-controls bar, JSON export section, PDF viewport container background |
| `--bg-input` | `#1e293b` | Form controls (select, file upload button), secondary button background, meta-pill background |

Also used as a literal hex (not a variable):
- `#0f172a` — status bar background and inspector panel background (one shade lighter than `--bg-main`, darker than `--bg-card`)

### Text Hierarchy

| Variable | Hex | Used for |
|---|---|---|
| `--text-main` | `#f8fafc` | Primary readable text, headings, selected tree-item text, inspector text-block content |
| `--text-secondary` | `#94a3b8` | Default tree-item text, secondary button label, page indicator, status bar text, JSON export header text |
| `--text-muted` | `#64748b` | Logo subtitle, inspector labels, tree toggle/bullet glyphs, empty-state text, tree-toggle icon, status dot default fill |

### Borders

| Variable | Hex | Used for |
|---|---|---|
| `--border-color` | `#1e293b` | Default separator between all panels; same value as `--bg-input` — keeps borders subtle on dark backgrounds |
| `--border-highlight` | `#334155` | Hovered secondary buttons, select element border, meta-pill border, tree-children dashed indent line, scrollbar thumb hover |

### Accent / Interactive

| Variable | Hex | Used for |
|---|---|---|
| `--accent-primary` | `#6366f1` | Primary action button background; logo gradient endpoint; select focus ring border |
| `--accent-hover` | `#4f46e5` | Primary button hover state background |

Logo gradient (CSS `linear-gradient`, applied as clipped text):
```
linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)
```
Start color `#a5b4fc` is indigo-300 (lighter); end color `#6366f1` is `--accent-primary`.

### Block-Type Stroke Colors (Bounding Box Borders)

| Variable | Hex | Type |
|---|---|---|
| `--color-heading` | `#ef4444` | heading |
| `--color-warning` | `#f59e0b` | warning |
| `--color-footnote` | `#10b981` | footnote |
| `--color-table` | `#3b82f6` | table |
| `--color-spec` | `#8b5cf6` | spec |

### Block-Type Fill Colors (Bounding Box Backgrounds)

15% opacity tints of the stroke colors, applied as `rgba(...)`:

| Variable | RGBA | Type |
|---|---|---|
| `--bg-overlay-heading` | `rgba(239, 68, 68, 0.15)` | heading |
| `--bg-overlay-warning` | `rgba(245, 158, 11, 0.15)` | warning |
| `--bg-overlay-footnote` | `rgba(16, 185, 129, 0.15)` | footnote |
| `--bg-overlay-table` | `rgba(59, 130, 246, 0.15)` | table |
| `--bg-overlay-spec` | `rgba(139, 92, 246, 0.15)` | spec |

### Status Indicator Colors

These are applied as `background-color` + matching `box-shadow` glow on the 8 px status dot:

| State class | Hex | Glow |
|---|---|---|
| `.success` | `#10b981` | `0 0 8px #10b981` |
| `.error` | `#ef4444` | `0 0 8px #ef4444` |
| `.info` | `#3b82f6` | `0 0 8px #3b82f6` |
| *(idle/default)* | `#64748b` (`--text-muted`) | none |

### Tree Badge Colors (Type Labels in the Outline Tree)

Badges use a 20% tinted background with a lighter foreground text — both are literal hex values, not variables:

| Type | Background | Text |
|---|---|---|
| `heading` | `rgba(239, 68, 68, 0.2)` | `#f87171` |
| `warning` | `rgba(245, 158, 11, 0.2)` | `#fbbf24` |
| `footnote` | `rgba(16, 185, 129, 0.2)` | `#34d399` |
| `table` | `rgba(59, 130, 246, 0.2)` | `#60a5fa` |
| `spec` | `rgba(139, 92, 246, 0.2)` | `#a78bfa` |

Note: badge text colors are one stop lighter than the stroke colors in the bounding-box palette. Stroke colors are the "500" Tailwind shades; badge text colors are the "400" shades.

### JSON Terminal Colors

The JSON export textarea uses:
- Background: `#0b0f19` (same as `--bg-main`)
- Text: `#34d399` (emerald-400 — the same color as the footnote badge text, used here as "terminal green")

### Shadows

| Variable | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` |
| `--shadow-glow` | `0 0 15px rgba(99,102,241,0.4)` (defined but not applied via variable in current CSS; glow effects are applied inline) |

---

## 2. Typography

### Font Families

| Variable | Stack | Weights loaded |
|---|---|---|
| `--font-main` | `'Outfit', sans-serif` | 300, 400, 500, 600, 700 |
| `--font-mono` | `'JetBrains Mono', monospace` | 400, 500 |

Both fonts are loaded from Google Fonts via `<link>` in `<head>`.

### Font Usage by Context

| Context | Family | Size | Weight | Color |
|---|---|---|---|---|
| Body / default | `--font-main` | inherits (1rem = 16 px browser default) | 400 | `--text-main` |
| Logo wordmark "SpecStream" | `--font-main` | `1.5rem` | 700 | gradient clip (see §1) |
| Logo tagline subtitle | `--font-main` | `0.8125rem` | 400 | `--text-muted` |
| Buttons (all) | `--font-main` | `0.875rem` | 500 | varies by variant |
| Select dropdown | `--font-main` | `0.875rem` | 400 | `--text-main` |
| Status bar text | `--font-main` | `0.8125rem` | 400 | `--text-secondary` |
| Sidebar section heading ("Document Structure") | `--font-main` | `1.125rem` | 600 | `--text-main` |
| Sidebar outline-meta line | `--font-main` | `0.8125rem` | 400 | `--text-muted` |
| Tree item text | `--font-main` | `0.875rem` (inherited from `.tree-container`) | 400 | `--text-secondary` |
| Tree item text (selected) | `--font-main` | `0.875rem` | 500 | `white` |
| Tree toggle glyph (▼/▶) | `--font-main` | `0.65rem` | 400 | `--text-muted` |
| Tree bullet (•) | `--font-main` | `0.8rem` | 400 | `--text-muted` |
| Tree type badge | `--font-mono` | `0.65rem` | 700 | per-type (see §1) |
| Meta pills | `--font-mono` | `0.75rem` | 400 | `--text-secondary` |
| Page indicator ("Page N / M") | `--font-main` | `0.875rem` | 500 | `--text-secondary` |
| Inspector title label ("INSPECTOR") | `--font-main` | `0.75rem` | 600 | `--text-muted` |
| Inspector field labels | `--font-main` | `0.8125rem` | 400 | `--text-muted` |
| Inspector field values (default) | `--font-main` | `0.8125rem` | 400 | `--text-secondary` |
| Inspector coordinate/size values | `--font-mono` | `0.75rem` | 400 | `--text-secondary` |
| Inspector text-block (full label text) | `--font-main` | `0.875rem` | 400 | `--text-main` |
| JSON export header label | `--font-main` | `0.875rem` | 600 | `--text-secondary` |
| JSON export textarea content | `--font-mono` | `0.75rem` | 400 | `#34d399` |
| Copy button (inside JSON section) | `--font-main` | `0.75rem` | 500 | `--text-secondary` |

Inspector title uses `text-transform: uppercase` and `letter-spacing: 0.05em`.  
Tree badges use `letter-spacing: 0.05em`.  
Logo `h1` uses `letter-spacing: -0.025em` (negative — tighter than normal).

---

## 3. Layout Structure

The page is divided into four stacked horizontal zones:

```
┌─────────────────────────────────────────────────────┐
│  HEADER  (≈74 px tall, bg-card)                     │
├─────────────────────────────────────────────────────┤
│  STATUS BAR  (48 px tall, #0f172a)                  │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│  VIEWER PANEL (1fr, bg-main) │  SIDEBAR (450 px)    │
│                              │  bg-card             │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│  JSON EXPORT STRIP  (bg-card, collapses)            │
└─────────────────────────────────────────────────────┘
```

### Grid System

`main.main-container` uses CSS Grid:
- `grid-template-columns: 1fr 450px` — viewer fills all remaining width; sidebar is fixed at 450 px
- `height: calc(100vh - 74px - 48px)` — fills the full viewport minus header and status bar
- `overflow: hidden` — neither panel scrolls the full page; each panel scrolls internally

### Header

- `background-color: var(--bg-card)`
- `border-bottom: 1px solid var(--border-color)`
- `padding: 1.25rem 2rem` — generous horizontal padding
- `display: flex; justify-content: space-between; align-items: center`
- `box-shadow: var(--shadow-sm)`
- Left: logo section (wordmark + tagline)
- Right: toolbar controls (file picker, sample button, mode select, process button)

### Status Bar

- `background-color: #0f172a` (slightly lighter than page body)
- `border-bottom: 1px solid var(--border-color)`
- `height: 48px; padding: 0.5rem 2rem`
- `display: flex; align-items: center; gap: 0.75rem`
- Contains: 8 px status dot + text message string

### Viewer Panel (Left)

- `padding: 2rem` — uniform internal padding
- `overflow-y: auto` — scrolls when PDF canvas exceeds panel height
- `display: flex; flex-direction: column; align-items: center` — all content centered horizontally
- `border-right: 1px solid var(--border-color)` — separates from sidebar
- Internal stacking (top to bottom):
  1. **Viewer controls bar** — full width up to `max-width: 800px`, card-style (`border-radius: 0.75rem`), `margin-bottom: 1rem`
  2. **PDF viewport container** — `border-radius: 0.75rem`, `box-shadow: var(--shadow-lg)`, hidden until PDF loaded
  3. **Empty state** — displayed when no PDF is loaded

### Viewer Controls Bar

- `background-color: var(--bg-card)`, `border: 1px solid var(--border-color)`, `border-radius: 0.75rem`
- `padding: 0.75rem 1.25rem`
- `display: flex; justify-content: space-between; align-items: center`
- Left sub-group: `page-navigation` (◀ Prev | Page N/M | Next ▶)
- Right sub-group: `meta-pills` (Pages: N | Blocks: N | Time: Ns)

### PDF Viewport Container

- Wraps the `<canvas>` and the overlay `<div>` in a relatively-positioned inline-block container
- Canvas width is calculated at render time as `containerWidth - 40 px` (accounts for viewer panel padding)
- Overlay `<div>` is `position: absolute; top: 0; left: 0; width: 100%; height: 100%` — zero overhead, pointer-events pass through unless on a bbox element

### Sidebar Panel (Right)

Three-row CSS grid: `grid-template-rows: auto 1fr auto`

1. **Sidebar header section** (`auto`) — "Document Structure" heading + outline-meta text. `padding: 1.5rem; border-bottom: 1px solid var(--border-color)`
2. **Tree container** (`1fr`) — scrollable outline list. `padding: 1.5rem; overflow-y: auto`
3. **Inspector panel** (`auto`) — fixed at `max-height: 250px`, scrollable. `border-top: 1px solid var(--border-color); padding: 1.5rem; background-color: #0f172a`

### JSON Export Strip (Bottom)

- Outside `<main>`, below it in document flow
- `background-color: var(--bg-card); border-top: 1px solid var(--border-color); padding: 0.75rem 2rem`
- Collapsed by default (`.json-content-wrapper` is `display: none`)
- Toggle: clicking `.json-header` adds class `.expanded` which sets `display: block` on the wrapper
- Expanded: shows a 250 px tall `<textarea>` with the JSON tree

---

## 4. Block Type Color Map

The five semantic types and their visual identity across all components:

| Type | Bbox border | Bbox fill | Badge bg | Badge text | Meaning |
|---|---|---|---|---|---|
| `heading` | `#ef4444` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.2)` | `#f87171` | Numbered section titles (1., 1.1., etc.) — red signals structure anchor |
| `warning` | `#f59e0b` | `rgba(245,158,11,0.15)` | `rgba(245,158,11,0.2)` | `#fbbf24` | WARNING/CAUTION/NOTE blocks — amber/yellow is universally associated with caution |
| `footnote` | `#10b981` | `rgba(16,185,129,0.15)` | `rgba(16,185,129,0.2)` | `#34d399` | Small-font annotations — green as "supplementary/secondary" information |
| `table` | `#3b82f6` | `rgba(59,130,246,0.15)` | `rgba(59,130,246,0.2)` | `#60a5fa` | Pipe-delimited tabular rows — blue signals structured/data content |
| `spec` | `#8b5cf6` | `rgba(139,92,246,0.15)` | `rgba(139,92,246,0.2)` | `#a78bfa` | Body text / specification lines (fallback) — purple as the neutral, most-common type |

---

## 5. Interactive States

### Bounding Box Overlays

| State | Class | Opacity | Border width | Shadow | z-index |
|---|---|---|---|---|---|
| Default | `.bbox-overlay` | `0.7` | `1.5px solid` | none | auto |
| Hovered | `.bbox-overlay:hover` or `.bbox-hover` | `1` | `2.5px solid` | `0 0 10px currentColor` | `10` |
| Selected | `.bbox-selected` | `1` | `3px solid` | `0 0 15px currentColor` | `20` |

`currentColor` references the element's CSS `color` property, but since the border-color is set directly (not via `color`), the glow effect in practice uses the border color value for the glow because `box-shadow` uses `currentColor` which resolves to the element's text color — in this implementation the glow effectively uses `currentColor` as inherited. The visual result is a type-colored halo whose intensity increases: idle → hover (10 px spread) → selected (15 px spread).

Transition: `all 0.15s ease-in-out` on all bbox elements.

### Tree Nodes

| State | Class | Background | Border | Text color | Font weight |
|---|---|---|---|---|---|
| Default | `.tree-item-header` | transparent | `1px solid transparent` | `--text-secondary` | 400 |
| Hovered | `.tree-item-header:hover` | `--bg-input` (`#1e293b`) | transparent | unchanged | 400 |
| Selected | `.tree-selected > .tree-item-header` | `rgba(99,102,241,0.15)` | `rgba(99,102,241,0.3)` | `white` | 500 |

When a tree node has children, hovering/selecting the bbox overlay on the canvas also adds `.bbox-hover` to the overlay — and vice versa, hovering the tree node adds `.bbox-hover` to the canvas overlay. This bidirectional sync is JavaScript-driven (`mouseenter`/`mouseleave` listeners).

Transition: `all 0.15s` on `.tree-item-header`.

### Buttons

| Variant | Default bg | Default text | Hover bg | Hover transform |
|---|---|---|---|---|
| `.btn-primary` | `--accent-primary` (`#6366f1`) | `white` | `--accent-hover` (`#4f46e5`) | `translateY(-1px)` |
| `.btn-secondary` | `--bg-input` (`#1e293b`) | `--text-secondary` | `--border-highlight` (`#334155`) + text becomes `--text-main` | `translateY(-1px)` |
| `.btn-danger` | `rgba(239,68,68,0.1)` | `#ef4444` | `rgba(239,68,68,0.2)` | `translateY(-1px)` |

All buttons transition with `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.

### Copy JSON Button (Feedback State)

After successful clipboard copy, the button temporarily changes for 2000 ms:
- `backgroundColor` → `rgba(16,185,129,0.1)` (footnote green tint)
- `color` → `#10b981` (footnote green)
- Text → "Copied!"
Then reverts to original values.

### Select Dropdown

- Focus state: `border-color: var(--accent-primary)` + `box-shadow: 0 0 0 2px rgba(99,102,241,0.2)` (2 px ring, no blur, 20% opacity indigo)

---

## 6. Bounding Box Rendering Rules

### Base Appearance

- `position: absolute` within the overlay layer
- `border: 1.5px solid [--color-<type>]` — solid stroke, not dashed
- `border-radius: 2px` — minimal rounding, nearly square corners
- `background-color: [--bg-overlay-<type>]` — 15% opacity tint fill
- `opacity: 0.7` at rest — allows PDF text beneath to remain legible

### Coordinate Mapping

Bboxes from the pipeline are in PyMuPDF's PDF-space (points, page-relative). At render time, all coordinates are scaled linearly by `scale = containerWidth / pdfPageWidth`. The overlay `<div>` is positioned identically to the canvas, so no further offset is needed:

```javascript
const x = bbox.x * scale;
const y = bbox.y * scale;
const w = bbox.w * scale;
const h = bbox.h * scale;
```

`left`, `top`, `width`, `height` are set as `${value}px` style properties.

### Stroke Weight Progression

| State | `border-width` |
|---|---|
| Rest | `1.5px` |
| Hover | `2.5px` |
| Selected | `3px` |

No dashed patterns. All borders are solid at all states.

### Fill Behavior

Fill is always present (the 15% tint). It does not change on hover or select. The visual "selection" effect comes entirely from increased stroke weight + glow shadow, not from fill change.

### Opacity Behavior

There is no explicit dimming of non-selected boxes when one is selected. All unselected boxes remain at `0.7` opacity; the selected box raises to `1.0`. The higher z-index (`20` vs auto) ensures the selected box always renders on top.

No reading-path waypoint dots or connecting lines are rendered in the current implementation. The ROADMAP prototype had a reading-path concept, but the current wired frontend does not implement it.

---

## 7. Reading Path Style

> **Note:** The current production frontend (`specstream-demo.html`) does **not** render a reading path overlay. The reading-order is exposed through the JSON tree and the sequential position of nodes in the outline, not through visual path lines. If a future implementation adds a reading path, the following describes the intended design from the earlier prototype:

- **XY-cut mode path:** Cyan (`#22d3ee` or similar) numbered waypoint dots with connecting dashed lines — signals the "corrected" ordering
- **Naive mode path:** Red-orange (around `#f97316`) — signals the degraded naive reading order for comparison

The mode selector in the header (`select#processing-mode`) still has "XY-Cut" vs "Naive" options, but the path visualization is not yet implemented in the wired frontend.

---

## 8. Component Patterns

### Buttons (`.btn`)

- `border-radius: 0.5rem` (8 px)
- `padding: 0.625rem 1.25rem` (10 px / 20 px) — default size
- Small variant (page nav buttons): `padding: 0.4rem 0.8rem`
- Compact variant (copy button): `padding: 0.25rem 0.75rem; font-size: 0.75rem`
- `border: 1px solid transparent` base — border-color overridden per variant
- Icon-text gap: `gap: 0.5rem`
- Transition: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`

### Select Dropdown

- Same `border-radius: 0.5rem` and `padding: 0.625rem 1rem` as buttons
- Right padding `2rem` to clear the custom SVG chevron arrow icon
- Custom chevron via `background-image` with an SVG data URI (`stroke='%2394a3b8'` = `#94a3b8`)
- `appearance: none` to suppress browser default arrow

### Meta Pills (`.pill`)

- `background-color: var(--bg-input)`
- `border: 1px solid var(--border-highlight)`
- `color: var(--text-secondary)`
- `font-size: 0.75rem; font-family: var(--font-mono)`
- `padding: 0.25rem 0.625rem`
- `border-radius: 2rem` — fully rounded (pill/capsule shape)

### Tree Type Badges (`.tree-badge`)

- `font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700`
- `padding: 0.125rem 0.375rem`
- `border-radius: 0.25rem` (4 px) — small rectangular chip
- `letter-spacing: 0.05em`
- Background/text per type (see §4 and §1)

### Tree Children Indent

- `padding-left: 1.25rem`
- `border-left: 1px dashed var(--border-highlight)` — dashed vertical connector line on the left edge
- `margin-left: 0.4rem`

### Tree Toggle (▼/▶)

- Collapsed state: `▶` text, `.expanded` class removed
- Expanded state: `▼` text, `.expanded` class present
- `transition: transform 0.15s` (the class does not actually apply a rotation in CSS; the icon character itself changes via JS)
- Size: `0.65rem` font, `width: 14px` container
- Color: `--text-muted`

### Inspector Grid

- `display: grid; grid-template-columns: 80px 1fr`
- `row-gap: 0.5rem`
- Label column: 80 px fixed, `--text-muted`
- Value column: `1fr`, `--text-secondary` (or `--font-mono` at `0.75rem` for coordinates)
- "Text content" label: `grid-column: 1 / -1; margin-top: 0.5rem; font-weight: 600`
- Text-block below: `grid-column: 1 / -1; background: --bg-main; border: 1px solid --border-color; border-radius: 0.375rem; padding: 0.75rem; max-height: 100px; overflow-y: auto`

### Inspector Panel

- `background-color: #0f172a` (slightly lighter than page body)
- `border-top: 1px solid var(--border-color)`
- `padding: 1.5rem; max-height: 250px; overflow-y: auto`
- Section title (`.inspector-title`): uppercase, 0.05em letter-spacing, `0.75rem` size, `--text-muted`, `margin-bottom: 0.75rem`

### JSON Export Section Collapse

- Toggle is the entire `.json-header` div (cursor: pointer)
- Collapsed → expanded: `jsonSection.classList.toggle('expanded')`
- Chevron `▶` before the `h3` text: `content: '▶'; font-size: 0.6rem; transition: transform 0.2s`
- Expanded state rotates chevron: `.expanded .json-header h3::before { transform: rotate(90deg) }`

### Viewer Controls Bar

- `background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 0.75rem`
- `padding: 0.75rem 1.25rem`
- Constrained to `max-width: 800px` (matches reasonable PDF width)

### Empty State

- `display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%`
- Icon: `font-size: 3rem; opacity: 0.5; margin-bottom: 1rem` (emoji)
- Heading: `color: --text-secondary; margin-bottom: 0.5rem`
- Body: `color: --text-muted`

### Custom Scrollbars (WebKit)

- Track: `background: #0b0f19` (page body)
- Thumb: `background: #1e293b; border-radius: 4px`
- Thumb hover: `background: #334155`
- Width/height: `8px`

---

## Quick Reference: CSS Variable Summary

```
--bg-main:            #0b0f19   page body
--bg-card:            #151f32   panels, header, viewer controls
--bg-input:           #1e293b   inputs, secondary buttons, pills
--text-main:          #f8fafc   primary text
--text-secondary:     #94a3b8   secondary/default text
--text-muted:         #64748b   labels, placeholders, icons
--border-color:       #1e293b   all panel dividers
--border-highlight:   #334155   active borders, dashed indent
--accent-primary:     #6366f1   CTA button, focus rings
--accent-hover:       #4f46e5   CTA button hover
--color-heading:      #ef4444   heading bbox stroke
--color-warning:      #f59e0b   warning bbox stroke
--color-footnote:     #10b981   footnote bbox stroke
--color-table:        #3b82f6   table bbox stroke
--color-spec:         #8b5cf6   spec bbox stroke
--bg-overlay-heading: rgba(239,68,68,0.15)
--bg-overlay-warning: rgba(245,158,11,0.15)
--bg-overlay-footnote:rgba(16,185,129,0.15)
--bg-overlay-table:   rgba(59,130,246,0.15)
--bg-overlay-spec:    rgba(139,92,246,0.15)
--font-main:          'Outfit', sans-serif
--font-mono:          'JetBrains Mono', monospace
```

Literal values not in variables:
```
#0f172a    status bar + inspector panel bg (between bg-main and bg-card)
#a5b4fc    logo gradient start (indigo-300)
#34d399    JSON textarea text (emerald-400 / terminal green)
#f87171    heading badge text (red-400)
#fbbf24    warning badge text (amber-400)
#34d399    footnote badge text (emerald-400)
#60a5fa    table badge text (blue-400)
#a78bfa    spec badge text (violet-400)
```
