# 📡 UPTIME MONITORING — GUIA DE CONFIGURAÇÃO

**Data:** 2026-01-10  
**Objetivo:** Configurar monitoring de uptime para o sistema  
**Tempo Estimado:** 30 minutos

---

## 🎯 OBJETIVO

Monitorar a disponibilidade do sistema 24/7 e receber alertas quando o sistema estiver down.

---

## 📋 PRÉ-REQUISITOS

- ✅ Sistema deployado (Vercel, produção, ou staging)
- ✅ Endpoint `/health` funcional
- ✅ Email para receber alertas (ou Discord webhook)

---

## 🚀 PASSO A PASSO

### 1. Criar Conta no UptimeRobot (5 min)

1. Acesse: https://uptimerobot.com
2. Clique em **"Sign Up"** (canto superior direito)
3. Preencha:
   - Email
   - Senha
   - Nome
4. Confirme email (verifique sua caixa de entrada)

---

### 2. Adicionar Monitor (10 min)

1. Após login, clique em **"Add New Monitor"**
2. Configure:

   **Monitor Type:** `HTTP(s)`
   
   **Friendly Name:** `ChefIApp POS - Health Check`
   
   **URL (or IP):** 
   ```
   https://seu-dominio.com/health
   ```
   > **Nota:** Substitua `seu-dominio.com` pelo domínio real do sistema
   
   **Monitoring Interval:** `5 minutes` (recomendado)
   
   **Alert Contacts:** 
   - Selecione seu email
   - (Opcional) Adicione Discord webhook se configurado

3. Clique em **"Create Monitor"**

---

### 3. Configurar Alertas (10 min)

#### 3.1. Alertas por Email (Padrão)
- ✅ Já configurado automaticamente
- Você receberá email quando:
  - Sistema ficar down
  - Sistema voltar a funcionar

#### 3.2. Alertas por Discord (Opcional)

1. No Discord, vá para **Server Settings** → **Integrations** → **Webhooks**
2. Clique em **"New Webhook"**
3. Configure:
   - **Name:** `ChefIApp Uptime Alerts`
   - **Channel:** Escolha um canal (ex: `#alerts` ou `#devops`)
4. Copie a **Webhook URL**

5. No UptimeRobot:
   - Vá em **My Settings** → **Alert Contacts**
   - Clique em **"Add Alert Contact"**
   - Selecione **"Webhook"**
   - Cole a URL do Discord
   - Salve

6. Edite o monitor criado:
   - Adicione o contato Discord aos alertas

---

### 4. Testar Monitor (5 min)

#### 4.1. Verificar Status Inicial
1. No dashboard do UptimeRobot, verifique:
   - ✅ Monitor aparece como **"Up"** (verde)
   - ✅ Última verificação mostra timestamp recente

#### 4.2. Testar Alerta (Opcional)
> **⚠️ ATENÇÃO:** Isso vai derrubar o sistema temporariamente!

1. **Método 1 - Desligar Servidor Temporariamente:**
   - Se estiver rodando localmente, pare o servidor
   - Aguarde 5-10 minutos
   - Verifique se recebeu alerta de "Down"
   - Reinicie o servidor
   - Aguarde 5-10 minutos
   - Verifique se recebeu alerta de "Up"

2. **Método 2 - Simular Falha no Health Check:**
   - Modifique temporariamente o endpoint `/health` para retornar erro
   - Aguarde alerta
   - Reverta a mudança

---

## 📊 DASHBOARD E MÉTRICAS

### O Que Você Verá no UptimeRobot

- **Uptime %:** Percentual de tempo que o sistema esteve online
- **Response Time:** Tempo médio de resposta do endpoint
- **Status History:** Histórico de up/down
- **Logs:** Registro de todas as verificações

### Métricas Esperadas

- **Uptime Target:** 99%+ (para beta público)
- **Response Time:** < 500ms (p95)
- **Alertas:** < 1 minuto após falha

---

## 🔧 CONFIGURAÇÃO AVANÇADA (Opcional)

### Monitor Adicional: API Endpoint
Crie um segundo monitor para o endpoint principal da API:
- **URL:** `https://seu-dominio.com/api/health` (se existir)
- **Interval:** 5 minutos
- **Alertas:** Mesmos contatos

### Monitor Adicional: Frontend
Crie um terceiro monitor para a página principal:
- **URL:** `https://seu-dominio.com`
- **Interval:** 5 minutos
- **Alertas:** Mesmos contatos

---

## 📋 CHECKLIST

### Configuração Básica:
- [ ] Conta criada no UptimeRobot
- [ ] Monitor criado para `/health`
- [ ] Status inicial verificado (Up)
- [ ] Alertas por email configurados

### Configuração Avançada (Opcional):
- [ ] Alertas por Discord configurados
- [ ] Teste de alerta realizado
- [ ] Monitor adicional para API criado
- [ ] Monitor adicional para frontend criado

---

## 🚨 TROUBLESHOOTING

### Problema: Monitor sempre mostra "Down"
**Soluções:**
1. Verifique se o endpoint `/health` está acessível publicamente
2. Verifique se o servidor está rodando
3. Verifique se há firewall bloqueando requisições do UptimeRobot
4. Teste a URL manualmente no navegador

### Problema: Não recebo alertas
**Soluções:**
1. Verifique spam/lixo eletrônico
2. Verifique se o email está correto no UptimeRobot
3. Verifique configurações de alerta no monitor
4. Teste enviando alerta manual (UptimeRobot → Monitor → "Send Test Alert")

### Problema: Alertas muito frequentes
**Soluções:**
1. Aumente o intervalo de monitoramento (ex: 10 minutos)
2. Configure "Alert When Down X Times" (ex: 2 vezes consecutivas)
3. Verifique se o sistema está realmente instável ou se é problema de rede

---

## 📊 MÉTRICAS DE SUCESSO

### Esta Semana:
- ✅ Monitor configurado e funcionando
- ✅ Alertas testados e funcionando
- ✅ Uptime > 99% (se sistema estável)

### Próximas 2 Semanas:
- ✅ Uptime mantido > 99%
- ✅ Response time < 500ms (p95)
- ✅ Zero falsos positivos

---

## 🔗 LINKS ÚTEIS

- **UptimeRobot:** https://uptimerobot.com
- **Documentação:** https://uptimerobot.com/api/
- **Discord Webhooks:** https://discord.com/developers/docs/resources/webhook

---

## 📝 NOTAS

### Limites do Plano Gratuito
- **50 monitors** (suficiente para começar)
- **5 minutos** de intervalo mínimo
- **Alertas ilimitados**

### Upgrade (Opcional)
Se precisar de mais recursos:
- **Pro:** $7/mês - 1 minuto de intervalo, mais monitors
- **Business:** $16/mês - 30 segundos de intervalo, API access

---

**Última atualização:** 2026-01-10  
**Status:** ⏳ **PENDENTE** — Aguardando configuração manual  
**Próxima ação:** Criar conta e configurar primeiro monitor
