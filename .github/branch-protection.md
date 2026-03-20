# Branch Protection Rules for `main`

These settings should be configured in GitHub repository settings under
**Settings > Branches > Branch protection rules** for the `main` branch.

## Required Settings

### Pull Request Reviews
- **Require a pull request before merging**: Yes
- **Required approving reviews**: 1
- **Dismiss stale pull request approvals when new commits are pushed**: Yes
- **Require review from Code Owners**: Yes (see `.github/CODEOWNERS`)

### Status Checks
- **Require status checks to pass before merging**: Yes
- **Require branches to be up to date before merging**: Yes
- **Required status checks**:
  - `CI Status Gate` (the `ci-passed` job from `.github/workflows/ci.yml`)
  - `Gate 1: TypeScript`
  - `Gate 3: Build`
  - `Gate 6: Domain Integrity`
  - `Gate 7: Security`

### Merge Strategy
- **Require linear history**: Yes (squash or rebase only)
- **Allow squash merging**: Yes (default)
- **Allow merge commits**: No
- **Allow rebase merging**: Yes

### Push Rules
- **Restrict who can push to matching branches**: Yes
  - Allow only: repository admins
- **Do not allow force pushes**: Yes
- **Do not allow deletions**: Yes

## Optional (Recommended)

### Signed Commits
- **Require signed commits**: No (enable when team is ready)

### Conversation Resolution
- **Require conversation resolution before merging**: Yes

## How to Apply (CLI)

```bash
# Using GitHub CLI (gh):
gh api repos/redle82/chefiapp-pos-core/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Status Gate"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_linear_history=true
```

## Notes

- The `CI Status Gate` job aggregates all required gates into a single check,
  making branch protection configuration simpler.
- Advisory gates (lint, test, bundle-size) are warned but not blocking.
  Promote them to required as the codebase matures.
- The deploy workflow (`.github/workflows/deploy.yml`) triggers on version tags
  (`v*`) and has its own build+test phase before deploying.
