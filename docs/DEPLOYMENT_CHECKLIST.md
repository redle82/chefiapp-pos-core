> **DEPRECATED** -- This document is outdated. See [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) for the current canonical release checklist.

# Deployment Checklist - ChefIApp

**Checklist completo para deploy em producao**

---

## 📋 Pré-Deploy

### Código
- [ ] Todos os testes passando (`npm test`)
- [ ] Coverage > 70%
- [ ] Sem console.logs desnecessários
- [ ] Sem código comentado
- [ ] Linter sem erros
- [ ] TypeScript sem erros
- [ ] Build local funcionando

### Configuração
- [ ] Variáveis de ambiente configuradas
- [ ] `.env` não commitado
- [ ] Secrets em variáveis seguras
- [ ] URLs de produção corretas
- [ ] Keys de API válidas

### Banco de Dados
- [ ] Migrations executadas
- [ ] RLS policies configuradas
- [ ] Backup criado
- [ ] Índices criados
- [ ] Constraints verificadas

### Segurança
- [ ] Inputs validados
- [ ] Outputs sanitizados
- [ ] Secrets não expostos
- [ ] HTTPS configurado
- [ ] Rate limiting ativo
- [ ] Auditoria habilitada

---

## 🏗️ Build

### iOS
```bash
# Build para produção
eas build --platform ios --profile production

# Verificar
- [ ] Build bem-sucedido
- [ ] Tamanho do app OK
- [ ] Certificados válidos
- [ ] Provisioning profiles OK
```

### Android
```bash
# Build para produção
eas build --platform android --profile production

# Verificar
- [ ] Build bem-sucedido
- [ ] Tamanho do app OK
- [ ] Keystore válido
- [ ] Assinatura OK
```

---

## 🧪 Testes de Deploy

### Testes Funcionais
- [ ] Fast Pay funciona
- [ ] Mapa Vivo funciona
- [ ] KDS funciona
- [ ] Reservas funcionam
- [ ] Offline funciona
- [ ] Sincronização funciona

### Testes de Performance
- [ ] Tempo de pagamento < 5s
- [ ] Renderização < 2s
- [ ] Scroll fluido (60 FPS)
- [ ] Uso de memória < 150MB
- [ ] Bateria OK

### Testes de Segurança
- [ ] Autenticação funciona
- [ ] Autorização correta
- [ ] Dados sensíveis protegidos
- [ ] Logs não expõem secrets
- [ ] Erros tratados

---

## 📱 App Stores

### iOS (App Store)
- [ ] Screenshots preparados
- [ ] Descrição escrita
- [ ] Keywords definidos
- [ ] Privacy policy link
- [ ] Version number correto
- [ ] Build number incrementado
- [ ] Release notes escritas
- [ ] Submetido para review

### Android (Google Play)
- [ ] Screenshots preparados
- [ ] Descrição escrita
- [ ] Keywords definidos
- [ ] Privacy policy link
- [ ] Version code incrementado
- [ ] Release notes escritas
- [ ] Submetido para review

---

## 🔍 Monitoramento

### Setup
- [ ] Analytics configurado
- [ ] Crash reporting ativo
- [ ] Performance monitoring ativo
- [ ] Error tracking ativo
- [ ] Logs centralizados

### Alertas
- [ ] Alertas de crash configurados
- [ ] Alertas de performance configurados
- [ ] Alertas de erro configurados
- [ ] Alertas de disponibilidade configurados

---

## 📊 Pós-Deploy

### Validação
- [ ] App instalado em dispositivos de teste
- [ ] Funcionalidades testadas
- [ ] Performance verificada
- [ ] Sem crashes
- [ ] Logs sendo coletados

### Comunicação
- [ ] Release notes publicadas
- [ ] Equipe notificada
- [ ] Usuários notificados (se necessário)
- [ ] Changelog atualizado

### Monitoramento
- [ ] Dashboard configurado
- [ ] Métricas sendo coletadas
- [ ] Alertas funcionando
- [ ] Logs sendo analisados

---

## 🔙 Rollback Plan

### Preparação
- [ ] Backup do banco criado
- [ ] Tag de rollback criada
- [ ] Build anterior disponível
- [ ] Plano documentado

### Execução (se necessário)
- [ ] Identificar problema
- [ ] Decidir rollback
- [ ] Executar rollback
- [ ] Validar funcionamento
- [ ] Comunicar equipe

---

## 📝 Documentação

### Atualizações
- [ ] Changelog atualizado
- [ ] Release notes publicadas
- [ ] Migration guide atualizado (se necessário)
- [ ] API reference atualizada (se necessário)

---

## ✅ Checklist Final

### Antes de Deploy
- [ ] Todos os itens acima verificados
- [ ] Aprovação do time
- [ ] Janela de deploy agendada
- [ ] Equipe de suporte avisada

### Durante Deploy
- [ ] Deploy executado
- [ ] Builds verificados
- [ ] Testes rápidos executados

### Após Deploy
- [ ] Validação completa
- [ ] Monitoramento ativo
- [ ] Equipe notificada
- [ ] Documentação atualizada

---

## 🚨 Emergência

### Em Caso de Problemas
1. **Identificar:** Qual problema?
2. **Isolar:** Afeta todos ou alguns?
3. **Decidir:** Rollback ou hotfix?
4. **Executar:** Ação imediata
5. **Comunicar:** Avisar equipe/usuários
6. **Documentar:** Registrar incidente

### Contatos
- **DevOps:** devops@chefiapp.com
- **Suporte:** support@chefiapp.com
- **Emergência:** +55 XX XXXX-XXXX

---

## 📚 Recursos

- **Setup Deploy:** `docs/SETUP_DEPLOY.md`
- **Go-Live:** `docs/GO_LIVE_CHECKLIST.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
