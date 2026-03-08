# Workflow Operational Order

> Status: Active
> Adopted: 2026-03-08
> Scope: goldmonkey777/ChefIApp-POS-CORE

## Purpose

Establish mandatory flow discipline so worktree/workspace hygiene and PR closure are enforced by process, not memory.

## Core Principle

One front at a time.

A new front cannot start before the previous front is operationally closed.

## Mandatory Rules

1. One task = one issue = one branch = one PR.
2. No new front before full closure of the previous front.
3. Every worktree must have owner, issue/PR link, and expiry date.
4. Dirty main workspace blocks opening a new front.
5. Oversized PRs must be sliced before growing further.
6. New contractual docs must update index in the same slice.
7. Merge closes code; branch/worktree/issue close operations.
8. Weekly closure ritual is mandatory.

## Operationally Closed Definition

A front is closed only when all items below are true:

- code committed
- PR opened and merged or explicitly closed
- required CI completed
- branch deleted
- worktree removed
- issue updated/closed
- no orphan local changes left

If any item is missing, the front is still open.

## PR Size Guardrails

Slice before continuing when one or more conditions happen:

- too many files changed
- multiple domains in one PR
- mixed runtime + infra + docs in same PR
- long narrative needed to justify scope

Policy target: keep PRs independently reviewable and mergeable.

## Worktree Policy

For each active worktree, record:

- owner
- related issue and PR
- creation date
- expiry date
- status (active, blocked, closing)

Any worktree without these fields must be removed.

## Main Workspace Policy

Main workspace is not an experimentation area.

Allowed in main workspace:

- clean base operations
- current active front only
- final integration checks

Exploratory or risky work must run in dedicated branch/worktree.

## Weekly Closure Ritual

Run once per week (or at cycle end):

1. list open PRs
2. list active worktrees
3. list merged branches pending deletion
4. list issues done-in-code but still open
5. list local changes without owner

Output must produce explicit closure actions and owners.

## Minimum Execution Checklist (per front)

- issue created and linked
- branch created with clear scope name
- optional isolated worktree created
- PR opened early with scope statement
- CI baseline executed
- minimal corrective fixes applied
- PR merged or closed with reason
- branch removed
- worktree removed
- issue closed with references

## Enforcement

- Violation of this order blocks starting new fronts.
- No political override for skipping closure steps.
- Exceptions require explicit written approval in issue and PR.

## Team Phrase

Branch is not housing.
Worktree is not storage.
PR is not a scope graveyard.
Every front that starts must finish fully.
