# Contrato — Header Ondulado ChefIApp

**Status:** CONTRATUAL  
**Tipo:** Lei visual do header ondulado. Camadas, fundo, SVG da onda, anti-patterns.  
**Violação:** Bug de produto (não refactor).  
**Subordinado a:** [MENU_VISUAL_RUNTIME_CONTRACT.md](MENU_VISUAL_RUNTIME_CONTRACT.md).  
**Complementa:** [MENU_VISUAL_CONTRACT.md](MENU_VISUAL_CONTRACT.md) (layout/tipografia).

---

## 1. Regras do contrato (HEADER ONDULADO CHEFIAPP)

1. O header é uma **máscara**, não um bloco rectangular visível até à base.
2. A onda **recorta** o header (forma inferior do header), não o conteúdo.
3. O menu passa **por trás** do header.
4. **Nunca** deve existir fundo branco (ou de outra cor) atrás da onda — o fill da onda e o fundo global da página devem ser a mesma cor.
5. A transição é **contínua** (z-index + overflow), não empilhada (sem container intermédio entre header e menu).

---

## 2. Estrutura de camadas (modelo mental)

- **body** (ou wrapper da página): fundo = cor global (ex.: escuro `#0e0e0e` ou neutro). Não branco se o objectivo for eliminar borda.
- **header.hero-header**: `position: fixed`, `overflow: hidden`, z-index acima do conteúdo; **forma inferior** definida pela onda (mask/clip).
- **svg.hero-wave**: máscara/recorte na base do header; **fill = mesma cor que o fundo global**.
- **main.menu-content**: `position: relative`, z-index abaixo do header; começa “por trás” do header (`margin-top` &lt; altura do header); **sem container branco entre header e menu**.

---

## 3. Regras de z-index

| Elemento | Regra |
| -------- | ----- |
| Header (incluindo onda) | z-index **maior** que menu content. |
| Modal (ex.: DishModal) | z-index **maior** que header. |

---

## 4. Regras de fundo

- O fundo do site (body ou wrapper da página do menu) **não pode** ser branco se a onda tiver fill escuro; ou o fill da onda **tem de ser** exactamente a mesma cor que o fundo da área de conteúdo. Caso contrário aparece borda / “quadrado”.
- **Nunca** um container com fundo próprio (ex.: branco) entre o header e o início do scroll do menu.
- Header = identidade + promessa (logo/monograma, selos, idioma). Alergénios só nos pratos; nada de alergénios no header.

---

## 5. SVG oficial da onda (referência)

- **Inline SVG** com `preserveAspectRatio="none"`.
- **viewBox:** `0 0 1440 120`.
- **Path (exemplo):** curva suave; `fill` = cor do fundo global (ex.: `#0e0e0e` ou `neutral-100`).
- **Classe:** `hero-wave`.
- **CSS:** `position: absolute`; `bottom: -1px`; `left: 0`; `width: 100%`; altura fixa (ex.: 120px); `display: block`.

Exemplo de path (ajustável):

```svg
<svg viewBox="0 0 1440 120" preserveAspectRatio="none" class="hero-wave">
  <path
    d="M0,40 C120,80 320,0 520,20 720,40 920,100 1120,80 1320,60 1440,40 1440,40 L1440,120 L0,120 Z"
    fill="<COR_FUNDO_GLOBAL>"
  />
</svg>
```

- **Não** usar SVG da onda como `<img>`.
- **Não** usar onda como pseudo-elemento puramente decorativo.

---

## 6. Anti-patterns (o que NÃO fazer)

- SVG da onda como `<img>`.
- Fundo branco no body/wrapper da página do menu (gera borda visível).
- Header e section do menu separados por um container com fundo próprio.
- Onda como pseudo-elemento decorativo (::after/::before) sem ser parte do recorte.
- Border-radius no header em vez de mask/onda.
- Qualquer solução que desenhe a onda “por cima” de um rectângulo sem recortar o header.

---

## 7. Declaração

O header ondulado do menu ChefIApp segue este contrato. Alterações que quebrem as regras de camadas, fundo ou SVG da onda são **violações**, não “melhorias”.
