# 📜 LEI DA REPRESENTAÇÃO TOTAL

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Lei Imutável do Sistema**  
**Nível:** 🏛️ Princípio de Soberania

---

## 🎯 OBJETIVO

Esta lei garante que **todo poder existente no sistema seja invocável, rastreável e representado no frontend**, ou explicitamente declarado como não-exposto.

---

## ⚖️ O PRINCÍPIO-LEI

### Lei da Representação Total

> **Todo poder existente no sistema deve ser:**
> 1. **Invocável** (pode ser chamado)
> 2. **Rastreável** (pode ser auditado)
> 3. **Representado no frontend** (tem UI)
> ou explicitamente declarado como **não-exposto**

### Regra de Violação

> **Se algo existe no backend e:**
> - ❌ não aparece no frontend
> - ❌ não está documentado como interno
> → **isso é poder fantasma (risco real)**

---

## 🧩 ONDE NORMALMENTE ISSO QUEBRA

| Local | Problema Clássico |
|-------|-------------------|
| Backend | Rotas antigas que ninguém usa |
| DB | Funções / triggers que ninguém sabe |
| Frontend | Telas que não cobrem todos os estados |
| Sistema | Ações possíveis que não têm UI |

**O ChefIApp já evita 70% disso por arquitetura.**  
**Agora estamos falando dos 30% finais: verificação formal.**

---

## 🛠️ O MÉTODO CORRETO (SEM ACHISMO)

Você só "sabe" de verdade com **3 mapas comparados entre si**:

### 🗺️ MAPA 1 — Mapa de Poder do Backend

**O que o backend pode fazer?**

Lista de:
- RPCs
- Endpoints
- Funções críticas
- Ações que mudam estado

**Exemplo:**
```
ORDER DOMAIN
- create_order
- add_item
- remove_item
- send_to_kitchen
- mark_ready
- cancel_order
- deliver_order

PAYMENT DOMAIN
- open_cash_register
- close_cash_register
- pay_cash
- split_payment
```

👉 Isso é o "arsenal real" do sistema.

---

### 🗺️ MAPA 2 — Mapa de Rotas do Frontend

**Para cada rota `/app/*`, responda:**

| Rota | Ações Possíveis |
|------|----------------|
| `/app/tpv` | criar pedido, pagar, cancelar |
| `/app/kds` | ver pedidos, marcar pronto |
| `/app/orders` | ver histórico |
| `/app/settings` | configurar |

Isso gera o **mapa de acesso humano**.

---

### 🗺️ MAPA 3 — Mapa de Estados do Banco

**Para cada tabela crítica:**
- Quais estados existem?
- Quais transições são possíveis?
- Quais são terminais?

**Exemplo:**
```
gm_orders.status:
- pending
- preparing
- ready
- delivered (terminal)
- canceled (terminal)
```

**Pergunta crítica:**
> **Existe algum estado que não pode ser alcançado por UI?**  
> **Se sim → problema.**

---

## 🧪 A VERIFICAÇÃO FINAL (A PERGUNTA MATADORA)

### 🔎 Checklist de Representação

Para cada ação do backend, responda:

| Pergunta | Resposta |
|---------|----------|
| Existe uma rota ou tela que dispara isso? | Sim / Não |
| Existe um botão, gesto ou fluxo humano? | Sim / Não |
| Existe feedback visual do resultado? | Sim / Não |
| Existe log/audit do evento? | Sim / Não |

📌 **Se qualquer resposta for "Não" → isso é um GAP.**

---

## 🚨 TIPOS DE GAP (IMPORTANTE)

### 1️⃣ Backend sem UI

**Ex:** função `cancel_order` existe, mas não há botão em nenhum lugar.

🔴 **Risco:** comportamento invisível / inconsistência.

---

### 2️⃣ UI sem Backend Real

**Ex:** botão existe, mas chama mock ou estado local.

🔴 **Risco:** ilusão de controle.

---

### 3️⃣ Banco com Estado Inalcançável

**Ex:** status existe, mas nunca ocorre via fluxo real.

🟡 **Risco:** lixo conceitual / dívida lógica.

---

## 🧠 COMO VOCÊ SABE QUE ESTÁ CERTO?

Quando você consegue afirmar:

> **"Se algo muda no banco, eu sei exatamente:**
> - qual tela causou isso
> - qual humano fez
> - em qual fluxo
> - e onde isso aparece visualmente"

**Esse é o ponto de soberania total.**

---

## 🧬 NO CHEFIAPP, O QUE JÁ EXISTE (E É RARO)

Você já tem:
- ✅ State machines formais
- ✅ Triggers bloqueando estados ilegais
- ✅ ROUTE_MANIFEST
- ✅ Audit logs
- ✅ Domínio separado da UI

**Falta apenas uma coisa para fechar o ciclo:**

---

## 🧩 A PEÇA FINAL

### 🔐 MATRIZ DE REPRESENTAÇÃO

Um arquivo que cruza:

| Backend Action | DB Change | UI Route | UI Action | Audit |
|----------------|-----------|----------|-----------|-------|
| cancel_order | status → canceled | /app/tpv | Botão Cancelar | ✔ |
| split_bill | payment split | /app/tpv | Dividir Conta | ✔ |
| mark_ready | status → ready | /app/kds | Marcar Pronto | ✔ |

👉 **Se a tabela fecha sem buracos → o sistema está íntegro.**

---

## 🏁 CONCLUSÃO HONESTA

Você não confia que frontend = backend por testes isolados.

Você confia quando:
- o poder real do sistema está mapeado
- o humano consegue invocar tudo que existe
- nada acontece "por baixo do pano"

**O ChefIApp está muito próximo do nível bancário nisso.**

---

## 📚 DOCUMENTOS RELACIONADOS

- **[REPRESENTATION_MATRIX.md](./docs/canon/REPRESENTATION_MATRIX.md)** - Matriz de representação
- **[MAPAS_SOBERANIA.md](./MAPAS_SOBERANIA.md)** - Os 3 mapas completos
- **[scripts/validate-representation.sh](./scripts/validate-representation.sh)** - Script de validação

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Lei Imutável**
