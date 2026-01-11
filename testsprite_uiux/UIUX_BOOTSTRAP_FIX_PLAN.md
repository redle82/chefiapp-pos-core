# Plano de Correção — Bootstrap UX (S0)

**Prioridade:** S0 — Bloqueador  
**Esforço:** 1-2 dias  
**Impacto:** Desbloqueia 19 rotas + confiança do usuário

---

## 🔴 Problema Atual

### Evidência
```
/app/bootstrap - page.waitForTimeout: Test timeout of 30000ms exceeded.
```

### Código Atual (`BootstrapPage.tsx`)

```typescript
const bootstrap = useCallback(async () => {
  setState('checking')
  setErrorMessage(null)

  const restaurantId = localStorage.getItem('chefiapp_restaurant_id')
  const isDemo = localStorage.getItem('chefiapp_demo_mode') === 'true'

  if (!restaurantId) {
    setState('redirecting')
    setTimeout(() => navigate('/start'), 300)
    return
  }

  if (isDemo) {
    setState('ready')
    setTimeout(() => navigate('/app/preview'), 500)
    return
  }

  // ⚠️ PROBLEMA: checkHealth() pode demorar indefinidamente
  const currentHealth = await checkHealth()

  if (currentHealth === 'DOWN') {
    setState('error')
    setErrorMessage('Sistema indisponivel. Tenta novamente em breve.')
    return
  }

  setState('ready')
  setTimeout(() => navigate('/app/preview'), 500)
}, [checkHealth, navigate])
```

### Problemas Identificados

1. **Sem timeout visível** — `checkHealth()` pode demorar indefinidamente
2. **Sem feedback de progresso** — Usuário não sabe o que está acontecendo
3. **Sem opção de retry** — Se falhar, usuário fica preso
4. **Sem modo degradado** — Não há fallback quando sistema está lento

---

## ✅ Solução Proposta

### 1. Timeout Cognitivo (5s)

Após 5 segundos, mostrar mensagem:
- "Estamos preparando seu restaurante…"
- "Isso pode levar alguns segundos"
- Opção: "Entrar em modo demo"

### 2. Feedback de Progresso

Mostrar etapas:
- ✅ Verificando restaurante…
- ⏳ Conectando ao sistema…
- ✅ Tudo pronto!

### 3. Opções de Recuperação

Se timeout ou erro:
- **Tentar novamente** (retry)
- **Entrar em modo demo** (fallback)
- **Voltar ao onboarding** (escape hatch)

### 4. Modo Degradado

Se sistema está lento mas não quebrado:
- Permitir acesso limitado
- Mostrar banner: "Modo limitado — algumas funcionalidades podem estar indisponíveis"

---

## 🛠️ Implementação

### Arquivo: `merchant-portal/src/pages/BootstrapPage.tsx`

#### Mudanças Necessárias

1. **Adicionar timeout de 10s para health check**
2. **Adicionar estados de progresso**
3. **Adicionar opções de recuperação**
4. **Adicionar modo degradado**

### Código Proposto

