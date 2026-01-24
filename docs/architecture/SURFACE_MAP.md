# ChefIApp Surface Architecture Map

> **Princípio**: ChefIApp não é um app único. É um ecossistema de superfícies orbitando um Kernel soberano.

---

## 🧠 1. KERNEL (Invisível)

| Atributo | Valor |
|----------|-------|
| **Path** | N/A (não exposto) |
| **Audiência** | Sistema |
| **Visibilidade** | Nunca aparece em menu |

**Componentes:**

- Auth (Supabase, OAuth, sessão)
- TenantResolver / TenantContext
- KernelContext, Rules Engine
- DEV_STABLE_MODE, FlowGate
- Transport Freeze, Guards
- Segurança / fail-closed

> [!IMPORTANT]
> O Kernel NUNCA vira "feature de produto". Documentação apenas.

---

## 🧭 2. PAINEL DE COMANDO (Admin)

| Atributo | Valor |
|----------|-------|
| **Path** | `/app/*` |
| **Audiência** | Donos, Gerentes |
| **Propósito** | Governo + Observação + Configuração |

### Menu Structure

```
COMANDO ▼
├── Comando Central (dashboard)
├── Ajustes do Núcleo

OPERAR ▼
├── TPV/Caixa → abre /app/tpv
├── KDS/Cozinha → abre /app/kds
├── Cardápio
├── Pedidos
├── Operação Hub
└── Reservas

ANALISAR ▼
├── Fecho Diário
├── Finanças
├── Clientes (CRM)
└── Fidelidade

GOVERNAR ▼
├── Equipa
├── Controlo de Acesso
├── Página Web
└── Segurança Alimentar

CONECTAR ▼
├── Conectores
└── Reputação Hub

EVOLVE ▼ (colapsado)
└── Evolve Hub → /app/evolve
```

> [!CAUTION]
> **Não deve conter**: Roadmap, Status MVP, Loja TPV, Conteúdo institucional.
> Painel = governo, não vitrine.

---

## 💳 3. TPV (Caixa)

| **Atributo** | **Valor** |
|----------|-------|
| **Path** | `/app/tpv` |
| **Audiência** | Operadores, Caixa |
| **Propósito** | Execução de vendas |
| **Natureza** | **PWA Instalável** (Janela Dedicada) |

**Contém:**

> [!NOTE]
> Consulte [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md) para detalhes de instalação PWA.

- Vendas, Pagamentos, Pedidos
- Mesas, Caixa
- Offline queue, Hardware bindings (USB/Bluetooth)

**Não contém:**

- ❌ Roadmap, Status, Loja
- ❌ Configurações profundas
- ❌ Conteúdo institucional

---

## 🍳 4. KDS (Cozinha)

| **Atributo** | **Valor** |
|----------|-------|
| **Path** | `/app/kds` ou `/kds/:restaurantId` |
| **Audiência** | Cozinha |
| **Propósito** | Fluxo nervoso de pedidos |
| **Natureza** | **PWA Dedicado** (Fullscreen/Kiosk) |

**Contém:**

- Pedidos, Estados, Timers
- Alertas de cozinha
- Modo de alto contraste

**Não contém:**

- ❌ Admin, Roadmap, Produto, Loja

---

## 👨‍🍳 5. STAFF APP

| Atributo | Valor |
|----------|-------|
| **Path** | `/app/staff` + `/join` |
| **Audiência** | Funcionários |
| **Propósito** | Operação humana |

**Contém:**

- Check-in/out, Tarefas
- Pedidos atribuídos
- Perfil básico

**Não contém:**

- ❌ Admin, Roadmap, Produto, Loja

---

## 🌍 6. WEB PÚBLICA

| Atributo | Valor |
|----------|-------|
| **Path** | `/public/*` |
| **Audiência** | Clientes finais |
| **Propósito** | Presença digital |

**Tipos:**

1. Página simples
2. Menu + QR
3. Site completo

**Contém:**

- Branding, Menu, QR
- Pedido (se habilitado)

**Não contém:**

- ❌ DEV_STABLE_MODE, Admin
- ❌ Status MVP, Roadmap

---

## 📱 7. QR DE MESA

| Atributo | Valor |
|----------|-------|
| **Path** | Superfície satélite (futuro) |
| **Audiência** | Clientes na mesa |
| **Propósito** | Self-service |

**Contém:**

- Mesa, Menu, Pedido
- Pagamento (opcional)

> [!NOTE]
> Planejar como superfície isolada. Não misturar com TPV nem Painel.

---

## 🚚 8. DELIVERY / INTEGRAÇÕES

| Atributo | Valor |
|----------|-------|
| **Path** | Superfície técnica |
| **Audiência** | Sistema |
| **Propósito** | Sync de pedidos |

**Contém:**

- Glovo, Uber, etc.
- Estados de pedido

**Não contém:**

- ❌ UI de produto, Loja, Roadmap

---

## 🔮 9. EVOLVE HUB (Meta-Produto)

| Atributo | Valor |
|----------|-------|
| **Path** | `/app/evolve` |
| **Audiência** | Donos (curiosos) |
| **Propósito** | Transparência + Comercial |

### Subseções

| Tab | Conteúdo |
|-----|----------|
| **Visão** | Roadmap, Status MVP, Changelog |
| **Loja** | Kits TPV, Impressoras, Acessórios |

> [!IMPORTANT]
> Este conteúdo foi **removido do Painel** e concentrado aqui.
> No futuro, pode migrar para fora de `/app/` completamente.

---

## 📚 10. DOCUMENTAÇÃO

| Atributo | Valor |
|----------|-------|
| **Path** | `/docs` |
| **Audiência** | Devs, Arquitetos |

**Documentos chave:**

- `SURFACES_ARCHITECTURE.md`
- `DEV_STABLE_MODE.md`
- `SURFACE_MAP.md` (este)

---

## 🎯 Princípio de Refatoração

```
Refatorar não é reescrever código.
É colocar cada coisa no seu lugar correto de poder.
```

| O que foi feito | Status |
|-----------------|--------|
| Arquitetura pensada | ✅ |
| Documentação criada | ✅ |
| Menu reorganizado | ✅ |
| Evolve Hub criado | ✅ |
| PRODUTO+COMERCIAL → EVOLVE | ✅ |
