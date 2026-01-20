# CORE WEB CONTRACT — Versão Canónica Final

**Data de Lock:** 2025-12-24  
**Status:** IMUTÁVEL  
**Violações:** BLOQUEADAS no gate

---

## 3 Incoerências Corrigidas

### ✅ Fix 1: Payments Opcional para TPV

**Problema anterior:**
```typescript
const canUseTPV = published && menuDefined && paymentConfigured  // ❌
```

**Solução correta:**
```typescript
const canUseTPV = published && menuDefined  // ✅ cash/offline OK
const canReceiveOrders = published && menuDefined && paymentConfigured  // só pedidos pagos
```

**Razão:**
- TPV funciona com cash e offline
- Payments só é obrigatório para pedidos online pagos
- Contradição com fix já validado em produção

---

### ✅ Fix 2: previewIsReal Requer Published

**Problema anterior:**
```typescript
const previewIsReal = identityConfirmed && menuDefined  // ❌
```

**Solução correta:**
```typescript
const previewIsReal = published && identityConfirmed && menuDefined  // ✅
```

**Razão:**
- Preview "real" só existe após publicação
- Antes disso é sempre `ghost`, mesmo com menu
- Alinha com implementação do SetupLayout

---

### ✅ Fix 3: backendIsLive Como Input

**Problema anterior:**
```typescript
backendIsLive: true  // ❌ hardcoded = mentira ontológica
```

**Solução correta:**
```typescript
export function computeWebCoreState(
  wizardState: any,
  health?: 'ok' | 'down'
): WebCoreState {
  // ...
  backendIsLive: health === 'ok'  // ✅ input explícito
}
```

**Razão:**
- Core não decide, recebe
- Sem fetch, sem inferência, sem promessas
- Health vem de fora (polling separado)

---

## Validações Finais (13 Regras)

### Core 1: Ontológico
1. Identity precede menu
2. Menu precede payments
3. Complete setup before publish

### Core 2: Capacidades
4. Preview requires identity
5. **TPV requires published + menu** (payments opcional)
6. Orders require published + menu + payments

### Core 3: Psicológico
7. Ghost requires identity
8. Live requires published
9. URL exists requires published
10. **Real preview requires published + identity + menu**

### Core 4: Contratos Web
11. 15 páginas validadas
12. Nenhuma promete antes do core
13. Todas respeitam allowedPreviewStates

---

## Checklist de Bloqueio Permanente

- [x] Payments removido como requisito de TPV
- [x] previewIsReal corrigido para depender de published
- [x] backendIsLive recebe health como input
- [x] Validador atualizado (CoreWebContract.ts)
- [x] Contratos de página atualizados
- [x] Build passing (336KB, 78 modules)
- [x] Gate ligado ao audit:web-e2e
- [x] CORE_ARCHITECTURE.md atualizado

---

## Gate Automático

```bash
npm run audit:web-e2e
```

**Comportamento:**
1. Valida os 4 cores via `validate-four-cores.js`
2. Se falhar → deploy BLOQUEADO
3. Se passar → executa `audit-web-e2e.js`
4. Resultado guardado com timestamp

---

## Lei de Ouro (Reforçada)

> **Uma página web não pode prometer algo que o core ainda não declarou como existente.**

Exemplos práticos:

❌ **Proibido:**
```tsx
<h1>Página ao vivo!</h1>  // promessa sem validar core.previewState
```

✅ **Permitido:**
```tsx
{core.previewState === 'live' && <h1>Página ao vivo!</h1>}
{core.previewState === 'ghost' && <h1>Pré-visualização</h1>}
```

---

## Proteção Contra 5º Core

**Função `detectFifthCoreAttempt()`** bloqueia:
- Novos state managers
- `localStorage.getItem()` direto
- Contextos com palavra "Core" não aprovados
- Hardcoded truths

**Em code review:**
- [ ] Não cria nova fonte de verdade?
- [ ] Usa `useWebCore()` em vez de inferir?
- [ ] Respeita contratos de página?

---

## Status Final

✅ **SISTEMA FECHADO**

- 4 cores definidos e validados
- 3 incoerências corrigidas
- 13 regras automáticas
- Gate ligado e funcional
- Deploy bloqueado até passar

**Nenhum 5º core pode ser criado sem quebrar o gate.**

---

**Última atualização:** 2025-12-24 (pós-auditoria)  
**Responsável:** Core team  
**Próxima revisão:** Apenas se surgir novo vertical
