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
  - `Gate 2: Lint`
  - `Gate 3: Build`
  - `Gate 4: Unit Tests`
  - `Gate 5: Bundle Size`
  - `Gate 6: Domain Integrity`
  - `Gate 7: Security`
  - `E2E Suite (Playwright)`

All gates are **required**. There are no advisory-only gates.

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
# Apply branch protection rules using GitHub CLI.
# Run this once from any machine with `gh` authenticated.

gh api repos/redle82/chefiapp-pos-core/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI Status Gate",
      "Gate 1: TypeScript",
      "Gate 2: Lint",
      "Gate 3: Build",
      "Gate 4: Unit Tests",
      "Gate 5: Bundle Size",
      "Gate 6: Domain Integrity",
      "Gate 7: Security",
      "E2E Suite (Playwright)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
EOF
```

## Verification

After applying, verify the protection is active:

```bash
gh api repos/redle82/chefiapp-pos-core/branches/main/protection \
  --jq '{
    status_checks: .required_status_checks.contexts,
    reviews: .required_pull_request_reviews.required_approving_review_count,
    linear_history: .required_linear_history.enabled,
    force_push: .allow_force_pushes.enabled,
    deletions: .allow_deletions.enabled
  }'
```

## Notes

- The `CI Status Gate` job aggregates all required gates into a single check,
  but individual gates are also listed for defense-in-depth.
- Zero `continue-on-error` flags exist in any required gate.
- All 7 gates plus E2E must pass before merge is allowed.
- The deploy workflow (`.github/workflows/deploy.yml`) triggers on version tags
  (`v*`) and has its own build+test phase before deploying.
