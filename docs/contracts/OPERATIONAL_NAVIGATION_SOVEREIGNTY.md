# Contrato: Soberania de Navegação em OPERATIONAL_OS

**Propósito:** Declarar a autoridade única de navegação para rotas app e a regra de ouro: em `UI_MODE === OPERATIONAL_OS` nunca redirecionar para Landing; destino canónico de saída é `/app/dashboard`. Elimina o loop "Instalar TPV → redirect para Landing".

**Referências:** [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md), [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md), [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md).

---

## 1. Autoridade de navegação

- **Uma única autoridade** para rotas app (`/*`): **FlowGate** (entrada e destino canónico) + **ORE** (`useOperationalReadiness`) por superfície (TPV, KDS, DASHBOARD, WEB).
- Nenhum outro guard pode redirecionar para "/" ou "/landing" em conflito com este contrato.

---

## 2. Regra de ouro (OPERATIONAL_OS)

- Se **`CONFIG.UI_MODE === "OPERATIONAL_OS"`**:
  - Nenhum guard pode redirecionar para **"/"** nem **"/landing"**.
  - O destino canónico de "saída" (quando o lifecycle exigir redirect) é **`/app/dashboard`**.
- Implementação: no FlowGate, em todos os sítios onde se usa `getCanonicalDestination(...)` para navegar, se `UI_MODE === "OPERATIONAL_OS"` e o destino seria "/", substituir por `/app/dashboard`.

---

## 3. DEMO_MODE não controla navegação em OPERATIONAL_OS

- Em **`UI_MODE === OPERATIONAL_OS`**, o facto de estar em "demo" (mocks, dados efémeros) **não** pode forçar redirect para Landing.
- **DEMO_MODE** (ou equivalente) controla apenas **mocks e dados**; **nunca** a decisão de navegação quando o modo de UI é OPERATIONAL_OS.

---

## 4. Rotas operacionais (early pass)

- Rotas que não exigem revalidação para landing quando há org local e contexto Demo/Pilot: `/dashboard`, `/config/*`, `/menu-builder`, **`/app/install`**.
- `/app/install` é rota **operacional** (não onboarding): requer restaurante em contexto operacional; nunca redirecionar para Landing. Ver [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md).

---

Última atualização: Soberania de navegação em OPERATIONAL_OS; alinhado ao plano de correção do loop Instalar TPV → Landing.
