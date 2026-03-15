# ADR: Fix Empty Session Display -- Server Detection + Client Fallback

## Status

Proposed

## Context

### The bug

Uploading terminal sessions from non-Claude-Code tools (Codex, Gemini CLI) produces zero detected section boundaries. The server marks the job `detection_status: 'completed'` with `detected_sections_count: 0`. The client renders a blank page because `SessionContent.vue` renders content exclusively through a `v-for` over sections.

### Fixture analysis across all session formats

Analysis of every fixture in the repository reveals the detection gap is systematic, not limited to one file:

| Fixture | Events | `\x1b[2J` | `\x1b[J` (erase-end) | Alt-screen | `\x1b[2K` (erase-line) | Gaps >1s | Current detector result |
|---|---|---|---|---|---|---|---|
| claude-medium | 1379 | 2 | 0 | 0 | 10 | 12 | 2 sections (screen clears) |
| claude-small | 18 | 0 | 0 | 0 | 1 | 1 | NOTHING (too small) |
| codex-medium | 1171 | 0 | 32 | 0 | 0 | 3 | NOTHING |
| codex-small | 64 | 0 | 6 | 0 | 0 | 6 | NOTHING (too small) |
| failing-session | 1171 | 0 | 32 | 0 | 0 | 3 | NOTHING |
| gemini-medium | 674 | 0 | 0 | 0 | 323 | 19 | NOTHING |
| gemini-small | 7 | 0 | 0 | 0 | 0 | 0 | NOTHING (too small) |
| sample | 24 | 0 | 0 | 0 | 0 | 0 | NOTHING (markers only) |

Key observations:

1. **Claude Code** uses `\x1b[2J` (full screen clear) -- the only format the current detector handles.
2. **Codex** uses `\x1b[J` (erase-in-display / erase to end of screen) -- 32 instances in its medium fixture. Zero `\x1b[2J`. Only 3 gaps >1s.
3. **Gemini CLI** uses `\x1b[2K` (erase line) -- 323 instances in its medium fixture. Zero `\x1b[2J`, zero `\x1b[J`. But it has 19 gaps >1s.
4. Each tool uses a different terminal escape pattern. No single escape sequence covers all formats. But timing gaps are present across all non-trivial sessions.

### Root cause: two compounding failures

**Failure 1 -- Timing gate locks out valid data.** The Codex session's median inter-event gap is 0.034s. The `isTimingReliable()` check requires median >= 0.1s, so it returns `false`, disabling both the timing gap signal (Signal 1) and the volume burst signal (Signal 4). The session has real pauses (4.6s, 3.2s, 1.2s) that are never evaluated. The Gemini session has the same problem in principle but would pass the timing gate with a different threshold -- its 19 gaps >1s are significant.

**Failure 2 -- Screen clear detection is too narrow.** The detector only recognizes `\x1b[2J` (clear entire screen). Codex uses `\x1b[J` (erase from cursor to end of screen) for its UI redraws. Gemini uses `\x1b[2K` (erase entire line). These are semantically similar operations -- partial screen erasure that marks UI state transitions -- but the detector ignores them entirely.

### Quantitative impact of each fix approach

**Adaptive timing alone (for Codex):** Would unlock 3 gaps >1s as boundary candidates. After `MIN_SECTION_SIZE = 100` filtering and merge, likely produces 2-3 sections for 1171 events. That is ~400 events per section -- very coarse. Functional but not useful for browsing.

**`\x1b[J` detection alone (for Codex):** Produces 32 boundary candidates. After merge window (50 events) and minimum section size (100 events) filtering, likely yields 8-15 sections. Much finer granularity -- each section is ~80-150 events, closer to a logical unit of work.

**Adaptive timing alone (for Gemini):** Would unlock 19 gaps >1s. After filtering, likely yields 10-15 sections for 674 events. This is good granularity (~40-70 events per section). `\x1b[2K` detection would add 323 candidates, which is far too many -- it would over-segment massively. Timing alone is sufficient for Gemini.

**Combined approach (adaptive timing + `\x1b[J`):** Covers both Codex (via `\x1b[J`) and Gemini (via adaptive timing). The merge window handles overlap when both signals fire near the same event.

### Client-side gap

`SessionDetailView.vue` has three rendering branches: loading, error, and content. The content branch delegates to `SessionContent.vue`, which renders sections via `v-for`. When `sections.length === 0` and there is a snapshot, the `hasContent` computed returns `true` (because `snapshot.value !== null`), but `SessionContent.vue` renders nothing visible -- the `OverlayScrollbar` activates (because `snapshot` is truthy) but the `v-for` loop over sections produces no DOM nodes. Only the preamble could show something, but `preambleLines` returns `[]` when `sections.length === 0`.

The composable `useSession.ts` already exposes `detectionStatus` but neither the view nor the content component use it to branch rendering.

### Existing infrastructure

- `SessionDetailResponse` carries `detection_status` and `sections[]` -- no schema changes needed
- `useSession.ts` already parses and exposes `detectionStatus`, `snapshot`, and `sections`
- Typia validation on the response is already wired in `sessions.ts` route handler
- The `DetectionStatus` union type already includes `'failed'` and `'completed'`

