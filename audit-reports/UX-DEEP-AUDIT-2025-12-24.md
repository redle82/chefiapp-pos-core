# UX SYSTEMS DEEP AUDIT
**ChefIApp / Merchant Portal / AppStaff / TPV**
**Data**: 2025-12-24
**Metodologia**: AntiGravity Truth Testing + Google Phase-0 Protocol
**Auditor**: Senior UX Systems Auditor

---

## 1. EXECUTIVE VERDICT

| Metrica | Valor |
|---------|-------|
| **Status** | TRUSTWORTHY (com ressalvas P0) |
| **Confidence Score** | 7.2/10 |
| **Producao hoje?** | SIM (beta controlado apenas) |

### Justificativa

O sistema NAO mente ativamente apos as correcoes aplicadas. Porem, existem **3 violacoes P0** que so aparecem sob falha de backend ou stress humano. Estas violacoes nao sao "edge cases" - sao cenarios reais que DEVEM ser corrigidos antes de escala.

---

## 2. P0 TRUTH VIOLATIONS (CRITICAS)

### P0-V1: Progress Teatral em CreatingPage

**Arquivo**: `merchant-portal/src/pages/start/CreatingPage.tsx`
**Linhas**: 21-71

**Comportamento**:
```typescript
// Linha 30-33: Progresso FAKE baseado em timer, nao em trabalho real
const progTimer = setInterval(() => {
  setProgress(p => Math.min(p + 3, 95))
}, 100)

// Linha 60-64: Navega apos 3.5s INDEPENDENTE do resultado da API
const navTimer = setTimeout(() => {
  setProgress(100)
  setTimeout(() => navigate('/app/preview'), 400)
}, 3500)
```

**Violacao**: A barra de progresso avanca mesmo se a API falhar. O usuario ve 100% e navega para preview, mas pode estar em modo demo sem saber.

**Impacto Humano**: Usuario acredita que seu restaurante foi criado. Na realidade, pode ser apenas um mock local.

**Classificacao**: P0 - THEATRICAL PROGRESS

---

### P0-V2: Fallback Silencioso em Backend Down

**Arquivo**: `merchant-portal/src/pages/start/CreatingPage.tsx`
**Linhas**: 52-55

**Comportamento**:
```typescript
} catch {
  // Backend off? Nao quebra UX - modo demo
  localStorage.setItem('chefiapp_restaurant_id', `demo-${Date.now()}`)
}
```

**Violacao**: Quando o backend falha, o sistema cria um ID demo **sem informar o usuario**. O usuario continua o fluxo achando que tem um restaurante real.

**Impacto Humano**: Usuario pode configurar menu, pagamentos, publicar - tudo em modo demo sem perceber. Quando tentar operar, nada funciona.

**Classificacao**: P0 - SILENT DEGRADATION

---

### P0-V3: Progress Simulado em BootstrapPage

**Arquivo**: `merchant-portal/src/pages/BootstrapPage.tsx`
**Linhas**: 20-36

**Comportamento**:
```typescript
// Simula bootstrap progressivo
const timers: Array<ReturnType<typeof setTimeout>> = []
steps.forEach((_, i) => {
  timers.push(setTimeout(() => setStep(i), i * 700))
})
```

**Violacao**: Os steps "A preparar tudo", "A criar restaurante", "A montar menu" sao pura animacao. Nenhum trabalho real acontece.

**Impacto Humano**: Usuario ve mensagens que implicam causalidade ("A criar o teu restaurante") quando nada esta sendo criado.

**Classificacao**: P0 - FALSE CAUSALITY ANIMATION

---

### P0-V4: Health Check Unico

**Arquivo**: Apenas `EntryPage.tsx` verifica `/api/health`

**Comportamento**: Apos passar pelo EntryPage, nenhuma outra pagina verifica se o backend ainda esta up.

**Violacao**: Usuario pode estar no TPV, AppStaff ou Analytics com backend down. Acoes vao falhar sem contexto.

**Impacto Humano**: Operador tenta processar pedido, sistema falha. Nao ha indicacao previa de que o sistema estava degradado.

**Classificacao**: P0 - NO CONTINUOUS HEALTH

---

## 3. HIDDEN UX RISKS (NAO OBVIOS)

### HIDDEN-1: Microcopy Otimista

| Arquivo | Linha | Texto | Problema |
|---------|-------|-------|----------|
| StartLayout.tsx | 13 | "O teu TPV pronto em minutos" | Promessa temporal nao garantida |
| AuthPage.tsx | 33 | "criar o teu espaco em segundos" | Promessa temporal nao garantida |
| BootstrapPage.tsx | 77 | "apenas alguns segundos" | Promessa temporal durante animacao fake |
| EntryPage.tsx | 77 | "Pronto em 2 minutos" | Promessa temporal sem verificacao de backend |

**Risco**: Sob carga, lentidao de rede, ou backend lento, estas promessas tornam-se mentiras.

---

### HIDDEN-2: Double-Navigation Race Condition

**Cenario**: Usuario clica em "Publicar", ve loading, fica impaciente, clica em outro link.

