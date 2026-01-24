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
| `LeakDashboard/` | 🧭 Painel | ✅ OK | Detecção de vazamentos/perdas |
| `LocalBoss/` | 🧭 Painel | ✅ OK | Hub de reputação/reviews |
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
| `Read/` | 🌍 Público | ✅ OK | Biblioteca de artigos |
| `Reports/` | 🧭 Painel | ✅ OK | Relatórios |
| `ReputationHub/` | 🧭 Painel | ✅ OK | Reputação |
| `Reservations/` | 🧭 Painel | ✅ OK | Reservas |
| `Settings/` | 🧭 Painel | ✅ OK | Configurações |
| `Store/` | 🔮 Evolve | ✅ OK | Loja TPV |
| `TPV/` | 💳 TPV | ✅ OK | Terminal de vendas |
| `Tenant/` | 🧭 Painel | ✅ OK | Seleção de tenant |
| `Waiter/` | 👨‍🍳 Staff | ✅ OK | App de garçom |
| `Web/` | 🧭 Painel | ✅ OK | Config de web pública |
| ~~`_deprecated/`~~ | ❌ Removido | 🗑️ Limpo | Ficheiros vazios removidos |
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

| Pasta | Resultado |
|-------|----------|
| `LeakDashboard/` | ✅ Manter — painel de detecção de fugas/perdas |
| `LocalBoss/` | ✅ Manter — hub de reviews/reputação (renomear para ReputationHub?) |
| `Read/` | ✅ Manter — biblioteca de artigos/research hub |
| `_deprecated/` | ✅ Removido (commit `fd58981`) |

---

## Conclusão

**37/37 pastas** estão corretamente mapeadas ✅  
**1 pasta** foi removida (_deprecated).  
**0 problemas** pendentes.
