# Stories: Main Toolbar and Icon Migration

> Add a glass pill toolbar to the application header with pipeline status, settings, notifications, and user avatar — and migrate all 46 custom icons to Lucide for a consistent, extensible visual language.

## Stories

### Platform user — pipeline awareness

As a platform user browsing sessions, I want a persistent progress ring in the header that updates in real time so that I always know whether the pipeline is active without scanning the sidebar.

Acceptance signal: uploading a session causes the ring count to increment and animate from 0 to 1 with the cyan glow while the user remains on any other page.

---

### Platform user — pipeline inspection

As a platform user, I want to click the progress ring and see a dropdown listing every processing and queued session by name, status, and queue position so that I can understand exactly what is in flight without any guesswork.

Acceptance signal: the pipeline dropdown opens showing only session-level information — no worker counts, thread counts, or internal infrastructure details — and closes cleanly on outside click or Escape.

---

### Platform user — toolbar collapse

As a platform user, I want to collapse the toolbar pill with a smooth animation (for example by clicking the user avatar) so that I can reclaim header space when I want a less-interrupted reading experience.

Acceptance signal: clicking the collapse trigger causes the pill to shrink with a CSS transition; clicking it again expands it; no content jumps or layout shift occurs.

---

### Platform user — user presence

As a platform user, I want to see my initial or avatar in the toolbar pill so that the application acknowledges me as an individual and establishes the visual anchor for a future account menu.

Acceptance signal: the top-right of the pill shows a gradient initial circle (cyan-to-pink) that matches the Midnight Neon palette; hovering it produces a border glow matching the mockup.

---

### Platform user — settings access

As a platform user, I want a gear icon inside the toolbar pill that I can click to reach settings so that I always have a single, predictable entry point for application configuration.

Acceptance signal: the gear icon is unambiguously gear-shaped (not a sun/starburst), interactive, and positioned inside the pill between the pipeline indicator and the user avatar.

---

### Platform user — consistent icons everywhere

As a platform user, I want every icon across the application to look like it belongs to the same family so that the interface feels polished and I can recognize actions and states at a glance.

Acceptance signal: all icons — sidebar, session cards, section headers, toolbar, empty states, upload zone — render with uniform stroke weight, rounded terminals, and correct semantics; no icon is broken or missing after the migration.

---

### Self-hosting operator — pipeline transparency without exposure

As a self-hosting operator running Erika for a team, I want the pipeline status UI to show only session-level information so that internal infrastructure details (worker counts, thread pools, concurrency limits) are never visible to end users.

Acceptance signal: a manual review of the pipeline dropdown confirms no worker, thread, or memory data is rendered; status is limited to session name, processing state, and queue position.

---

### Self-hosting operator — zero new runtime dependencies

As a self-hosting operator, I want the icon migration to add no new runtime dependencies or network requests so that my deployment remains air-gappable and the upgrade introduces no operational risk.

Acceptance signal: Lucide SVGs are embedded as CSS data URIs in `icons.css`; no `lucide-vue-next` package, icon font, or external CDN request is introduced; `npm run build` produces the same output structure as before.

---

### Developer extending the platform — icon scalability

As a developer adding new features to Erika, I want to add an icon by looking up its Lucide name and writing a single CSS class definition so that I never have to hand-draw or encode SVG path data manually.

Acceptance signal: a developer can add a new icon in under two minutes by following a documented pattern — find Lucide name, copy data URI snippet, add CSS class — with no custom SVG authoring required.

---

### Developer extending the platform — faithful Vue conversion

As a frontend developer implementing the toolbar, I want the Vue component to be built by converting the approved HTML/CSS from `draft-2b-lucide.html` directly so that the design is preserved exactly and no visual drift is introduced by reimplementation from scratch.

Acceptance signal: a visual diff between a screenshot of the running Vue component and a screenshot of `draft-2b-lucide.html` shows no meaningful differences in layout, color, spacing, or typography.

---

### Developer extending the platform — dropdown overflow fix

As a frontend developer, I want the `spatial-shell__header` `overflow` to be changed from `hidden` to `visible` so that the pipeline dropdown can extend below the header boundary without being clipped.

Acceptance signal: the pipeline dropdown renders fully below the header with no clipping at any viewport height; no other layout regions are visually affected by the overflow change.

---

### Legal / compliance — Lucide attribution

As a maintainer responsible for license compliance, I want Lucide's ISC copyright notice to be recorded in a `THIRD-PARTY-LICENSES` or `NOTICES` file and referenced from the README so that the project meets its attribution obligations and any downstream user can identify the origin of embedded icon data.

Acceptance signal: a `THIRD-PARTY-LICENSES` (or equivalent) file exists containing the Lucide copyright notice and ISC license text; the README or LICENSE file includes a reference to Lucide attribution.

## Out of Scope

- Settings page or panel (toolbar provides the entry point; destination is a future cycle)
- User authentication, login, registration, and profile management
- Notification system infrastructure (bell icon is present but non-functional)
- Clickable session names in the pipeline dropdown (navigation shortcut is an opportunity, not a requirement)
- Real-time pipeline progress percentage (degrades gracefully to a spinner if the backend does not expose it)
- Responsive / mobile toolbar behavior (desktop-first; mobile adaptation is deferred)
- Animated icon transitions (e.g., menu-to-close morphing)
- Dark / light theme switching (Erika is dark-theme only at this stage)

---
**Sign-off:** Pending
