# PLAN: Design System Bootstrap

Branch: design-system-bootstrap
Date: 2026-02-27 (updated 2026-03-03)
Status: Approved — Stages 0-4 complete, Stages 5-11 in progress
Depends on: ADR.md approval

## Stages Overview

| Stage | Deliverable | Owner | Depends on | Status |
|-------|------------|-------|------------|--------|
| 0 | Current app audit + observation document | Frontend Designer | Nothing | Done |
| 1 | Three visual directions (DS-1) | Frontend Designer | Stage 0 | Done |
| 2 | User picks direction | User | Stage 1 | Done — "B Refined" chosen |
| 3 | Design tokens (DS-2) | Frontend Designer | Stage 2 | Done |
| 4 | Component library (DS-3) | Frontend Designer | Stage 3 | Done |
| 5 | Landing page mockups (DS-4) | Frontend Designer | Stage 4 | TODO |
| 6 | Session detail page mockups (DS-5) | Frontend Designer | Stage 4 | TODO |
| 7 | Auth screens (DS-6) | Frontend Designer | Stage 4 | TODO |
| 8 | Upload modal (DS-7) | Frontend Designer | Stage 4 | TODO |
| 9 | Session edit modal (DS-8) | Frontend Designer | Stage 4 | TODO |
| 10 | Curation slide-over (DS-9) | Frontend Designer | Stage 6 | TODO |
| 11 | 404 + error states (promoted from DS-13) | Frontend Designer | Stage 4 | TODO |

Stages 5 through 9 are parallelizable (no file overlap, all depend on Stage 4 only).
Stage 10 depends on Stage 6 because the curation panel coexists with the session detail layout.
Stage 11 can run in parallel with Stages 5-9.

---

## Toolchain

Stages 0-4 were started with Penpot but migrated to **HTML + CSS files** with **Playwright MCP** for screenshots and visual verification. All remaining stages use this workflow:

- **Design in:** HTML files under `stage-N/`- **Verify with:** Playwright MCP screenshots (headless Chrome)
- **Color science:** `node agents/scripts/color-science.mjs` (zero-dependency OKLCH tool)
- **Reference server:** `npx http-server .state/design-system-bootstrap -p 8787`

---

## Shared CSS Architecture

All stage HTML files import shared CSS in this order:

```html
<link rel="stylesheet" href="../shared/layout.css">
<link rel="stylesheet" href="../shared/page.css">
<link rel="stylesheet" href="../shared/components.css">
<link rel="stylesheet" href="../shared/icons.css">
```

### Source of Truth Files

| File | Purpose | Source of Truth For |
|------|---------|---------------------|
| `shared/layout.css` | Foundation | All design tokens (`:root` custom properties), Google Fonts import, reset, grid/layout utility classes |
| `shared/page.css` | Page scaffold | Page container, page header, sections, dividers, state showcase layout, showcase grids, inline utilities |
| `shared/components.css` | Reusable UI | All component styles — buttons, inputs, cards, badges, toasts, modals, dropdowns, upload zones, etc. |
| `shared/icons.css` | Icon utilities | Icon sizing scale and utility classes |

Each file has a complete table of contents in its header comment. **Read the file itself for the class catalog** — this plan does not duplicate class names or token values.

### Rules

- No `:root` block in individual stage HTML files — all tokens live in `layout.css`
- No class redefinition — use the shared classes, don't duplicate them in stage `<style>` blocks
- `var()` cannot be used inside `repeat(auto-fill, ...)` — use raw px values with a comment
- Component styles reused across stages go in `components.css`, not in stage HTML
- Stage-specific presentation styles stay in the HTML file's `<style>` block
- BEM naming convention throughout: `.block__element--modifier`

### Naming Conventions

- Tokens: `--category-name` (e.g. `--bg-page`, `--text-primary`, `--space-4`, `--radius-md`)
- Components: `.component` with BEM modifiers (e.g. `.btn--primary`, `.card--compact`)
- Page scaffold: `.page`, `.section`, `.state-group` etc.
- Utilities: `.grid--2col`, `.text-muted`, `.flex-fill` etc.

---

## Visual Reference Standard

**`stage-4/components.html`** is the canonical visual reference for the design system. It demonstrates every component in every state, using only shared CSS classes and tokens. All subsequent stages (5-11) must be visually consistent with this file.

### Deferred Variants

Warm-dark and high-contrast palette variants are archived in `stage-4/defered/` for future exploration. These are not part of the current standard.

---

