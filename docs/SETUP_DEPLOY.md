# 🚀 Setup e Deploy - Sistema Nervoso Operacional

**Guia completo de instalação e deploy**

---

## 📋 Pré-requisitos

### Desenvolvimento
- Node.js 18+ e npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- React Native environment configurado
- Supabase account e projeto

### Produção
- Conta Expo (para EAS Build)
- Supabase project em produção
- Certificados iOS/Android (para builds nativos)

---

## 🔧 Setup Inicial

### 1. Clonar Repositório
```bash
git clone <repository-url>
cd chefiapp-pos-core
```

### 2. Instalar Dependências
```bash
cd mobile-app
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente
Criar arquivo `.env` em `mobile-app/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Validar Estrutura
```bash
# Executar script de validação
chmod +x scripts/validate-system.sh
./scripts/validate-system.sh
```

---

## 🧪 Desenvolvimento

### Rodar em Desenvolvimento
```bash
cd mobile-app
npm start
# ou
expo start
```

### Rodar em Dispositivo
```bash
# iOS
expo start --ios

# Android
expo start --android
```

### Testes Manuais
Seguir checklist em `docs/VALIDACAO_RAPIDA.md`

---

## 🏗️ Build

### Build de Desenvolvimento
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build Android
eas build --platform android --profile development

# Build iOS
eas build --platform ios --profile development
```

### Build de Produção
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

---

## 📦 Deploy

### Expo Go (Desenvolvimento)
```bash
# Publicar para Expo Go
expo publish
```

### EAS Update (OTA Updates)
```bash
# Publicar atualização OTA
eas update --branch production --message "Sistema Nervoso Operacional v1.0"
```

### App Stores

#### Android (Google Play)
1. Build de produção
2. Upload para Google Play Console
3. Preencher informações da loja
4. Submeter para revisão

#### iOS (App Store)
1. Build de produção
2. Upload via Xcode ou Transporter
3. Preencher informações no App Store Connect
4. Submeter para revisão

---

## 🔐 Configuração de Segurança

### Supabase RLS (Row Level Security)
Garantir que políticas RLS estão configuradas:
```sql
-- Exemplo: Pedidos só acessíveis pelo restaurante
CREATE POLICY "Restaurant orders only"
ON gm_orders
FOR ALL
USING (restaurant_id = auth.jwt() ->> 'restaurant_id');
```

### Variáveis Sensíveis
- Nunca commitar `.env` no git
- Usar variáveis de ambiente do EAS
- Rotacionar chaves regularmente

---

## 📊 Monitoramento

### Logs
```bash
# Ver logs do Expo
expo logs

# Ver logs do EAS
eas build:list
```

### Analytics
- Configurar Sentry (opcional)
- Configurar Firebase Analytics (opcional)
- Usar logs do Supabase

---

## 🔄 Atualizações

### Atualizar Dependências
```bash
cd mobile-app
npm update
# ou
yarn upgrade
```

### Atualizar Expo SDK
```bash
expo upgrade
```

### Migrações de Banco
```bash
# Executar migrações do Supabase
supabase migration up
```

---

## 🐛 Troubleshooting

### Problemas Comuns

#### Build Falha
```bash
# Limpar cache
expo start -c

# Limpar node_modules
rm -rf node_modules
npm install
```

#### Erro de Conexão Supabase
- Verificar variáveis de ambiente
- Verificar URL e chave
- Verificar políticas RLS

#### App Não Inicia
- Verificar logs: `expo logs`
- Verificar versão do Expo SDK
- Verificar dependências nativas

Ver mais em `docs/TROUBLESHOOTING.md`

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Todas as validações passando
- [ ] Testes manuais completos
- [ ] Variáveis de ambiente configuradas
- [ ] Build de produção testado
- [ ] Documentação atualizada

### Deploy
- [ ] Build de produção criado
- [ ] Upload para lojas (se aplicável)
- [ ] OTA update publicado (se aplicável)
- [ ] Monitoramento configurado

### Pós-Deploy
- [ ] Verificar logs
- [ ] Monitorar métricas
- [ ] Coletar feedback
- [ ] Documentar issues

---

## 📚 Documentação Relacionada

- **Validação:** `docs/VALIDACAO_RAPIDA.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Arquitetura:** `docs/ARQUITETURA_VISUAL.md`
- **Execução:** `docs/EXECUCAO_30_DIAS.md`

---

## 🔗 Links Úteis

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/)

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
