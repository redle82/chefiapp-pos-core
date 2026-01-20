# 🧪 Roteiro de Validação (QA) - Hardening P0

**Este documento serve como checklist para validar se o Release v0.9.2 está estável.**

---

## 🏗️ 1. Sanidade Básica (Smoke Test)

- [ ] **Login:** Consigo fazer login normalmente (auth flow não quebrado por RLS).
- [ ] **Dashboard:** Consigo ver o dashboard do dono sem erros 403/RLS.
- [ ] **TPV Carregamento:** O POS carrega e mostra mesas/produtos.

## 📡 2. Offline Core (A Mais Importante)

> **Cenário:** Simular queda de internet durante operação.

- [ ] **Desconectar Internet:** Desligue o Wifi/Cabo.
- [ ] **Identificador Visual:** O badge "Offline" aparece no canto superior?
- [ ] **Criar Pedido:** Crie um pedido no POS.
    - [ ] Ele salva localmente? (Verificar na UI, não deve dar erro).
    - [ ] Ele aparece na lista de "Pedidos Pendentes"?
- [ ] **Reconectar Internet:** Ligue o Wifi.
- [ ] **Sincronização:**
    - [ ] O pedido é enviado automaticamente?
    - [ ] **Idempotência:** O pedido NÃO foi duplicado no banco? (Verificar `gm_orders`).
    - [ ] O status muda para "Sincronizado"?

## 🧾 3. Fiscal (InvoiceXpress)

> **Cenário:** Fechamento de conta com emissão de fatura.

- [ ] **Configuração:** Inserir API Key válida em `gm_restaurants.fiscal_config`.
- [ ] **Checkout:** Fechar uma conta no POS.
- [ ] **Pagamento:** Selecionar "Dinheiro" ou "Cartão" e finalizar.
- [ ] **Emissão Automática:**
    - [ ] O sistema tenta emitir a fatura?
    - [ ] Se falhar (ex: API key errada), o erro aparece mas **NÃO BLOQUEIA** o uso do sistema?
    - [ ] Se sucesso, o PDF é gerado/linkado?

## 🛵 4. Delivery (Glovo/Uber)

- [ ] **Simulação de Webhook:** Enviar POST simulado para o endpoint do webhook.
- [ ] **Notificação:**
    - [ ] Toca som de alerta?
    - [ ] Aparece o card no canto da tela?
- [ ] **Ação:**
    - [ ] Botão Aceitar funciona? (Cria pedido no POS).
    - [ ] Botão Rejeitar funciona? (Remove notificação).

---

## 📝 Resultado da Validação

**Data:** ____/____/2026
**Responsável:** ___________________

| Teste | Status | Notas |
| :--- | :---: | :--- |
| Sanidade | ⚪️ | |
| Offline | ⚪️ | |
| Fiscal | ⚪️ | |
| Delivery | ⚪️ | |

Legenda: ✅ Passou | ❌ Falhou | ⚪️ Pendente