## Options Considered

### Server Detection

#### Option S1: Adaptive timing threshold only

Relax `isTimingReliable()` to check for the existence of significant gaps (>0.5s) rather than requiring median >= 0.1s. Replace the fixed 5s `TIMING_GAP_THRESHOLD` with an adaptive threshold computed from the session's gap distribution (e.g., `P75 + 1.5 * IQR`).

- **Pros:** Format-general, no new signal types, directly addresses the timing gate root cause, small code change
- **Cons:** Produces only 2-3 sections for Codex (3 gaps >1s for 1171 events -- very coarse). Insufficient granularity for TUI-heavy sessions where timing pauses are rare but UI redraws are frequent. Does NOT address the `\x1b[J` gap at all.

#### Option S2: Add `\x1b[J` (erase-in-display) as a new detection signal

Extend the existing `detectScreenClears()` method (Signal 2) to also match `\x1b[J` and `\x1b[0J` (erase from cursor to end of screen), not just `\x1b[2J` (clear entire screen). These are semantically related -- all are erase-in-display operations per ECMA-48, differing only in which region they clear.

- **Pros:** Directly targets the Codex failure (32 candidates vs. 0), additive and cannot regress existing detection, small code change (extend one regex/string check), semantically justified (all are the same CSI Ps J sequence family)
- **Cons:** Does not fix the timing gate issue, so sessions that rely purely on timing (like Gemini with 19 gaps >1s but no `\x1b[J`) still fail if the gate locks them out. Does not cover `\x1b[2K` (erase-line) which Gemini uses.

#### Option S3: Adaptive timing + `\x1b[J` detection (combined)

Apply both S1 and S2. Fix the timing reliability gate AND extend erase-in-display detection.

- **Pros:** Covers both failure modes -- Codex gets fine-grained detection via `\x1b[J` (32 candidates) AND unlocked timing gaps; Gemini gets detection via adaptive timing (19 gaps >1s). Defense in depth: if one signal produces sparse results, the other fills in. The merge window (50 events) handles overlap.
- **Cons:** Larger change surface. Risk of over-segmenting when both signals fire for the same boundary. Two things to tune rather than one.

### Client Fallback

#### Option C1: Branch in SessionContent.vue

Add rendering branches inside `SessionContent.vue` for the zero-section case and the failed case.

- **Pros:** Minimal component surface, all rendering stays in one component
- **Cons:** `SessionContent.vue` grows more conditional branches, responsibility expands from "render sections" to "render sections OR fallback"

#### Option C2: Branch in SessionDetailView.vue (view-level routing)

Keep `SessionContent.vue` as-is. Add new rendering branches in `SessionDetailView.vue` that handle fallback states BEFORE delegating to `SessionContent`.

- **Pros:** Cleaner separation -- `SessionContent` stays a section renderer, `SessionDetailView` owns state routing, easier to test each path in isolation
- **Cons:** Duplicates some rendering logic (snapshot rendering appears in both the view and the content component)

#### Option C3: Computed rendering contract in useSession composable

Add a computed `renderMode` to `useSession.ts`.

- **Pros:** Centralized, testable without mounting components
- **Cons:** User has explicitly rejected a `SessionRenderMode` composable

## Decision

### Server: Option S3 -- Adaptive timing + `\x1b[J` detection (combined)

**Rationale:** The fixture analysis shows that adaptive timing alone is insufficient for Codex. Three gaps >1s for 1171 events produces at most 2-3 sections -- too coarse to be useful for browsing. The `\x1b[J` signal provides 32 candidates, giving the granularity that makes section-based browsing worthwhile. Meanwhile, adaptive timing is essential for Gemini (19 gaps >1s, zero erase-in-display sequences).

Neither approach alone covers both formats. Combined, they provide defense in depth:

**Part A -- Relax `isTimingReliable()`:** Instead of requiring `median >= 0.1s`, check whether the session contains at least N gaps above a significance floor (e.g., 0.5s). This lets Codex and Gemini sessions through while still filtering truly compressed sessions (synthetic timestamps where ALL gaps are <0.01s).

**Part B -- Make the gap threshold adaptive:** Replace the fixed `TIMING_GAP_THRESHOLD = 5` with an adaptive threshold computed from the session's gap distribution. Use a percentile-based approach or `P75 + k * IQR` (standard outlier formula). This finds "unusual pauses" relative to each session's own baseline, regardless of absolute timing scale.

**Part C -- Extend `detectScreenClears()` to recognize `\x1b[J`:** The existing Signal 2 checks for `\x1b[2J` only. Extend it to also match `\x1b[J` and `\x1b[0J` (erase from cursor to end of screen). These are all the same CSI Ps J family (ECMA-48 "Erase in Display"), differing only in the Ps parameter:
- `\x1b[0J` or `\x1b[J` -- erase from cursor to end of screen (default)
- `\x1b[2J` -- erase entire screen (currently detected)

