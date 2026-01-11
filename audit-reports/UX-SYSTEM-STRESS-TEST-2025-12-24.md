# UX/UI SYSTEM STRESS TEST
**ChefIApp / AppStaff / TPV / Portal**
**Data**: 2025-12-24
**Modo**: Break Attempts (UX Edition)

---

## RESUMO EXECUTIVO

| Categoria | Testes | Passou | Falhou | Criticos |
|-----------|--------|--------|--------|----------|
| DS-1: Tokens | 3 | 1 | 2 | 1 |
| DS-2: Componentes | 2 | 1 | 1 | 0 |
| UX-TRUTH | 4 | 3 | 1 | 1 |
| UX-FLOW | 3 | 2 | 1 | 1 |
| UX-TPV | 4 | 4 | 0 | 0 |
| UX-STAFF | 6 | 6 | 0 | 0 |
| UX-DATA | 4 | 4 | 0 | 0 |
| UX-MOBILE | 4 | 2 | 2 | 1 |
| UX-REG | 2 | 1 | 1 | 0 |
| **TOTAL** | **32** | **24** | **8** | **4** |

**SCORE**: 75% (24/32 PASS)

---

## 1. DESIGN SYSTEM (DS)

### DS-1.1: Padding/Margin Hardcoded
**Status**: FAIL

**Evidencia**:
```
merchant-portal/src/App.tsx:23: padding:24px
merchant-portal/src/pages/start/MenuPage.tsx:71: paddingBottom: 32
merchant-portal/src/pages/AuthPage.tsx:27: paddingTop: '10vh'
+ 100+ ocorrencias em pages/
```

**Impacto**: ALTO
- Valores nao usam tokens do Design System
- Inconsistencia visual entre paginas

---

### DS-1.2: Cores Hardcoded
**Status**: FAIL

**Evidencia**:
```
327 ocorrencias de #hex ou rgb() em 30 arquivos
Exemplos:
- merchant-portal/src/pages/start/MenuPage.tsx:31
- merchant-portal/src/pages/AppStaff/AppStaff.tsx:7 (usando cores inline)
```

**Impacto**: MEDIO
- Cores fora do tema central
- Dark mode pode quebrar

---

### DS-1.3: Border-Radius Hardcoded
**Status**: PASS (com ressalvas)

**Nota**: Maioria usa CSS variables, mas App.css tem valores fixos.

---

### DS-2.1: Componentes Fora do DS
**Status**: FAIL

**Evidencia**:
```
124 ocorrencias de className="btn|card|banner|muted"
11 arquivos usando classes legacy:
- merchant-portal/src/App.tsx:41
- merchant-portal/src/pages/SetupLayout.tsx:7
- merchant-portal/src/pages/steps/*.tsx
```

**Impacto**: MEDIO
- Duas fontes de verdade para UI
- Manutenibilidade reduzida

---

### DS-2.2: Componentes Criados
**Status**: PASS

Todos os novos componentes seguem o padrao:
- TopBar, SideNav, MobileNav
- Toast, InlineAlert, Skeleton

---

## 2. VERDADE VISUAL (UX-TRUTH)

### UX-TRUTH-1: Ghost Parece Live
**Status**: FAIL (CRITICO)

**Evidencia**:
```typescript
// Home.tsx:207 (dentro de HomeGhost)
<p>Comece a receber pedidos</p>
```

**Problema**: Microcopy promete funcionalidade que NAO existe em estado ghost.

**Classificacao**: MICROCOPY MENTIROSA

---

### UX-TRUTH-2: TruthBadge Presente
**Status**: PASS

TruthBadge usado corretamente em:
- Home.tsx (ghost + live)
- AppStaff.tsx (shift status, system health)
- Settings.tsx (compliance)
- Onboarding/Step5Publish.tsx

---

### UX-TRUTH-3: Distincao Ghost/Live
**Status**: PASS

- HomeGhost vs HomeLive sao views distintas
- TruthBadge com showLabel=true
- Cores e estados visivelmente diferentes

---

### UX-TRUTH-4: URL Clicavel em Ghost
**Status**: PASS