## Completed Stages

### Stage 0: Explore the Current Application — DONE

Screenshots and observations captured. Documented in `screenshots/OBSERVATIONS.md`.

### Stage 1: Three Visual Directions (DS-1) — DONE

Three HTML direction files produced:
- `directions/direction-a-tui.html` — Terminal/TUI aesthetic
- `directions/direction-b-devtool.html` — Developer tool aesthetic
- `directions/direction-c-editorial.html` — Editorial/magazine aesthetic

### Stage 2: Direction Selection — DONE

User chose **Direction B Refined** (Geist fonts, `#00ff9f` green, `#ff6b2b` orange). Documented in `directions/CHOSEN.md`. Visual reference: `directions/direction-b-refined-v1.html`.

### Stage 3: Design Tokens (DS-2) — DONE

All tokens extracted into `shared/layout.css` `:root` block. Categories: colors (backgrounds, accents, status, text, borders, terminal), typography (Geist family, minor third scale from 14px, line heights, tracking, weights), spacing (4px base grid), layout (960px container, grid utilities, breakpoints), component sizing, shape (radius scale), shadows/glows, animation (durations, easing).

### Stage 4: Component Library (DS-3) — DONE

21 components built in `shared/components.css`, all demonstrated with full state coverage in `stage-4/components.html`. Components include interactive states (hover, active, disabled, error, loading) for all interactive elements.

Additionally: `shared/page.css` (page scaffold classes) and `shared/icons.css` (icon sizing) were created.

Mockup pages also completed during Stage 4:
- `mockups/tokens.html` — Token reference page
- `mockups/components.html` — Component catalog
- `mockups/landing-empty.html` — Landing page empty state
- `mockups/landing-populated.html` — Landing page with sessions
- `mockups/landing-empty-search.html` — Empty search results

---

## Remaining Stages (5-11)

### General Instructions for All Remaining Stages

- **Output format:** HTML file in `stage-N/` directory
- **Import all 4 shared CSS files** in the standard order
- **Use only shared classes and tokens** — no raw hex values, no inline styles for things that have token equivalents
- **Page-specific layout** goes in a `<style>` block in the HTML file
- **Visual consistency:** Must match `stage-4/components.html` in look and feel
- **Verify with Playwright** screenshots after completing each frame

---

### Stage 5: Landing Page Mockups (DS-4)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML files in `stage-5/`

Note: Some landing page mockups were produced early during Stage 4 in `mockups/`. Review existing `mockups/landing-*.html` files for reference — rebuild in `stage-5/`.

#### Frames to Produce

1. **Empty state (first-run, no sessions)**
   - Upload zone centered and prominent (this is the ONLY action)
   - Personality-driven empty state copy (not "No data found")
   - Hint linking to AGR for recording sessions
   - Full header visible (but no workspace switcher, no user menu if pre-auth)

2. **Populated state (sessions exist)**
   - Upload zone in collapsed/compact position (strip above list, or button in header triggers modal)
   - Search bar (left) + agent type filter pills (right) above session list
   - Session cards: 4-6 cards showing variety (different filenames, agent types, file sizes, dates)
   - One card in "processing" state (spinner/pulse)
   - Full header with all slots filled

3. **Empty search results**
   - Active search term visible in search bar
   - Active filter pills selected
   - "No sessions match" message with personality
   - Clear/reset affordance

4. **Loading state**
   - Skeleton placeholders for session cards (3-4 skeleton cards)
   - Search bar and filters visible but disabled/muted

#### Design Notes

- Session cards should show: filename (monospace), agent type badge, marker count, detected section count, upload date, file size
- Card hover state should be visible on at least one card
- The landing page max-width is currently 960px (per `--container-max`)

#### Exit Criteria

- [ ] All 4 frames produced (or existing mockups updated to match current component standard)
- [ ] Empty state has personality-driven copy
- [ ] Populated state shows search + filters + diverse cards
- [ ] Processing card state visible
- [ ] Loading skeleton state visible
- [ ] All components use shared CSS classes only

---

### Stage 6: Session Detail Page Mockups (DS-5)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML file(s) in `stage-6/`

#### Frames to Produce

1. **Full render (sections expanded)**
   - Page header: back/breadcrumb + filename (monospace) + agent badge + edit button + prev/next arrows
   - Terminal chrome fills remaining vertical space
   - 3-4 sections visible, expanded, with sticky headers
   - Section headers show: chevron, label, type badge (Marker vs Detected with visual distinction), line range, "Curate" affordance on hover
   - Terminal content: realistic-looking monospace text (can be placeholder but should look like terminal output, not lorem ipsum)

