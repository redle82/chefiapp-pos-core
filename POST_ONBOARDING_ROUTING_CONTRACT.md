# POST-ONBOARDING ROUTING CONTRACT

## Contexto e Objetivo

Formalizar as regras de redirecionamento após a conclusão do onboarding (ativação do restaurante) para garantir que usuários Web e Mobile sejam direcionados aos destinos corretos, evitando que usuários Web caiam em rotas exclusivas de mobile (AppStaff).

## Regras de Ouro de Redirecionamento

### 1. Usuário Web (Desktop/Browser)

- **Papel**: `owner` ou `manager`.
- **Destino Obrigatório**: `/dashboard` (Portal do Comerciante).
- **Proibição**: Nunca redirecionar para `/garcom` ou rotas mobile.
- **Fail-Safe**: Se o papel for `staff` na Web, mostrar tela de bloqueio informando que o acesso é via app mobile.

### 2. Usuário Mobile (AppStaff)

- **Papel**: `staff` (ou `owner`/`manager` em modo simulação mobile).
- **Destino Obrigatório**: `/garcom`.
- **Comportamento**: O app deve abrir diretamente na interface de operação de salão.

## Implementação Técnica

### Detecção de Plataforma

O sistema deve usar o helper `isMobileDevice()` para distinguir entre contextos:

- `isMobileDevice() === true` -> Contexto MOBILE.
- `isMobileDevice() === false` -> Contexto WEB.

### Guardiões de Rota (Gates)

#### RoleGate

- Deve verificar `!canAccessPath(role, pathname)`.
- Se negado:
  - Se `isMobileDevice()` -> Redirecionar para `/garcom`.
  - Se `!isMobileDevice()` -> Redirecionar para `/dashboard`.

#### CoreFlow (Sovereign Flow)

- Se `onboardingStatus === 'completed'`:
  - Se `isMobileDevice()` -> Permitir apenas rotas mobile/public.
  - Se `!isMobileDevice()` -> Redirecionar para `/app/dashboard`.

## Matriz de Decisão

| Role    | Plataforma | Destino Final                  |
| :------ | :--------- | :----------------------------- |
| Owner   | Web        | `/dashboard`                   |
| Manager | Web        | `/dashboard`                   |
| Staff   | Web        | `/dashboard` (Bloqueado/Vazio) |
| Staff   | Mobile     | `/garcom`                      |
| Owner   | Mobile     | `/garcom` (Operação)           |

## Verificação de Integridade

Qualquer mudança na lógica de onboarding ou ativação de restaurante deve respeitar este contrato para evitar quebras de UX em ambientes de produção.