- PreviewPage verifica previewState
- URLs mostradas mas nao linkadas ativamente

---

## 3. FLOW UX (CAUSALIDADE VISUAL)

### UX-FLOW-1: Bloqueio Correto
**Status**: PASS

- FlowEngine.ts define ordem causal
- GuardedRoute bloqueia navegacao invalida
- CAUSAL_FLOW enforces: identity -> slug -> menu -> [payments] -> publish -> tpv-ready

---

### UX-FLOW-2: Microcopy Honesta
**Status**: FAIL (CRITICO)

**Violacoes encontradas**:

| Arquivo | Linha | Texto | Problema |
|---------|-------|-------|----------|
| Home.tsx | 207 | "Comece a receber pedidos" | Em HomeGhost - MENTIRA |

**Contexto**: Este texto aparece na secao "Impacto de Publicar", mas da a impressao que ja pode receber pedidos.

---

### UX-FLOW-3: Router Guard
**Status**: PASS

- GuardedRoute implementado corretamente
- meta.allowedPreviewStates verificado
- Redirect automatico para rota correta

---

## 4. TPV (STRESS OPERACIONAL)

### UX-TPV-1: Interface sob Pressao
**Status**: PASS

- 4 colunas kanban (Novo, Em Preparo, Pronto, Servido)
- Estados claros com OrderCard
- Acoes consistentes (send, ready, close)

---

### UX-TPV-2: Protecao Erro Humano
**Status**: PASS

- Checkout tem fluxo separado
- Confirmacao antes de fechar pedido
- Botao "Cancelar" sempre disponivel

---

### UX-TPV-3: Estados Visuais
**Status**: PASS

- Status do pedido visivel no card
- Tempo desde criacao mostrado
- Prioridade visual adequada

---

### UX-TPV-4: Acoes Claras
**Status**: PASS

- Botoes grandes e claros
- Microcopy curta ("+ Novo", "Confirmar")
- Voltar sempre acessivel

---

## 5. APPSTAFF (PSICOLOGICO + JUSTICA)

### UX-STAFF-1: Worker Entende Status
**Status**: PASS

- TruthBadge mostra se em turno
- Tarefas com prioridade visual
- RiskLevel visivel

---

### UX-STAFF-2: Tarefas Criticas Visiveis
**Status**: PASS

- TaskCard com priority='critical' destaca
- HACCP validation marcado claramente
- requiresValidation flag funciona

---

### UX-STAFF-3: Manager Ve Alertas
**Status**: PASS

- Alertas em Card separado
- Riscos e HACCP contados
- Nao e ruido - so mostra quando > 0

---

### UX-STAFF-4: Owner Entende Sistema
**Status**: PASS

- Health bar visual
- Compliance score numerico
- Conformidade em 3 cards (Equidade, Auditoria, Certificacoes)

---

### UX-STAFF-5: Equidade Visivel
**Status**: PASS

- Historico imutavel mencionado
- Relatorio acessivel
- Transparencia explicita

---

### UX-STAFF-6: Views por Papel
**Status**: PASS

- 3 views: Worker, Manager, Owner
- Toggle entre views funciona
- Cada view mostra info relevante

---

## 6. ANALYTICS (ANTI-BULLSHIT)

### UX-DATA-1: KPIs Acionaveis
**Status**: PASS

- Receita, Ticket, Pedidos, Conclusao, Preparo
- Trends com direcao e percentual
- Estado (healthy/warning/critical)

---

### UX-DATA-2: Insights Reais
**Status**: PASS

Insights derivados de dados:
- "Taxa de conclusao baixa" (quando < 90%)
- "Preparo lento" (quando > 25min)
- "Receita em alta" (quando trend > 10%)

Nenhum insight generico tipo "Voce esta indo bem!"

---

### UX-DATA-3: Sparklines Funcionais
**Status**: PASS

- Grafico CSS puro implementado
- 12 barras por hora
- Interativo (hover states)

---

### UX-DATA-4: Footer Honesto
**Status**: PASS

```
"Dados do Flow Engine (TPV + AppStaff + Contratos)."
```

