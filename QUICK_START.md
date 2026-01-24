# ⚡ Quick Start - ChefIApp

**Comece em 5 minutos**

---

## 🚀 Setup Rápido

### 1. Pré-requisitos
```bash
# Node.js 18+
node --version

# npm ou yarn
npm --version

# Expo CLI
npm install -g expo-cli
```

### 2. Clone e Instale
```bash
git clone https://github.com/seu-repo/chefiapp-pos-core.git
cd chefiapp-pos-core/mobile-app
npm install
```

### 3. Configure Variáveis
```bash
# Copiar .env.example
cp .env.example .env

# Editar .env
EXPO_PUBLIC_SUPABASE_URL=sua_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_key
```

### 4. Execute
```bash
# Desenvolvimento
npm start

# iOS
npm run ios

# Android
npm run android
```

---

## ✅ Validação Rápida

### Testar Fast Pay
1. Abrir app
2. Criar pedido
3. Clicar "Cobrar Tudo"
4. Confirmar
5. ✅ Pagamento < 5s

### Testar Mapa Vivo
1. Abrir mesas
2. Verificar timer
3. Verificar cores
4. ✅ Timer atualiza, cores corretas

### Testar KDS
1. Criar 6+ pedidos
2. Verificar banner
3. Verificar menu filtrado
4. ✅ Banner aparece, menu adapta

### Testar Reservas
1. Abrir waitlist
2. Adicionar entrada
3. Fechar app
4. Reabrir
5. ✅ Entrada persiste

---

## 🐛 Problemas Comuns

### App não inicia
```bash
# Limpar cache
npm start -- --clear

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro de conexão Supabase
- Verificar `.env`
- Verificar URL e key
- Verificar internet

### Timer não atualiza
- Verificar `useEffect` cleanup
- Verificar `order.status`

---

## 📚 Próximos Passos

### Para Desenvolvedores
1. **Ler:** `PRIMEIROS_PASSOS.md`
2. **Validar:** `./scripts/validate-system.sh`
3. **Testar:** `docs/VALIDACAO_RAPIDA.md`
4. **Deploy:** `docs/SETUP_DEPLOY.md`

### Para Correções de UX (Status Atual)
1. **Quick Reference:** `docs/audit/HUMAN_TEST_QUICK_REFERENCE.md` (2 min)
2. **Plano de Ação:** `docs/audit/ACTION_PLAN_UX_FIXES.md` (10 min)
3. **Handoff Final:** `docs/audit/FINAL_HANDOFF.md` (5 min)

**Status:** 🟡 **PRONTO COM AJUSTES** - 4 erros críticos de UX precisam ser corrigidos

---

## 🔗 Links Úteis

- **Documentação:** `REFERENCIA_DEFINITIVA.md`
- **FAQ:** `docs/FAQ.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`

---

## 📊 Status Atual do Projeto

### Versão: 2.0.0-RC1 (Release Candidate)

**Técnico:** ✅ **85/100** - Apto para produção  
**Humano:** 🟡 **67/100** - Ajustes necessários

**Decisão:** 🟡 **PRONTO COM AJUSTES**

**Ação Imediata:** Corrigir 4 erros críticos de UX (1-2 dias)

**Documentação Completa:**
- **Índice:** `docs/audit/CHEFIAPP_QA_COMPLETE_INDEX.md`
- **Handoff:** `docs/audit/FINAL_HANDOFF.md`
- **Apresentação:** `docs/audit/EXECUTIVE_PRESENTATION.md`

---

**Versão:** 2.0.0-RC1  
**Última atualização:** 2026-01-24
