# 🚀 Onboarding - Sistema Nervoso Operacional

**Guia rápido para novos desenvolvedores**

---

## ⚡ Início Rápido (15 minutos)

### 1. Entender o Projeto (5 min)
**Leia primeiro:**
- `docs/RESUMO_EXECUTIVO.md` - Visão geral completa

**Filosofia:**
> "Last.app organiza o restaurante. ChefIApp deve guiá-lo."

### 2. Setup Local (5 min)
```bash
# Clonar e instalar
git clone <repo>
cd chefiapp-pos-core/mobile-app
npm install

# Configurar .env
cp .env.example .env
# Editar com suas credenciais Supabase

# Validar estrutura
../scripts/validate-system.sh
```

### 3. Rodar Localmente (5 min)
```bash
npm start
# Escanear QR code com Expo Go
```

---

## 📚 Documentação Essencial

### Para Começar
1. **[docs/RESUMO_EXECUTIVO.md](docs/RESUMO_EXECUTIVO.md)** - O que foi feito
2. **[docs/ARQUITETURA_VISUAL.md](docs/ARQUITETURA_VISUAL.md)** - Como funciona
3. **[docs/GUIA_RAPIDO_GARCOM.md](docs/GUIA_RAPIDO_GARCOM.md)** - Como usar

### Para Desenvolver
1. **[docs/EXECUCAO_30_DIAS.md](docs/EXECUCAO_30_DIAS.md)** - Implementação detalhada
2. **[docs/SETUP_DEPLOY.md](docs/SETUP_DEPLOY.md)** - Setup e deploy
3. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Debug

### Para Validar
1. **[docs/VALIDACAO_RAPIDA.md](docs/VALIDACAO_RAPIDA.md)** - Checklist de testes

---

## 🏗️ Estrutura do Código

### Componentes Principais
```
mobile-app/
├── components/
│   ├── FastPayButton.tsx          # Pagamento rápido
│   ├── WaitlistBoard.tsx          # Lista de espera
│   └── KitchenPressureIndicator.tsx # Indicador de pressão
├── hooks/
│   └── useKitchenPressure.ts      # Hook de saturação
├── app/(tabs)/
│   ├── tables.tsx                 # Mapa vivo
│   ├── orders.tsx                 # Pedidos + Fast Pay
│   └── index.tsx                  # Menu inteligente
└── services/
    └── persistence.ts             # Persistência local
```

### Fluxo de Dados
```
OrderContext (Global State)
    │
    ├──→ Tables Screen (Mapa Vivo)
    ├──→ Orders Screen (Fast Pay)
    └──→ Menu Screen (KDS Inteligente)
```

---

## 🎯 Funcionalidades Implementadas

### 1. Fast Pay (Semana 1)
**Arquivo:** `components/FastPayButton.tsx`

**Como funciona:**
- Auto-seleciona método de pagamento
- 2 toques para confirmar
- Fecha mesa automaticamente

**Onde usar:**
- `app/(tabs)/tables.tsx` - No mapa de mesas
- `app/(tabs)/orders.tsx` - Na tela de pedidos

### 2. Mapa Vivo (Semana 2)
**Arquivo:** `app/(tabs)/tables.tsx`

**Como funciona:**
- Timer atualiza a cada segundo
- Cores por urgência (verde/amarelo/vermelho)
- Ícones contextuais (quer pagar, esperando bebida)

**Lógica:**
- Timer baseado no último evento do pedido
- Cores: < 15min verde, 15-30min amarelo, > 30min vermelho

### 3. KDS Inteligente (Semana 3)
**Arquivo:** `hooks/useKitchenPressure.ts` + `app/(tabs)/index.tsx`

**Como funciona:**
- Detecta saturação da cozinha
- Esconde pratos lentos quando saturado
- Prioriza bebidas durante picos

**Lógica:**
- Low: < 5 pedidos
- Medium: 5-10 pedidos
- High: > 10 pedidos

### 4. Reservas LITE (Semana 4)
**Arquivo:** `components/WaitlistBoard.tsx`

**Como funciona:**
- Lista de espera digital
- Persistência local (AsyncStorage)
- Conversão automática reserva → mesa

---

## 🔧 Desenvolvimento

### Adicionar Nova Funcionalidade

1. **Criar componente/hook**
```typescript
// mobile-app/components/NovoComponente.tsx
export function NovoComponente() {
  // Implementação
}
```

2. **Integrar onde necessário**
```typescript
// Importar e usar
import { NovoComponente } from '@/components/NovoComponente';
```

3. **Documentar**
- Adicionar em `docs/EXECUCAO_30_DIAS.md`
- Atualizar `CHANGELOG.md`

### Debug

**Ver logs:**
```bash
# Expo logs
expo logs

# React Native logs
npx react-native log-android
npx react-native log-ios
```

**Ver estado:**
```typescript
// Adicionar console.log temporário
console.log('[Debug] Estado atual:', estado);
```

**Ver mais:** `docs/TROUBLESHOOTING.md`

---

## ✅ Checklist de Primeiro Commit

Antes de fazer seu primeiro commit:

- [ ] Código segue padrões do projeto
- [ ] Testes manuais passando
- [ ] Documentação atualizada (se necessário)
- [ ] CHANGELOG.md atualizado
- [ ] Sem erros de lint
- [ ] Validação passando (`./scripts/validate-system.sh`)

---

## 🐛 Problemas Comuns

### "Module not found"
```bash
# Limpar e reinstalar
rm -rf node_modules
npm install
```

### "Expo Go não conecta"
- Verificar se está na mesma rede
- Tentar `expo start --tunnel`

### "Supabase connection error"
- Verificar variáveis de ambiente
- Verificar URL e chave
- Verificar políticas RLS

**Mais problemas:** `docs/TROUBLESHOOTING.md`

---

## 📖 Recursos de Aprendizado

### React Native
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎯 Próximos Passos

1. **Explorar código**
   - Ler componentes principais
   - Entender fluxo de dados
   - Testar funcionalidades

2. **Fazer primeira mudança**
   - Escolher issue pequena
   - Fazer alteração
   - Testar localmente
   - Criar PR

3. **Contribuir**
   - Ver `docs/GITHUB_ISSUES.md` para issues
   - Seguir padrões do projeto
   - Documentar mudanças

---

## 💬 Contato e Suporte

**Dúvidas técnicas:**
- Ver `docs/TROUBLESHOOTING.md`
- Verificar issues no GitHub
- Perguntar no time

**Dúvidas sobre funcionalidades:**
- Ver `docs/GUIA_RAPIDO_GARCOM.md`
- Ver `docs/ARQUITETURA_VISUAL.md`

---

## 🎓 Filosofia do Projeto

### Princípios
1. **Simplicidade > Complexidade**
2. **Decisão > Registro**
3. **Guia > Organização**
4. **Tempo Real > Batch**

### Padrões
- Offline-first
- Componentes isolados
- Hooks reutilizáveis
- Documentação sempre atualizada

---

**Bem-vindo ao projeto! 🚀**

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
