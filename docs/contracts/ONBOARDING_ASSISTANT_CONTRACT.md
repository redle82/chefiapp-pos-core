# Contrato Onboarding Assistente

**Propósito:** Definir perguntas, ordem, payload e destino do assistente de configuração guiada (camada de Ativação). Ponte entre Bem-vindo e Centro de Ativação.

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md#arquitetura-de-jornada-em-3-camadas), [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

---

## Rota e contexto

- **Rota:** `/onboarding` (fluxo único com steps internos, não 7 URLs distintas).
- **Entrada:** Tela Bem-vindo (`/welcome`) → CTA "Começar Configuração Guiada" → `/onboarding`.
- **Saída:** Centro de Ativação (`/app/activation`). Se ainda não existir restaurante → `/bootstrap` com `state: { successNextPath: "/app/activation", fromOnboarding: true }`; após criar restaurante, navegar para `/app/activation`.

---

## Perguntas (ordem fixa)

| #   | Pergunta                       | Tipo    | Notas                                                 |
| --- | ------------------------------ | ------- | ----------------------------------------------------- |
| 1   | Nome do restaurante            | texto   | Obrigatório.                                          |
| 2   | País (ativa fiscal)            | select  | PT, BR, ES, FR, DE, UK, US, OTHER.                    |
| 3   | Tipo                           | select  | Bar, Restaurante, Café, Fast Casual, Catering, Outro. |
| 4   | Número de mesas (estimativa)   | número  | Opcional.                                             |
| 5   | Usa impressora?                | boolean | Checkbox.                                             |
| 6   | Vai usar KDS (ecrã cozinha)?   | boolean | Checkbox.                                             |
| 7   | Quantos usuários (estimativa)? | número  | Opcional.                                             |

---

## Payload

- **SessionStorage:** `sessionStorage.chefiapp_onboarding_answers` = JSON com as respostas (nome, pais, tipo, numMesas, usaImpressora, usaKDS, numUsuarios).
- **Core (quando já existe restaurante):** Persistir via `updateRestaurantProfile` (name, country, type) e `upsertSetupStatus` (identity: true). Flags de módulos (KDS, impressora) podem ser guardados em setup_status ou em variáveis de sessão conforme implementação.

---

## Destino

- **Já tem restaurante:** Navegar para `/app/activation` (Centro de Ativação).
- **Ainda não tem restaurante:** Navegar para `/bootstrap` com `state: { successNextPath: "/app/activation", fromOnboarding: true }`. Após criação do restaurante no Bootstrap, redirecionar para `/app/activation`.

---

## Implementação

- **Página:** `merchant-portal/src/pages/Onboarding/OnboardingAssistantPage.tsx`.
- **Fluxo:** CoreFlow.ts e FlowGate.tsx permitem `/onboarding` na camada de Ativação; não adicionar lógica de fluxo fora destes.
