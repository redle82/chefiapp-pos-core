# 🔐 DOCUMENTOS MAIS SENSÍVEIS - CHEFIAPP POS CORE

**Data:** 2026-01-24  
**Status:** ⚠️ **ATENÇÃO - INFORMAÇÕES SENSÍVEIS**

---

## 🚨 DOCUMENTOS CRÍTICOS (NUNCA COMMITAR)

### 1. **Credenciais e Chaves**

#### `testsprite_tests/TEST_CREDENTIALS.md`
- **Sensibilidade:** 🔴 **ALTA**
- **Conteúdo:**
  - Email: `contact@goldmonkey.studio`
  - Password: `password123`
- **Ação:** ✅ Apenas para desenvolvimento, mas não deve estar em repositório público
- **Recomendação:** Mover para `.env` ou variáveis de ambiente

#### `key-check.txt`
- **Sensibilidade:** 🔴 **ALTA**
- **Conteúdo:** Parece conter parte de uma chave (`KEY ends: 00Uq5STAfU`)
- **Ação:** ⚠️ **DELETAR ou mover para `.gitignore`**
- **Recomendação:** Não commitar chaves parciais

---

## 🔒 DOCUMENTOS COM REFERÊNCIAS A SECRETOS

### 2. **Código com Lógica de Criptografia**

#### `server/middleware/security.ts`
- **Sensibilidade:** 🟡 **MÉDIA-ALTA**
- **Conteúdo:**
  - Função `getEncryptionKeyOrThrow()` - lógica de derivação de chave
  - Funções `encryptOAuthToken()` / `decryptOAuthToken()`
  - Fallback para desenvolvimento (`dev-insecure-key`)
- **Risco:** Exposição da lógica de criptografia e fallbacks inseguros
- **Recomendação:** ✅ Código OK, mas garantir que `CREDENTIALS_ENCRYPTION_KEY` nunca seja commitado

#### `server/web-module-api-server.ts`
- **Sensibilidade:** 🟡 **MÉDIA-ALTA**
- **Conteúdo:**
  - Referências a variáveis de ambiente:
    - `STRIPE_SECRET_KEY`
    - `MERCHANT_STRIPE_KEY`
    - `MERCHANT_STRIPE_WEBHOOK_SECRET`
    - `INTERNAL_API_TOKEN`
    - `CREDENTIALS_ENCRYPTION_KEY`
    - `DATABASE_URL`
- **Risco:** Código expõe quais variáveis são necessárias
- **Recomendação:** ✅ OK (código), mas garantir que `.env` esteja no `.gitignore`

---

## 📋 DOCUMENTOS COM INFORMAÇÕES DE ARQUITETURA SENSÍVEL

### 3. **Documentação de Segurança**

#### `docs/audit/FINANCIAL_AUDIT.md`
- **Sensibilidade:** 🟡 **MÉDIA**
- **Conteúdo:**
  - Detalhes sobre criptografia AES-256-GCM
  - Formato de armazenamento de credenciais
  - Lógica de derivação de chaves
- **Risco:** Exposição de detalhes de implementação de segurança
- **Recomendação:** ✅ OK para documentação interna, mas não publicar publicamente

#### `FISCAL_DEFENSE_PROTOCOL.md`
- **Sensibilidade:** 🟡 **MÉDIA**
- **Conteúdo:** Protocolos de defesa fiscal e validações
- **Risco:** Exposição de lógica de negócio sensível
- **Recomendação:** ✅ OK para documentação interna

---

## 🔍 ARQUIVOS QUE DEVEM ESTAR NO `.gitignore`

### 4. **Arquivos de Configuração**

```
# Variáveis de ambiente
.env
.env.local
.env.production
.env.development

# Chaves e credenciais
key-check.txt
*.key
*.pem
*.p12

# Logs com informações sensíveis
*.log
server.log
billing-server.log

# Arquivos de teste com credenciais
testsprite_tests/TEST_CREDENTIALS.md
```

---

## ✅ CHECKLIST DE SEGURANÇA

### Variáveis de Ambiente Críticas (NUNCA COMMITAR)

- [ ] `CREDENTIALS_ENCRYPTION_KEY` - Chave de 32 bytes (hex ou base64)
- [ ] `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- [ ] `MERCHANT_STRIPE_KEY` - Chave do merchant Stripe
- [ ] `MERCHANT_STRIPE_WEBHOOK_SECRET` - Secret do webhook Stripe
- [ ] `INTERNAL_API_TOKEN` - Token interno da API
- [ ] `DATABASE_URL` - URL completa do banco de dados
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` - Chave anônima (pode ser pública)
- [ ] `VITE_STRIPE_PUBLIC_KEY` - Chave pública (pode ser pública)

### Arquivos que DEVEM estar no `.gitignore`

- [ ] `.env*` (todos os arquivos .env)
- [ ] `key-check.txt`
- [ ] `testsprite_tests/TEST_CREDENTIALS.md`
- [ ] `*.log` (logs podem conter informações sensíveis)
- [ ] `*.key`, `*.pem`, `*.p12` (certificados)

---

## 🛡️ RECOMENDAÇÕES DE SEGURANÇA

### 1. **Mover Credenciais para Variáveis de Ambiente**
```bash
# Criar .env.example com placeholders
CREDENTIALS_ENCRYPTION_KEY=your-32-byte-key-here
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

### 2. **Verificar `.gitignore`**
```bash
# Garantir que está ignorando:
.env
.env.local
.env.*.local
key-check.txt
*.log
```

### 3. **Auditar Histórico do Git**
```bash
# Verificar se credenciais foram commitadas no passado
git log --all --full-history --source -- "**/.env"
git log --all --full-history --source -- "**/TEST_CREDENTIALS.md"
```

### 4. **Rotacionar Chaves se Necessário**
Se alguma chave foi exposta:
- Rotacionar `CREDENTIALS_ENCRYPTION_KEY`
- Re-criptografar todos os tokens OAuth no banco
- Rotacionar chaves do Stripe
- Atualizar `DATABASE_URL` se necessário

---

## 📊 RESUMO POR NÍVEL DE SENSIBILIDADE

| Documento | Sensibilidade | Ação Necessária |
|-----------|---------------|-----------------|
| `testsprite_tests/TEST_CREDENTIALS.md` | 🔴 **ALTA** | Mover para `.env` ou deletar |
| `key-check.txt` | 🔴 **ALTA** | Deletar ou mover para `.gitignore` |
| `server/middleware/security.ts` | 🟡 **MÉDIA** | OK (código), garantir `.env` ignorado |
| `server/web-module-api-server.ts` | 🟡 **MÉDIA** | OK (código), garantir `.env` ignorado |
| `docs/audit/FINANCIAL_AUDIT.md` | 🟡 **MÉDIA** | OK para documentação interna |
| `FISCAL_DEFENSE_PROTOCOL.md` | 🟡 **MÉDIA** | OK para documentação interna |

---

## 🎯 AÇÕES IMEDIATAS

1. ✅ **Verificar `.gitignore`** - Garantir que `.env*` e `key-check.txt` estão ignorados
2. ⚠️ **Auditar histórico Git** - Verificar se credenciais foram commitadas
3. 🔄 **Mover credenciais** - `TEST_CREDENTIALS.md` → variáveis de ambiente
4. 🗑️ **Deletar `key-check.txt`** - Não deve estar no repositório
5. 🔐 **Rotacionar chaves** - Se alguma foi exposta no histórico

---

**Última Atualização:** 2026-01-24  
**Próxima Revisão:** Após cada commit que adiciona novos arquivos
