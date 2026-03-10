# Chosen Direction: B Refined

**Date:** 2026-02-27
**Updated:** 2026-03-10 — aligned with `design/styles/layout.css` as single source of truth
**Source:** `design/styles/layout.css` (canonical), `direction-b-refined-v1.html` (initial reference)

## Summary

Direction B's polished developer-tool layout (Geist fonts, rounded cards, pill filters, subtle elevation) with terminal-inspired accents (mint green primary, warm orange secondary). Warm mid-gray backgrounds create a comfortable reading environment distinct from the near-black terminal chrome.

## Authoritative Token Values

All values below are from `design/styles/layout.css` — the single source of truth.

### Color System

#### Backgrounds (warm mid-gray hierarchy)
- **Page:** `--bg-page` #484850
- **Surface:** `--bg-surface` #4e4e56
- **Elevated:** `--bg-elevated` #58585f
- **Overlay:** `--bg-overlay` rgba(0,0,0,0.55)

#### Accents
- **Primary (mint green):** `--accent-primary` #00ff9f
  - Hover: `color-mix(in srgb, #00ff9f 80%, white)`
  - Dim: `color-mix(in srgb, #00ff9f 55%, #484850)`
  - Subtle: `color-mix(in srgb, #00ff9f 7%, transparent)`
- **Secondary (warm orange):** `--accent-secondary` #ffc48a
  - Hover: #ffd0a1
  - Dim: #ad8c70
  - Subtle: `color-mix(in srgb, #ffc48a 7%, transparent)`

#### Status Colors
- Success: #78e3bd | Warning: #ffcc00 | Error: #ffc0bd | Info: #8fdafc
- Each has `-subtle` variant for backgrounds

#### Text Hierarchy
- Primary: #f8f8f8 | Secondary: #d5d9e0 | Muted: #ccd0d5 | Disabled: #a7abaf

#### Borders
- Default: #aaaab0 | Strong: #adaeb4 | Accent: uses `--accent-primary`

#### Terminal
- Background: `--terminal-bg` #1e1e22 (distinctly darker than page bg)
- Text: `--terminal-text` #dcdcdc

### Typography

- **Body:** Geist, -apple-system, BlinkMacSystemFont, sans-serif
- **Mono:** Geist Mono, JetBrains Mono, monospace
- **Scale (minor third, 1.2 ratio, 14px base):** xs 10px, sm 12px, base 14px, lg 17px, xl 20px, 2xl 24px, 3xl 29px
- **Weights:** normal 400, medium 500, semibold 600, bold 700

### Spacing (4px base grid)

2px, 4px, 6px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Shape

- Radius: sm 4px, md 6px, lg 8px, xl 10px, full 9999px
- Pill shapes for filters/tags

### Layout

- Container max: 960px | Container padding: 24px
- Header height: 56px | Grid gap: 16px

### Effects

- Shadows: sm, md, lg (elevation levels)
- Glows: accent (green), error (red)
- Animation durations: fast 150ms, normal 250ms, slow 400ms
- Easing: ease-out (default)

## Key Design Decisions

- **Typography:** Geist (UI) + Geist Mono (code/terminal)
- **Primary accent:** #00ff9f (mint green) — links, interactive elements, detected sections
- **Secondary accent:** #ffc48a (warm orange) — markers, Claude Code badges
- **Backgrounds:** Warm mid-gray hierarchy (#484850 → #4e4e56 → #58585f) — NOT near-black
- **Terminal chrome:** Near-black (#1e1e22) contrasts against warm gray page — traffic light dots, titled, rounded corners
- **Shape:** Medium radius (4-10px), pill shapes for filters/tags, subtle shadows
- **Upload button:** Ghost/outlined green, fills on hover
- **Section differentiation:** Green for Detected, orange for Marker sections

## Component Library

66 BEM component classes in `design/styles/components.css` covering: cards, buttons (5 variants), inputs, badges, session cards, toasts, app header, search bar, filter pills, upload zone, section headers, modals, empty states, 7 loader types, dropdowns, terminal chrome, navigation, session viewer.

39 SVG icons in `design/styles/icons.css` with 6-level sizing scale.

## Mood

"Polished, but lives in the terminal." Developer tool built by terminal people. Warm and readable, with terminal elements that pop against the mid-gray background.
