# Full-Stack Workflow

For tasks spanning both client and server code.

```mermaid
graph TD
    PO1[Product Owner] --> Arch[Architect]
    Arch --> Des{Visual work?}
    Des -->|yes| FD[Frontend Designer]
    Des -->|no| Impl
    FD --> Impl
    subgraph Impl[Implementation]
        FE[Frontend Engineer]
        BE[Backend Engineer]
    end
    Impl --> PR[Pair Review]
    PR -->|blocking| Impl
    PR -->|pass| IR[Internal Review]
    IR -->|blocking| Impl
    IR -->|pass| Ready[PR Ready]
    Ready --> CR[CodeRabbit]
    CR -->|fixes needed| Impl
    CR -->|pass| PO2[Product Owner]
    PO2 --> M[Maintainer]
```

## Phases

| # | Agent | Gate |
|---|-------|------|
| 1 | `product-owner` | REQUIREMENTS.md signed off |
| 2 | `architect` | ADR.md + PLAN.md approved |
| 3 | `frontend-designer` | Mockups approved (if visual work) |
| 4 | `frontend-engineer` + `backend-engineer` | All PLAN stages complete |
| 5 | `reviewer-pair` | Per stage, blocking findings resolved |
| 6 | `reviewer-internal` | No blocking findings |
| 7 | `reviewer-coderabbit` | Valid findings fixed |
| 8 | `product-owner` | Validates against REQUIREMENTS.md |
| 9 | `maintainer` | CI green, all approvals |

Phase 3 is skipped when the task has no visual/UX changes.
Phase 4 engineers may run in parallel when PLAN stages have non-overlapping files and no dependencies. Max 2 parallel agents.

## Git Contract

| Rule | Value |
|------|-------|
| Branch prefix | `feat/` or `fix/` |
| Commit scopes | `client`, `server`, `shared`, `db`, `wasm` |
| Allowed paths | `src/**`, `packages/**` |
| PR title | `feat: <description>` or `fix: <description>` |
