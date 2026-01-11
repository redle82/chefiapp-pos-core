# 🔥 ROADMAP VENCEDOR (NÃO "BONITO")

**Data:** 11 Janeiro 2026
**Objetivo Real:** Ser claramente melhor para restaurantes independentes caóticos
**Princípio Operacional:** ChefIApp não compete por feature count. Compete por confiabilidade no caos.

> "A partir de agora, toda feature precisa responder a uma única pergunta: **'Isso evita que o restaurante pare num dia ruim?'** Se a resposta não for SIM, a feature não entra."

---

## 🟢 FASE 1 — "NÃO QUEBRA" (0–6 semanas)
**Objetivo:** Ser o POS que não falha quando tudo falha.

### 1️⃣ Offline Mode (Prioridade Máxima)
*O restaurante nunca para, mesmo sem internet.*
- [ ] Criar pedido offline (IndexedDB)
- [ ] Adicionar itens offline
- [ ] Fechar pedido offline
- [ ] Sincronização automática quando voltar online
- ❌ **Fora de escopo:** Edição complexa, merge inteligente, UI bonita.

### 2️⃣ Integração de Delivery Única (A que dói mais)
*Uma benfeita vale mais que três medíocres.*
- [ ] Integração Glovo (Foco inicial)
- [ ] Recebimento de pedidos direto no POS
- [ ] Impressão automática na cozinha
- ❌ **Fora de escopo:** Uber Eats, Deliveroo (por enquanto).

### 3️⃣ Fiscal Mínimo Legal
*Evitar multa ≠ Encantar auditor.*
- [ ] SAF-T válido (Estrutura XML)
- [ ] Emissão de fatura básica
- [ ] Impressão de comprovante fiscal
- ❌ **Fora de escopo:** Dashboard fiscal, relatórios avançados.

---

## 🟡 FASE 2 — "PENSA COMIGO" (2–4 meses)
**Objetivo:** O sistema reduz a "burrice operacional".

### 4️⃣ AppStaff (Simples e Visível)
- [ ] Alertas automáticos (ex: "Mesa 4 sem pedido há 20min")
- [ ] Sugestões contextuais
- [ ] Menos cliques para ações comuns

### 5️⃣ Analytics Mínimio
- [ ] Faturação diária
- [ ] Produtos top vendidos
- [ ] Horários de pico
- ❌ **Fora de escopo:** Gráficos complexos. "O dono quer decidir amanhã, não ler gráfico bonito."

---

## 🔵 FASE 3 — "ESCALA OU VENDA" (Decisão Estratégica)
*Só inicia se houver clientes reais e receita.*

- [ ] Mobile App Nativo
- [ ] Multi-location
- [ ] CRM / Loyalty
- [ ] Uber Eats / Deliveroo

---

## ❌ O QUE NÃO FAREMOS AGORA (Armadilhas de Roadmap)
- **Feature Parity com Last.app:** É suicídio tentar copiar quem tem 10x mais recursos.
- **Mobile App Nativo (Agora):** Web App bem feito resolve.
- **Micro-otimizações visuais:** Se funciona e não é feio, está pronto.

---

## 💡 CRITÉRIO DE SUCESSO DA FASE 1
**Cenário de Teste:**
1. Desligar o roteador do restaurante.
2. Criar pedidos, imprimir na cozinha, fechar contas.
3. Religar o roteador.
4. Tudo sincroniza sem intervenção humana.

**Resultado:** "Você pode vender sem medo."
