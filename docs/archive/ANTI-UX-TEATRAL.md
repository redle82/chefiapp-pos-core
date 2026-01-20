# Anti-UX Teatral — Manifesto Interno

> **"UI nunca antecipa o Core."**

Este documento define a doutrina de desenvolvimento de UI/UX do ChefIApp.
Todos os membros da equipa devem ler, compreender e aplicar estes principios.

---

## A Lei Fundamental

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   A Interface NUNCA mente ao utilizador.                        ║
║                                                                  ║
║   Se o backend nao confirmou, a UI nao celebra.                 ║
║   Se o sistema esta em baixo, a UI diz claramente.              ║
║   Se e modo demo, o utilizador sabe antes de agir.              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Porque "Anti-Teatral"?

A industria de software normalizou padroes de UX que **mentem aos utilizadores**:

- Barras de progresso falsas (0% → 100% em 2 segundos, sempre igual)
- "Sucesso!" antes da confirmacao do servidor
- Delays artificiais para parecer "trabalho serio"
- Fallback silencioso para modo demo quando o servidor falha
- Promessas de tempo ("Pronto em 2 minutos!")

**Estes padroes sao teatro.** Criam uma ilusao de competencia tecnica enquanto escondem a realidade do sistema.

No ChefIApp, **rejeitamos o teatro**. Operamos com verdade.

---

## Os 7 Mandamentos

### 1. Sem Progresso Falso

```
PROIBIDO:
┌─────────────────────────────────────┐
│ A criar o teu espaco...             │
│ ████████████████░░░░  78%           │  ← MENTIRA
└─────────────────────────────────────┘

CORRETO:
┌─────────────────────────────────────┐
│ A criar o teu espaco...             │
│ ○ A comunicar com o servidor...     │  ← VERDADE
└─────────────────────────────────────┘
```

**Regra:** Spinners indeterminados. Nunca percentagens falsas.

---

### 2. Sem Sucesso Antecipado

```typescript
// PROIBIDO ❌
async function createRestaurant() {
  showSuccess("Restaurante criado!")  // ANTES do servidor responder
  await api.create(data)
}

// CORRETO ✓
async function createRestaurant() {
  showLoading("A criar...")
  const result = await api.create(data)
  if (result.ok) {
    showSuccess("Restaurante criado!")  // DEPOIS da confirmacao
  }
}
```

**Regra:** Sucesso so aparece depois da confirmacao real.

---

### 3. Sem Delays Teatrais

```typescript
// PROIBIDO ❌
async function validateEmail() {
  showSpinner()
  await sleep(800)  // Delay artificial para "parecer trabalho"
  navigate('/next')
}

// CORRETO ✓
async function validateEmail() {
  const isValid = validateFormat(email)
  if (isValid) {
    navigate('/next')  // Imediato quando nao ha trabalho real
  }
}
```

**Regra:** Se nao ha trabalho real, nao finjas que ha.

---

### 4. Sem Fallback Silencioso

```typescript
// PROIBIDO ❌
async function createRestaurant() {
  try {
    await api.create(data)
  } catch {
    // Silenciosamente entra em modo demo
    localStorage.setItem('demo_mode', 'true')
    navigate('/preview')
  }
}

// CORRETO ✓
async function createRestaurant() {
  try {
    await api.create(data)
  } catch {
    // Mostra opcao EXPLICITA ao utilizador
    showDemoPrompt({
      message: "Sistema indisponivel",
      options: [
        { label: "Tentar novamente", action: retry },
        { label: "Explorar em modo demo", action: enterDemo }
      ],
      warning: "No modo demo, os dados nao serao guardados."
    })
  }
}
```

**Regra:** O utilizador ESCOLHE entrar em modo demo. Nunca e automatico.

---

### 5. Sem Promessas de Tempo

