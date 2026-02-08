# Menu digital — Catálogo visual de decisão

**Status:** CONTRATUAL  
**Tipo:** Especificação de produto e arquitetura do menu digital. Tratado como produto real, não como “ideia bonita”.  
**Ancorado em:** [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md); [DOC_INDEX.md](../DOC_INDEX.md).

---

## Frase-guia do produto

> **O cliente decide com os olhos antes de decidir com a cabeça.**

---

## 1. O que é este menu (conceito funcional)

Este menu **não é uma lista**. É um **catálogo visual de decisão**.

| Cliente | Comportamento |
| -------- | -------------- |
| Não lê | Desliza |
| Não imagina | Vê |
| Não pergunta | Toca |

Cada prato é uma **unidade de conversão**.

### Elementos obrigatórios por item (sempre presentes)

- **Imagem / vídeo grande** — unidade de conversão visual.
- **Nome curto** — identificação imediata.
- **Descrição mínima** — só o essencial.
- **Preço destacado** — visível sem procurar.
- **Ação clara** — botões sempre no mesmo lugar.

Referência de inspiração: **Netflix + Apple Store**, não menu tradicional em lista.

---

## 2. Arquitetura e implementação técnica

### Stack recomendada (mobile + tablet + QR)

| Camada | Tecnologia |
| ------ | ---------- |
| Frontend | React / Next.js ou React + Vite |
| Estilo | Tailwind ou design system próprio |
| Scroll / animação | Swiper / Framer Motion (scroll fluido) |
| Backend | Docker Core (PostgreSQL); media por URL (WebP no app) |
| Media | Imagens WebP; vídeo curto (MP4 / HLS opcional) |
| Deploy | PWA (instalável em tablet); QR → URL pública |

### Modelo de dados (fundamental)

**Menu**

```
menu {
  id
  restaurant_id
  name
  language
  is_active
}
```

**Categoria**

```
menu_category {
  id
  menu_id
  title
  order
}
```

**Prato**

```
menu_item {
  id
  category_id
  title
  description
  price
  image_url
  video_url?     // opcional
  allergens[]    // array ou relação
  is_available
  order
}
```

**Regra sagrada:** Se não tiver imagem boa, não aparece. (Prato sem imagem válida não é exibido no catálogo.)

---

## 3. Layout exato (estrutura visual)

```
[ HEADER VISUAL DA CATEGORIA ]
--------------------------------
[ CARD DO PRATO ]
|  [ IMAGEM GRANDE ]            |
|                               |
|  Nome do prato                |
|  Descrição curta              |
|                               |
|  € Preço                      |
|                               |
| [ Ver prato ] [ Pedir ]       |
--------------------------------
```

### Regras visuais

- Texto grande e legível.
- Botões sempre no mesmo lugar (Ver prato / Pedir).
- Nada de parágrafo longo.
- Espaço em branco é luxo, não desperdício.

---

## 4. Comportamento (UX)

| Aspecto | Regra |
| -------- | ----- |
| Scroll | Vertical fluido; categoria “cola” no topo; swipe natural (tablet first). |
| Ver prato | Abre modal full-screen (detalhe do prato). |
| Pedir | Ação direta (ou CTA fake no MVP). |
| Performance | Lazy load de imagens; vídeo só carrega ao abrir o prato. |

---

## 5. Modos de uso (3 implementações)

| Modo | Uso |
| ----- | --- |
| Mobile (QR) | Cliente escaneia QR → abre catálogo na mesma estrutura. |
| Tablet (modo mesa) | Tablet 11" na mesa; fonte maior, imagens mais largas, zero distração. |
| Backoffice | Edição pelo dono (ativar/desativar, preço, imagem, esconder temporariamente). |

O menu nasceu para **tablet**; o modo tablet (11") é chave.

---

## 6. Editor do restaurante (controle total)

O dono precisa, **sem dev**:

- Ativar/desativar prato.
- Mudar preço.
- Trocar imagem.
- Esconder temporariamente.

Tudo editável no backoffice, sem deploy.

---

## 7. Decisões críticas (premium de verdade)

Para o menu ser **premium de verdade** e não só bonito:

1. **Imagem real obrigatória** — sem imagem boa, o prato não aparece; evita “mais um QR ruim”.
2. **Texto curto** — nome curto + descrição mínima; sem parágrafos longos.
3. **Preço e ação claros** — preço destacado; botões “Ver prato” e “Pedir” sempre no mesmo sítio.
4. **Pedido não confuso** — fluxo de “Pedir” direto e óbvio; sem fricção desnecessária.

---

## 8. O erro que NÃO pode cometer

| Erro | Consequência |
| ----- | -------------- |
| Transformar isto num “menu digital bonito” sem substância | Perde o propósito de catálogo de decisão. |
| Mostrar pratos sem imagem real | Cliente imagina em vez de ver; quebra a frase-guia. |
| Usar texto longo | Cliente lê em vez de deslizar; perde conversão. |
| Deixar o pedido confuso | Aumenta fricção; reduz uso real. |

**Se fizer isso → vira só mais um QR ruim.**

---

## Referências

- [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md) — princípios imutáveis do produto.
- [DOC_INDEX.md](../DOC_INDEX.md) — índice da documentação contratual.

**Última atualização:** 2026-02-06
