# Contrato visual — Menu digital (catálogo de decisão)

**Status:** CONTRATUAL  
**Tipo:** Regras de layout, spacing e tipografia para o menu visual. Referência única para implementação.  
**Lei superior (runtime):** [MENU_VISUAL_RUNTIME_CONTRACT.md](MENU_VISUAL_RUNTIME_CONTRACT.md).  
**Ancorado em:** [MENU_CATALOG_VISUAL_SPEC.md](MENU_CATALOG_VISUAL_SPEC.md).

---

## Princípio

> **Seduz → Confirma → Executa.**  
> Primeiro seduz (imagem), depois informa (nome, descrição, preço), só no fim executa (botões).

O cliente tem de saber **onde está** (restaurante) antes de saber **o que vai comer** (categorias/pratos).

---

## 1. RestaurantHeader

| Regra | Valor / descrição |
| ----- | ----------------- |
| Hero | Background image full-width; cobre toda a largura do viewport. |
| Altura | min-height em vh (ex.: 28vh–35vh); não esmagar em mobile. |
| Logo | Central sobre o hero; tamanho legível (ex.: max-width 120px em mobile, 180px em tablet). |
| Nome do restaurante | Abaixo ou integrado ao logo; tipografia grande, bold, contraste com o fundo. |
| Selo opcional | Ex.: "Recomendación del chef", "Desde 1998"; pequeno, sobre o hero; não competir com logo/nome. |
| Idioma | Mock: selector (dropdown ou bandeiras) no canto superior direito; opcional. |
| Share | Botão "Compartir" / partilha no canto superior direito; opcional. |

**Não:** barra genérica ("Catálogo", "O cliente decide com os olhos"); sem identidade do restaurante.

---

## 2. MenuCategorySection

| Regra | Valor / descrição |
| ----- | ----------------- |
| Título | Faixa preta (ou fundo escuro #0a0a0a–#171717); texto branco; maiúsculas; font-size grande (ex.: 1rem–1.25rem); letter-spacing opcional. |
| Comportamento | Título pode ser sticky no scroll (cola no topo ao passar a secção). |
| Espaçamento | Margem/padding real entre secções; não lista contínua de cards sem respiro. |
| Hierarquia | Cada secção = capítulo (Entrantes, Ensaladas, Menú degustación, etc.). |

**Não:** títulos pequenos ou integrados no fluxo sem destaque; lista infinita sem separação visual.

---

## 3. MenuDishCard

| Regra | Valor / descrição |
| ----- | ----------------- |
| Imagem | Edge-to-edge (sem bordas/bordas mínimas); ~70% do impacto visual do card; aspect-ratio consistente (ex.: 4/3). |
| Nome do prato | Tipografia grande (ex.: 1.25rem–1.5rem), bold; poucas linhas (1–2). |
| Descrição | Curta; 2–3 linhas max; texto legível (ex.: 0.9375rem–1rem); cor secundária. |
| Alergénios | Ícones ou pills (ex.: "ALERGENOS" + ícones gluten, lacteos, etc.); linha dedicada abaixo da imagem ou junto à descrição. |
| Preço | Em destaque; tamanho grande (ex.: 1.125rem–1.25rem); bold; cápsula ou elemento próprio se desejado. |
| Botões | "Ver prato" (secundário: borda preta) e "Pedir à cozinha" (primário: verde); **altura mín. 44px**; largura adequada ao toque (não micro-botões). |
| Sem micro-fontes | Nada abaixo de ~0.875rem para texto funcional. |

**Narrativa no card:** Imagem (seduz) → Nome + Descrição + Alergénios + Preço (confirma) → Botões (executa).

---

## 4. DishModal (full-screen prato)

| Regra | Valor / descrição |
| ----- | ----------------- |
| Layout | Mesma narrativa que MenuDishCard: imagem grande no topo, depois nome, descrição, alergénios, preço, botões. |
| Botões | "Ver la carta" (voltar) e "Pedir a cocina" (CTA verde); mesma altura mín. 44px. |
| Fechar | Seta "Voltar" ou "Ver la carta"; acessível. |

---

## 5. Breakpoint (tablet-first)

| Modo | Breakpoint | Uso |
| ----- | ---------- | --- |
| **Tablet 11" (principal)** | ≥ 834px (ou 1024px conforme design) | Layout de referência; botões e tipografia pensados para dedo. |
| Mobile | &lt; 834px | Versão reduzida; mesmos componentes; fontes/espaçamentos proporcionais. |
| Desktop | ≥ 1024px | Demo/simulação ou igual ao tablet. |

**Decisão:** O menu é um dispositivo (tablet na mesa); não é um site responsivo genérico.

---

## 6. Spacing e tipografia (valores de referência)

| Elemento | Spacing | Tipografia |
| -------- | ------- | ---------- |
| Entre secções (categorias) | 1.5rem–2rem | — |
| Dentro do card (entre imagem e texto) | 0 | — |
| Entre nome e descrição | 0.25rem–0.5rem | Nome: 1.25rem–1.5rem bold; Descrição: 0.9375rem–1rem regular |
| Entre descrição e preço | 0.5rem–0.75rem | Preço: 1.125rem–1.25rem bold |
| Entre preço e botões | 0.75rem–1rem | Botões: 1rem; min-height 44px |
| Faixa categoria | padding 0.75rem 1rem | 1rem–1.25rem uppercase |

---

## Referências

- [MENU_CATALOG_VISUAL_SPEC.md](MENU_CATALOG_VISUAL_SPEC.md) — conceito e modelo de dados.
- Imagens de referência: Gringo's Parrilla Mexicana, Nebeli, costillas, sandwich club, hamburguesa, menú degustación.

**Última atualização:** 2026-02-06
