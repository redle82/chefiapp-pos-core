# Manual Oficial — ChefIApp OS

**Propósito:** Índice único que costura fluxo, rotas, Core, contratos, implementação e piloto. Um dev ou produto encontra aqui o ponto de entrada para toda a documentação oficial.

**Última atualização:** 2026-02-01.

---

## 1. Fluxo e rotas (fonte de verdade)

| Documento                                                                              | Conteúdo                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [implementation/ROUTES_WEB_VS_OPERATION.md](implementation/ROUTES_WEB_VS_OPERATION.md) | Mapa canónico: WEB vs OPERAÇÃO; guard; nunca return null na web; /trial e /trial-guide.                                                                                                                                                                                                                                                                                      |
| [routes/README_WEB_ROUTES.md](routes/README_WEB_ROUTES.md)                             | Contrato técnico-operacional das rotas da Web de Configuração; tabela-resumo das 13 rotas.                                                                                                                                                                                                                                                                                   |
| [routes/web/](routes/web/)                                                             | Um doc por rota (compras, financeiro, reservas, multi-unidade, qr-mesa, painel-pedidos-prontos, pessoas, mentor-ia, billing, configuracao-operacional, presenca-online, percepcao-operacional, appstaff-web). Template: Tipo, Caminho(s), Objetivo, Quem acessa, Estados do Sistema, Conexão com o Core, Fonte de Dados, Impacto Operacional, Estado Atual, Próximos Passos. |
| [routes/DIAGRAMA_WEB_CORE_OPERACAO.md](routes/DIAGRAMA_WEB_CORE_OPERACAO.md)           | Diagrama mestre Web ↔ Core ↔ Operação (ASCII + Mermaid).                                                                                                                                                                                                                                                                                                                     |

**Código:** `merchant-portal/src/core/flow/CoreFlow.ts` (`isWebConfigPath`, `isOperationalPath`, `resolveNextRoute`); `FlowGate.tsx`; `LifecycleState.ts`.

---

## 2. Core e contratos

| Documento                                                                    | Conteúdo                                                                                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture/CORE_CONTRACT_INDEX.md](architecture/CORE_CONTRACT_INDEX.md)   | Índice de contratos Core: soberania financeira, 4 terminais, piloto fechado, runtime e rotas.                                                |
| [DECLARACAO_POS_REFATORACAO_WEB_V1.md](DECLARACAO_POS_REFATORACAO_WEB_V1.md) | Declaração oficial pós-refatoração (v1 congelada): sem modo de simulação/perfis Gerente/Staff na web; estado canónico; Opção A /trial-guide. |

---

## 3. Implementação e próximos passos

| Documento                                          | Conteúdo                                                                                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [implementation/INDEX.md](implementation/INDEX.md) | Índice das checklists de implementação (FASE 1–5), ROUTES*WEB_VS_OPERATION, web-config, routes, FASE_5*\*.                                                |
| [NEXT_STEPS.md](NEXT_STEPS.md) (raiz do repo)      | Próxima ação comercial (P1 piloto: 2 emails); fluxo WEB vs OPERAÇÃO concluído; E2E smoke; ordem ativa (Opção A); Fases 1–6 primeiro cliente pago; Onda 5. |

---

## 4. Piloto e produto

| Documento                                                                                    | Conteúdo                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [pilots/ONDA_4_PILOTO_P1.md](pilots/ONDA_4_PILOTO_P1.md)                                     | Piloto P1: ICP, lista 10 alvos, script abordagem (§7.1 emails Can Terra, La Brasa), agendar 5 instalações (§9), plano Dia 1–14 (§10). |
| [pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) | Checklist primeiro cliente pagante €79.                                                                                               |
| [web-config/INDEX_WEB_CONFIG.md](web-config/INDEX_WEB_CONFIG.md)                             | Índice alternativo das rotas web (ROTA\_\*.md em web-config/).                                                                        |

---

## 5. Regras absolutas (não violar)

- **Web de configuração:** SEMPRE render para dono com `hasOrg`; nunca bloquear por `systemState` nem por billing/dados. Nunca `return null` na web.
- **Operação (TPV/KDS):** Bloqueada em `systemState === "SETUP"` → redirect `/onboarding/first-product`.
- **Sem simulação conceitual:** Trial é real; não criar perfis Dono/Gerente/Staff na web como muletas; não reintroduzir simulação na lógica de produto.
- **Core é a fonte de verdade:** Não criar lógica paralela ao Core; tudo deve respeitar ROUTES_WEB_VS_OPERATION.md e CoreFlow.ts.

---

## 6. Como usar este manual

- **Novo dev:** Começar por §1 (fluxo e rotas) e §2 (Core e contratos); depois implementation/INDEX e routes/web/\*.md para a rota em que vai trabalhar.
- **Produto/operação:** §1 + §4 (piloto, checklist primeiro cliente); NEXT_STEPS para próxima ação.
- **Arquitectura:** §2 + architecture/CORE_CONTRACT_INDEX + routes/DIAGRAMA_WEB_CORE_OPERACAO.md.