```typescript
type BootstrapState = 
  | 'checking' 
  | 'checking_restaurant'
  | 'checking_health'
  | 'ready' 
  | 'error' 
  | 'timeout'
  | 'redirecting'
  | 'degraded'

const BOOTSTRAP_TIMEOUT = 10000 // 10s
const PROGRESS_DELAY = 2000 // Mostrar progresso após 2s

export function BootstrapPage() {
  const navigate = useNavigate()
  const { status: healthStatus, check: checkHealth } = useCoreHealth({ autoStart: false })

  const [state, setState] = useState<BootstrapState>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<string | null>(null)

  const bootstrap = useCallback(async () => {
    setState('checking')
    setErrorMessage(null)
    setShowProgress(false)
    setProgressStep(null)

    // Step 1: Verificar restaurante
    const restaurantId = localStorage.getItem('chefiapp_restaurant_id')
    const isDemo = localStorage.getItem('chefiapp_demo_mode') === 'true'

    if (!restaurantId) {
      setState('redirecting')
      setTimeout(() => navigate('/start'), 300)
      return
    }

    setState('checking_restaurant')
    setProgressStep('Verificando restaurante…')

    // Mostrar progresso após 2s
    const progressTimer = setTimeout(() => {
      setShowProgress(true)
    }, PROGRESS_DELAY)

    // Step 2: Demo mode (skip health check)
    if (isDemo) {
      clearTimeout(progressTimer)
      setState('ready')
      setShowProgress(false)
      setTimeout(() => navigate('/app/preview'), 500)
      return
    }

    // Step 3: Health check com timeout
    setState('checking_health')
    setProgressStep('Conectando ao sistema…')

    try {
      const healthPromise = checkHealth()
      const timeoutPromise = new Promise<'TIMEOUT'>((resolve) => {
        setTimeout(() => resolve('TIMEOUT'), BOOTSTRAP_TIMEOUT)
      })

      const result = await Promise.race([healthPromise, timeoutPromise])

      clearTimeout(progressTimer)

      if (result === 'TIMEOUT') {
        setState('timeout')
        setShowProgress(false)
        return
      }

      if (result === 'DOWN') {
        setState('error')
        setErrorMessage('Sistema indisponível. Tenta novamente em breve.')
        setShowProgress(false)
        return
      }

      // Success
      setState('ready')
      setProgressStep('Tudo pronto!')
      setShowProgress(false)
      setTimeout(() => navigate('/app/preview'), 500)

    } catch (error) {
      clearTimeout(progressTimer)
      setState('error')
      setErrorMessage('Erro ao conectar. Verifica a tua ligação à internet.')
      setShowProgress(false)
    }
  }, [checkHealth, navigate])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  // Render com estados melhorados
  return (
    <StartLayout variant="centered">
      {/* Loading state com progresso */}
      {(state === 'checking' || state === 'checking_restaurant' || state === 'checking_health') && (
        <div className="bootstrap-loading">
          <div className="spinner" />
          {showProgress && progressStep && (
            <p className="progress-message">{progressStep}</p>
          )}
          {showProgress && (
            <p className="progress-hint">
              Isto pode levar alguns segundos…
            </p>
          )}
        </div>
      )}

      {/* Timeout state */}
      {state === 'timeout' && (
        <div className="bootstrap-timeout">
          <h2>Está a demorar mais do que o esperado</h2>
          <p>O sistema pode estar lento ou indisponível.</p>
          <div className="bootstrap-actions">
            <button onClick={bootstrap}>
              Tentar novamente
            </button>
            <button onClick={() => {
              localStorage.setItem('chefiapp_demo_mode', 'true')
              navigate('/app/preview')
            }}>
              Entrar em modo demo
            </button>
            <button onClick={() => navigate('/start')}>
              Voltar ao início
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="bootstrap-error">
          <h2>Não foi possível conectar</h2>
          <p>{errorMessage}</p>
          <div className="bootstrap-actions">
            <button onClick={bootstrap}>
              Tentar novamente
            </button>
            <button onClick={() => {
              localStorage.setItem('chefiapp_demo_mode', 'true')
              navigate('/app/preview')
            }}>
              Entrar em modo demo
            </button>
          </div>
        </div>
      )}

      {/* Ready state (breve) */}
      {state === 'ready' && (
        <div className="bootstrap-ready">
          <div className="spinner" />
          <p>Redirecionando…</p>
        </div>
      )}

      {/* Redirecting state */}
      {state === 'redirecting' && (
        <div className="bootstrap-redirecting">
          <div className="spinner" />
          <p>Redirecionando…</p>
        </div>
      )}
    </StartLayout>
  )
}
```

---

## 🎨 Estilos Necessários

Adicionar em `merchant-portal/src/pages/BootstrapPage.css` ou no componente:

```css
.bootstrap-loading,
.bootstrap-timeout,
.bootstrap-error,
.bootstrap-ready,
.bootstrap-redirecting {
  text-align: center;
  padding: 2rem;
}

.bootstrap-loading .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2a9d3e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.progress-message {
  font-size: 1.1rem;
  color: #333;
  margin: 1rem 0 0.5rem;
}

.progress-hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.bootstrap-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.bootstrap-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bootstrap-actions button:first-child {
  background: #2a9d3e;
  color: white;
}

.bootstrap-actions button:first-child:hover {
  background: #238a35;
}

.bootstrap-actions button:not(:first-child) {
  background: #f5f5f5;
  color: #333;
}

.bootstrap-actions button:not(:first-child):hover {
  background: #e0e0e0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## ✅ Critérios de Aceite

- [ ] Bootstrap não trava por mais de 10s sem feedback
- [ ] Após 2s, mostra mensagem de progresso
- [ ] Após timeout, mostra opções de recuperação
- [ ] Em caso de erro, mostra mensagem clara + retry
- [ ] TestSprite passa no smoke test de `/app/bootstrap`
- [ ] 19 rotas desbloqueadas (não falham mais por dependência)

---

## 🧪 Testes Necessários

### Teste Manual
1. Limpar `localStorage`
2. Acessar `/app/bootstrap`
3. Verificar redirecionamento para `/start`

### Teste com Restaurant ID
1. Setar `localStorage.setItem('chefiapp_restaurant_id', 'test')`
2. Acessar `/app/bootstrap`
3. Verificar progresso após 2s
4. Verificar timeout após 10s (se health check demorar)

### Teste com Demo Mode
1. Setar `localStorage.setItem('chefiapp_demo_mode', 'true')`
2. Acessar `/app/bootstrap`
3. Verificar redirecionamento rápido para `/app/preview`

### Teste com TestSprite
1. Re-executar `npm test` em `testsprite_uiux`
2. Verificar que `/app/bootstrap` não timeout
3. Verificar que rotas dependentes carregam

---

## 📊 Impacto Esperado

### Antes
- ❌ Bootstrap trava (timeout 30s)
- ❌ 19 rotas bloqueadas
- ❌ Score: 62/100 (Navegação)

### Depois
- ✅ Bootstrap com feedback e recuperação
- ✅ 19 rotas desbloqueadas
- ✅ Score: ~85/100 (Navegação)

---

**Próximo passo:** Implementar correção e re-executar TestSprite.

