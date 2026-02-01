# 🎯 Arquitetura: Status do Cliente vs KDS Interno

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Princípio Fundamental

**Cliente NUNCA vê KDS.**  
**Cliente vê STATUS, não produção.**

O que você chama de "KDS do cliente" não é um KDS.  
É um **Customer Order Status View (COSV)**.

**Diferença:**
- **KDS** = ferramenta de trabalho (pressão, tempo, atraso, falhas)
- **Cliente** = ansiedade + expectativa

Misturar os dois mata a experiência.

---

## 🧩 Arquitetura (3 Camadas)

### 1️⃣ KDS Real (Interno)

**Onde:** Cozinha / Garçom / Gerente  
**O que mostra:**
- Tempos reais
- Itens detalhados
- Estação (BAR/KITCHEN)
- Alertas de atraso
- Outros pedidos

**Rotas:**
- `/kds-minimal` - KDS completo (cozinha)
- `/garcom` - Mini KDS (garçom/gerente)

---

### 2️⃣ KDS Público (Externo)

**Onde:**
- Tela fora do restaurante
- TV
- Painel público
- Página web pública (sem login)

**O que mostra:**
- Lista de pedidos **PRONTOS** ou **CHAMANDO**
- Identificação curta:
  - Número do pedido
  - Mesa (se fizer sentido)
  - Nome ou apelido (opcional)

**Nunca mostra:**
- Em preparo
- Tempo
- Origem
- Bar/cozinha
- Itens detalhados
- Atraso

**Estados:**
```
🔔 Pedido #123 pronto
🔔 Pedido #124 pronto
```

**Regra:** Só entra aqui quando o pedido atinge estado `READY`.

**Rota:** `/public/:slug/kds`

**Arquivo:** `merchant-portal/src/pages/Public/PublicKDS.tsx`

---

### 3️⃣ Status Individual do Cliente (Privado)

**Onde o cliente vê:**
Depende de onde ele pediu:

| Origem do Pedido | Onde ele acompanha |
|------------------|-------------------|
| QR Mesa | `/public/:slug/order/:orderId` |
| Web | `/public/:slug/order/:orderId` |
| Garçom | QR no recibo / link enviado |
| TPV | Recibo / SMS / QR opcional |

**O que ele vê (sempre igual):**
```
Pedido #123
Status: 🍳 Em preparo

"Estamos preparando seu pedido com carinho."
```

**Estados permitidos ao cliente:**

| Estado Interno | Cliente vê | Icon | Cor |
|----------------|------------|------|-----|
| OPEN | Recebido | ✅ | Verde |
| PREPARING/IN_PREP | Em preparo | 🍳 | Azul |
| ALMOST_READY | Quase pronto | ⏳ | Amarelo |
| READY | Pronto | 🔔 | Verde |
| DELIVERED/CLOSED | Entregue | ✅ | Cinza |

**Regras:**
- Cliente nunca vê atraso
- Cliente nunca vê tempo
- Cliente só vê o pedido dele
- Nunca vê outros pedidos
- Nunca vê quantos pedidos existem
- Nunca vê se a cozinha está cheia

**Rota:** `/public/:slug/order/:orderId`

**Arquivo:** `merchant-portal/src/pages/Public/CustomerOrderStatusView.tsx`

---

## 🔒 Isolamento Absoluto

**Regra de ouro:**
- Cliente só vê o pedido dele
- Nunca vê:
  - Outros pedidos
  - Quantos pedidos existem
  - Se a cozinha está cheia
  - Se alguém está atrasado

**Isso é fundamental psicologicamente.**

---

## 🧠 Resumo Visual da Arquitetura

```
                ┌──────────────┐
                │   KDS REAL   │
                │  (Cozinha)  │
                └─────▲────────┘
                      │
              ┌───────┴────────┐
              │   Mini KDS     │
              │ Garçom/Gerente│
              └───────▲────────┘
                      │
     ┌────────────────┴────────────────┐
     │         CORE DE PEDIDOS          │
     └─────────────▲───────────────▲───┘
                   │               │
        ┌──────────┴───────┐   ┌───┴───────────┐
        │ KDS Público      │   │ Status Cliente│
        │ (Pedidos Prontos)│   │ (Pedido Único)│
        └──────────────────┘   └────────────────┘
```

---

## 🧪 Regra Prática para Decidir "Mostra ou Não"

**Pergunta simples:**

> Isso ajuda o cliente a ficar mais calmo?

- **Se sim** → pode mostrar
- **Se não** → é interno

**Exemplos:**
- ✅ Status "Em preparo" → ajuda (cliente sabe que está sendo feito)
- ❌ Tempo "14 minutos" → não ajuda (gera ansiedade)
- ❌ "Atrasado" → não ajuda (gera stress)
- ✅ "Quase pronto" → ajuda (cliente sabe que está chegando)

---

## ✅ Implementação

### Rotas Adicionadas

```typescript
// Status individual do cliente
<Route path="/public/:slug/order/:orderId" element={<CustomerOrderStatusView />} />

// KDS público (só pedidos prontos)
<Route path="/public/:slug/kds" element={<PublicKDS />} />
```

### Componentes Criados

1. **CustomerOrderStatusView.tsx**
   - Status individual do cliente
   - Estados simplificados (sem tempo/atraso)
   - Polling a cada 5s
   - Design limpo e calmo

2. **PublicKDS.tsx**
   - Só pedidos READY
   - Grid de cards verdes
   - Identificação curta
   - Polling a cada 10s

### Integração com QR Mesa

Quando cliente cria pedido via QR Mesa:
1. Pedido é criado com origem `QR_MESA`
2. Cliente é redirecionado para `/public/:slug/order/:orderId`
3. Cliente acompanha status individual
4. Nunca vê KDS interno

---

## 📊 Exemplos de Uso

### Exemplo 1: Cliente via QR Mesa

1. Cliente escaneia QR da mesa
2. Acessa `/public/restaurante-piloto/mesa/5`
3. Cria pedido
4. É redirecionado para `/public/restaurante-piloto/order/abc123`
5. Vê: "🍳 Em preparo - Estamos preparando seu pedido com carinho."
6. Nunca vê tempo, nunca vê atraso

### Exemplo 2: KDS Público (TV)

1. TV mostra `/public/restaurante-piloto/kds`
2. Só mostra pedidos READY
3. Cliente vê: "🔔 Pedido #123 pronto"
4. Cliente vai buscar
5. Nunca mostra em preparo, nunca mostra tempo

---

## ✅ Status da Implementação

- ✅ CustomerOrderStatusView criado
- ✅ PublicKDS criado
- ✅ Rotas adicionadas
- ✅ Estados cliente-friendly implementados
- ✅ Isolamento absoluto garantido
- ✅ Integração com QR Mesa (redirecionamento)

---

## 🚀 Próximos Passos (Opcional)

1. **Notificações push:**
   - Cliente recebe notificação quando pedido fica pronto
   - Sem precisar ficar atualizando página

2. **QR Code no recibo:**
   - TPV/Garçom gera QR code com link para status
   - Cliente escaneia e acompanha

3. **Estado "Quase pronto":**
   - Adicionar estado intermediário `ALMOST_READY`
   - Cliente vê "Quase pronto!" antes de ficar READY

---

**Implementado por:** Auto (Cursor AI)  
**Data:** 2026-01-26  
**Status:** ✅ PRONTO PARA TESTE
