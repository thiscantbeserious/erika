# Research Re-evaluation Guide

## Purpose

This directory tracks iterative architectural research. Each `step<N>/` is a snapshot of findings at a point in time. Comparing steps shows what improved, what regressed, and what's still open.

## Structure

```
.research/
├── AGENTS.md          ← you are here
├── step1/             ← initial review
├── step2/             ← after fixes, re-evaluated
└── ...
```

Each step contains whichever documents were re-evaluated in that round. Not every file needs to appear in every step — only include files that were re-assessed.

## How to Re-evaluate

### Architecture Review

Spawn 4 researcher agents in parallel against the latest `ARCHITECTURE-REVIEW.md`:

1. **Critical + High findings (C1-C5, H1-H10)** — verify each against current code, report CONFIRMED / FIXED / CHANGED / INACCURATE
2. **Medium findings (M1-M19)** — same
3. **Aspiration vs Reality table** — cross-check ARCHITECTURE.md claims against actual codebase state
4. **File paths and line references** — verify every evidence citation is still accurate (ACCURATE / DRIFTED / FILE_MISSING / WRONG)

Then produce a new `ARCHITECTURE-REVIEW.md` in `step<N+1>/` that:
- Updates the status of each finding (keep original text, add resolution notes)
- Updates line number references where drifted
- Removes findings that are fully resolved
- Adds any new findings discovered during verification

### Competitive Landscape

Spawn researcher agents to verify:
- Star counts, license, stack claims for each competitor
- New competitors that have emerged since last evaluation
- Changes in competitor feature sets

Produce updated `COMPETITIVE-LANDSCAPE.md` in `step<N+1>/`.

### Naming Research

Re-evaluate only if the naming decision is still open or being revisited.

## Acceptance Criteria

A step is complete when:
- All findings have a current status (confirmed/fixed/changed)
- All file references point to correct locations
- No unverified claims remain
- The document date is updated to the evaluation date
