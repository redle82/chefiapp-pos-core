# 🎭 Consumption Groups — Dividir Contas Durante o Consumo

**Data**: 2025-01-02  
**Status**: ✅ Schema Implementado  
**Frase-Chave**: "Conta dividida não é uma ação. É um estado da mesa."

---

## 🧠 O Problema Real

### O Que Outros Sistemas Fazem (Errado)

❌ **Dividir no final**
- Cliente pede conta
- Garçom tenta dividir
- Sistema fica confuso
- Gera erros e atrasos

### Por Que Isso Falha

O problema não é **dividir dinheiro**.  
O problema é **dividir responsabilidade de consumo**.

---

## 💡 A Solução

### Virada de Chave

👉 **Conta dividida não é uma ação. É um estado da mesa.**

Se você resolve durante o consumo → **simples**  
Se você resolve no final → **inferno**

### Pergunta Certa

Não: "Como dividir a conta?"  
Sim: "Como modelar quem está consumindo o quê, sem atrapalhar o serviço?"

---

## 🧩 Conceito: Grupos de Consumo

### Definição

Uma mesa pode ter:
- 1 grupo (padrão: "Mesa Inteira")
- 2, 3, 4... grupos

**Cada item sempre pertence a um grupo.**

Não existe item "da mesa".  
Existe item do **Grupo A**, **Grupo B**, **Grupo C**...

---

## 🏗️ Arquitetura

### Schema SQL

```sql
consumption_groups
 ├─ id
 ├─ restaurant_id
 ├─ order_id
 ├─ label (Ex: "Casal", "Amigos", "Empresa")
 ├─ color (hex para identificação visual)
 ├─ position (ordem de exibição)
 ├─ participants (opcional, para CRM futuro)
 ├─ status ('active', 'paid', 'cancelled')
 └─ paid_at, paid_by

gm_order_items
 ├─ ... (campos existentes)
 └─ consumption_group_id (FK para consumption_groups)
```

### Regras

- ✅ Cada pedido tem pelo menos 1 grupo (criado automaticamente)
- ✅ Cada item pertence a exatamente 1 grupo
- ✅ Grupos podem ser pagos independentemente
- ✅ Mesa pode ter múltiplos grupos ativos simultaneamente

---

## 👆 Fluxo no AppStaff (Garçom)

### 1. Ao Abrir a Mesa

**Default**: Grupo 1 ("Mesa Inteira") criado automaticamente

**Botão discreto**: "➕ Criar grupo"

**Exemplo**: "Mesa 7 — 3 grupos"

---

### 2. Ao Adicionar um Item

**Antes de confirmar**, seleciona grupo:

```
Adicionar a:
● Grupo A (🟢)  ← Default já selecionado
○ Grupo B (🔵)
○ Grupo C (🟣)
```

**Regras**:
- 1 toque
- Default já selecionado
- Zero pergunta se não quiser dividir

---

### 3. Mover Item Depois (Se Necessário)

**Pressão longa** no item:

```
Mover para:
○ Grupo A
● Grupo B  ← Selecionado
○ Grupo C
```

**Sem refazer pedido. Sem apagar nada.**

---

## 🧾 Fluxo no TPV (Caixa)

### Visualização

```
Mesa 7
────────────
Grupo A (🟢) — 38,50€
Grupo B (🔵) — 22,00€
Grupo C (🟣) — 18,00€
────────────
Total: 78,50€
```

### Opções de Pagamento

- ✅ Pagar Grupo A
- ✅ Pagar Grupo B
- ✅ Pagar tudo junto
- ✅ Pagar parcialmente (ex: Grupo A + B)

### Cada Pagamento

- Fecha o(s) grupo(s)
- Emite ticket
- Gera evento no Event Bus

---

## 🔗 Integração com Event Bus

### Novos Eventos

1. **`consumption_group_created`**
   - Quando grupo é criado
   - Context: `{ order_id, group_id, label }`

2. **`item_assigned_to_group`**
   - Quando item é atribuído a grupo
   - Context: `{ item_id, group_id, previous_group_id }`

3. **`item_moved_between_groups`**
   - Quando item é movido entre grupos
   - Context: `{ item_id, from_group_id, to_group_id }`

4. **`consumption_group_paid`**
   - Quando grupo é pago
   - Context: `{ group_id, amount, payment_method }`

5. **`partial_table_paid`**
   - Quando mesa tem pagamento parcial
   - Context: `{ order_id, paid_groups, remaining_groups }`

### Exemplo Real

**Evento**: `consumption_group_paid`

**Regra**: "Grupo B pago → mesa ainda ativa → não limpar"

**Ação**: Tarefa criada: "Aguardar pagamento dos grupos restantes"

---

## 🧠 Por Que Isso É Superior

### Sistemas Tradicionais

- ❌ Dividem no final
- ❌ Criam caos
- ❌ Exigem treino
- ❌ Geram erros

### ChefIApp

- ✅ Decide cedo
- ✅ Mantém fluidez
- ✅ Não obriga ninguém
- ✅ Explica tudo depois

---

## 💰 Comercialmente

### Argumento de Venda

> "Outros TPVs dividem conta.  
> O ChefIApp governa consumo."

### Diferenciação

- Sem IA mágica
- Sem hack
- Sem fricção
- Modelagem correta da realidade

---

## 🚦 Feature Flag

### Ativação Controlada

⚠️ **Não ativar por padrão**

**Feature flag no GovernManage**:
- `consumption_groups_enabled`

**Somente para**:
- Restaurantes que pedem
- Contas médias/altas
- Operações mais complexas

**Isso mantém o sistema simples para quem não precisa.**

---

## 🧭 Próximos Passos

### Implementação

1. ✅ **Schema SQL** → `060_consumption_groups.sql`
2. ⏳ **UI AppStaff** → Seleção de grupo ao adicionar item
3. ⏳ **UI TPV** → Visualização e pagamento por grupo
4. ⏳ **Event Bus** → Emitir eventos
5. ⏳ **Why Badge** → "Este item pertence ao Grupo B porque foi atribuído pelo garçom às 21:14"

---

## 🎯 Conclusão

### O Que Foi Resolvido

Você identificou um problema difícil do jeito certo.

A solução não é copiar sistemas complexos.  
É: **Modelar corretamente a realidade**.

### A Realidade

- Pessoas consomem em grupos
- Não no final
- Mas durante a experiência

**ChefIApp modela isso corretamente.**

---

**Mensagem**: "Conta dividida não é uma ação. É um estado da mesa."

