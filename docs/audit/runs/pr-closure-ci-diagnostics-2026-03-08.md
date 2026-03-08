# PR Closure CI Diagnostics (2026-03-08)

## PR #6

- Vercel Preview Comments: SUCCESS (pass)
- Seer Code Review: NEUTRAL (skipping)
- E2E Suite (Playwright — 4 layers): SKIPPED (skipping)
- Flakiness Audit (repeat-each × N): SKIPPED (skipping)
- 🚀 Deployment Clearance: SKIPPED (skipping)
- 🧪 7-Phase Stress Test: SKIPPED (skipping)
- 🏛️ Verify Canonical Architecture: SKIPPED (skipping)
- Fail-Fast Validation: FAILURE (fail)
- 🧊 Truth Freeze (Codex Gate): FAILURE (fail)
- Full 24h Simulation: FAILURE (fail)
- Contract integrity: FAILURE (fail)
- Validate Code Quality: FAILURE (fail)
- 🏛️ Architecture Guardian: FAILURE (fail)
- 🔍 Detect Canon Violations: FAILURE (fail)
- check-screens: FAILURE (fail)
- Vercel Agent Review: NEUTRAL (skipping)
- Vercel: SUCCESS (pass)

### Validate Code Quality failure

- run: 22478798285
- job: 65111638711
- tail log:

```text
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3175825Z npm error Missing: @inquirer/external-editor@2.0.3 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3176503Z npm error Missing: chardet@2.1.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3177126Z npm error Missing: iconv-lite@0.7.2 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3177756Z npm error Missing: @babel/generator@7.28.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3178407Z npm error Missing: @babel/parser@7.28.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3179189Z npm error Missing: @babel/plugin-proposal-decorators@7.28.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3180339Z npm error Missing: angular-html-parser@10.4.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3180987Z npm error Missing: semver@7.7.4 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3181572Z npm error Missing: weapon-regex@1.3.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3182167Z npm error Missing: semver@7.7.4 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3182735Z npm error Missing: magicast@0.5.2 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3183352Z npm error Missing: fast-string-width@3.0.2 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3184117Z npm error Missing: fast-string-truncated-width@3.0.3 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3184786Z npm error Missing: zod@4.3.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3185317Z npm error Missing: qr.js@0.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3185897Z npm error Missing: des.js@1.1.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3186435Z npm error Missing: js-md4@0.3.2 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3186983Z npm error Missing: tunnel@0.0.6 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3187587Z npm error Missing: underscore@1.13.8 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3188245Z npm error Missing: minimalistic-assert@1.0.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3189167Z npm error Invalid: lock file's @vitest/expect@4.0.16 does not satisfy @vitest/expect@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3190434Z npm error Invalid: lock file's @vitest/mocker@4.0.16 does not satisfy @vitest/mocker@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3191638Z npm error Invalid: lock file's @vitest/pretty-format@4.0.16 does not satisfy @vitest/pretty-format@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3192809Z npm error Invalid: lock file's @vitest/runner@4.0.16 does not satisfy @vitest/runner@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3193922Z npm error Invalid: lock file's @vitest/snapshot@4.0.16 does not satisfy @vitest/snapshot@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3194968Z npm error Invalid: lock file's @vitest/spy@4.0.16 does not satisfy @vitest/spy@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3195992Z npm error Invalid: lock file's @vitest/utils@4.0.16 does not satisfy @vitest/utils@4.0.18
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3196864Z npm error Missing: json-schema-traverse@1.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3197627Z npm error Missing: @sindresorhus/merge-streams@4.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3198309Z npm error Missing: figures@6.1.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3198887Z npm error Missing: get-stream@9.0.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3199498Z npm error Missing: human-signals@8.0.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3220911Z npm error Missing: is-plain-obj@4.1.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3221558Z npm error Missing: is-stream@4.0.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3222149Z npm error Missing: pretty-ms@9.3.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3222958Z npm error Missing: signal-exit@4.1.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3223617Z npm error Missing: strip-final-newline@4.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3224278Z npm error Missing: yoctocolors@2.1.2 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3224964Z npm error Missing: is-unicode-supported@2.1.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3225612Z npm error Missing: parse-ms@4.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3226316Z npm error Missing: @sec-ant/readable-stream@0.4.1 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3227023Z npm error Missing: brace-expansion@5.0.3 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3227675Z npm error Missing: balanced-match@4.0.4 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3228282Z npm error Missing: path-key@4.0.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3228885Z npm error Missing: unicorn-magic@0.3.0 from lock file
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3229344Z npm error
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3229708Z npm error Clean install a project
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3230233Z npm error
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3230510Z npm error Usage:
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3230790Z npm error npm ci
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3231078Z npm error
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3231360Z npm error Options:
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3232077Z npm error [--install-strategy <hoisted|nested|shallow|linked>] [--legacy-bundling]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3233153Z npm error [--global-style] [--omit <dev|optional|peer> [--omit <dev|optional|peer> ...]]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3234364Z npm error [--include <prod|dev|optional|peer> [--include <prod|dev|optional|peer> ...]]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3235416Z npm error [--strict-peer-deps] [--foreground-scripts] [--ignore-scripts] [--no-audit]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3236214Z npm error [--no-bin-links] [--no-fund] [--dry-run]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3237011Z npm error [-w|--workspace <workspace-name> [-w|--workspace <workspace-name> ...]]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3237940Z npm error [-ws|--workspaces] [--include-workspace-root] [--install-links]
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3238513Z npm error
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3239064Z npm error aliases: clean-install, ic, install-clean, isntall-clean
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3239616Z npm error
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3261920Z npm error Run "npm help ci" for more info
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3263024Z npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2026-02-27T08_31_11_780Z-debug-0.log
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3345658Z ##[error]Process completed with exit code 1.
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.3552852Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5005488Z [command]/usr/bin/git version
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5097014Z git version 2.53.0
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5260335Z Temporarily overriding HOME='/home/runner/work/_temp/4c3203c8-3faa-4d57-a834-cf99791b2820' before making global git config changes
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5264615Z Adding repository directory to the temporary git global config as a safe directory
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5268663Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5393144Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.5485678Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6291939Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6310464Z http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6334757Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6393584Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6802585Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.6852596Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Validate Code Quality UNKNOWN STEP 2026-02-27T08:31:32.7397028Z Cleaning up orphan processes
```

