# Contrato Visual-Operacional do Menu (Runtime)

**Status:** CONTRATUAL
**Tipo:** Lei visual-operacional imutável do menu. Efeito, hierarquia e comportamento — não implementação.
**Hierarquia:** Acima de Menu V1, V2, V3, React, CSS, Tailwind, qualquer camada de código.
**Violação:** Bug de produto (não refactor).
**Subordinado a:** [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md), [DOC_INDEX.md](../DOC_INDEX.md).
**Complementa:** [MENU_VISUAL_CONTRACT.md](MENU_VISUAL_CONTRACT.md) (layout/tipografia), [MENU_CATALOG_VISUAL_SPEC.md](MENU_CATALOG_VISUAL_SPEC.md) (spec do catálogo). **Detalhe de camadas, fundo e SVG da onda:** [MENU_HEADER_WAVE_CONTRACT.md](MENU_HEADER_WAVE_CONTRACT.md).

---

## 1. Decisão de produto (imutável)

O menu é um **catálogo visual de decisão**.
O **conteúdo emerge por detrás do cabeçalho**.

**Experiência desejada:**

- O **cabeçalho é fixo**.
- A **página inteira rola por baixo** do cabeçalho.
- O menu **desaparece atrás** do cabeçalho ao fazer scroll.
- O utilizador sente: _“estou a navegar dentro de uma vitrine viva”_.

Referência: Netflix / Apple Music / menus premium de hotel — não SaaS comum.

Se isso for quebrado → menu inválido. Não é guideline. É lei do sistema.

---

## 2. Cabeçalho (Hero)

### Estrutura imutável

| Bloco               | Conteúdo                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **HEADER FIXO**     | Background (imagem/vídeo), overlay escuro, logo ou monograma, nome, frase curta, selos flutuantes, **wave na base**. |
| **CONTEÚDO SCROLL** | Começa “por trás” do header; categorias, cards de pratos, badges, alergénios.                                        |

### Obrigatório no header

| Regra            | Descrição                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Referência fixa  | O cabeçalho é **fixo** (não participa do fluxo normal; position fixed).                                                                                                       |
| Background       | Imagem ou vídeo em full-width; cobre a área do hero.                                                                                                                          |
| Overlay          | Overlay escuro sobre o background (leitura e hierarquia).                                                                                                                     |
| Conteúdo central | **Apenas:** (1) logo do restaurante **ou** monograma (iniciais), (2) nome, (3) frase curta (tagline), (4) selos flutuantes (recomendado, TripAdvisor, chef, etc.). Nada mais. |
| Base ondulada    | A base do hero é **ondulada** (wave). Nunca recta.                                                                                                                            |

### Proibido

- **Foto de ambiente / restaurante no centro.** O menu é sobre decisão de prato, não sobre o espaço; foto de ambiente distrai e quebra o foco.
- Cabeçalho “reto” (corte seco na base).
- Hero que empurra o conteúdo para baixo sem transição (o hero é fixo; o conteúdo rola por baixo).
- Remoção da onda entre versões (V1, V2, V3).
- Qualquer elemento no header além de: background, overlay, logo/monograma, nome, frase, selos, wave.

---

## 3. Onda (Wave)

| Regra            | Descrição                                                                                                                                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pertence ao Hero | A onda é **parte do header**, não do conteúdo do menu. Está acima do menu.                                                                                                                                                                                                               |
| Recorta o header | A onda **recorta** o header (forma inferior do header), não é decoração em cima de um quadrado. **Nunca** fundo branco (ou outra cor) atrás da onda — o fill da onda e o fundo global da página devem ser a mesma cor. Ver [MENU_HEADER_WAVE_CONTRACT.md](MENU_HEADER_WAVE_CONTRACT.md). |
| Acima do menu    | A onda tem z-index **maior** que o conteúdo do menu (recorta visualmente o scroll).                                                                                                                                                                                                      |
| Nunca desaparece | A onda **nunca some**. Entre versões (V1, V2, V3), a onda não pode ser removida.                                                                                                                                                                                                         |
| Nunca recta      | A onda **nunca vira reta**. Se a wave sumir ou virar reta = bug de produto.                                                                                                                                                                                                              |
| Semântica        | A onda é **transição de estado visual**, não decoração.                                                                                                                                                                                                                                  |

