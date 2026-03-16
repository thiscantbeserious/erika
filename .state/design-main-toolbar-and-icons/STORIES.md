# Stories: Main Toolbar and Icon Migration

> Add a glass pill toolbar to the application header with pipeline status, settings, notifications, and user avatar — and migrate all 46 custom icons to Lucide for a consistent, extensible visual language.

## Stories

### Platform user — pipeline awareness

As a platform user browsing sessions, I want a persistent progress ring in the header that updates in real time so that I always know whether the pipeline is active without scanning the sidebar.

Acceptance:
- Uploading a session causes the ring count to increment and animate with the cyan glow while the user remains on any other page
- The count shows **total sessions in pipeline** (processing + queued), not just processing
- When the pipeline drains to 0, the ring transitions to a dormant state: "0" with reduced opacity, label fades to `--text-disabled`
- When activity resumes, the pill brightens with a smooth transition (`--duration-normal`, `--easing-default`)

---

### Platform user — pipeline inspection

As a platform user, I want to click the progress ring and see a dropdown listing every processing and queued session by name, status, and queue position so that I can understand exactly what is in flight without any guesswork.

Acceptance:
- Dropdown opens with two sections: **Processing** (spinner + percentage if available, else spinner only) and **Queued** (position number)
- Only session-level information — no worker counts, thread counts, or internal infrastructure details
- Long session names truncated with ellipsis
- Closes on outside click or Escape; focus returns to the trigger button on Escape
- Trigger button has `aria-expanded` attribute reflecting dropdown state

---

### Platform user — pipeline inspection — recently completed

As a platform user, I want the pipeline dropdown to also show a "Recently completed" section so I can see what just finished without scanning the sidebar.

Acceptance:
- A third section "Recently completed" shows the last 3-5 completed sessions with checkmark icon and relative timestamp ("2m ago")
- Section is omitted if no sessions completed recently

---

### Platform user — pipeline awareness — SSE disconnection

As a platform user, I want the toolbar to indicate when real-time updates are unavailable so I know the pipeline status may be stale.

Acceptance:
- When the SSE connection drops, the progress ring shows a subtle warning state (e.g., dim/grey ring, or a small disconnect indicator)
- When SSE reconnects, the ring returns to normal and refreshes the count
- No error toast or alert — this is ambient, not disruptive

---

### Platform user — toolbar collapse

As a platform user, I want to collapse the toolbar pill with a smooth animation by clicking the user avatar so that I can reclaim header space when I want a less-interrupted reading experience.

Acceptance:
- Clicking the avatar collapses the pill to **just the avatar** — all other elements (pipeline ring, settings, bell, separators) are hidden
- Animation uses `--duration-normal` and `--easing-default` tokens
- Clicking the avatar again expands the pill back to full state
- No content jumps or layout shift during transition
- Collapsed state persists across page navigation within the session (not across page reloads)

---

### Platform user — user presence

As a platform user, I want to see my initial or avatar in the toolbar pill so that the application acknowledges me as an individual and establishes the visual anchor for a future account menu.

Acceptance:
- The right end of the pill shows a gradient initial circle (cyan-to-pink) matching the Midnight Neon palette
- Hovering produces a border glow matching the mockup
- The avatar is always visible, even in collapsed toolbar state

---

### Platform user — settings access

As a platform user, I want a gear icon inside the toolbar pill that I can click to reach settings so that I always have a single, predictable entry point for application configuration.

Acceptance:
- The gear icon is unambiguously gear-shaped (Lucide `settings` icon, not a sun/starburst)
- Interactive with hover state matching other pill controls
- Positioned inside the pill between the pipeline indicator and the user avatar
- Has `aria-label="Settings"` and `title="Settings"`

---

### Platform user — bell icon placeholder

As a platform user, I want to see a bell/notification icon in the toolbar pill so that the visual anchor exists for the future notification system.

Acceptance:
- Bell icon (Lucide `bell`) is visible in the pill between settings and avatar
- Has hover state matching other pill controls
- Clicking produces no action (non-functional placeholder)
- Has `aria-label="Notifications"` and `title="Notifications"`

---

### Platform user — consistent icons everywhere

As a platform user, I want every icon across the application to look like it belongs to the same family so that the interface feels polished and I can recognize actions and states at a glance.

Acceptance:
- ALL icons migrated: sidebar, session cards, section headers, toolbar, empty states, upload zone, **and toast notifications**
- All 46 current icons replaced with Lucide equivalents per the mapping in `.state/design-main-toolbar-and-icons/references/iconography-lucide.html`
- Uniform stroke weight (Lucide default 2), rounded terminals, correct semantics
- No icon is broken, missing, or visually different in size after migration
- Verification: Playwright visual regression test comparing before/after screenshots of the session list and session detail pages

