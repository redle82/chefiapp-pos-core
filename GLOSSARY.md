# 📖 Glossary - ChefIApp

**Glossário de termos técnicos e de negócio**

---

## 🎯 Termos de Negócio

### Fast Pay
Sistema de pagamento em 2 toques que permite cobrar um pedido completo com confirmação única, auto-selecionando o método de pagamento mais usado.

### Mapa Vivo
Mapa de mesas que exibe contexto temporal em tempo real, incluindo timers, cores de urgência e ícones contextuais.

### KDS (Kitchen Display System)
Sistema de exibição da cozinha que emite sinais de pressão e influencia o menu do TPV, escondendo pratos lentos quando a cozinha está saturada.

### Reservas LITE
Sistema simples de lista de espera digital, sem overengineering, permitindo adicionar, atribuir mesa e cancelar entradas.

### Sistema Nervoso Operacional
Filosofia arquitetural do ChefIApp: sistema que guia operações em tempo real, não apenas registra vendas. Mapa + KDS + Tempo como centro, vendas como consequência.

---

## 🔧 Termos Técnicos

### Component
Componente React reutilizável que encapsula UI e lógica.

**Exemplos:**
- `FastPayButton`
- `KitchenPressureIndicator`
- `WaitlistBoard`

### Hook
Função React que permite usar estado e outras funcionalidades sem classes.

**Exemplos:**
- `useKitchenPressure()`
- `useOrder()`
- `useAppStaff()`

### Context
API do React para compartilhar estado global entre componentes.

**Exemplos:**
- `OrderContext`
- `AppStaffContext`

### Service
Classe ou módulo que encapsula lógica de negócio e integrações.

**Exemplos:**
- `PersistenceService`
- `InventoryService`
- `PrinterService`

### RPC (Remote Procedure Call)
Chamada de função remota no Supabase, executada no servidor.

**Exemplos:**
- `process_order_payment`
- `earn_loyalty_points`

### RLS (Row Level Security)
Segurança em nível de linha do Supabase, controlando acesso a dados por usuário/role.

### Offline-First
Arquitetura que funciona offline e sincroniza quando online.

### Optimistic Update
Atualização imediata da UI antes da confirmação do servidor.

### Idempotency
Propriedade de operação que pode ser executada múltiplas vezes sem efeitos colaterais.

### Memoization
Técnica de cache de resultados de cálculos para evitar recálculos.

### Debounce
Técnica de atrasar execução até que ações parem por um período.

### Throttle
Técnica de limitar execução a uma frequência máxima.

---

## 📊 Métricas e KPIs

### Tempo de Pagamento
Tempo entre toque no botão "Cobrar Tudo" e confirmação do pagamento. Meta: < 5s.

### Pressão da Cozinha
Nível de saturação da cozinha baseado em pedidos em preparação:
- **Low:** < 5 pedidos
- **Medium:** 5-10 pedidos
- **High:** > 10 pedidos

### Urgência de Mesa
Nível de urgência baseado em tempo desde último evento:
- **Verde:** < 15 minutos
- **Amarelo:** 15-30 minutos
- **Vermelho:** > 30 minutos

### Taxa de Conversão
Percentual de reservas que se convertem em mesas ocupadas. Meta: > 85%.

### Table Turnover
Número de vezes que uma mesa é ocupada em um período.

---

## 🎨 UI/UX

### Bottom Sheet
Componente que desliza de baixo para cima, usado para detalhes e ações.

### Modal
Componente que sobrepõe a tela para ações importantes.

### Haptic Feedback
Feedback tátil (vibração) para confirmar ações do usuário.

### Loading State
Estado visual indicando que uma operação está em andamento.

### Error State
Estado visual indicando que uma operação falhou.

### Empty State
Estado visual quando não há dados para exibir.

---

## 🔐 Segurança

### Authentication
Processo de verificar identidade do usuário.

### Authorization
Processo de verificar permissões do usuário.

### RLS Policy
Regra de segurança do Supabase que controla acesso a dados.

### Sanitization
Processo de limpar inputs para prevenir XSS e outros ataques.

### Validation
Processo de verificar que dados estão no formato esperado.

---

## 🚀 Deploy e DevOps

### Build
Processo de compilar código para produção.

### Release
Versão do software publicada para usuários.

### Rollback
Processo de reverter para versão anterior.

### Feature Flag
Configuração que habilita/desabilita features sem deploy.

### CI/CD
Continuous Integration / Continuous Deployment.

### Staging
Ambiente de teste que replica produção.

---

## 📱 Mobile

### Expo
Framework para desenvolvimento React Native.

### React Native
Framework para desenvolvimento mobile multiplataforma.

### AsyncStorage
Armazenamento local assíncrono no React Native.

### SecureStore
Armazenamento seguro para dados sensíveis.

---

## 🌐 Backend

### Supabase
Backend-as-a-Service usado pelo ChefIApp.

### PostgreSQL
Banco de dados relacional usado pelo Supabase.

### Realtime
Funcionalidade do Supabase para atualizações em tempo real.

### Edge Functions
Funções serverless do Supabase.

---

## 🧪 Testes

### Unit Test
Teste de unidade isolada (função, componente).

### Integration Test
Teste de integração entre componentes.

### E2E Test
Teste end-to-end que simula usuário real.

### Coverage
Percentual de código coberto por testes.

### Mock
Simulação de dependência para testes.

---

## 📚 Documentação

### ADR (Architecture Decision Record)
Documento que registra decisões arquiteturais importantes.

### Changelog
Registro de mudanças entre versões.

### API Reference
Documentação completa de APIs e interfaces.

### Migration Guide
Guia para migrar entre versões.

---

## 🔄 Padrões

### Offline-First
Padrão arquitetural que prioriza funcionamento offline.

### Optimistic UI
Padrão de atualizar UI antes da confirmação.

### Idempotency
Padrão de operações que podem ser repetidas.

### Retry Pattern
Padrão de tentar novamente em caso de falha.

---

## 📞 Suporte

### Issue
Problema reportado no GitHub.

### Bug
Erro no software.

### Feature Request
Solicitação de nova funcionalidade.

### Hotfix
Correção urgente de bug crítico.

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
