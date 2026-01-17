# Architecture Guard

> Regras obrigatórias para PRs e mudanças. Previne regressões arquiteturais.

---

## Checklist Obrigatório (toda PR)

### 1. Superfície Identificada?

- [ ] Este código pertence a qual superfície? (ver SURFACE_MAP.md)
- [ ] O path respeita a superfície?

### 2. Contrato de Menu Respeitado?

- [ ] O item está no grupo correto? (ver MENU_CONTRACT.md)
- [ ] Não há vazamento de meta-produto para Painel/TPV/KDS?

### 3. Kernel Protegido?

- [ ] Nenhuma referência a Auth/Guards/FlowGate na UI?
- [ ] DEV_STABLE_MODE não aparece como feature?

---

## Regras de Ouro

| Regra | Violação = Rejeição |
|-------|---------------------|
| **Kernel invisível** | Kernel nunca aparece em menu ou UI |
| **Painel = governo** | Roadmap/Loja/Status MVP → Evolve |
| **TPV = execução** | Zero meta-produto |
| **1 item = 1 superfície** | Sem mistura de poderes |

---

## Onde vai cada coisa?

| Tipo de Conteúdo | Superfície | Path |
|------------------|------------|------|
| Dashboard, Settings | 🧭 Painel | `/app/*` |
| Vendas, Mesas, Caixa | 💳 TPV | `/app/tpv` |
| Pedidos cozinha | 🍳 KDS | `/app/kds` |
| Check-in, Tarefas | 👨‍🍳 Staff | `/app/staff` |
| Roadmap, Loja, Status | 🔮 Evolve | `/app/evolve` |
| Menu público, QR | 🌍 Web | `/public/*` |

---

## Red Flags (bloquear imediatamente)

- ❌ "Roadmap" fora de `/app/evolve`
- ❌ "Em breve" com link para `/app/coming-soon` no menu principal
- ❌ Badge "MVP" no Painel
- ❌ Loja de equipamentos no sidebar operacional
- ❌ DEV_STABLE_MODE mencionado em copy de usuário

---

## Documentos de Referência

- [SURFACE_MAP.md](./SURFACE_MAP.md) — 10 superfícies
- [MENU_CONTRACT.md](./MENU_CONTRACT.md) — regras por item
- [FOLDER_MAP.md](./FOLDER_MAP.md) — 37 pastas → superfícies