---

### Self-hosting operator — pipeline transparency without exposure

As a self-hosting operator running Erika for a team, I want the pipeline status UI to show only session-level information so that internal infrastructure details (worker counts, thread pools, concurrency limits) are never visible to end users.

Acceptance:
- Manual review of the pipeline dropdown confirms no worker, thread, or memory data is rendered
- Code review confirms the component only reads session name, status, and queue position from the API — no infrastructure fields are accessed

---

### Self-hosting operator — zero new runtime dependencies

As a self-hosting operator, I want the icon migration to add no new runtime dependencies or network requests so that my deployment remains air-gappable and the upgrade introduces no operational risk.

Acceptance:
- Lucide SVGs embedded as CSS data URIs in `icons.css` — no `lucide-vue-next` package, no icon font, no external CDN request
- `npm run build` produces the same entry points and file structure as before
- A browser devtools network audit of the running app shows zero icon-related network requests

---

### Developer — icon scalability

As a developer adding new features to Erika, I want to add an icon by looking up its Lucide name and writing a single CSS class definition so that I never have to hand-draw or encode SVG path data manually.

Acceptance:
- A developer can add a new icon in under two minutes by: find Lucide name → copy data URI snippet from documented pattern → add CSS class
- The pattern is documented in a comment block at the top of `icons.css`

---

### Developer — faithful Vue conversion from mockup

As a frontend developer implementing the toolbar, I want the Vue component to be built by converting the approved HTML/CSS from `draft-2b-lucide.html` directly so that the design is preserved exactly and no visual drift is introduced.

Acceptance:
- A Playwright screenshot of the running Vue component at 1440x900 viewport, compared against a screenshot of `draft-2b-lucide.html` at the same viewport, shows no differences in layout, color, spacing, or typography beyond anti-aliasing
- Both expanded and dropdown-open states are screenshot-verified
- The reviewer runs the comparison as part of the stage review

---

### Developer — design token extraction

As a frontend developer, I want raw `rgba()` values from the mockup that don't map to existing design tokens to be extracted into toolbar-scoped CSS custom properties so that the component is maintainable and consistent with the design system.

Acceptance:
- No raw `rgba()` color values in the toolbar Vue component's `<style>` — all colors reference `var(--*)` tokens
- New tokens are scoped (e.g., `--toolbar-glass-bg`, `--toolbar-separator`) and documented in the component or promoted to `layout.css` if reusable

---

### Developer — dropdown overflow fix

As a frontend developer, I want the `spatial-shell__header` `overflow` to be changed from `hidden` to `visible` so that the pipeline dropdown can extend below the header boundary without being clipped.

Acceptance:
- Pipeline dropdown renders fully below the header with no clipping at any viewport height
- No other layout regions are visually affected by the overflow change

---

### Developer — keyboard accessibility

As a frontend developer, I want the toolbar to be keyboard-accessible so that users can navigate and operate it without a mouse.

Acceptance:
- Tab order through pill controls: pipeline trigger → settings → bell → avatar
- Escape closes the dropdown and returns focus to the trigger
- All icon-only buttons have `aria-label` attributes
- Pipeline trigger has `aria-expanded` reflecting dropdown state
- Dropdown items are focusable via arrow keys

---

### Legal / compliance — Lucide attribution

As a maintainer responsible for license compliance, I want Lucide's ISC copyright notice to be recorded in a `THIRD-PARTY-LICENSES` file and referenced from the README so that the project meets its attribution obligations.

Acceptance:
- `THIRD-PARTY-LICENSES` file exists at repo root containing Lucide copyright notice, ISC license text, and Feather Icons MIT attribution (Lucide is a Feather fork)
- README references the third-party notices file

## Out of Scope

- Settings page or panel (toolbar provides the entry point; destination is a future cycle)
- User authentication, login, registration, and profile management
- Notification system infrastructure (bell icon is present but non-functional — see placeholder story)
- Clickable session names in the pipeline dropdown (navigation shortcut is an opportunity, not a requirement)
- Real-time pipeline progress percentage (degrades gracefully to a spinner if backend does not expose it)
- Responsive / mobile toolbar behavior (desktop-first; mobile adaptation is deferred)
- Animated icon transitions (e.g., menu-to-close morphing)
- Dark / light theme switching (Erika is dark-theme only at this stage)

---
**Sign-off:** Approved (2026-03-16)
