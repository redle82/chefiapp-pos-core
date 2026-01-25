# Documentation Migration Plan: PT → EN

> **Status:** In Progress  
> **Date:** 2026-01-24  
> **Rule:** Canonical documents = English only

---

## 🎯 Strategy

**Canonical documents** (system-defining) → **English**  
**Operational/internal documents** → Portuguese OK  
**Translations** → Optional, in `docs/translations/pt-BR/`

---

## 📋 Priority List

### 🔴 CRITICAL (Convert First)

These documents define the system and must be in English:

1. ✅ `CORE_MANIFESTO.md` → `CORE_MANIFESTO.md` (EN)
2. ✅ `docs/CORE_OVERVIEW.md` → `docs/CORE_OVERVIEW.md` (EN)
3. ✅ `docs/STATUS_TECH.md` → `docs/STATUS_TECH.md` (EN)
4. ✅ `docs/STATUS_OPERATION.md` → `docs/STATUS_OPERATION.md` (EN)
5. ⏳ `START_HERE.md` → `START_HERE.md` (EN)
6. ⏳ `ROADMAP.md` → `ROADMAP.md` (EN)
7. ⏳ `EXECUTIVE_SUMMARY.md` → `EXECUTIVE_SUMMARY.md` (EN)

### 🟡 HIGH PRIORITY (Convert Next)

8. ⏳ `docs/CORE_ARCHITECTURE.md` → Check if already EN
9. ⏳ `docs/PROJECT_STATUS.md` → `docs/PROJECT_STATUS.md` (EN)
10. ⏳ `CONTRIBUTING.md` → `CONTRIBUTING.md` (EN)

### 🟢 MEDIUM PRIORITY (Convert Later)

11. ⏳ `README.md` → Keep bilingual or EN-only?
12. ⏳ `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md` → EN
13. ⏳ `docs/testing/FAIL_FAST_MODE.md` → EN

### ⚪ LOW PRIORITY (Keep PT or Archive)

- Session logs, notes, historical documents
- Internal decision logs
- Development logs

---

## 📁 Structure After Migration

```
/
├── CORE_MANIFESTO.md              (EN - canonical)
├── START_HERE.md                   (EN - canonical)
├── ROADMAP.md                      (EN - canonical)
├── EXECUTIVE_SUMMARY.md            (EN - canonical)
├── README.md                       (EN - main entry point)
├── CONTRIBUTING.md                 (EN - canonical)
├── docs/
│   ├── CORE_OVERVIEW.md           (EN - canonical)
│   ├── CORE_ARCHITECTURE.md       (EN - canonical)
│   ├── STATUS_TECH.md             (EN - canonical)
│   ├── STATUS_OPERATION.md         (EN - canonical)
│   ├── PROJECT_STATUS.md           (EN - canonical)
│   ├── testing/
│   │   ├── MEGA_OPERATIONAL_SIMULATOR.md (EN)
│   │   └── FAIL_FAST_MODE.md      (EN)
│   └── translations/
│       └── pt-BR/
│           ├── CORE_MANIFESTO.pt.md
│           └── CORE_OVERVIEW.pt.md
└── docs/archive/
    └── (PT documents moved here if needed)
```

---

## ✅ Migration Rules

1. **One language per file** - Never mix PT/EN in same document
2. **Keep technical terms** - "SLA", "offline-first", "idempotency" stay as-is
3. **Preserve structure** - Same sections, same hierarchy
4. **Update links** - All internal links must point to EN versions
5. **Archive PT originals** - Move to `docs/translations/pt-BR/` or `docs/archive/`

---

## 🚀 Execution Plan

### Phase 1: Critical Documents (Now)
- [x] CORE_MANIFESTO.md
- [x] docs/CORE_OVERVIEW.md
- [x] docs/STATUS_TECH.md
- [x] docs/STATUS_OPERATION.md
- [ ] START_HERE.md
- [ ] ROADMAP.md
- [ ] EXECUTIVE_SUMMARY.md

### Phase 2: High Priority (Next)
- [ ] docs/CORE_ARCHITECTURE.md
- [ ] docs/PROJECT_STATUS.md
- [ ] CONTRIBUTING.md

### Phase 3: Medium Priority (Later)
- [ ] README.md (decide: bilingual or EN-only)
- [ ] docs/testing/*.md

---

## 📝 Notes

- Original PT documents will be preserved in `docs/translations/pt-BR/`
- All canonical documents must be in English
- Internal/operational documents can remain in Portuguese
- Never mix languages in the same file

---

*This migration ensures the Core is internationally readable and professionally structured.*
