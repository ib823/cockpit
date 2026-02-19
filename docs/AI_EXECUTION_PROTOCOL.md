# AI CLI Execution Protocol (Strict)

Status: Active  
Version: 1.0.0  
Last Updated (UTC): 2026-02-19  
Scope: Any AI LLM CLI operating on this repository.

This protocol is mandatory. It is designed to prevent overclaiming, hallucination, scope drift, and inconsistent execution quality across different agents.

## 1. Core Contract
1. Truth first: never claim a check was executed unless it was executed.
2. Evidence first: every conclusion must be tied to direct repository evidence.
3. Unknown-first transparency: unresolved facts must be explicitly declared as unknown.
4. Deterministic execution: follow the same workflow every session.
5. Objective lock: all work must align with `docs/MASTER_PLAN.md`.

## 2. Session Startup Sequence (Mandatory)
At the start of every session:
1. Read `docs/MASTER_PLAN.md`.
2. Read `docs/HANDOFF.md`.
3. Confirm current active phase and next task IDs.
4. Verify no conflicting in-progress status in the handoff ledger.
5. Write a short startup note to `docs/HANDOFF.md` (timestamp, actor, intent).

If documents are missing, recreate from latest known state before proceeding.

## 3. Deterministic Work Loop
Use this exact loop for each task:

1. Clarify task scope:
1. Record task ID.
2. Record acceptance criteria from `docs/MASTER_PLAN.md`.

2. Build evidence baseline:
1. Inspect relevant files.
2. Run only necessary checks/commands.
3. Log observations as facts, not assumptions.

3. Plan edits:
1. List files to modify.
2. State why each file changes.
3. State validation commands to run.

4. Execute edits in small batches:
1. Keep commits/task units atomic.
2. Avoid unrelated file churn.

5. Validate:
1. Run strict checks relevant to the changed surface.
2. Record pass/fail and blocker details.

6. Close or continue:
1. If criteria met, mark task complete in `docs/HANDOFF.md`.
2. If blocked, mark blocked with exact reason and next action.

## 4. No-Overclaim Rules (Hard)
Forbidden statements unless proven with fresh evidence:
1. "Fully fixed".
2. "Production-ready".
3. "Exhaustive".
4. "Tested on mobile" (unless real-device evidence exists).
5. "All endpoints secured" (unless endpoint inventory confirms).

Required language when limited:
1. "Not verified in this environment".
2. "Pending manual real-device validation".
3. "Blocked by missing dependency/service".

## 5. Evidence Format Standard
Every status update must include:
1. `Task ID`
2. `Files changed`
3. `Commands run`
4. `Result`
5. `Remaining risk`
6. `Next step`

## 6. Standard Validation Tiers

### Tier 1 (always for code changes)
1. `pnpm lint:strict`
2. `pnpm typecheck:strict`

### Tier 2 (when logic/API changed)
1. `pnpm test --run`
2. Relevant targeted tests if full suite is blocked.

### Tier 3 (before release gate)
1. `pnpm build`
2. Route-aligned e2e and accessibility checks.

If any tier cannot run, log blocker and compensating checks in `docs/HANDOFF.md`.

## 7. Change Scope Control
1. Do not batch unrelated fixes.
2. Do not silently refactor outside task boundaries.
3. If opportunistic issues are found, add them to backlog rather than bundling.

## 8. Security and Privacy Guardrails
Before finalizing any change:
1. Search for secret leakage patterns.
2. Search for personal identifiers.
3. Confirm no new debug exposures.
4. Confirm auth checks for modified API paths.

## 9. Public Repo Hygiene Rules
1. Keep docs minimal and canonical.
2. Do not commit generated artifacts.
3. Do not store private operational data in tracked files.
4. Preserve proprietary licensing and notice headers.

## 10. Handoff Rules
At session end:
1. Update `docs/HANDOFF.md` with factual status.
2. Update task states changed in this session.
3. Record blockers and exact takeover step.
4. Include explicit unresolved assumptions list (or `none`).

## 11. Conflict Resolution
When protocol conflicts with ad-hoc requests:
1. Prioritize user instruction.
2. Still disclose risk and tradeoffs.
3. Require explicit confirmation for lower-quality/high-risk paths.

## 12. Output Template (Required)
Use this structure in operational updates:
1. `Summary`: one paragraph factual result.
2. `Evidence`: file refs + command outcomes.
3. `Gaps`: what is not yet verified.
4. `Next`: exact next action with task ID.

## 13. Recovery if State Is Unclear
If handoff state is inconsistent:
1. Stop new edits.
2. Reconstruct from git diff and current files.
3. Repair `docs/HANDOFF.md` first.
4. Resume only after status is coherent.

## 14. Compliance Clause
Any AI agent that cannot follow this protocol must not continue execution.
