# OPERATIONAL_INSTALL_FLOW_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato geral (NON-CORE) — fluxo de instalação do TPV e do KDS
**Local:** docs/architecture/OPERATIONAL_INSTALL_FLOW_CONTRACT.md
**Classificação:** Contratos Gerais; impacto financeiro direto: NÃO; escrita no Core: NÃO
**Hierarquia:** Referencia [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md), [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) e [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md). Não subordinado ao Core.

---

## Fluxo de instalação (passo a passo)

| Passo | Acção                                                                                                 | Responsável                        |
| ----- | ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1     | Cliente acede ao portal de gestão                                                                     | Utilizador                         |
| 2     | Navega para `/app/install` (a partir do dashboard ou da árvore de configuração)                       | Utilizador / UI                    |
| 3     | Lê instruções e escolhe TPV ou KDS                                                                    | Utilizador                         |
| 4     | Clica em “Abrir TPV” ou “Abrir KDS” → abre `/op/tpv` ou `/op/kds` em nova aba                         | Sistema (link/button)              |
| 5     | Se os gates permitirem, a página operacional é exibida                                                | Sistema (RequireOperational, etc.) |
| 6     | Cliente usa a opção do browser para instalar (Instalar app, Criar atalho, Adicionar à tela de início) | Utilizador / Browser               |
| 7     | A partir daí, o cliente abre o atalho e usa TPV ou KDS em janela dedicada / fullscreen                | Browser / Sistema                  |

Não existe passo automático de “instalação forçada”; o portal **instrui**, nunca força.

---

## Papel do portal

| Papel            | Descrição                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Instruir**     | A página `/app/install` explica o que é instalar TPV/KDS, mostra os links e as instruções por browser (Chrome/Edge, Safari iOS, Safari macOS).                                       |
| **Nunca forçar** | O portal não executa instalação por script, não bloqueia o uso em tab normal e não exige que o cliente instale para operar (pode usar em tab; instalação é opcional para melhor UX). |

O portal pode mostrar o estado (disponível para instalar vs. bloqueado por billing ou publish) e mensagens de erro canónicas quando o cliente tenta aceder a `/op/tpv` ou `/op/kds` sem condições.

---

## Estados possíveis

| Estado                                  | Condição                                                                      | O que o cliente vê ao aceder a `/op/tpv` ou `/op/kds`                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Disponível para instalar**            | Restaurante publicado, billing ativo, utilizador autenticado com role correta | Página operacional (TPV ou KDS); pode usar em tab ou instalar via browser.                                                                                       |
| **Bloqueado por publish**               | `isPublished === false`                                                       | Tela “Sistema não operacional” (ou equivalente); link para portal de gestão (ex.: “Ir para o Portal de Gestão” → `/dashboard`). Nunca redirecionar para landing. |
| **Bloqueado por billing**               | Billing não ativo (ex.: `past_due`, `suspended`)                              | Conforme enforcement do sistema (ex.: redirect para `/app/billing` ou tela de bloqueio); link para portal/faturação. Nunca redirecionar para landing.            |
| **Não autenticado / role insuficiente** | Sem sessão ou sem permissão para a rota                                       | Comportamento definido por auth e RoleGate (ex.: redirect para login ou dashboard). Nunca redirecionar para landing.                                             |

A decisão de “bloqueado” e o destino (dashboard, billing, etc.) são implementados nos gates e no fluxo de auth; este contrato fixa apenas os **estados** e o princípio de **nunca redirecionar para landing** em contexto operacional.

---

## Mensagens de erro canónicas

| Situação                  | Mensagem canónica (orientação)                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restaurante não publicado | “Sistema não operacional. As ferramentas de operação (TPV, KDS) só ficam disponíveis após publicar o restaurante e ter faturação ativa. Aceda ao portal de gestão para configurar.” |
| Bloqueado por billing     | Mensagem que indique regularização da faturação e link para `/app/billing` (texto exacto fica a cargo da UI).                                                                       |
| Sem permissão             | Comportamento de auth/role (ex.: redirect ou mensagem de acesso negado); nunca “voltar à landing” como acção primária.                                                              |

Todas as telas de bloqueio operacional devem oferecer saída para **portal de gestão** (ex.: `/dashboard`) ou **faturação** (`/app/billing`), nunca para a landing (`/`).

---

## Relação com contratos existentes

| Contrato                              | Relação                                                                                                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CAMINHO_DO_CLIENTE**                | O fluxo de instalação ocorre **após** o caminho Landing → Signup → Portal → Billing → Publicar. A página `/app/install` é uma rota do portal (`/app/*`); o cliente só instala TPV/KDS quando já está no portal e com operação desbloqueada. |
| **OPERATIONAL_GATES_CONTRACT**        | Os estados “disponível” vs “bloqueado por publish/billing” são implementados pelos mesmos gates que protegem `/op/tpv` e `/op/kds`; este contrato não altera os gates, apenas descreve o fluxo e as mensagens à luz deles.                  |
| **OPERATIONAL_INSTALLATION_CONTRACT** | Define o que é “Web App Operacional Instalável” e as regras (uma rota = um app, um computador = um papel); o presente contrato define o **fluxo** e os **estados** dessa instalação.                                                        |
| **OPERATIONAL_APP_MODE_CONTRACT**     | Define Browser App Mode e requisitos técnicos; o fluxo de instalação pressupõe que as páginas `/op/tpv` e `/op/kds` cumprem esses requisitos.                                                                                               |

---

## Referências

- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo do cliente até à operação
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates published / operational
- [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) — definição e regras de instalação
- [OPERATIONAL_APP_MODE_CONTRACT.md](./OPERATIONAL_APP_MODE_CONTRACT.md) — Browser App Mode

**Violação = fluxo ou mensagens fora do descrito acima, ou redirecionamento para landing em contexto operacional bloqueado.**
