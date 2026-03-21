# Plano 48h — Operação Sem Gateway

**Objectivo:** Colocar restaurante real a usar o sistema e gerar prova de uso, sem gateway em produção.

**Hipótese:** O produto é vendável como "Sistema de gestão operacional" — gestão, operação, tarefas, onboarding, POS com dinheiro.

---

## 1. O que fica activo

| Funcionalidade | Estado |
|----------------|--------|
| Login / Auth | ✅ |
| Onboarding | ✅ |
| Pedidos (criar, KDS, Dashboard) | ✅ |
| Tarefas (criar, atribuir, concluir) | ✅ |
| Leituras operacionais | ✅ |
| POS — pagamento em **dinheiro** | ✅ |
| Relatórios, fecho de caixa | ✅ |

---

## 2. O que fica desactivado (temporariamente)

| Funcionalidade | Motivo |
|----------------|--------|
| Stripe checkout (assinatura SaaS) | Requer gateway |
| PIX | Requer gateway |
| SumUp (TPV) | Requer gateway |
| Cartão (Stripe TPV) | Requer gateway |
| Upload imagens via gateway | Requer gateway |
| Internal events (opcional) | Requer gateway |

---

## 3. Implementação

### 3.1 Flag `isGatewayAvailable`

Em `merchant-portal/src/config.ts`:
- `isGatewayAvailable` = `true` quando `API_BASE` está definido e **não** é placeholder
- Placeholders: `your-gateway-url`, `placeholder`, vazio

### 3.2 PaymentModal

- Quando `!isGatewayAvailable`: mostrar **apenas dinheiro** (igual a `isOnline=false`)
- Métodos PIX, SumUp, Cartão, MB Way ficam ocultos

### 3.3 Billing (Stripe assinatura)

- BillingPage, BillingStep, SubscriptionPage:
  - Quando `!isGatewayAvailable`: ocultar botões "Assinar", "Cambiar plan", "Gerir assinatura"
  - Mostrar mensagem: "Checkout em breve. Por agora, use o sistema em modo operacional."

### 3.4 Produto

- Posicionamento: **Sistema de gestão operacional para restaurantes**
- CTA: "Começar a usar" (onboarding) em vez de "Assinar agora"
- Trial contínuo enquanto checkout não estiver disponível

---

## 4. Critérios de sucesso (48h)

- [ ] Restaurante piloto consegue criar conta e completar onboarding
- [ ] Consegue criar pedidos, enviar para KDS, fechar conta com dinheiro
- [ ] Consegue criar e concluir tarefas
- [ ] Páginas de billing não mostram checkout (apenas mensagem "em breve")
- [ ] TPV mostra apenas dinheiro como método de pagamento
- [ ] Nenhum erro de gateway em consola (fluxos desactivados não são chamados)

---

## 5. Rollback

Para reactivar checkout/PIX quando o gateway estiver disponível:
1. Definir `VITE_API_BASE` com URL real do gateway (ou Edge)
2. Redeploy frontend
3. Nenhuma alteração de código — a flag `isGatewayAvailable` passa a `true` automaticamente
