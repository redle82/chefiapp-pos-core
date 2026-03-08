# Evolução Bootstrap — S0.5 (Render Primeiro, Degradar Depois)

**Prioridade:** S0.5 — Evolução conceitual (após S0)  
**Status:** Recomendação estratégica  
**Esforço:** 2-3 dias (após S0 implementado)

---

## 🧠 Princípio Conceitual

### Problema Atual (S0)
Bootstrap decide **tudo antes** de renderizar o app.

**Consequência:**
- Sensação de erro quando demora
- Ansiedade do usuário
- Dependência psicológica do loading
- Falsos negativos em testes

### Solução Proposta (S0.5)
**"Render primeiro, degradar depois."**

A shell do app deve **sempre aparecer**.  
O bootstrap decide **capacidade, não existência**.

---

## 🎨 Visual Proposto

### Estado Inicial (0-2s)
```
┌─────────────────────────────┐
│  [App Shell Renderizado]    │
│                             │
│  ┌───────────────────────┐  │
│  │ 🔄 Conectando...     │  │
│  │ Modo limitado         │  │
│  └───────────────────────┘  │
│                             │
│  [Conteúdo placeholder]     │
└─────────────────────────────┘
```

### Estado Conectado (2-5s)
```
┌─────────────────────────────┐
│  [App Shell Renderizado]    │
│                             │
│  ┌───────────────────────┐  │
│  │ ✅ Conectado          │  │
│  │ Carregando dados...    │  │
│  └───────────────────────┘  │
│                             │
│  [Conteúdo real aparecendo] │
└─────────────────────────────┘
```

### Estado Degradado (timeout)
```
┌─────────────────────────────┐
│  [App Shell Renderizado]    │
│                             │
│  ┌───────────────────────┐  │
│  │ ⚠️ Modo limitado      │  │
│  │ Algumas funcionalidades│  │
│  │ podem estar indisponíveis│
│  └───────────────────────┘  │
│                             │
│  [Conteúdo limitado]        │
│  [Opções: Retry, Demo]      │
└─────────────────────────────┘
```

---

## 🛠️ Implementação Técnica

### Arquitetura

1. **App Shell sempre renderiza**
   - Layout base
   - Navegação (desabilitada se necessário)
   - Header/Footer

2. **Bootstrap como Provider**
   - Wraps o app
   - Gerencia estado de capacidade
   - Não bloqueia renderização

3. **Degradação Consciente**
   - Funcionalidades limitadas
   - Banner informativo
   - Opções de recuperação

### Código Estrutural

```typescript
// App.tsx
function App() {
  return (
    <BootstrapProvider>
      <AppShell>
        <BootstrapGate>
          {/* Conteúdo real */}
        </BootstrapGate>
        <DegradedMode>
          {/* Conteúdo limitado */}
        </DegradedMode>
      </AppShell>
    </BootstrapProvider>
  )
}

// BootstrapProvider.tsx
function BootstrapProvider({ children }) {
  const [capacity, setCapacity] = useState<'checking' | 'full' | 'degraded' | 'offline'>('checking')
  
  useEffect(() => {
    // Bootstrap assíncrono
    bootstrap().then(setCapacity)
  }, [])
  
  return (
    <BootstrapContext.Provider value={capacity}>
      {children}
    </BootstrapContext.Provider>
  )
}

// BootstrapGate.tsx
function BootstrapGate({ children }) {
  const capacity = useBootstrap()
  
  if (capacity === 'full') {
    return children
  }
  
  return null
}

// DegradedMode.tsx
function DegradedMode({ children }) {
  const capacity = useBootstrap()
  
  if (capacity === 'degraded' || capacity === 'offline') {
    return (
      <>
        <Banner type="warning">
          Modo limitado — conectando ao sistema…
        </Banner>
        {children}
      </>
    )
  }
  
  return null
}
```

---

## ✅ Benefícios

### UX
- ✅ App sempre aparece (não fica "travado")
- ✅ Sensação de progresso (não de erro)
- ✅ Usuário pode explorar mesmo limitado
- ✅ Reduz ansiedade

### Técnico
- ✅ Testes não falham por timeout
- ✅ App sempre renderiza
- ✅ Degradação consciente
- ✅ Recovery paths claros

### Produto
- ✅ Percepção de robustez
- ✅ Confiança do usuário
- ✅ Menos abandono
- ✅ Melhor primeira impressão

---

## 📊 Comparação

| Aspecto | S0 (Atual) | S0.5 (Evolução) |
|---------|------------|-----------------|
| **Renderização** | Bloqueada até bootstrap | Sempre renderiza |
| **Feedback** | Loading genérico | Banner informativo |
| **Capacidade** | Tudo ou nada | Degradação consciente |
| **Testes** | Falsos negativos | Sempre passa smoke |
| **UX** | Ansiedade | Confiança |

---

## 🎯 Critérios de Aceite

- [ ] App shell sempre renderiza (<500ms)
- [ ] Bootstrap não bloqueia renderização
- [ ] Banner informativo quando degradado
- [ ] Funcionalidades limitadas funcionam
- [ ] TestSprite sempre passa smoke test
- [ ] Usuário pode explorar mesmo offline

---

## 🚀 Quando Implementar

**Ordem:**
1. ✅ S0 primeiro (timeout + recovery)
2. ✅ Validar S0 funciona
3. ✅ Depois evoluir para S0.5

**Não fazer S0.5 antes de S0** porque:
- S0 resolve o problema crítico
- S0.5 é evolução, não correção
- S0.5 requer mais arquitetura

---

## 📝 Notas

- **Não é urgente** — S0 resolve o bloqueador
- **É estratégico** — Eleva produto a nível enterprise
- **É evolutivo** — Pode ser feito depois do lançamento

---

**Status:** ✅ Conceito documentado, pronto para implementação após S0

