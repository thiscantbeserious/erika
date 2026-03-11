---
tags: vision, backlog
---

# Visionbook

> Ideas and concepts for Erika. Each entry is a standalone vision seed — when ready, reference it in a cycle kickoff.

## Git-Native Project Integration

> [!info] Status: Draft

**Core idea:** Erika ships a git plugin that does a lightweight checkout of external projects and keeps them in sync. It reads agent session data from those repos and writes back — updating `AGENTS.md`, skills, and other agent config files. Git is both the transport and the sync mechanism.

**The flow:**

1. User connects a project repo to Erika (via the git plugin)
2. Erika does a lightweight/sparse checkout — only the paths it cares about (`.agents/`, `.state/`, session recordings, etc.)
3. Erika continuously syncs: pulls new session data, indexes it, makes it browsable and searchable
4. Erika writes back to the source repo — updating `AGENTS.md` with learned patterns, pushing new skills, improving agent configs
5. Write-backs go through PRs — reviewable, deniable, familiar

**Why git as the sync layer:**

- Every project already has it — zero new infrastructure
- Built-in history, diffing, authorship tracking
- Sparse checkout keeps it lightweight — no need to clone entire repos
- PRs as the feedback mechanism — the project team reviews what Erika suggests
- Works with GitHub, GitLab, Bitbucket, self-hosted — anywhere git runs

**Open questions:**

- Sparse checkout paths — what does Erika need from a project? Just `.agents/` and session files, or more?
- Conflict resolution — if the project and Erika both modify `AGENTS.md`, who wins?
- How does this relate to AGR (the recording service)? Does git-sync replace AGR's upload path or complement it?
- Auth model — PATs? Deploy keys? OAuth app installation?
- Write-back frequency — real-time PRs or batched insights?

**Connections:** This turns Erika from a passive session viewer into an active participant in a project's agent ecosystem. It learns from your sessions, improves your agent configs, and pushes those improvements back — all through git, the tool you already use.
