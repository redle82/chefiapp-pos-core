# Separação Constitucional: Fundação vs Operação

## O Princípio Soberano
- **Onboarding (Mobile/Qualquer)**: Existe para **FUNDAR** entidades.
- **Dashboard (Desktop/Tablet)**: Existe para **OPERAR** entidades.

**Fundação ≠ Operação.**

A fundação é um ato de criação, identidade e consagração. Pode ser realizada em qualquer lugar, via dispositivo móvel.
A operação é um ato de comando, controle e execução. Exige um ambiente físico adequado (Cockpit), ou seja, Desktop ou Tablet.

## Regras de Acesso (A Lei do Sistema)

### 1. O Handoff Obrigatório
Após a consagração (término do onboarding), o sistema **NÃO** deve presumir que o usuário está apto a operar.
- **Mobile**: O usuário é direcionado para a **Tela de Fundação** (`/onboarding/foundation`).
- **Desktop**: O usuário pode ser direcionado para a Fundação ou Dashboard, mas a Fundação é preferível como rito de passagem.

### 2. O Bloqueio Constitucional
O Dashboard (`/app/dashboard`) e ferramentas operacionais (`/app/pos`, `/app/kds`) são **ambientes hostis** para telas pequenas.
- O sistema deve **detectar** o dispositivo.
- Se `Mobile` + `Status: Completed` → **Bloquear** acesso ao Dashboard.
- **Redirecionar** para: `/onboarding/foundation`.

### 3. A Exceção (View-Only)
Futuramente, poderá existir um "Modo Observador" ou "App Companion" para mobile.
- Este NÃO é o Dashboard. É um app diferente ou uma view adaptada.
- O Dashboard Desktop completo nunca deve ser forçado em telas < 768px.

---

**Veredito**: O ChefIApp não "termina" no dashboard. Ele termina na **Fundação**. A Operação é um novo início, em outro lugar.
