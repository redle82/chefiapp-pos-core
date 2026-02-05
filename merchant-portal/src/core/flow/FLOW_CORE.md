# CORE FLOW CONTRACT™

> "A Lei Única que governa a navegação do Merchant Portal."

**Sequência Canônica v1.0:** Este fluxo implementa os 8 passos oficiais (Landing → Auth → Bootstrap → Primeiro produto [pulável] → Aha Moment → Trial silencioso → Operação → Billing assíncrono). Contrato: `docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10`. Código: `core/flow/canonicalFlow.ts`.

## 1. Introdução
Este documento define a máquina de estados soberana que decide para onde um usuário deve ser roteado. Nenhuma tela (Login, Splash, Onboarding) deve decidir seu próprio destino. Elas apenas **executam** a decisão deste contrato.

## 2. Estado do Usuário (UserState)
O sistema deve conhecer apenas estes fatos para decidir o destino:

```typescript
type UserState = {
  // Autenticação (Supabase Auth)
  isAuthenticated: boolean;

  // Organização (Multi-tenancy)
  hasOrganization: boolean; // Possui vínculo na tabela 'restaurant_members'?

  // Maturidade do Cadastro
  onboardingStatus: 'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done';
  
  // Contexto Atual
  currentPath: string; // Para evitar loops de redirecionamento para o mesmo lugar
};
```

## 3. Função Soberana (The Resolver)
`resolveNextRoute(state: UserState) -> Decision`

### Tabela de Decisão

| Auth | Org | Status | Regra (Destino) | Motivo |
| :--- | :--- | :--- | :--- | :--- |
| **FALSE** | * | * | `/login` | Sem credencial = Login. (Se já estiver em /login, ALLOW). |
| **TRUE** | **FALSE** | * | `/onboarding/identity` | Usuário orfão deve criar organização. |
| **TRUE** | **TRUE** | `not_started` | `/onboarding/identity` | Organização existe, mas está crua. |
| **TRUE** | **TRUE** | `quick_done` | `/dashboard` | Modo MVP TPV. Acesso permitido. |
| **TRUE** | **TRUE** | `advanced_in_progress` | `/dashboard` | (Decisão de Produto) Pode operar enquanto termina setup. |
| **TRUE** | **TRUE** | `advanced_done` | `/dashboard` | Estado final ideal. |

### Regras de Exceção (Anti-Loop)
1. Se o destino calculado for igual ao `currentPath`, a decisão é `ALLOW`.
2. A rota `/bootstrap` é "NEUTRA". Ela serve para carregar/criar estado. Se o usuário estiver em `/bootstrap`, o Resolver pode permitir (ALLOW) até que o Bootstrap termine e invoque o Resolver novamente (ou redirecione).
   *Refinamento:* O `FlowGate` deve permitir `/bootstrap` rodar, pois é ele quem hidrata o DB. Mas se o Bootstrap terminar, ele deve redirecionar para `/dashboard` ou `/onboarding`.

## 4. Implementação (FlowGate)
O componente `FlowGate` é o **Executor**.
1. **Lê** Session (Supabase).
2. **Busca** DB (Supabase `gm_restaurants`).
3. **Persiste** Cache Local (LocalStorage).
4. **Consulta** `resolveNextRoute`.
5. **Executa** `navigate()`.

---
*Este contrato é imutável. Alterações aqui exigem aprovação de Arquitetura.*
