# Menu Contract

> **Fonte de verdade**: Cada item do menu está vinculado a uma superfície e tem regras explícitas sobre o que pode ou não conter.

---

## Regras Gerais

| Regra | Descrição |
|-------|-----------|
| 🚫 **Sem vazamento** | Nenhum item Meta/Comercial no Painel operacional |
| 🔒 **Kernel invisível** | Auth, TenantResolver, Guards nunca aparecem |
| 📍 **Um item = Uma superfície** | Cada link aponta para exatamente uma superfície |

---

## Contrato por Grupo

### COMANDO

| Item | Path | Superfície | Nunca conter |
|------|------|------------|--------------|
| Comando Central | `/app/dashboard` | Painel | Roadmap, Loja |
| Ajustes do Núcleo | `/app/settings` | Painel | Comercial |

---

### OPERAR

| Item | Path | Superfície | Nunca conter |
|------|------|------------|--------------|
| TPV (Caixa) | `/app/tpv` | TPV | Roadmap, Status, Loja |
| KDS (Cozinha) | `/app/kds` | KDS | Admin, Produto, Meta |
| Cardápio | `/app/menu` | Painel | - |
| Pedidos | `/app/orders` | Painel | - |
| Operação Hub | `/app/operational-hub` | Painel | Comercial |
| Reservas | `/app/reservations` | Painel | - |

---

### ANALISAR

| Item | Path | Superfície | Nunca conter |
|------|------|------------|--------------|
| Fecho Diário | `/app/reports/daily-closing` | Painel | Meta-produto |
| Finanças | `/app/reports/finance` | Painel | Comercial |
| Clientes (CRM) | `/app/crm` | Painel | - |
| Fidelidade | `/app/loyalty` | Painel | - |

---

### GOVERNAR

| Item | Path | Superfície | Nunca conter |
|------|------|------------|--------------|
| Equipa | `/app/team` | Painel | Comercial |
| Controlo de Acesso | `/app/govern-manage` | Painel | - |
| Página Web | `/app/web/preview` | Web Config | TPV-specific |
| Segurança Alimentar | `/app/govern` | Painel | - |

---

### CONECTAR

| Item | Path | Superfície | Nunca conter |
|------|------|------------|--------------|
| Conectores | `/app/settings/connectors` | Integrations | UI de produto |
| Reputação Hub | `/app/reputation-hub` | Painel | Comercial |

---

### EVOLVE (Colapsado)

| Item | Path | Superfície | Propósito |
|------|------|------------|-----------|
| Evolve Hub | `/app/evolve` | Meta-Produto | Roadmap, Status MVP, Loja |

> [!IMPORTANT]
> EVOLVE é o **único grupo** que contém conteúdo meta-produto e comercial.
> Isso mantém o Painel limpo para governo/operação.

---

## Checklist de Validação

Antes de adicionar qualquer item ao menu:

- [ ] Qual superfície este item pertence?
- [ ] Existe um path definido no SURFACE_MAP.md?
- [ ] O item respeita a coluna "Nunca conter"?
- [ ] Se for meta-produto/comercial → vai para EVOLVE?

---

## Histórico

| Data | Mudança |
|------|---------|
| 2026-01-17 | Criação inicial, Evoluir → EVOLVE, Página Web → GOVERNAR |
