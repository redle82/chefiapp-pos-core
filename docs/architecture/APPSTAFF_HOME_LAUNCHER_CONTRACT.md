# Contrato — AppStaff Home (Launcher Operacional)

**Lei Final (identidade visual):** [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md). Este contrato não substitui o Canon; em caso de conflito, o Canon prevalece.

**Status:** CONTRATUAL (definitivo)
**Tipo:** Lei de identidade do ecrã `/app/staff/home`. Função, anti-patterns, hierarquia visual.
**Violação:** Quebra de identidade de produto (não refactor estético).
**Contrato fundacional de identidade (ler primeiro):** [APPSTAFF_LAUNCHER_CONTRACT.md](APPSTAFF_LAUNCHER_CONTRACT.md).
**Contrato congelado AppRootSurface (anti-regressão):** [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](APPSTAFF_APPROOT_SURFACE_CONTRACT.md).
**Subordinado a:** [APPSTAFF_LAUNCHER_CONTRACT.md](APPSTAFF_LAUNCHER_CONTRACT.md), [APPSTAFF_BASELINE_CONSOLIDATED.md](APPSTAFF_BASELINE_CONSOLIDATED.md), [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md).

**Enforcement:** Este ecrã é Launcher Operacional, não dashboard web. Qualquer alteração que o faça parecer dashboard corporativo, grid neutro de cards ou interface “posso fechar e voltar depois” é **violação** — não regredir.

---

## 1. Função real do ecrã

**AppStaff Home não é dashboard.**
**AppStaff Home é o launcher de modos operacionais.**

- O ecrã existe para **escolher o modo do sistema** (Turno, TPV, KDS, Tarefas, Exceções, etc.).
- Cada bloco é um **modo de sistema**, não um “card” ou “link”.
- O utilizador deve perceber em **0,5 s**: “Estou AQUI para fazer ISTO.”

Se o ecrã convida a **explorar** → falhou.
Se o ecrã **impõe ação** → acertou.

**Frase que guia este ecrã:**
_“Isto não é para explorar. É para operar.”_

---

## 2. O que NÃO pode parecer (anti-patterns)

| Anti-pattern                | Descrição                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Dashboard web               | Layout centralizado, “ar” demais, margens grandes. App ocupa e envolve; não respira como landing. |
| Grid genérico de cards      | Todos os modos com o mesmo peso visual. Lembra Notion / admin / SaaS, não ferramenta operacional. |
| Banner informativo no topo  | “Fluxo saudável” como texto descritivo. O topo tem de ser **barra de comando**, não cartaz.       |
| Links disfarçados           | Turno, TPV, Tarefas a parecerem opções secundárias. Num app são **estados do sistema**.           |
| Browser vibes               | Margens grandes, falta de edge-to-edge, fundo fragmentado. Parecer que “posso fechar e esquecer”. |
| Admin / painel / plataforma | Qualquer estética de dashboard corporativo, painel de controlo ou “plataforma” genérica.          |

**Resultado psicológico a evitar:**
_“Posso fechar isto sem medo, não estou a operar nada.”_
Isso mata o ChefIApp, porque o ChefIApp é **operação viva**.

---

## 3. Hierarquia visual obrigatória

### 3.1 Tela full-screen operacional

- **Sem “respiro web”.** A tela ocupa o contexto (full-screen operacional).
- **Scroll interno**, nunca da página inteira (quando aplicável).
- **Fundo contínuo**; sem transições de cor ou secções que quebrem a sensação de dispositivo.
- **Edge-to-edge** onde fizer sentido; margens mínimas, não “card no centro”.

### 3.2 Top bar = barra de comando (não banner informativo)

O topo **não** é um banner descritivo. É **cockpit**.

| Deve comunicar      | Exemplo mental                                         |
| ------------------- | ------------------------------------------------------ |
| Estado do turno     | TURNO ABERTO / FECHADO                                 |
| Estado da operação  | 12 tarefas, 2 alertas                                  |
| Ação primária clara | Um gesto óbvio (ex.: “Iniciar turno”, “Assumir posto”) |

Exemplo de direção:
`[ 🟢 TURNO ABERTO | 12 tarefas | 2 alertas ]   ⚙️`

### 3.3 Modos: 1 dominante + subordinados

- **1 modo ativo** (grande, dominante) — “centro de gravidade”.
- **2–3 modos secundários** — subordinados visualmente.
- **Menos opções = mais app.** Evitar grid igual de 6+ blocos com o mesmo peso.

Os blocos devem parecer **botões de modo** que mudam o estado do app, não “cards bonitos”.

### 3.4 Gesto óbvio

- Textos de ação: “Entrar em modo”, “Iniciar turno”, “Assumir posto”.
- **App não sugere; app convoca.**

---

## 4. “Parece app” vs “Parece web”

| Parece web (evitar)                    | Parece app (objetivo)                      |
| -------------------------------------- | ------------------------------------------ |
| Layout centralizado + ar               | Ocupa, envolve, prende                     |
| Grid de cards iguais                   | 1 modo dominante + subordinados            |
| “Fluxo saudável” (informativo)         | Estado do turno + operação + ação primária |
| “Toque num modo para abrir” (explorar) | “Iniciar turno” / “Assumir posto” (operar) |
| Margens grandes, fundo fragmentado     | Edge-to-edge, fundo contínuo               |
| Várias coisas possíveis                | Uma coisa óbvia primeiro                   |

---

## 5. Sensação de dispositivo

Mesmo no browser, o ecrã deve:

- **Ocupar tudo** (full-screen operacional).
- **Fundo contínuo** (sem bandas ou secções que quebrem a imersão).
- **Transições** coerentes com “modo” (não com “página web”).
- **Bordas inexistentes** onde o produto o permitir.

Se parecer que dá para abrir outra aba e esquecer → **não é app**.

---

## 6. Declaração

O AppStaff Home segue este contrato. Alterações que o façam parecer dashboard, admin ou “web” são **violações de identidade**, não melhorias visuais.

_O problema não é o visual em si. O problema é o ecrã não assumir autoridade. Um app não pede atenção; toma atenção e impõe contexto._
