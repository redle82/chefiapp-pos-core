# OPERATIONAL_INSTALLATION_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato geral (NON-CORE) — instalação e execução operacional no desktop do cliente
**Local:** docs/architecture/OPERATIONAL_INSTALLATION_CONTRACT.md
**Classificação:** Contratos Gerais; impacto financeiro direto: NÃO; escrita no Core: NÃO
**Hierarquia:** Referencia [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) e [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md). Não subordinado ao Core.

---

## Definição

**Web App Operacional Instalável (Browser App Mode)** é o modo em que o TPV e o KDS são instalados e executados no desktop do cliente usando exclusivamente as capacidades nativas do navegador (Chrome, Edge, Safari). O utilizador instala uma rota (`/op/tpv` ou `/op/kds`) como “app” ou “atalho” a partir do próprio browser; o resultado abre em janela dedicada ou tela cheia, sem barra de URL. O sistema não fornece binários, nem service workers obrigatórios, nem aplicações de loja.

---

## O que NÃO é

| Não é            | Significado                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| **Electron**     | Não há build desktop, nem processo Node, nem empacotamento de binário. |
| **PWA completo** | Não é obrigatório manifest.json nem service workers para instalação.   |
| **App de store** | Não há submissão a App Store, Google Play ou Microsoft Store.          |

---

## Rotas instaláveis

| Rota      | Papel         | Uso no desktop                                               |
| --------- | ------------- | ------------------------------------------------------------ |
| `/op/tpv` | TPV (Caixa)   | Um computador = um papel de caixa; instalação por máquina.   |
| `/op/kds` | KDS (Cozinha) | Um computador = um papel de cozinha; instalação por máquina. |

Cada rota corresponde a **um app instalado** do ponto de vista do utilizador. Cada computador é tipicamente dedicado a **um papel** (caixa ou cozinha).

---

## Regras

| Regra                       | Aplicação                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Uma rota = um app instalado | O cliente instala `/op/tpv` ou `/op/kds` separadamente; não existe um único “app ChefIApp” que contenha ambas. |
| Um computador = um papel    | Por máquina física, o cliente escolhe TPV ou KDS; a instalação reflete essa escolha.                           |
| Browser = shell             | O browser é o invólucro (janela, atalho, ícone); a lógica e os dados vêm do sistema (merchant-portal + Core).  |
| Sistema = lógica            | Autenticação, gates, billing, publish e dados são responsabilidade do sistema; a instalação não altera o Core. |

---

## Pré-condições

As rotas `/op/tpv` e `/op/kds` só devem ser acessíveis (e portanto instaláveis com sucesso) quando:

| Pré-condição                            | Fonte                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Restaurante publicado                   | `isPublished === true`                                                        |
| Billing ativo                           | `billingStatus` permite operação (ex.: `active` ou `trial` conforme política) |
| Utilizador autenticado com role correta | Autenticação e RoleGate; destino pós-login não é TPV/KDS por defeito.         |

O enforcement destas condições é definido em [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) e em [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md). Este contrato não regula a implementação dos gates; apenas declara que a instalação pressupõe que elas estão satisfeitas.

---

## Comportamento esperado

| Comportamento              | Descrição                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fullscreen**             | A página instalada usa altura útil total (ex.: 100vh); sem barra de navegador visível quando aberta como “app”.                                       |
| **Sem barra de navegador** | Quando o browser abre em “modo app” ou “janela de app”, a barra de URL e os controlos de navegação não são mostrados.                                 |
| **Sem navegação externa**  | As páginas `/op/tpv` e `/op/kds` não expõem links ou navegação para fora da própria rota operacional (sem sidebar de portal, sem links para landing). |

---

## Responsabilidades

| Parte                         | Responsabilidade                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Browser**                   | Fornecer o mecanismo de “Instalar app” / “Criar atalho” / “Adicionar à tela de início”; abrir a URL em janela dedicada ou fullscreen.                                                         |
| **Sistema (merchant-portal)** | Expor as rotas `/op/tpv` e `/op/kds` com layout fullscreen, viewport adequado e sem UI de portal; aplicar gates antes de renderizar; fornecer a página `/app/install` com instruções e links. |

---

## Não-responsabilidades (fora de escopo)

| Fora de escopo          | Significado                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Offline**             | Este contrato não exige modo offline nem cache persistente para operação sem rede.                  |
| **Drivers de hardware** | Impressoras, leitores de cartões, displays secundários são fora do âmbito deste contrato.           |
| **Impressão legacy**    | Protocolos e drivers de impressão fiscal ou receitas em hardware específico não são regulados aqui. |

Estes pontos podem ser objeto de outros contratos ou decisões de produto; não são pré-condições nem garantias do Web App Operacional Instalável.

---

## Referências

- [OPERATIONAL_APP_MODE_CONTRACT.md](./OPERATIONAL_APP_MODE_CONTRACT.md) — definição formal de Browser App Mode
- [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md) — fluxo de instalação e estados
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas `/op/*`
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates published / operational

**Violação = instalação ou execução operacional fora das regras acima.**
