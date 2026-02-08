# OPERATIONAL_APP_MODE_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato geral (NON-CORE) — definição formal de Browser App Mode
**Local:** docs/architecture/OPERATIONAL_APP_MODE_CONTRACT.md
**Classificação:** Contratos Gerais; impacto financeiro direto: NÃO; escrita no Core: NÃO
**Hierarquia:** Referencia [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md). Não subordinado ao Core.

---

## Definição formal de “Browser App Mode”

**Browser App Mode** é o modo de execução em que o navegador abre uma URL (neste sistema, `/op/tpv` ou `/op/kds`) como aplicação dedicada: janela própria, eventualmente sem barra de endereço e sem chrome de navegação, com comportamento de “app instalado” (ícone no desktop ou na tela de início, abertura direta na URL). O conteúdo é servido pelo mesmo front-end (merchant-portal); não há binário separado nem runtime próprio. A “instalação” é feita pelo próprio browser, através de opções nativas (Instalar app, Criar atalho, Adicionar à tela de início).

---

## Como os browsers suportam

| Browser / ambiente                 | Mecanismo                        | Acção do utilizador (orientação canónica)                                                          |
| ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Chrome / Edge (Windows, macOS)** | Install as app / Create shortcut | Menu ⋮ → “Instalar app” ou “Criar atalho” → Abrir como janela.                                     |
| **Safari (iOS / iPadOS)**          | Add to Home Screen               | Compartilhar → Adicionar à Tela de Início.                                                         |
| **Safari (macOS)**                 | Web App / Dock                   | Arquivo → Adicionar ao Dock (quando disponível), ou Adicionar aos Favoritos e abrir em tela cheia. |

O sistema limita-se a **instruir** o utilizador com estes fluxos; não utiliza APIs experimentais nem tenta invocar instalação por script. A elegibilidade para “Instalar app” depende das políticas de cada browser e do cumprimento dos requisitos técnicos mínimos abaixo.

---

## Requisitos técnicos mínimos

| Requisito                    | Descrição                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Viewport**                 | Meta viewport adequada (ex.: `width=device-width`, `user-scalable=no` quando aplicável) para que a página seja utilizável em janela dedicada ou fullscreen. |
| **Layout fullscreen**        | A página usa a altura útil total (ex.: `min-height: 100vh`, `height: 100vh`) e evita overflow que quebre a sensação de app.                                 |
| **Ausência de UI de portal** | Em `/op/tpv` e `/op/kds` não há header, sidebar, footer nem navegação do portal de gestão; a página é apenas a interface operacional (TPV ou KDS).          |

Estes requisitos tornam a página **elegível** para ser aberta e instalada como app pelo browser; não garantem que todos os browsers mostrem sempre a opção de instalação, pois isso depende da implementação de cada um.

---

## O que torna uma página elegível para instalação

- Ser uma URL estável e dedicada (no nosso caso, `/op/tpv` ou `/op/kds`).
- Cumprir os requisitos técnicos mínimos (viewport, layout fullscreen, sem UI de portal).
- Ser servida em contexto seguro (HTTPS em produção).
- Não depender de service workers nem de manifest para o fluxo de instalação descrito neste contrato (podem existir noutros contextos, mas não são obrigatórios para Browser App Mode).

---

## O que o sistema NÃO deve tentar automatizar

| Não automatizar                        | Motivo                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Disparar “Instalar app” por script     | As APIs de instalação são restritas e variam por browser; a experiência canónica é o utilizador seguir as instruções no portal. |
| Detectar se a página foi “instalada”   | Não há contrato que exija deteção de modo instalado; o mesmo URL serve tanto em tab normal como em janela de app.               |
| Forçar PWA (manifest + service worker) | O contrato é Browser App Mode sem PWA complexo; instruções e links são suficientes.                                             |

---

## UX esperado pelo cliente

| Expectativa                          | Descrição                                                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Aceder ao portal e ver como instalar | O cliente entra em `/app/install`, vê duas opções (TPV, KDS), links e instruções por browser.                                     |
| Abrir a rota e instalar pelo browser | Clica em “Abrir TPV” ou “Abrir KDS” (nova aba); na nova aba, usa a opção do browser para instalar/criar atalho.                   |
| Ícone no desktop / ecrã de início    | Após instalação, um ícone permite abrir directamente a URL em janela dedicada ou fullscreen.                                      |
| Sem barra de URL                     | Quando aberto como “app”, o browser pode ocultar barra de endereço e controlos; o conteúdo ocupa a área útil.                     |
| Um dispositivo, um papel             | Cada instalação é uma URL; o cliente instala TPV num dispositivo e KDS noutro (ou o mesmo, com dois atalhos) conforme a operação. |

---

## Referências

- [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) — Web App Operacional Instalável e regras
- [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md) — fluxo passo a passo e estados

**Violação = comportamento ou requisitos fora da definição de Browser App Mode acima.**
