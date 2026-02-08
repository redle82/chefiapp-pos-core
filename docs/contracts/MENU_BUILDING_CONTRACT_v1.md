# 👑 MENU BUILDING CONTRACT — v1

**(A Rainha do ChefIApp OS)**

Sem Menu não há Pedido.
Sem Pedido não há Dinheiro.
Sem Dinheiro não há Sistema.

---

## Princípios fundamentais

1. Menu é contrato, não sugestão
2. Produto é entidade financeira
3. Todos os canais consomem o mesmo menu
4. Nada vende fora do menu
5. Menu governa stock, tempo, impostos e visibilidade
6. Menu é imutável em runtime (pedido já criado não muda)

---

## 1️⃣ ENTIDADE CENTRAL: PRODUCT

### Definição

Um **Product** é tudo aquilo que:

- pode ser vendido
- tem preço
- tem imposto
- gera faturação
- pode gerar tarefas

**Produto ≠ item visual.**
**Produto = unidade económica.**

### Campos obrigatórios (canónicos)

- `product_id`
- `store_id`
- `sku`
- `name`
- `description`
- `base_price`
- `currency`
- `tax_profile_id`
- `category_id`
- `is_active`
- `created_at`

### Regras duras

- ❌ Pedido sem `product_id` é inválido
- ❌ Produto sem preço não existe
- ❌ Produto inativo não pode entrar em pedido
- ❌ Produto apagado nunca apaga histórico

---

## 2️⃣ CATEGORY CONTRACT

Categorias não são cosméticas. Governam fluxo operacional.

| Campo       | Descrição             |
| ----------- | --------------------- |
| category_id | PK                    |
| menu_id     | FK                    |
| name        |                       |
| type        | Impacta KDS / tarefas |
| order_index |                       |

**type** (impacta KDS / tarefas):

- `FOOD` → KDS
- `DRINK` → BAR KDS
- `DESSERT` → KDS
- `TASK` → sistema de tarefas
- `SERVICE` → não vai para KDS

---

## 3️⃣ VARIANTS (opções reais, não texto livre)

Variants são produtos derivados, não comentários.

| Campo       | Descrição |
| ----------- | --------- |
| variant_id  | PK        |
| product_id  | FK        |
| name        |           |
| price_delta |           |

**Regras:**

- Variant altera preço
- Variant altera imposto se necessário
- Variant nunca é texto livre

Ex.: “Grande” +2€, “Sem álcool” -1€

---

## 4️⃣ MODIFIERS / EXTRAS (controlados)

| Campo        | Descrição |
| ------------ | --------- |
| modifier_id  | PK        |
| product_id   | FK        |
| name         |           |
| price        |           |
| max_quantity |           |

**Regras:**

- Nenhum texto livre no pedido
- Tudo que altera preço = modifier
- Modifier entra no Core Finance

---

## 5️⃣ AVAILABILITY CONTRACT (tempo manda)

| Campo       | Descrição |
| ----------- | --------- |
| product_id  | FK        |
| day_of_week |           |
| start_time  |           |
| end_time    |           |

**Regras:**

- Produto fora do horário: ❌ não aparece, ❌ não pode ser pedido
- Pedido criado congela disponibilidade

---

## 6️⃣ STOCK & CAPACITY (opcional mas soberano)

| Campo      | Descrição                          |
| ---------- | ---------------------------------- |
| product_id | FK                                 |
| stock_type | UNLIMITED \| LIMITED \| TIME_BASED |
| quantity   |                                    |

**Regras:**

- Stock zerado → produto some
- KDS nunca recebe produto sem stock
- Stock é lido antes de criar pedido

---

## 7️⃣ TAX & PRICE SOVEREIGNTY (liga ao Core Finance ❤️)

Produto aponta para `tax_profile_id`.
O **Core Finance** resolve:

- IVA
- imposto local
- regras de país
- faturação

👉 Menu **não calcula** imposto, apenas **declara**.

---

## 8️⃣ VISIBILITY CONTRACT (quem vê o quê)

| Campo      | Descrição                                   |
| ---------- | ------------------------------------------- |
| product_id | FK                                          |
| visible_to | CLIENT \| WAITER \| MANAGER \| OWNER \| API |

Ex.: produto interno (staff meal), produto só delivery, produto só bar.

---

## 9️⃣ ORDER SNAPSHOT (regra crítica)

Quando um pedido é criado, o menu é **“fotografado”** no pedido.

**Campos copiados:**

- name
- price
- tax
- variant
- modifiers

👉 Se o menu mudar depois: pedido não muda, faturação não muda, histórico não quebra.

---

## 🔗 QUEM CONSUME ESTE CONTRATO

| Sistema        | Como usa                      |
| -------------- | ----------------------------- |
| TPV / Mini TPV | Cria pedidos válidos          |
| Web / QR       | Mostra só o que pode          |
| KDS            | Executa tarefas por categoria |
| Core Finance   | Calcula dinheiro              |
| Integrations   | Valida pedidos externos       |
| Tasks          | Cria tarefas derivadas        |
| Analytics      | Sabe o que vendeu             |

👉 **Todos leem. Ninguém inventa.**

---

## 🚫 O QUE É PROIBIDO

- ❌ Texto livre no pedido
- ❌ Produto criado no TPV
- ❌ Preço digitado manualmente
- ❌ Pedido com produto “genérico”
- ❌ Integração mandar item fora do menu

---

## 🧬 EVENTOS DE MENU (para replay)

- `MENU_CREATED`
- `PRODUCT_ADDED`
- `PRODUCT_UPDATED`
- `PRODUCT_DISABLED`

Mudanças de menu são **eventos**, não só updates.

---

## 🧪 TESTES QUE ESTE CONTRATO GARANTE

- TPV nunca quebra
- KDS nunca recebe lixo
- Core Finance nunca calcula errado
- Integração nunca manda porcaria
- Pedido sempre é auditável

---

## Frase-chave

**O Menu é a Constituição do Restaurante.**
Todos obedecem. Ninguém discute em runtime.
