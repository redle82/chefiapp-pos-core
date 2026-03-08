# Repo Hygiene Policy — Artifact & Cache Management

> **Status**: Active
> **Adopted**: 2026-03-07
> **Scope**: `goldmonkey777/ChefIApp-POS-CORE` mono-repo

---

## 1. Core Rules

| Rule   | What                                               | Where it goes                          | Never in git |
| ------ | -------------------------------------------------- | -------------------------------------- | ------------ |
| **R1** | Installer binaries (`.dmg`, `.exe`, `.AppImage`)   | GitHub Releases                        | ✓            |
| **R2** | Native build caches (`android/build/`, `.gradle/`) | Local only (reproducible)              | ✓            |
| **R3** | Packager output (`desktop-app/out/`)               | Local only (electron-builder)          | ✓            |
| **R4** | CocoaPods (`ios/Pods/`)                            | Local only (`pod install` restores)    | ✓            |
| **R5** | Python virtualenv (`.venv/`)                       | Local only                             | ✓            |
| **R6** | Test/debug sprite archives (`testsprite_*`)        | Not tracked; historical reference only | ✓            |

## 2. Desktop Installers — Distribution Path

```
 Build: desktop-app/ → pnpm build && pnpm dist:mac
 Local: desktop-app/out/*.dmg  (gitignored)
  Prod: GitHub Releases (VITE_DESKTOP_DOWNLOAD_BASE)
  Admin: DesktopDownloadSection reads release URL, never public/downloads/
```

The frontend (`DesktopDownloadSection.tsx`) uses `VITE_DESKTOP_DOWNLOAD_BASE` + `VITE_DESKTOP_DOWNLOAD_MAC_FILE` to build download links. In dev mode it shows local build instructions. **No binary is ever served from `merchant-portal/public/`.**

## 3. `.gitignore` Coverage

These rules are enforced in the root `.gitignore` (added 2026-03-07):

```gitignore
*.dmg
*.exe
*.AppImage
**/android/build/
**/android/.gradle/
desktop-app/out/
testsprite_uiux/
testsprite_tests/
.venv/
```

## 4. Local Cleanup Commands

```bash
# Android build caches in node_modules (~1.3 GB)
find node_modules -path '*/android/build' -type d -exec rm -rf {} +

# Mobile Android build + Gradle cache (~960 MB)
rm -rf mobile-app/android/app/build mobile-app/android/.gradle

# Electron packager output (~948 MB)
rm -rf desktop-app/out

# iOS CocoaPods (only when not actively developing iOS, ~928 MB)
rm -rf mobile-app/ios/Pods
# Restore: cd mobile-app/ios && pod install

# Orphaned .dmg on disk (already untracked)
rm -f merchant-portal/public/downloads/*.dmg
```

## 5. Verification

```bash
# Check workspace weight
du -sh .

# Verify gitignore rules are active
git check-ignore test.dmg desktop-app/out/x testsprite_uiux/x

# Confirm nothing tracked that shouldn't be
git ls-files '*.dmg' '*/android/build/*' 'testsprite_*'
# Expected: empty output
```

## 6. Baseline (2026-03-07)

| Metric                 | Before  | After   | Delta |
| ---------------------- | ------- | ------- | ----- |
| Workspace              | 6.6 GB  | 4.0 GB  | −39%  |
| `.git`                 | 317 MB  | 138 MB  | −56%  |
| Clone size (projected) | ~300 MB | ~140 MB | −53%  |

## 7. Future Opportunities

- **iOS Pods** (~928 MB): drop when not in active iOS dev cycle
- **Root `.md` clutter** (35 files, 416 KB): low weight, reorganize in structural refactor
- **`audit-reports/`** (737 files): consider archiving to a branch or separate repo
