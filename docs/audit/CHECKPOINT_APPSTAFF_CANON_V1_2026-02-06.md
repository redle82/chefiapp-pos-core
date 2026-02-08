# AppStaff Canon v1 — 2026-02-06

**Base legal:** [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md) (Lei Final)  
**Auditoria:** [APPSTAFF_VISUAL_AUDIT_FINAL.md](APPSTAFF_VISUAL_AUDIT_FINAL.md) (Opção B — proxy)  
**Veredito:** PASS (proxy validado)

---

## Declaração oficial

O AppStaff encontra-se canonizado ao nível de código e contrato. A auditoria visual por proxy passou sem violações. Qualquer alteração futura que introduza texto explicativo, scroll duplo, layout portal ou dashboard web constitui regressão e deve ser rejeitada.

---

## Violação corrigida

- **Antes:** "Fluxo saudável" (Top Bar — frase explicativa)
- **Depois:** "OK" (estado sintético permitido pelo Canon §3, §7)
- **Ficheiro:** `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx`

---

## Regra anti-regressão

Alterações que reintroduzam:

- Texto explicativo (ex.: "Fluxo saudável", "Modos do AppStaff", "Toque para abrir")
- Scroll duplo (mais de um scroll visível; 100vh/overflow:auto no root de páginas filhas)
- Layout portal ou dashboard web

= **regressão**. Código não avança; rejeitar.

---

## Validação visual (Opção A)

Opcional. Serve para carimbo visual, não para decisão estrutural. Próximo passo legítimo: seguir para outro módulo (menu visual, TPV real, Task System) sem alterar o launcher AppStaff.