The score for `\x1b[J` / `\x1b[0J` should be lower than for `\x1b[2J` (e.g., 0.6 vs 1.0) because a partial erase is a weaker boundary signal than a full screen clear. The merge window and minimum section size filter will handle the higher candidate count.

**What about `\x1b[2K` (erase-line) for Gemini?** Deliberately excluded from this fix. Gemini has 323 `\x1b[2K` events in 674 total events -- nearly every other event is an erase-line. This is not a boundary signal; it is the tool's routine rendering mechanism. Treating it as a boundary signal would over-segment catastrophically. Gemini is adequately served by adaptive timing (19 gaps >1s). If future analysis shows timing is insufficient for some Gemini sessions, `\x1b[2K` could be added with aggressive deduplication, but that is out of scope here.

**Backward compatibility:** For Claude Code sessions (median gap typically >0.1s), the relaxed reliability gate changes nothing -- timing was already enabled. Claude's `\x1b[2J` signals continue to be detected by the same code path. The new `\x1b[J` detection does not fire for Claude (0 occurrences in the fixture). No regression risk.

**Interaction between signals:** When both adaptive timing and `\x1b[J` fire near the same event (within the 50-event merge window), they merge into a single boundary with combined signals and the higher score. This is the existing merge behavior -- no new logic needed.

### Client: Option C2 -- View-level routing in SessionDetailView.vue

**Rationale:** The user has explicitly rejected a `SessionRenderMode` composable (Option C3 is out). Between C1 and C2, the view-level approach is cleaner:

- `SessionContent.vue` remains a focused section renderer. It already has non-trivial logic (fold state, preamble lines, hybrid CLI/TUI rendering). Adding fallback branches would dilute its purpose.
- `SessionDetailView.vue` already owns the loading/error/content routing. Adding State A and State B is a natural extension of its existing responsibility.
- The rendering decision is driven by `detectionStatus` (from `useSession`) and `sections.length` -- both already available in the view. No new composable needed.

The view template becomes:

```
loading -> SkeletonMain
error (fetch error) -> error message
State B (failed, no snapshot) -> error state
State B (failed, has snapshot) -> error banner + TerminalSnapshotComponent
State A (completed, 0 sections, has snapshot) -> info banner + TerminalSnapshotComponent
State A (completed, 0 sections, no snapshot) -> empty state
normal (has sections) -> SessionContent
```

The banners use existing design system tokens. The `TerminalSnapshotComponent` is reused directly for both fallback states -- no new rendering components needed.

## Consequences

### What becomes easier

- **Codex sessions** get fine-grained detection (8-15 sections from `\x1b[J`) instead of coarse timing-only detection (2-3 sections) or nothing at all.
- **Gemini sessions** get detection via adaptive timing (10-15 sections from 19 gaps >1s) where they previously got nothing.
- **Any future session format** with either timing gaps or erase-in-display sequences is automatically covered without per-tool configuration.
- **Any future processing failure mode** is handled by the client fallback contract. New `detection_status` values only need server-side handling; the client already covers the terminal states.

### What becomes harder

- **Two signal changes in one fix** means more to test and tune. The adaptive timing threshold and the `\x1b[J` detection can interact (overlapping candidates near the same event), though the existing merge window handles this.
- **Tuning the adaptive threshold** requires understanding the statistical approach. Good test coverage against all fixtures mitigates this.
- **Two rendering paths for snapshot content** exist in the view (the fallback) and in `SessionContent` (the normal path via section slicing). Changes to snapshot rendering may need to touch both.

### Follow-ups (out of scope)

- `\x1b[2K` (erase-line) signal for Gemini, if adaptive timing proves insufficient for some Gemini sessions
- Virtual scrolling for large unsectioned sessions (existing backlog item)
- Confidence scoring on detected boundaries
- Manual section marking UI

## Decision History

1. **User decided against a `SessionRenderMode` composable.** The client rendering decision stays in the view/component layer, not in a separate abstraction. The Session/response model is used directly.
2. **User confirmed both server detection improvement and client fallback are in scope.** Neither alone is sufficient -- better detection handles most sessions, fallback handles the remainder.
3. **User defined two client fallback states.** State A: completed with 0 sections (info banner + content). State B: failed processing (error banner + available content). These are the two fallback branches.
4. **Architect initially chose adaptive timing only (S1), then revised to combined approach (S3) after fixture analysis showed adaptive timing produces only 2-3 sections for Codex -- too coarse.** The `\x1b[J` signal provides 32 candidates for Codex, giving useful browsing granularity. Gemini is covered by adaptive timing alone (19 gaps >1s). The combined approach covers both.
5. **Architect chose view-level routing over content-component branching.** `SessionDetailView` already owns state routing; `SessionContent` stays focused on section rendering.
6. **Architect excluded `\x1b[2K` (erase-line) from detection.** Gemini uses it 323 times in 674 events -- it is a rendering mechanism, not a boundary signal. Over-segmentation risk is too high. Adaptive timing handles Gemini adequately.