**Comportamento Atual**: Nao ha lock de navegacao durante operacoes criticas. Usuario pode sair no meio de um publish e corromper estado.

**Evidencia**: Nenhum `beforeunload` handler encontrado em PublishStep.tsx

---

### HIDDEN-3: Modo Demo Invisivel

**Cenario**: Backend down durante criacao, usuario continua em modo demo.

**Comportamento Atual**: Nao ha **nenhum indicador visual** de que o usuario esta em modo demo vs producao.

**Risco**: Usuario opera durante horas em modo demo, pensa que esta funcionando.

---

### HIDDEN-4: Reload Durante Onboarding

**Cenario**: Usuario da F5 durante Step 3 do onboarding.

**Comportamento Atual**: Estado e perdido. Usuario volta ao inicio ou ve estado inconsistente.

**Risco**: Frustacao, abandono, dados parciais.

---

## 4. DESIGN SYSTEM WEAKNESSES

### DS-W1: Classes Legacy Paralelas

**Evidencia**: 124 ocorrencias de `className="btn|card|banner"` em 11 arquivos

**Problema**: Duas fontes de verdade para estilos. Mudanca em Button.tsx nao afeta paginas usando `.btn`.

**Impacto**: Inconsistencia visual, manutencao duplicada.

---

### DS-W2: Cores Hardcoded

**Evidencia**: 327 ocorrencias de cores hex/rgb em 30 arquivos

**Problema**: Cores fora do tema central. Dark mode vai quebrar.

---

### DS-W3: Touch Targets Inconsistentes

| Componente | Height | Conforme? |
|------------|--------|-----------|
| button--sm | 40px | MARGINAL |
| button--md | 44px | OK |
| Paginas legacy | variavel | NAO VERIFICADO |

---

### DS-W4: Accessibility Deficit

**Evidencia**:
- Apenas 13 ocorrencias de aria-* ou role=
- 0 ocorrencias de prefers-reduced-motion em componentes ativos
- 0 focus trap em modais

---

## 5. RECOMMENDATIONS

### Phase 0 (DEVE CORRIGIR ANTES DE QUALQUER DEPLOY)

| ID | Acao | Arquivo | Prioridade |
|----|------|---------|------------|
| P0-FIX-1 | Remover progress fake, mostrar spinner honesto | CreatingPage.tsx | CRITICA |
| P0-FIX-2 | Mostrar InlineAlert quando em modo demo | CreatingPage.tsx | CRITICA |
| P0-FIX-3 | Bloquear navegacao se backend falhar | CreatingPage.tsx | CRITICA |
| P0-FIX-4 | Health check continuo ou banner de status | Global | CRITICA |

### Phase 3.1 (Pos-Beta Imediato)

| ID | Acao |
|----|------|
| 3.1-1 | Migrar classes legacy para Design System |
| 3.1-2 | Centralizar cores em tokens |
| 3.1-3 | Remover promessas temporais da microcopy |
| 3.1-4 | Adicionar indicador visual de modo demo |

### Phase 3.2 (Compliance & Escala)

| ID | Acao |
|----|------|
| 3.2-1 | ARIA labels em todos os componentes interativos |
| 3.2-2 | Focus management em fluxos multi-step |
| 3.2-3 | prefers-reduced-motion em todas as animacoes |
| 3.2-4 | beforeunload em operacoes criticas |

---

## 6. FINAL STATEMENT

> **"Does this UI ever lie to the human, even politely?"**

**Sim, em 3 cenarios especificos:**

1. **Progress bars que avancam sem trabalho real** - Mentira cinematografica. O usuario ve "A criar o teu restaurante" enquanto apenas timers rodam.

2. **Fallback silencioso para modo demo** - Mentira por omissao. O usuario nao sabe que esta em modo demo quando backend falha.

3. **Promessas temporais nao verificadas** - Mentira otimista. "Pronto em 2 minutos" pode ser falso sob carga.

**Estas mentiras nao sao maliciosas, mas sao mentiras.**

Em um restaurante real, com operador sob pressao, estas mentiras polidas podem causar:
- Perda de pedidos
- Configuracao de pagamentos em modo demo
- Frustacao e abandono
- Perda de confianca no sistema

---

## VEREDICTO FINAL

```
┌─────────────────────────────────────────────┐
│  UX SYSTEMS AUDIT - FINAL VERDICT          │
├─────────────────────────────────────────────┤
│  Status:        TRUSTWORTHY (condicional)  │
│  P0 Violations: 4                          │
│  Hidden Risks:  4                          │
│  DS Weaknesses: 4                          │
│                                            │
│  DEPLOY RECOMMENDATION:                    │
│  ✓ Beta Controlado: SIM                   │
│  ✗ Producao Escala: NAO (ate P0 fix)      │
│                                            │
│  CONDICAO PARA ESCALA:                    │
│  Corrigir P0-FIX-1 a P0-FIX-4             │
└─────────────────────────────────────────────┘
```

---

*Este relatorio nao foi gentil porque gentileza nao protege usuarios.*
*Gerado pelo Senior UX Systems Auditor*
*ChefIApp v1.0.0*
