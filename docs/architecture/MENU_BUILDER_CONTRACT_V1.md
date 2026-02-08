# Menu Builder Contract v1

> **Fonte de verdade:** Criação de menu — matriz de modos, schema, preset por tipo, visibilidade por plataforma, publicação e UX. Core/ORE governam; UI consome.

---

## Princípio

Capacidade ≠ prioridade ≠ ergonomia. Um único sistema, modos habilitados por contexto.

**Regra de ouro:** O menu nunca começa vazio. Se não existe menu: Web → oferece Preset; Mobile → oferece Foto / IA. Nunca: tela branca, "crie tudo do zero", frustração inicial.

---

## Matriz definitiva (modos por plataforma)

| Modo   | Web | Mobile | Observação estrutural                |
| ------ | --- | ------ | ------------------------------------ |
| Preset | Sim | Não    | Base administrativa, curadoria, bulk |
| Manual | Sim | Sim    | Sempre disponível                    |
| Foto   | Não | Sim    | Sensorial, câmera-first              |
| PDF    | Sim | Sim    | Upload em ambos                      |
| Link   | Sim | Sim    | URL é neutro                         |
| IA     | Sim | Sim    | Orquestrador comum                   |

---

## Tabs por plataforma

- **Menu Builder — Web:** Preset, Manual, PDF, Link, IA. **Foto não aparece.**
- **Menu Builder — Mobile (App Staff):** Manual, Foto, PDF, Link, IA. **Preset não aparece.**

---

## Princípios sólidos (proposta corrigida)

- **Problema real:** Menu é crítico — alimenta Mini-TPV, TPV, Web+QR, KDS, relatórios, integrações, branding. Não é rascunho emocional. Antes de qualquer venda, o menu precisa existir, estar consistente e publicável.
- **Princípio:** Criar menu deve ser rápido, mas o resultado deve ser correto. Menos fricção, sem ambiguidade, sem estados "meio perigosos".
- **Menu inicial = completo, válido e simples.** Menu avançado = refinamento.
- **Web = hub central:** Preset, criação, edição, publicação — tudo nasce na web (desktop ou mobile). App Staff consome. Nada duplicado, nada paralelo.

### Fluxo em 3 passos (sem confusão)

1. **Escolha de base (obrigatória, simples)** — Tela inicial: "Qual tipo de negócio?" → Café/Bar, Restaurante, Fast food, Pizzaria, Bar noturno, Padaria, Outro. Isso ativa um **preset por tipo**, não um preset genérico único.
2. **Preset realista (não genérico)** — Ex.: Café/Bar → sistema cria Café 1.80, Água 1.50, Água com gás 1.70, Refrigerante 2.50, Cerveja 3.00. **Preço vem preenchido** (sugerido, editável). Tudo editável, tudo apagável, nada imposto.
3. **Edição direta** — Preço digitável (sem setas), teclado numérico no mobile, suporte a 2 / 2.5 / 2,50. Sem fricção visual.

### Publicação consciente

Antes de abrir o restaurante / QR: checklist simples — itens existem, preços definidos, "Quer publicar no QR/web agora?" Nada de "primeira venda misteriosa". Nada de QR sem menu.

### Marcas (Coca-Cola etc.)

Agora: não ativar (sem publicidade, revenue share, marcas no web). O sistema deve estruturar dados para isso: `item.brand`, categoria (ex. beverages), `volume`. Schema pronto, nada ativado.

---

## Schema final do item de menu

Referência em código: `merchant-portal/src/core/contracts/Menu.ts`.

### Campos obrigatórios (existentes)

- `name`, `price_cents`, `station` (BAR | KITCHEN), `prep_time_minutes` (input) / `prep_time_seconds` (persistido), `available`, `category_id` (opcional para input).

### Campos opcionais (marca-ready, IA-ready, preset)

