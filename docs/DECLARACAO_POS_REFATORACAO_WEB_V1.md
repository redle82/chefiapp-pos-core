# Declaração oficial pós-refatoração (v1 congelada)

Documento canónico do que foi eliminado, do que está correto e do estado atual do sistema após a refatoração da web de configuração (sem modo de simulação, sem perfis Gerente/Staff na web). **Sem ambiguidade.**

**Data:** 2026-02-01
**Refs:** [CONTRATO_TRIAL_REAL.md](contracts/CONTRATO_TRIAL_REAL.md) · [CONTRATO_OWNER_ONLY_WEB.md](contracts/CONTRATO_OWNER_ONLY_WEB.md) · [ROUTES_WEB_VS_OPERATION.md](implementation/ROUTES_WEB_VS_OPERATION.md)

---

## 1. O que foi eliminado de forma definitiva (web de configuração)

### 1.1 Modo Trial / Demo Guide

| Regra                                                                    | Estado         |
| ------------------------------------------------------------------------ | -------------- |
| Nenhum badge de simulação                                                | ❌ Eliminado   |
| Nenhuma copy de "simulação", "ações bloqueadas", "dados de demonstração" | ❌ Eliminado   |
| Nenhum botão "Ativar piloto / Ativar trial"                              | ❌ Eliminado   |
| Nenhum `return null` escondendo UI por "modo"                            | ❌ Eliminado   |
| Trial real (14 dias) é o único modo de entrada pós-bootstrap             | ✅ Regra ativa |

### 1.2 Perfis Gerente / Staff na WEB

| Regra                                                                       | Estado         |
| --------------------------------------------------------------------------- | -------------- |
| Removido "DEV: Simular papel"                                               | ❌ Eliminado   |
| Removido "MODO DE VISÃO" (Dono/Gerente/Staff)                               | ❌ Eliminado   |
| Nenhuma troca de role na configuração                                       | ❌ Eliminado   |
| WEB = Dono apenas, sempre                                                   | ✅ Regra ativa |
| Gerente/Staff restritos ao contexto operacional (TPV/KDS/app), não à config | 🔒 Regra ativa |

**Resposta direta:** A refatoração incluiu explicitamente a eliminação dos perfis na web. Isso não é efeito colateral — é **regra de sistema**.

---

## 2. O que está correto agora (confirmado)

- Dashboard não está vazio ✔️
- SystemState único visível e honesto ✔️
  Copy: _"Trial ativo — 14 dias para operar no seu restaurante real."_
- Fluxo "Primeira venda em poucos passos" coerente ✔️
- Métricas:
  - Sem erro técnico cru
  - Mensagem humana: _"Ainda não há pedidos. Abra o TPV para a primeira venda."_
- Atalhos TPV/KDS disponíveis, com gates corretos:
  - 🔐 SETUP → redirect correto
  - 🟢 TRIAL/ACTIVE → operação liberada

**Componentes alinhados com o contrato:** CoreFlow · Guards · DashboardPortal · OperationalMetricsCards.

**Billing ancorado na web de configuração:** Card "Plano & Faturação" (quando TRIAL) abaixo do estado do sistema; bloco "Faturação" na sidebar (TRIAL/ACTIVE); passo 6 "Faturação" no guia "Primeira venda em poucos passos". Sem urgência falsa; convite natural ao plano.

**Momento certo para convite ao pagamento:** Durante o trial, visível no dashboard; sem regra rígida "após 1ª venda" ou "após X dias" — o dono vê o ponto de decisão (card + sidebar + passo 6) e escolhe quando ir a /app/billing. Decisão de produto pode refinir critério depois (ex.: após 1ª venda ou N dias).

---

## 3. Estado atual do sistema (canónico)

- **Contrato ativo:** [CONTRATO_TRIAL_REAL.md](contracts/CONTRATO_TRIAL_REAL.md)
- **Estados válidos:** SETUP · TRIAL · ACTIVE · SUSPENDED
- **Não existem mais:** simulação como estado de produto na UI.

---

## 4. `/trial-guide` e `/trial` — Opção A aplicada

**Decisão:** Opção A (comercial limpa).

- `/trial-guide` → redirect para `/op/tpv?mode=trial`
- `/trial` → redirect para `/op/tpv?mode=trial`
- Todos os links (Hero, AuthPage, ProductFirstLandingPage, Demo Guide, HowItWorks, SetupSidebar, PublishSection, ConfigSidebar) apontam para `/op/tpv?mode=trial`
- Rotas removidas das listas públicas (LifecycleState, LifecycleStateContext); imports legacy de páginas de simulação removidos de App.tsx

Tour acontece dentro do trial real; zero discurso de simulação. Nenhuma reintrodução de simulação no sistema.

---

## 5. Veredito técnico

- 🟢 Refatoração bem-sucedida
- 🟢 Arquitetura mais simples, mais honesta e mais vendável
- 🟢 Pronta para P1 (piloto real)

---

## 6. Próximos cortes possíveis (dois, claros)

1. **E2E smoke test mínimo** — Feito. Atualizado para Opção A (redirect /trial-guide → /op/tpv?mode=trial); 11 testes a passar: `E2E_NO_WEB_SERVER=1 npm run test:e2e:smoke`.
2. **Modo comercial** — Contactar 2 restaurantes do P1 ([ONDA_4_PILOTO_P1.md](pilots/ONDA_4_PILOTO_P1.md) §7).

---

---

## 7. Estado da pista técnica

**Pista técnica (refatoração + Opção A + E2E smoke): concluída.**
Próximo passo explícito: **modo comercial** — contactar 2 restaurantes do P1 ([ONDA_4_PILOTO_P1.md](pilots/ONDA_4_PILOTO_P1.md) §7).

---

**Última atualização:** 2026-02-01