```
PROIBIDO:
- "Pronto em 2 minutos"
- "Configuracao instantanea"
- "Em segundos"
- "Rapido e facil"

CORRETO:
- "Configura o teu espaco"
- "Vamos preparar tudo"
- "Proximo passo: menu"
- "Quase la"
```

**Regra:** Nunca prometemos tempo. Prometemos passos.

---

### 6. Health Check Antes de Acoes Criticas

```typescript
// PROIBIDO ❌
async function publish() {
  await api.publish(restaurantId)
  showSuccess("Publicado!")
}

// CORRETO ✓
async function publish() {
  // 1. Verifica saude do sistema
  const health = await checkHealth()

  // 2. Gate a acao
  const gating = coreGating({ action: 'publish', health })

  if (!gating.allowed) {
    showBlocked(gating.reason)
    return
  }

  // 3. Executa com confirmacao
  const result = await api.publish(restaurantId)
  if (result.ok) {
    showSuccess("Publicado!")
  }
}
```

**Regra:** Acoes criticas (criar, publicar, pagar) exigem health check.

---

### 7. Estado Explicito: Ghost vs Live

```
GHOST (Rascunho):
┌─────────────────────────────────────┐
│ 👻 Modo rascunho                    │
│ Esta pagina ainda nao esta publica. │
│ [Publicar]                          │
└─────────────────────────────────────┘

LIVE (Publicado):
┌─────────────────────────────────────┐
│ ✓ Online                            │
│ chefiapp.com/meu-restaurante        │
│ [Editar] [Ver pagina]               │
└─────────────────────────────────────┘

DEMO (Demonstracao):
┌─────────────────────────────────────┐
│ ⚠️ Modo demonstracao                │
│ Os dados nao serao guardados.       │
│ [Sair do demo]                      │
└─────────────────────────────────────┘
```

**Regra:** O utilizador sabe SEMPRE em que estado esta.

---

## Padroes Proibidos — Referencia Rapida

| Padrao | Porque e Proibido | Alternativa |
|--------|-------------------|-------------|
| `setTimeout(() => navigate(...))` | Delay falso | Navegar imediatamente ou apos API |
| `setProgress(Math.random() * 100)` | Progresso falso | Spinner indeterminado |
| `showSuccess()` antes de `await api` | Sucesso antecipado | Sucesso apos confirmacao |
| `catch { enterDemoMode() }` | Fallback silencioso | Mostrar prompt explicito |
| `"Pronto em X minutos"` | Promessa de tempo | Descrever passos |
| `localStorage.set('demo')` sem UI | Demo oculto | Banner visivel |

---

## Fluxograma de Decisao

```
                    ┌──────────────────┐
                    │ Acao do utilizador│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ E acao critica?  │
                    │ (criar/publicar/ │
                    │  pagar/guardar)  │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼ SIM                         ▼ NAO
    ┌──────────────────┐          ┌──────────────────┐
    │ Verificar health │          │ Executar acao    │
    └────────┬─────────┘          └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Health === UP?   │
    └────────┬─────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ SIM             ▼ NAO
┌────────────┐   ┌────────────────────┐
│ Executar   │   │ Mostrar bloqueio   │
│ acao real  │   │ + opcoes:          │
└─────┬──────┘   │ - Tentar novamente │
      │          │ - Modo demo (se    │
      ▼          │   aplicavel)       │
┌────────────┐   └────────────────────┘
│ Sucesso?   │
└─────┬──────┘
      │
  ┌───┴───┐
  │       │
  ▼ SIM   ▼ NAO
┌─────┐ ┌─────────────┐
│ ✓   │ │ Mostrar erro│
└─────┘ │ + retry     │
        └─────────────┘
```

---

## Checklist para Code Review

Antes de aprovar um PR, verifica:

### Microcopy
- [ ] Nao ha promessas de tempo ("em segundos", "instantaneo")
- [ ] Nao ha sucesso falso ("Feito!" sem confirmacao)
- [ ] Estados sao claros (loading, success, error, blocked)