## PR #11

- E2E Suite (Playwright — 4 layers): SKIPPED (skipping)
- Flakiness Audit (repeat-each × N): SKIPPED (skipping)
- Vercel Preview Comments: SUCCESS (pass)
- Seer Code Review: SUCCESS (pass)
- Validate Code Quality: FAILURE (fail)
- Vercel Agent Review: NEUTRAL (skipping)
- Vercel – chefiapp-pos-core: SUCCESS (pass)
- Vercel – integration-gateway: SUCCESS (pass)

### Validate Code Quality failure

- run: 22493537656
- job: 65161873434
- tail log:

```text
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7308900Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7309286Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7309975Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7431538Z [check-financial-supabase] Checking merchant-portal/src for Supabase usage on gm_orders, gm_order_items, fiscal_event_store, inventory_*...
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7755783Z [check-financial-supabase] PASSED (no Supabase usage on financial domain tables).
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7792714Z ##[group]Run bash ./scripts/contract-gate.sh
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7793284Z [36;1mbash ./scripts/contract-gate.sh[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7824777Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7825150Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7825533Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7826011Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7910488Z [contract-gate] Step 1: Checking for empty .md in docs/architecture and docs/contracts...
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7942489Z [contract-gate]   OK: No empty .md files.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.7944695Z [contract-gate] Step 2: Verifying referenced .md exist and are non-empty...
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.8297609Z [contract-gate]   OK: All referenced files exist and are non-empty.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:11.8302051Z [contract-gate] Step 3: Checking no unindexed docs (strict: all must be in CORE_CONTRACT_INDEX)...
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.5961902Z [contract-gate]   OK: All docs are indexed in CORE_CONTRACT_INDEX.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.5964983Z
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.5967053Z [contract-gate] Contract gate PASSED.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6009449Z ##[group]Run bash ./scripts/ci/validate-build-artifact.sh
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6010401Z [36;1mbash ./scripts/ci/validate-build-artifact.sh[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6053015Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6053429Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6053845Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6054363Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6136758Z ── Validating build artifact in public/app ──
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6138162Z   ✅ index.html
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6138576Z   ✅ manifest.webmanifest
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6138983Z   ✅ sw.js
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6248300Z   ✅ JS bundles (12 files)
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6249813Z   ✅ CSS bundles (8 files)
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6260934Z   ✅ index.html contains <div id="root">
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6261298Z
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6261638Z ✅ Build artifact is valid and deployable
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6294401Z ##[group]Run npx -y serve public/app -l 4173 &
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6294806Z [36;1mnpx -y serve public/app -l 4173 &[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6295069Z [36;1mSERVER_PID=$![0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6295280Z [36;1mfor i in $(seq 1 20); do[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6295694Z [36;1m  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ 2>/dev/null || true)[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6296109Z [36;1m  [ "$STATUS" = "200" ] && break[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6296342Z [36;1m  sleep 1[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6296530Z [36;1mdone[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6296718Z [36;1mecho "Root /: $STATUS"[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6297117Z [36;1m[ "$STATUS" = "200" ] || { kill $SERVER_PID 2>/dev/null; echo "❌ Root / did not return 200"; exit 1; }[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6297713Z [36;1mSTATUS2=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/app/staff/home 2>/dev/null || true)[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6298172Z [36;1mecho "SPA /app/staff/home: $STATUS2"[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6298577Z [36;1mkill $SERVER_PID 2>/dev/null[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6299092Z [36;1m[ "$STATUS2" = "200" ] || { echo "❌ SPA route did not return 200"; exit 1; }[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6300005Z [36;1mecho "✅ Smoke passed"[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6326693Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6326938Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6327179Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:12.6327461Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.0360978Z  INFO  Accepting connections at http://localhost:4173
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7307059Z  HTTP  2/27/2026 4:02:21 PM ::1 GET /
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7353535Z  HTTP  2/27/2026 4:02:21 PM ::1 Returned 200 in 11 ms
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7377626Z Root /: 200
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7422647Z  HTTP  2/27/2026 4:02:21 PM ::1 GET /app/staff/home
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7435031Z  HTTP  2/27/2026 4:02:21 PM ::1 Returned 404 in 1 ms
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7444555Z SPA /app/staff/home: 404
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:21.7446078Z ❌ SPA route did not return 200
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:27.2006507Z ##[error]Process completed with exit code 1.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:27.2050053Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.2016400Z Pruning is unnecessary.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.2105892Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.3998913Z [command]/usr/bin/git version
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.3999347Z git version 2.53.0
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4002799Z Temporarily overriding HOME='/home/runner/work/_temp/36fe8d4b-4fa9-4b10-bfcb-a491cae6b7ed' before making global git config changes
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4003754Z Adding repository directory to the temporary git global config as a safe directory
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4004650Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4006086Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4007784Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4009465Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4010362Z http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4011628Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4013514Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4015239Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4016740Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4061760Z Cleaning up orphan processes
Validate Code Quality UNKNOWN STEP 2026-02-27T16:02:28.4277826Z Terminate orphan process: pid (3386) (node)
```