2. **Collapsed sections**
   - Same layout, but 2 of the sections are collapsed
   - One section expanded for contrast

3. **Curation affordance on hover**
   - One section header in hover state
   - "Curate" button/icon visible on the right edge of that header
   - Annotation: "clicking this opens the curation panel (Stage 10)"

4. **Processing state**
   - Session uploaded but detection not complete
   - Info banner at top of terminal chrome: "Sections are being detected. This page will update automatically."
   - Show partial content if available, or a pulsing placeholder if not

5. **Not found / error state**
   - Session ID does not exist or loading failed
   - Personality-driven error message
   - Link back to session list

#### Design Notes

- Section header for "Marker" type should be visually distinct from "Detected" type — use existing badge and section-header component variants
- Previous/next arrows should use the shared nav-arrow component

#### Exit Criteria

- [ ] All 5 frames produced
- [ ] Marker vs Detected sections are visually distinct beyond badge text
- [ ] Curation affordance is visible and annotated
- [ ] Processing state has informative banner
- [ ] Previous/next session navigation visible in header
- [ ] Terminal content is realistic and readable

---

### Stage 7: Auth Screens (DS-6)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML file(s) in `stage-7/`
#### Frames to Produce

1. **Login page (`/login`)**
   - RAGTS brand mark
   - Email + password fields
   - "Sign in" primary button
   - Divider: "or continue with"
   - 1-2 generic OIDC provider buttons (e.g., "Continue with SSO" — do not design for specific providers)
   - "Create an account" link below (conditionally visible when open registration is enabled)
   - "Forgot password?" link (placeholder, no target page needed)

2. **Registration page (`/register`) — open mode**
   - Email, password, confirm password fields
   - "Create account" primary button
   - "Already have an account? Sign in" link

3. **Registration page (`/register`) — invite-only mode**
   - Invite code / token field (single field)
   - Explanatory text: "Registration requires an invite code from your workspace administrator"
   - "Continue" button
   - If valid code: reveal email + password fields (or navigate to a second step)

4. **First-run bootstrap (`/setup`)**
   - Heading: "Set up RAGTS" or similar
   - Explanatory text: "Create the first administrator account to get started"
   - Email + password + confirm password fields
   - "Create admin account" primary button
   - No links to login/register (there are no accounts yet)

#### Design Notes

- Auth pages have no header/nav — they are standalone
- Use shared card, input, and button components throughout
- Forms should demonstrate the input component's error state (at least one field showing validation error in one frame)
- The bootstrap page should feel like a welcome/setup experience, not a registration form

#### Exit Criteria

- [ ] All 4 frames produced
- [ ] Login shows both email/password and OIDC patterns
- [ ] Invite-only registration variant is distinct from open registration
- [ ] Bootstrap page has setup/welcome tone
- [ ] At least one input field shows error/validation state

---

### Stage 8: Upload Modal (DS-7)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML file(s) in `stage-8/`
#### Frames to Produce

1. **Pre-drop state** — Modal open, empty drag-and-drop zone, agent type dropdown (default: Claude), "Browse files" button
2. **File dropped state** — File selected, showing filename + file size preview, agent type confirmed, "Upload" primary button enabled
3. **Uploading state** — Progress indicator (determinate or indeterminate), disabled controls
4. **Success state** — Checkmark, "Session uploaded successfully" message, "Open session" link, modal auto-closes after delay or on click

#### Design Notes

- The modal uses the shared modal shell component
- Agent type dropdown options: Claude, Claude Code, Gemini CLI, Codex, Other (free text)
- The drag-and-drop zone inside the modal should match the visual language of the landing page upload zone (compact variant)

#### Exit Criteria

- [ ] All 4 state frames produced
- [ ] Agent type selection visible
- [ ] File preview (name + size) visible in dropped state
- [ ] Uses shared modal and dropdown components

---

### Stage 9: Session Edit Modal (DS-8)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML file(s) in `stage-9/`
#### Frames to Produce

1. **Editing state** — Modal with editable fields: filename (text input, monospace), agent type (dropdown). Read-only display: upload date, file size, section count. Save + Cancel buttons.
2. **Save success** — Modal closes, toast appears ("Session updated")

#### Design Notes

- Triggered by pencil/edit icon on session detail page header
- Simple and quick — this is a lightweight interaction
- Read-only fields should be visually distinct from editable fields (no border, muted text, or label-value layout)