| Campo             | Tipo     | Uso                                                                    |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `canon_id`        | string?  | Identifica item vindo de preset/canon (ex.: `preset_v1:bebidas:agua`). |
| `system_provided` | boolean? | Proteção contra eliminação (item de preset/canon).                     |
| `brand_id`        | string?  | Reservado para camada de marcas (futuro).                              |

Validação: `validateMenuItemInput` não valida estes campos; validação só nos campos obrigatórios já existentes.

---

## Preset oficial (por tipo de negócio)

Fonte = ORE/Core. Web consome via reader até haver endpoint.

**Tipos:** `cafe_bar`, `restaurante`, `fast_food`, `pizzaria`, `bar_noturno`, `padaria`, `outro`.

Cada tipo ativa um preset realista com **preço sugerido preenchido** (editável). Exemplo **Café/Bar:**

| Item         | Preço sugerido (cents) | Estação | prep_time_minutes |
| ------------ | ---------------------- | ------- | ----------------- |
| Café         | 180                    | BAR     | 2                 |
| Água         | 150                    | BAR     | 1                 |
| Água com gás | 170                    | BAR     | 1                 |
| Refrigerante | 250                    | BAR     | 1                 |
| Cerveja      | 300                    | BAR     | 1                 |

Outros tipos: o contrato de implementação (MenuPresetReader) define listas e preços por tipo. Tudo editável e apagável pelo dono.

---

## Regras de visibilidade

- **Web (merchant-portal):** Mostrar apenas tabs Preset, Manual, PDF, Link, IA. Não mostrar tab Foto.
- **Mobile (App Staff):** Mostrar apenas tabs Manual, Foto, PDF, Link, IA. Não mostrar tab Preset.
- Deteção de plataforma: por agora no Web sempre `platform = "web"`. Quando existir App Staff, passar `platform: "web" | "mobile"` ou derivar de contexto.

---

## UX rules

- **Remover > criar:** O dono remove o que não usa; não cria tudo do zero quando há preset.
- **Preço digitável:** Campo de preço como texto com `inputMode="decimal"`; suporte a vírgula e ponto; sem setas de número.
- **Edição inline:** Editar item na lista de forma direta quando aplicável.

---

## Estados "funcionalidade não ativa"

Para tabs em stub (PDF, Link, IA no Web quando ainda não implementados):

- Copy coerente: ex. "Disponível em breve." ou "Criação automática em breve."
- Sem botão de upload falso.
- Sem chamadas a APIs.

Para tab Foto no Web: não aparece (removida da lista de tabs).

---

## Riscos documentados (não implementar agora)

### Preset como muleta (falta de rito de passagem)

**Risco:** O dono aplica preset, altera um preço e nunca mais revisa o menu. O sistema perde consciência operacional.

**Solução futura (não agora):** Checklist de revisão mínima ou "marcar menu como revisado". Documentar apenas; não implementar em V1.

### Marcas (publicidade em menu)

**Risco alto se ativadas cedo:** Mexe com confiança, margem e soberania do dono. É fase 3 ou 4, com contrato jurídico, não feature de MVP. Schema pronto (`brand_id`), nada ativado.

### O que NÃO fazer agora

- Não mexer mais no menu por UI (congelar estética).
- Não adicionar IA ao menu agora.
- Não embelezar sem contrato visual.
- Não misturar TPV/KDS com menu neste momento.

---

## Congelamento e V2

**V1 está correto:** vendável, escalável, sem dívida cognitiva. Estruturalmente certo.

**Congelamento recomendado (ex.: 7 dias):** Só usar, criar menus reais, observar fricção, anotar. Depois nasce Menu Builder V2 com estética, ritmo e micro-UX ("Seu restaurante está ganhando forma"), sem alterar este contrato.

---

## Referências

- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — hierarquia Core.
- [MENU_CONTRACT.md](./MENU_CONTRACT.md) — itens de menu por superfície (navegação).
- [MENU_CREATION_METHODS.md](./MENU_CREATION_METHODS.md) — métodos de criação (manual, CSV, OCR, IA, etc.).