Sem opiniao, apenas fonte.

---

## 7. MOBILE & ACESSIBILIDADE

### UX-MOBILE-1: Touch Targets 44px
**Status**: FAIL (PARCIAL)

**Evidencia**:
```css
/* Button.css */
.button--sm { height: 32px }  /* VIOLA 44px */
.button--md { height: 44px }  /* OK */
.button--lg { height: 52px }  /* OK */
```

**Impacto**: Botoes pequenos dificieis de tocar em mobile

---

### UX-MOBILE-2: MobileNav
**Status**: PASS

- Fixed bottom
- Safe area respeitada
- Max 5 items

---

### UX-MOBILE-3: ARIA Labels
**Status**: FAIL

**Evidencia**:
```
Apenas 10 ocorrencias de aria-* ou role= em todo merchant-portal/
Componentes sem:
- Button
- Card
- OrderCard
- TaskCard
- ShiftCard
```

**Impacto**: Acessibilidade comprometida para leitores de tela

---

### UX-MOBILE-4: Reduced Motion
**Status**: PASS (PARCIAL)

Apenas Skeleton.css implementa @media (prefers-reduced-motion).
Toast, MobileNav, TopBar nao respeitam.

---

## 8. REGRESSAO (ANTI-GAMBIARRA)

### UX-REG-1: TODOs Pendentes
**Status**: PASS (ACEITAVEL)

Apenas 2 TODOs encontrados:
- landing-page/src/pages/Onboarding.tsx:45 (fetch mock)
- components/legal/LegalComplianceWizard.tsx:25 (persist)

Nenhum critico ou bloqueador.

---

### UX-REG-2: Layouts Duplicados
**Status**: FAIL

**Evidencia**:
- App.css define classes legacy (btn, card, banner)
- Design System define componentes modernos (Button, Card)
- 11 arquivos usam classes legacy

**Impacto**: Duas fontes de verdade para estilos

---

## FALHAS CRITICAS (4)

| ID | Descricao | Arquivo | Acao |
|----|-----------|---------|------|
| CRIT-1 | Microcopy mentirosa em ghost | Home.tsx:207 | Mudar texto |
| CRIT-2 | Valores hardcoded | 30+ arquivos | Migrar para tokens |
| CRIT-3 | Touch target < 44px | Button.css | Aumentar button--sm |
| CRIT-4 | ARIA insuficiente | Componentes DS | Adicionar roles |

---

## ACOES RECOMENDADAS

### Prioridade 1 (BLOQUEIA BETA)

1. **CRIT-1**: Mudar Home.tsx:207
   ```typescript
   // DE:
   <p>Comece a receber pedidos</p>
   // PARA:
   <p>Pedidos disponiveis apos publicar</p>
   ```

### Prioridade 2 (PRE-LANCAMENTO)

2. **CRIT-3**: Button.css aumentar sm
   ```css
   .button--sm { height: 40px; }
   ```

3. **CRIT-4**: Adicionar ARIA basico
   ```typescript
   // Button.tsx
   role="button"
   aria-disabled={disabled}
   ```

### Prioridade 3 (POS-BETA)

4. **CRIT-2**: Migrar valores hardcoded para tokens
5. **UX-REG-2**: Consolidar App.css e Design System

---

## VEREDICTO FINAL

```
UX/UI SYSTEM STRESS TEST
------------------------
Total Tests: 32
Passed: 24
Failed: 8
Critical Failures: 4

SCORE: 75%

VERDICT: [ ] SYSTEM TRUSTWORTHY
         [X] SYSTEM MISLEADING (1 microcopy mentirosa)
         [ ] SYSTEM LEAKING
```

### CONDICAO PARA BETA

O sistema esta **QUASE pronto** mas tem 1 falha critica que DEVE ser corrigida:

**Home.tsx:207** - Microcopy "Comece a receber pedidos" em estado ghost e **mentira tecnica**.

Apos corrigir: **BETA READY**

---

*Gerado pelo UX/UI Stress Test Engine*
*ChefIApp v1.0.0*