### Comportamento
- [ ] Acoes criticas verificam health primeiro
- [ ] Erros mostram opcoes claras (retry, alternativa)
- [ ] Modo demo requer consentimento explicito
- [ ] Nao ha delays artificiais (setTimeout para "parecer trabalho")

### Visual
- [ ] Spinners sao indeterminados (nao percentagem falsa)
- [ ] Banners de estado sao visiveis (demo, offline, degraded)
- [ ] Botoes desabilitados explicam porque

### Testes
- [ ] Truth Suite passa
- [ ] Novos fluxos tem testes de gating
- [ ] Cenarios offline estao cobertos

---

## Exemplos do Mundo Real

### Antes (Teatro)

```tsx
// CreatingPage.tsx — VERSAO TEATRAL (PROIBIDA)
function CreatingPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Progresso falso
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 95))
    }, 200)

    // Tenta criar, mas fallback silencioso
    api.create(data)
      .then(() => {
        setProgress(100)
        navigate('/preview')
      })
      .catch(() => {
        // SILENCIOSAMENTE entra em demo
        localStorage.setItem('demo', 'true')
        setProgress(100)
        navigate('/preview')
      })

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h1>A criar o teu espaco...</h1>
      <ProgressBar value={progress} />  {/* MENTIRA */}
      <p>Pronto em segundos!</p>        {/* MENTIRA */}
    </div>
  )
}
```

### Depois (Verdade)

```tsx
// CreatingPage.tsx — VERSAO VERDADEIRA (CORRETA)
function CreatingPage() {
  const [state, setState] = useState<'creating' | 'success' | 'demo_prompt'>('creating')
  const { check: checkHealth } = useCoreHealth()

  const createRestaurant = useCallback(async () => {
    setState('creating')

    // 1. Verificar saude
    const health = await checkHealth()

    // 2. Gate a acao
    const gating = coreGating({ action: 'create', health })

    if (!gating.allowed) {
      setState('demo_prompt')  // Prompt EXPLICITO
      return
    }

    // 3. Tentar criar
    try {
      const result = await api.create(data)
      if (result.ok) {
        setState('success')
        navigate('/preview')
      }
    } catch {
      setState('demo_prompt')  // Mostra opcoes
    }
  }, [])

  return (
    <div>
      {state === 'creating' && (
        <>
          <Spinner />  {/* Indeterminado, nao percentagem */}
          <h1>A criar o teu espaco</h1>
          <p>A comunicar com o servidor...</p>  {/* Honesto */}
        </>
      )}

      {state === 'demo_prompt' && (
        <>
          <h1>Sistema indisponivel</h1>
          <Button onClick={createRestaurant}>Tentar novamente</Button>
          <Button onClick={enterDemoMode}>Explorar em modo demo</Button>
          <p>No modo demo, os dados nao serao guardados.</p>
        </>
      )}
    </div>
  )
}
```

---

## Consequencias de Violar o Manifesto

1. **PR sera rejeitado** ate correcao
2. **Playwright Truth Suite falhara** em CI
3. **Audit de UX identificara** como P0 violation
4. **Beta sera bloqueado** ate resolucao

Nao ha excepcoes. A verdade nao e negociavel.

---

## Recursos

- `tests/playwright/truth/` — Truth Suite completa
- `src/core/health/` — Sistema de health monitoring
- `src/core/health/gating.ts` — Logica de gating
- `audit-reports/PHASE0-TRUTH-LOCK-*.md` — Auditorias anteriores

---

## Assinaturas

Este manifesto foi selado em 2025-12-24.

```
Estado do Sistema: TRUTH-LOCKED
Regra: "UI nunca antecipa o Core."
Versao: 1.0.0
```

---

*Construido sob a metodologia AntiGravity Truth Testing.*
*Desenhado como se vidas dependessem disso.*