#### Exit Criteria

- [ ] Both frames produced
- [ ] Editable vs read-only fields are visually distinct
- [ ] Uses shared modal, input, dropdown, button, and toast components

---

### Stage 10: Curation Slide-Over Panel (DS-9)

**Owner:** Frontend Designer
**Depends on:** Stage 6 (session detail layout)
**Output:** HTML file(s) in `stage-10/`
#### Frames to Produce

1. **Panel open, in context** — The session detail page with the curation panel visible alongside terminal content. Panel shows:
   - Section label (from the curated section)
   - Compact preview: first 3 lines of terminal content from the section (monospace, muted)
   - Title field: text input (override auto-detected label)
   - Tags field: multi-select with free-form input and suggestions
   - Notes field: textarea (markdown-lite, optional)
   - Retrieval intent: dropdown/radio (Debugging pattern, Architecture decision, Error recovery, Workflow example, Other)
   - Save curation + Cancel buttons

2. **Panel with populated data** — Same layout but fields are filled in (show what a completed curation looks like before saving)

3. **Panel standalone (for component reference)** — The panel isolated from the page context, showing full height and all fields. This is the reference for implementation.

#### Design Notes

- The curation panel is the product's differentiating feature. It should feel intentional and purposeful — not an afterthought or a tacked-on form
- The section preview (3 terminal lines in monospace) connects the annotation to the content. It reminds the user what they are curating
- Tags should look like pills/chips with an "add" affordance
- The retrieval intent field explains to the user WHY they are curating: this annotation will be used by agents. Copy/microcopy should reinforce this
- Responsive behavior: panel should adapt at narrow viewports

#### Exit Criteria

- [ ] All 3 frames produced
- [ ] Panel coexists with terminal content in the in-context frame
- [ ] Section preview is visible and in monospace
- [ ] Tags use pill/chip pattern
- [ ] Retrieval intent has clear options
- [ ] The panel feels intentional, not like a hastily attached form

---

### Stage 11: 404 and Error States (Promoted from DS-13)

**Owner:** Frontend Designer
**Depends on:** Stage 4
**Output:** HTML file(s) in `stage-11/`
#### Frames to Produce

1. **404 Not Found page** — Full page with header. Personality-driven message (not "Page not found"). Link back to session list. The copy should match the product's irreverent voice.

2. **Session loading skeleton** — Skeleton placeholder for the session detail page while data loads. Terminal chrome frame with pulsing/shimmer placeholder content.

3. **Session list loading skeleton** — Skeleton placeholder for session cards (3-4 shimmering card shapes).

4. **Session processing banner** — The info banner that appears at the top of the session detail terminal chrome when detection is still running. (This also appears in Stage 6 frame 4, but include it here as a standalone component reference.)

5. **Session failed state** — What the session detail page shows when processing failed. Error message, "Retry" button, link back to session list.

#### Design Notes

- Use shared skeleton component for all loading placeholders
- Error states should provide actionable next steps, not just "something went wrong"
- The 404 page is an opportunity for product personality

#### Exit Criteria

- [ ] All 5 frames produced
- [ ] 404 has personality-driven copy
- [ ] Skeletons are subtle and realistic (match card/terminal chrome shapes)
- [ ] Error states have actionable messaging

---

## Summary: Full Deliverable Checklist

| Stage | DS Item | Output | Status |
|-------|---------|--------|--------|
| 0 | Exploration | `screenshots/OBSERVATIONS.md` | [x] Done |
| 1 | DS-1: Directions | `directions/direction-{a,b,c}-*.html` | [x] Done |
| 2 | User choice | `directions/CHOSEN.md` — "B Refined" | [x] Done |
| 3 | DS-2: Tokens | `shared/layout.css` `:root` block | [x] Done |
| 4 | DS-3: Components | `shared/components.css` + `stage-4/components.html` | [x] Done |
| 5 | DS-4: Landing | 4 frames in `stage-5/` | [ ] |
| 6 | DS-5: Session detail | 5 frames | [ ] |
| 7 | DS-6: Auth | 4 frames | [ ] |
| 8 | DS-7: Upload modal | 4 frames | [ ] |
| 9 | DS-8: Session edit modal | 2 frames | [ ] |
| 10 | DS-9: Curation panel | 3 frames | [ ] |
| 11 | Error states | 5 frames | [ ] |
| **Total** | | **~27 remaining frames** | |
