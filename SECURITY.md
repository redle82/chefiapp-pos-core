# Security Policy - ChefIApp Core

**Data:** 2026-01-25  
**Escopo:** Ambiente de desenvolvimento e produção

---

## 🛡️ Postura de Segurança

### Princípios Fundamentais

1. **Segurança em Camadas**
   - Perímetro (WAF, TLS, Rate Limiting)
   - Rede (Isolamento Docker, Firewall)
   - Aplicação (RLS, Validação, Secrets)

2. **Fail-Closed**
   - Sem autenticação = sem acesso
   - Secrets ausentes = serviço não inicia
   - Erro desconhecido = bloqueia, não permite

3. **Transparência**
   - CVEs documentadas
   - Riscos conhecidos explicitados
   - Ações de mitigação claras

---

## 🔒 Hardening Crítico

### 1. Secrets Management

**Nunca commitar:**
- `.env` files
- JWT secrets
- Database passwords
- API keys

**Gerar secrets seguros:**
```bash
# SECRET_KEY_BASE (64+ caracteres)
openssl rand -hex 64

# JWT_SECRET (32+ caracteres)
openssl rand -hex 32
```

**Armazenar:**
- Local: `.env.local` (gitignored)
- Produção: Secrets Manager (AWS Secrets Manager, HashiCorp Vault, etc.)

---

### 2. Network Isolation

**Regra de Ouro:**
- ✅ Expor apenas PostgREST/API Gateway
- ❌ Nunca expor GoTrue diretamente
- ❌ Nunca expor Realtime diretamente
- ❌ Nunca expor Postgres diretamente

**Docker Compose:**
```yaml
# ✅ Correto
postgrest:
  ports:
    - "3001:3000"  # Apenas API pública

# ❌ Errado
gotrue:
  ports:
    - "9999:9999"  # NUNCA fazer isso em produção
```

---

### 3. Container Security

**Fixar Versões:**
```yaml
# ✅ Correto
image: supabase/gotrue:v2.143.0
image: supabase/realtime:v2.28.32

# ❌ Errado
image: supabase/gotrue:latest
```

**Atualizar:**
- Acompanhar releases oficiais do Supabase
- Não rebuildar imagens oficiais
- Não fazer `apt upgrade` manual em containers

---

## ⚠️ CVEs em Containers Docker

### Postura Oficial

**CVEs reportadas por Docker Scout são:**
- ✅ Esperadas em imagens base (Alpine, Debian)
- ✅ Muitas são de libs não usadas em runtime
- ✅ Muitas exigem acesso ao container (já isolado)
- ✅ Supabase monitora e atualiza quando há risco real

**Ação:**
- ✅ Fixar versões (não usar `latest`)
- ✅ Monitorar releases oficiais
- ✅ Não tentar "corrigir" manualmente
- ❌ Não rebuildar imagens oficiais

**Risco Real:**
- 🟢 **Local/Staging:** Baixo (rede isolada, sem exposição pública)
- 🟡 **Produção:** Médio (mitigar com WAF, TLS, isolamento)

---

## 🔐 Secrets Obrigatórios

### Docker Core

| Variável | Obrigatória | Gerar Comando |
|----------|-------------|---------------|
| `SECRET_KEY_BASE` | ✅ Sim (Realtime) | `openssl rand -hex 64` |
| `JWT_SECRET` | ✅ Sim | `openssl rand -hex 32` |
| `API_JWT_SECRET` | ✅ Sim | `openssl rand -hex 32` |
| `DB_PASSWORD` | ✅ Sim | `openssl rand -hex 16` |

### Merchant Portal

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ Sim | URL do PostgREST |
| `VITE_SUPABASE_ANON_KEY` | ✅ Sim | JWT secret (mesmo do PostgREST) |

---

## 🚨 Checklist de Segurança

### Antes de Deploy

- [ ] Todos os secrets gerados com `openssl rand`
- [ ] `.env` files no `.gitignore`
- [ ] Versões de containers fixadas (não `latest`)
- [ ] Portas internas não expostas
- [ ] WAF configurado (produção)
- [ ] TLS obrigatório (produção)
- [ ] Rate limiting ativo (produção)

### Monitoramento

- [ ] Logs de autenticação
- [ ] Logs de RPCs críticos
- [ ] Alertas para tentativas de acesso não autorizado
- [ ] Backup automático do banco

---

## 📊 Níveis de Risco

### 🟢 Baixo Risco (Aceitável)

- CVEs em libs não usadas
- CVEs que exigem acesso ao container
- Ambiente local/staging isolado
- Containers não expostos publicamente

### 🟡 Médio Risco (Mitigar)

- CVEs em libs usadas em runtime
- Ambiente de produção sem WAF
- Secrets em variáveis de ambiente (não em secrets manager)

### 🔴 Alto Risco (Corrigir Imediatamente)

- Secrets commitados no git
- Portas internas expostas publicamente
- Containers rodando como root
- Sem TLS em produção

---

## 🔄 Atualização de Segurança

### Quando Atualizar

1. **Supabase lança nova versão** → Atualizar
2. **CVE crítica reportada** → Avaliar urgência
3. **Release mensal** → Revisar e atualizar se necessário

### Como Atualizar

```bash
# 1. Verificar changelog do Supabase
# 2. Atualizar versões no docker-compose
# 3. Testar em staging
# 4. Deploy em produção
```

---

## 📝 Responsabilidades

### Desenvolvedor

- ✅ Gerar secrets seguros
- ✅ Não commitar `.env`
- ✅ Fixar versões de containers
- ✅ Reportar CVEs críticas

### DevOps/SRE

- ✅ Configurar WAF
- ✅ Configurar TLS
- ✅ Configurar Secrets Manager
- ✅ Monitorar logs de segurança

---

## 🆘 Reportar Vulnerabilidade

Se encontrar uma vulnerabilidade crítica:

1. **NÃO** abra issue pública
2. **NÃO** commite correção sem revisão
3. **SIM** reporte diretamente ao time
4. **SIM** documente após correção

---

*"Segurança não é feature. É fundação."*