---

## 4. Menu Content e scroll (regra absoluta)

**O menu passa por detrás do cabeçalho.**

### Regras de scroll

- O **header não participa do fluxo normal** (position fixed).
- O bloco de conteúdo do menu tem **margin-top negativo** (sobe e “entra por trás” do header).
- O bloco de conteúdo do menu tem **padding-top** (espaço respirável; o conteúdo nasce dentro da onda).
- O bloco de conteúdo tem **z-index abaixo** do header e da onda.

### Tecnicamente

- O bloco de conteúdo do menu (categorias + cards) tem **margin-top negativo** (sobe e invade o espaço do Hero).
- O bloco de conteúdo do menu tem **z-index abaixo da onda**.
- O conteúdo “entra” no hero (visualmente nasce dentro da onda).

### Visualmente

- O menu **nasce dentro da onda**.
- Não existe “quebra” ou linha recta entre hero e pratos.
- O olho desce do hero para o conteúdo de forma contínua.

**Se isso não acontece → contrato violado.**

### Fundo

- O conteúdo do menu tem **fundo sólido** (não transparente). Sem isso o efeito não “fecha”.

---

## 5. Cards de prato

| Regra            | Descrição                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Microvídeo / GIF | Não é GIF pesado; é **mp4 curto** ou **WebP animado**; loop suave; 2–3 segundos.                            |
| Badges / selos   | Camada **sobre** a imagem do prato, nunca abaixo (Recomendado pelo Chef, Vegetariano, TripAdvisor, Prémio). |
| Alergénios       | Sempre visíveis; **ícones** em linha fixa; sem texto longo; alfabeto visual do sistema.                     |

---

## 6. Execução técnica de referência

Valores **indicativos** (não obrigatórios); contrato permanece agnóstico de framework. Referência para quem implementa:

| Elemento | Propriedade | Valor de referência      |
| -------- | ----------- | ------------------------ |
| Header   | position    | fixed                    |
| Header   | top / left  | 0                        |
| Header   | width       | 100%                     |
| Header   | height      | 70vh                     |
| Header   | z-index     | 100                      |
| Header   | overflow    | hidden                   |
| Conteúdo | position    | relative                 |
| Conteúdo | z-index     | 10 (abaixo do header)    |
| Conteúdo | margin-top  | -30vh (entra por trás)   |
| Conteúdo | padding-top | 40vh (espaço respirável) |
| Conteúdo | fundo       | sólido                   |
| Wave     | position    | absolute                 |
| Wave     | bottom      | -1px (dentro do header)  |
| Wave     | z-index     | 120 (acima do conteúdo)  |

Reservar espaço no fluxo do documento para o hero fixo (ex.: elemento spacer com altura 70vh) para o conteúdo não ficar escondido atrás do header.

Manter contrato agnóstico de framework; esta secção como referência para quem implementa.

---

## 7. Fixidez sem rigidez

O contrato **não define**:

- Framework (React, outro).
- Classes CSS ou nomes de componentes.
- Tailwind vs CSS puro.
- Valores exactos de px ou vh (podem ajustar-se por produto).

O contrato **define**:

- Efeito (conteúdo emerge por detrás do hero).
- Hierarquia (Hero + onda acima; menu content abaixo).
- Comportamento visual (transição contínua, sem corte seco).

---

## 8. Versões (V1 / V2 / V3)

| Versão      | Papel                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| V1          | Legado. Pode não cumprir o contrato; não quebrar em nome de “unificar”. |
| V2          | Implementação moderna. **Não pode contradizer** o contrato visual.      |
| V3 (futuro) | Qualquer evolução nasce já a obedecer ao contrato.                      |

**Contrato = verdade.** Código que viole = bug de produto, não refactor aceitável.

---

## 9. Declaração oficial

O menu visual do ChefIApp segue este contrato.
Alterações que quebrem o princípio-mãe ou as regras de Hero, Onda ou Menu Content são **violações**, não “melhorias” ou “simplificações”.
