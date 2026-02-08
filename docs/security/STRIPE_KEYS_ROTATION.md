# Rotação de Chaves Stripe — Ação Necessária

**Data:** 2026-01-25
**Status:** ⚠️ AÇÃO REQUERIDA
**Prioridade:** Alta (após testes)

---

## 🚨 Alerta de Segurança

As chaves Stripe (TEST MODE) foram expostas durante desenvolvimento e testes.

**Ação necessária:**

- 🔄 Rotacionar todas as chaves Stripe
- 🚫 Nunca reutilizar essas keys em outro ambiente
- ✅ Manter `.env` fora de qualquer commit (já está no `.gitignore`)

---

## 📋 Chaves a Rotacionar

### Chaves Expostas (TEST MODE)

1. **STRIPE_PUBLISHABLE_KEY**

   - Prefixo: `pk_test_XXXX...` (rotacionada)
   - Ação: Revogar e criar nova

2. **STRIPE_SECRET_KEY**

   - Prefixo: `sk_test_XXXX...` (rotacionada)
   - Ação: Revogar e criar nova

3. **STRIPE_WEBHOOK_SECRET**

   - Prefixo: `whsec_XXXX...` (rotacionada)
   - Ação: Revogar e criar novo

4. **MERCHANT_STRIPE_KEY**

   - Prefixo: `sk_test_XXXX...` (rotacionada)
   - Ação: Revogar e criar nova

5. **MERCHANT_STRIPE_WEBHOOK_SECRET**
   - Prefixo: `whsec_XXXX...` (rotacionada)
   - Ação: Revogar e criar novo

---

## 🔄 Como Rotacionar

### 1. Acessar Dashboard Stripe

1. Ir para: https://dashboard.stripe.com/test/apikeys
2. Fazer login na conta Stripe

### 2. Revogar Chaves Antigas

1. Para cada chave exposta:
   - Clicar em "Reveal test key" (se necessário)
   - Clicar em "Delete" ou "Revoke"
   - Confirmar revogação

### 3. Criar Novas Chaves

1. **Publishable Key:**

   - Dashboard → Developers → API keys
   - Copiar "Publishable key" (test mode)

2. **Secret Key:**

   - Dashboard → Developers → API keys
   - Clicar em "Reveal test key"
   - Copiar "Secret key" (test mode)

3. **Webhook Secret:**
   - Dashboard → Developers → Webhooks
   - Criar novo webhook endpoint (ou usar existente)
   - Copiar "Signing secret"

### 4. Atualizar `.env`

```bash
# Substituir valores antigos por novos
STRIPE_PUBLISHABLE_KEY=pk_test_NOVA_CHAVE_AQUI
STRIPE_SECRET_KEY=sk_test_NOVA_CHAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_NOVO_SECRET_AQUI
MERCHANT_STRIPE_KEY=sk_test_NOVA_CHAVE_AQUI
MERCHANT_STRIPE_WEBHOOK_SECRET=whsec_NOVO_SECRET_AQUI
```

### 5. Verificar que `.env` está no `.gitignore`

```bash
git check-ignore .env
# Deve retornar: .env
```

---

## ✅ Checklist Pós-Rotação

- [ ] Todas as chaves antigas foram revogadas
- [ ] Novas chaves foram criadas
- [ ] `.env` foi atualizado com novas chaves
- [ ] Testes foram executados com novas chaves
- [ ] Nenhuma chave antiga está em uso
- [ ] `.env` está no `.gitignore` (confirmado)

---

## 🛡️ Prevenção Futura

### Boas Práticas

1. **Nunca commitar `.env`:**

   - Sempre verificar `git status` antes de commit
   - Usar `git check-ignore .env` para confirmar

2. **Usar variáveis de ambiente:**

   - Não hardcodar chaves no código
   - Sempre usar `process.env.CHAVE`

3. **Rotacionar regularmente:**

   - Rotacionar chaves de teste a cada 3-6 meses
   - Rotacionar chaves de produção a cada 6-12 meses

4. **Usar secrets management:**
   - Em produção: usar AWS Secrets Manager, HashiCorp Vault, etc.
   - Em desenvolvimento: usar `.env` (nunca commitar)

---

## 📝 Nota Importante

**Isso não invalida nada do Core.**

As chaves são para **TEST MODE** e foram expostas apenas em ambiente local. O Core em si não foi comprometido.

A rotação é uma **medida de higiene operacional** e **best practice**, não uma emergência de segurança.

---

**Ação:** Rotacionar após conclusão dos testes atuais (TESTE D).