## PR #12

- E2E Suite (Playwright — 4 layers): SKIPPED (skipping)
- Flakiness Audit (repeat-each × N): SKIPPED (skipping)
- Vercel Preview Comments: SUCCESS (pass)
- Seer Code Review: NEUTRAL (skipping)
- Validate Code Quality: FAILURE (fail)
- Vercel Agent Review: NEUTRAL (skipping)
- Vercel – chefiapp-pos-core: SUCCESS (pass)
- Vercel – integration-gateway: SUCCESS (pass)

### Validate Code Quality failure

- run: 22504981680
- job: 65201289793
- tail log:

```text
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:45.4788339Z     ✓ should handle nested objects (1 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:45.4789248Z     ✓ should return primitives unchanged (1 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:45.4789872Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:46.6970682Z PASS jsdom tests/unit/ui/IncomingRequests.test.tsx
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:46.6987368Z   IncomingRequests
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:46.6988463Z     ✓ deve renderizar sem lançar erro (10 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:46.6989594Z     ✓ deve exibir o conteúdo do stub (5 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:46.6990160Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.0442126Z PASS jsdom tests/unit/ui/CashRegisterAlert.test.tsx
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.0443003Z   CashRegisterAlert
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.0443965Z     ✓ deve renderizar sem lançar erro (6 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.0444830Z     ✓ deve exibir o conteúdo do stub (5 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.0445314Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1150945Z PASS jsdom tests/unit/ui/CloseCashRegisterModal.test.tsx (13.718 s)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1151948Z   CloseCashRegisterModal
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1152876Z     ✓ deve renderizar o modal (136 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1153880Z     ✓ deve exibir total esperado (abertura + vendas) (22 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1155066Z     ✓ deve ter input de total declarado com placeholder 0,00 (13 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1156259Z     ✓ deve calcular diferença ao preencher valor (27 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1158828Z     ✓ deve fechar caixa com valor válido (40 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1159761Z     ✓ deve cancelar quando botão cancelar é clicado (17 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.1160717Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.5567665Z PASS jsdom tests/unit/ui/OpenCashRegisterModal.test.tsx
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.5571893Z   OpenCashRegisterModal
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.5576122Z     ✓ deve renderizar sem lançar erro (7 ms)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.5580328Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8577818Z Test Suites: 1 skipped, 64 passed, 64 of 65 total
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8583449Z Tests:       6 skipped, 694 passed, 700 total
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8589443Z Snapshots:   0 total
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8592710Z Time:        47.919 s
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8596179Z Ran all test suites in 2 projects.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8766572Z ##[group]Run bash ./scripts/sovereignty-gate.sh
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8767251Z [36;1mbash ./scripts/sovereignty-gate.sh[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8816051Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8816296Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8816541Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8817076Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8921647Z [sovereignty-gate] Checking order creation does not use Supabase RPC in financial-critical modules...
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.8988973Z [sovereignty-gate] Sovereignty gate PASSED (order creation via CoreOrdersApi).
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9016551Z ##[group]Run bash ./scripts/check-financial-supabase.sh
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9017401Z [36;1mbash ./scripts/check-financial-supabase.sh[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9063237Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9063475Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9063721Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9064023Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9164697Z [check-financial-supabase] Checking merchant-portal/src for Supabase usage on gm_orders, gm_order_items, fiscal_event_store, inventory_*...
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9633759Z [check-financial-supabase] PASSED (no Supabase usage on financial domain tables).
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9661720Z ##[group]Run bash ./scripts/contract-gate.sh
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9662068Z [36;1mbash ./scripts/contract-gate.sh[0m
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9708829Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9709083Z env:
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9709324Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9709633Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9808680Z [contract-gate] Step 1: Checking for empty .md in docs/architecture and docs/contracts...
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9850283Z [contract-gate]   OK: No empty .md files.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:48.9852846Z [contract-gate] Step 2: Verifying referenced .md exist and are non-empty...
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:49.0418221Z [contract-gate]   OK: All referenced files exist and are non-empty.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:49.0419842Z [contract-gate] Step 3: Checking no unindexed docs (strict: all must be in CORE_CONTRACT_INDEX)...
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1609151Z [contract-gate] FAIL: UNINDEXED_DOC: docs/architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md (must be linked in CORE_CONTRACT_INDEX.md)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1614012Z [contract-gate] FAIL: UNINDEXED_DOC: docs/architecture/MANDATORY_ARCHITECTURE_AND_PUBLICATION_READINESS.md (must be linked in CORE_CONTRACT_INDEX.md)
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1615134Z
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1615555Z [contract-gate] Contract gate FAILED. Fix the issues above.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1635640Z ##[error]Process completed with exit code 1.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.1696921Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.2253402Z Pruning is unnecessary.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.2356542Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3335901Z [command]/usr/bin/git version
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3379376Z git version 2.53.0
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3437113Z Temporarily overriding HOME='/home/runner/work/_temp/833cb43b-12a6-4e5a-80b9-f31163e9a1cb' before making global git config changes
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3440257Z Adding repository directory to the temporary git global config as a safe directory
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3444346Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3483681Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3520692Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3795328Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3820494Z http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3835407Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.3871463Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.4135587Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.4173737Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Validate Code Quality UNKNOWN STEP 2026-02-27T21:46:50.4545729Z Cleaning up orphan processes
```

