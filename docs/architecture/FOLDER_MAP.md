# Folder-to-Surface Map

> Mapeamento de cada pasta em `src/pages` para sua superfície correta.

---

## Legenda de Superfícies

| ID | Superfície | Path |
|----|------------|------|
| 🧠 | Kernel | N/A (invisível) |
| 🧭 | Painel (Admin) | `/app/*` |
| 💳 | TPV | `/app/tpv` |
| 🍳 | KDS | `/app/kds` |
| 👨‍🍳 | Staff App | `/app/staff` |
| 🌍 | Web Pública | `/public/*` |
| 🔮 | Evolve Hub | `/app/evolve` |

---

## Mapa de Pastas

| Pasta | Superfície | Status | Notas |
|-------|------------|--------|-------|
| `Activation/` | 🧭 Painel | ✅ OK | Ativação de conta |
| `Analytics/` | 🧭 Painel | ✅ OK | Análises operacionais |
| `AppStaff/` | 👨‍🍳 Staff | ✅ OK | App de funcionários |
| `Audit/` | 🧭 Painel | ✅ OK | Auditoria interna |
| `CRM/` | 🧭 Painel | ✅ OK | Gestão de clientes |
| `Dashboard/` | 🧭 Painel | ✅ OK | Dashboard principal |
| `Evolve/` | 🔮 Evolve | ✅ OK | Meta-produto |
| `Finance/` | 🧭 Painel | ✅ OK | Finanças |
| `Fiscal/` | 🧭 Painel | ✅ OK | Fiscal/impostos |
| `Govern/` | 🧭 Painel | ✅ OK | Segurança alimentar |
| `GovernManage/` | 🧭 Painel | ✅ OK | Controlo de acesso |
| `Home/` | 🧭 Painel | ✅ OK | Home genérica |
| `Inventory/` | 🧭 Painel | ✅ OK | Inventário |
| `Landing/` | 🌍 Público | ✅ OK | Landing page pública |
| `LeakDashboard/` | 🧭 Painel | ⚠️ Revisar | Nome suspeito |
| `LocalBoss/` | 🧭 Painel | ⚠️ Revisar | Pode ser deprecado |
| `Loyalty/` | 🧭 Painel | ✅ OK | Fidelidade |
| `Menu/` | 🧭 Painel | ✅ OK | Gestão de cardápio |
| `MultiLocation/` | 🧭 Painel | ✅ OK | Multi-restaurante |
| `Onboarding/` | 🧭 Painel | ✅ OK | Onboarding |
| `Operation/` | 🧭 Painel | ✅ OK | Estado operacional |
| `OperationalHub/` | 🧭 Painel | ✅ OK | Hub operacional |
| `Performance/` | 🧭 Painel | ✅ OK | Métricas |
| `Portioning/` | 🧭 Painel | ✅ OK | Porcionamento |
| `Public/` | 🌍 Público | ✅ OK | Páginas públicas |
| `Purchasing/` | 🧭 Painel | ✅ OK | Compras |
| `Read/` | 🧭 Painel | ⚠️ Revisar | Nome genérico |
| `Reports/` | 🧭 Painel | ✅ OK | Relatórios |
| `ReputationHub/` | 🧭 Painel | ✅ OK | Reputação |
| `Reservations/` | 🧭 Painel | ✅ OK | Reservas |
| `Settings/` | 🧭 Painel | ✅ OK | Configurações |
| `Store/` | 🔮 Evolve | ✅ OK | Loja TPV |
| `TPV/` | 💳 TPV | ✅ OK | Terminal de vendas |
| `Tenant/` | 🧭 Painel | ✅ OK | Seleção de tenant |
| `Waiter/` | 👨‍🍳 Staff | ✅ OK | App de garçom |
| `Web/` | 🧭 Painel | ✅ OK | Config de web pública |
| `_deprecated/` | ❌ Deprecado | 🗑️ Limpar | Código antigo |
| `steps/` | 🧭 Painel | ✅ OK | Steps de wizard |

---

## Ficheiros Soltos

| Ficheiro | Superfície | Status |
|----------|------------|--------|
| `AuthPage.tsx` | 🧭 Auth | ✅ OK |
| `BootstrapPage.tsx` | 🧭 Painel | ✅ OK |
| `ComingSoonPage.tsx` | 🔮 Evolve | ✅ OK |
| `HealthCheckPage.tsx` | 🧭 Painel | ✅ OK |
| `PreviewPage.tsx` | 🧭 Painel | ✅ OK |
| `SetupLayout.tsx` | 🧭 Painel | ✅ OK |
| `TPVReadyPage.tsx` | 💳 TPV | ✅ OK |
| `WizardPage.tsx` | 🧭 Painel | ✅ OK |

---

## Itens para Revisão

| Pasta | Questão |
|-------|---------|
| `LeakDashboard/` | Nome sugere debugging - deprecar? |
| `LocalBoss/` | Nome antigo - renomear ou deprecar? |
| `Read/` | Nome genérico - verificar propósito |
| `_deprecated/` | Limpar quando possível |

---

## Conclusão

**35/38** pastas estão corretamente mapeadas.  
**3** pastas precisam revisão (LeakDashboard, LocalBoss, Read).  
**1** pasta deve ser limpa (_deprecated).
