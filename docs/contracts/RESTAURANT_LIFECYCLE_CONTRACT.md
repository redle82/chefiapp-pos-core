# RESTAURANT LIFECYCLE CONTRACT (GloriaFood Model)

## Contexto e Objetivo

Formalizar a separação entre **Configuração**, **Gestão** e **Operação**. O sistema deve permitir que o proprietário configure o restaurante sem estar "preso" em um wizard, enquanto protege as funções operacionais (pedidos/pagamentos) até que o sistema esteja pronto.

## As Três Camadas de Estado

### 1. Camada de Gestão (Sempre Acessível)

- **Definição**: Capacidade de acessar o Portal de Gestão (`/dashboard`, `/config`, `/menu-builder`, `/people`).
- **Condição**: Usuário autenticado e com vínculo a um restaurante.
- **Comportamento**: Mesmo que o restaurante não tenha sido "Publicado", o portal deve estar aberto.
- **UX**: Se o restaurante não estiver `published`, exibir banners informativos em vez de bloquear as páginas.

### 2. Camada de Publicação (`isPublished`)

- **Definição**: O restaurante declarou que sua configuração básica está pronta para receber o público (Web ou Local).
- **Condição**: Clique no botão "Publicar" no Onboarding ou Configurações.
- **Bloqueios**:
  - Se `false`: TPV, KDS e Presença Online mostram tela de "Em Preparação".
  - Se `true`: Libera acesso aos apps operacionais.

### 3. Camada Operacional (`isOperational`)

- **Definição**: O restaurante está em um turno de trabalho ativo (Caixa Aberto).
- **Condição**: Existe uma sessão de caixa aberta.
- **Bloqueios**:
  - Se `false`: TPV bloqueia a criação de novos pedidos (exige abertura de caixa).
  - Se `true`: Fluxo total de pedidos e pagamentos liberado.

## Resumo dos Estados do Ciclo de Vida

| Estado          | Contexto             | Acesso Portal | Acesso TPV/KDS | Pedidos Reais |
| :-------------- | :------------------- | :-----------: | :------------: | :-----------: |
| **Configuring** | Onboarding inicial   |   ✅ Aberto   |  🛑 Bloqueado  |    🛑 Não     |
| **Published**   | Menu/Identity pronto |   ✅ Aberto   |   ✅ Aberto    | 🛑 Abre Caixa |
| **Operational** | Turno ativo          |   ✅ Aberto   |   ✅ Aberto    |    ✅ Sim     |

## Mudanças na Lógica de Sistema

1. **Onboarding**: Deixa de ser um `Gate` (não redireciona forçadamente). Torna-se um `Assistant`.
2. **Dashboard**: Torna-se a rota principal (`/app/dashboard`) imediatamente após o vínculo do restaurante.
3. **Requirement Gates**:
   - `RequireOnboarding`: Substituído por `ManagementAdvisor` (exibe banners de progresso).
   - `RequireOperational`: Novo gate para TPV/KDS.

## Regra de Ouro

**Configuração não é Operação.** O sistema deve nascer como uma ferramenta de gestão que, ao ser amadurecida, habilita a operação.