## PR #29

- Vercel Preview Comments: SUCCESS (pass)
- E2E Suite (Playwright — 4 layers): SKIPPED (skipping)
- Flakiness Audit (repeat-each × N): SKIPPED (skipping)
- Seer Code Review: SUCCESS (pass)
- Validate Code Quality: FAILURE (fail)
- Vercel Agent Review: NEUTRAL (skipping)
- Vercel – chefiapp-pos-core: FAILURE (fail)
- Vercel – integration-gateway: FAILURE (fail)

### Validate Code Quality failure

- run: 22565230491
- job: 65359900383
- tail log:

```text
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:07.5287445Z Progress: resolved 0, reused 1922, downloaded 0, added 2232, done
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.1655458Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.4896122Z merchant-portal postinstall$ bash fix-capacitor-paths.sh 2>/dev/null || true
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5132459Z merchant-portal postinstall: ✓ Symlinked @capacitor-mlkit → root node_modules
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5163871Z merchant-portal postinstall: ✓ Symlinked @capgo → root node_modules
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5170563Z merchant-portal postinstall: ✓ Capacitor workspace paths ready
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5193126Z merchant-portal postinstall: Done
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5219257Z Done in 10.3s
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5916892Z ##[group]Run npm run check:browser-guard-purity
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5917513Z [36;1mnpm run check:browser-guard-purity[0m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5985075Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5985442Z env:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5985818Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.5986311Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.7609140Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.7610209Z > chefiapp-pos-core@1.0.1 check:browser-guard-purity
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.7611707Z > node scripts/check-browser-guard-purity.mjs
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.7612797Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8260722Z ✅ check:browser-guard-purity: BrowserBlockGuard remains storage/global-trial free
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8551595Z ##[group]Run make simulate-failfast
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8552077Z [36;1mmake simulate-failfast[0m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8627012Z shell: /usr/bin/bash -e {0}
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8627394Z env:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8627981Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8628490Z ##[endgroup]
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:08.8759491Z npm run typecheck
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:09.0958566Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:09.1003456Z > chefiapp-pos-core@1.0.1 typecheck
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:09.1004053Z > tsc -p tsconfig.json --noEmit
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:09.1004348Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:11.5403647Z npm run build
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:11.6578814Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:11.6582966Z > chefiapp-pos-core@1.0.1 build
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:11.6591171Z > npm run -s build:core && npm -w merchant-portal run -s build && npm run -s export:portal
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:11.6591837Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1748507Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1750867Z ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1757560Z 🔒 CONSTITUTION VALIDATOR
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1775076Z ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1775399Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1775638Z ✅ CONSTITUTION VALIDATED
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1776084Z    System is clean. Build allowed.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.1776367Z
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.5916691Z [36mvite v7.3.1 [32mbuilding client environment for production...[36m[39m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:14.7038120Z transforming...
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1833313Z [32m✓[39m 91 modules transformed.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1878113Z [31m✗[39m Build failed in 552ms
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1879553Z [31merror during build:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1881870Z [31m[vite-plugin-pwa:build] [plugin vite-plugin-pwa:build] src/App.tsx: There was an error during the build:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1883125Z   Could not resolve "./components/DevBuildBanner" from "src/App.tsx"
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1884206Z Additionally, handling the error in the 'buildEnd' hook caused the following error:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1885488Z   Could not resolve "./components/DevBuildBanner" from "src/App.tsx"[31m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1886870Z file: [36m/home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/merchant-portal/src/App.tsx[31m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1888861Z     at getRollupError (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/node_modules/rollup/dist/es/shared/parseAst.js:402:41)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1891224Z     at file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/node_modules/rollup/dist/es/shared/node-entry.js:23444:39
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1893809Z     at async catchUnfinishedHookActions (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/node_modules/rollup/dist/es/shared/node-entry.js:22902:16)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1896565Z     at async rollupInternal (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/node_modules/rollup/dist/es/shared/node-entry.js:23427:5)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1900205Z     at async buildEnvironment (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/dist/node/chunks/config.js:33541:12)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1901445Z     at async Object.build (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/dist/node/chunks/config.js:33900:19)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1902475Z     at async Object.buildApp (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/dist/node/chunks/config.js:33897:153)
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.1903659Z     at async CAC.<anonymous> (file:///home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE/node_modules/vite/dist/node/cli.js:629:3)[39m
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.2192403Z make: *** [Makefile:14: build] Error 1
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.2207135Z ##[error]Process completed with exit code 2.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.2338062Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.2901442Z Pruning is unnecessary.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.3005915Z Post job cleanup.
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4092988Z [command]/usr/bin/git version
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4191389Z git version 2.53.0
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4256733Z Temporarily overriding HOME='/home/runner/work/_temp/38fb5f75-2976-4b2a-9d1f-7a69b13bec8c' before making global git config changes
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4259498Z Adding repository directory to the temporary git global config as a safe directory
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4264293Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/ChefIApp-POS-CORE/ChefIApp-POS-CORE
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4328312Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4383727Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4813868Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4855001Z http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4878591Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.4930739Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.5335455Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.5402107Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Validate Code Quality UNKNOWN STEP 2026-03-02T07:08:15.5815386Z Cleaning up orphan processes
```
