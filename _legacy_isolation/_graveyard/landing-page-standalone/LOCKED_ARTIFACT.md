# 🔒 LOCKED ARTIFACT — DO NOT TOUCH

**Status**: FROZEN  
**Locked**: 2026-01-05  
**Owner**: Core Team

---

## ⚠️ THIS DIRECTORY IS PROTECTED

This landing page is the **official public face** of ChefIApp.

### What this means:

- ❌ **NO automatic purges**
- ❌ **NO refactors without explicit approval**
- ❌ **NO "cleanup" commits**
- ❌ **NO design experiments**

### Before ANY change:

1. Confirm with product owner
2. Screenshot current state
3. Test in isolation
4. Commit with `[LOCKED]` prefix

---

## 📋 Protected Assets

| File | Purpose |
|------|---------|
| `src/components/Hero.tsx` | Main hero with logo + CTA |
| `src/components/Problem.tsx` | Pain points section |
| `src/components/Solution.tsx` | Value proposition |
| `src/components/Integration.tsx` | "Funciona com o que você já usa" |
| `src/components/HardwareFlex.tsx` | Hardware flexibility |
| `src/components/IntegrationDelivery.tsx` | Delivery positioning |
| `src/components/IntegrationHumor.tsx` | "Para quem vive a cozinha" |
| `src/components/Testimonial.tsx` | Sofia Gastrobar proof |
| `src/components/HowItWorks.tsx` | 14-day pilot flow |
| `src/components/Demonstration.tsx` | Live demo section |
| `src/components/FAQ.tsx` | Honest questions |
| `src/components/Footer.tsx` | Final CTA + credits |
| `public/logo.png` | Golden chef hat logo |

---

## 🎯 Design Principles (DO NOT VIOLATE)

1. **Gold/Yellow** is the primary accent — NOT green, NOT blue
2. **"Sistema OPERACIONAL"** — exact wording, capitalized
3. **No marketing fluff** — operational language only
4. **One CTA path** — `/login` via Google OAuth
5. **Sofia Gastrobar** is the living proof — always reference

---

## 🔗 Integration Points

```
Landing (/)           → This app
Login (/login)        → merchant-portal (OAuth)
Dashboard (/app/*)    → merchant-portal (authenticated)
```

---

**Last verified working**: 2026-01-05 16:05 UTC
