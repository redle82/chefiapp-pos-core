# O que o ChefIApp Não É — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T00-3 · [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Limites explícitos do produto: o que o ChefIApp **não** é, para defesa de scope, vendas e arquitectura. Complementa [docs/architecture/WHAT_WE_DO_NOT_PROCESS.md](./architecture/WHAT_WE_DO_NOT_PROCESS.md) (dados e processamento); este doc é focado em **produto e posicionamento**.

---

## 1. Limites de produto

| O ChefIApp **não** é | Significado |
|----------------------|-------------|
| **TPV genérico** | Não é um terminal de pagamento genérico. É orquestração operacional (KDS, tarefas, turnos, Now Engine); integra com TPV/pagamentos externos. O diferencial é "TPV que pensa", não o hardware de caixa. |
| **ERP** | Não é um ERP de back-office. Não substitui contabilidade geral, inventário completo nem gestão de fornecedores fora do âmbito operacional do restaurante. |
| **Sistema operacional completo (como produto)** | A arquitectura interna é tipo OS (Kernel, contratos, terminais); não vendemos nem comunicamos "OS completo" como produto agora. Escopo congelado: ver [NON_GOALS.md](./NON_GOALS.md) e [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md). |
| **Processador de pagamentos (PCI)** | Não processa nem armazena dados de cartão (PAN, CVV); delega em PSP. Ver [architecture/WHAT_WE_DO_NOT_PROCESS.md](./architecture/WHAT_WE_DO_NOT_PROCESS.md). |
| **Rede social ou marketing de terceiros** | Não processa dados para publicidade dirigida de terceiros nem vende dados a data brokers. |

---

## 2. O que somos (resumo)

- **TPV que pensa** — Sistema que observa contexto, calcula próxima ação, explica o porquê e prioriza por urgência.
- **Orquestração operacional** — Menu como contrato, Task Engine, KDS, turnos, Now Engine; integração com TPV/pagamentos externos.
- **Foco actual:** Billing, onboarding, Now Engine, gamificação mínima (conforme SCOPE_FREEZE). Não ERP, não "OS completo" como produto, não analytics profundos agora.

Ver [VISION.md](./VISION.md) e [strategy/POSITIONING.md](./strategy/POSITIONING.md).

---

## 3. Dados e processamento

Para limites de **dados** (o que não processamos, responsabilidades, defesa legal): [docs/architecture/WHAT_WE_DO_NOT_PROCESS.md](./architecture/WHAT_WE_DO_NOT_PROCESS.md).

---

## 4. Uso

- **Scope:** Evitar scope creep; alinhar produto, vendas e engenharia.
- **Vendas:** Comunicar claramente o que não fazemos (não ERP, não PCI, não OS completo como produto).
- **Arquitectura:** Decisões de produto e limites estão documentados; alterações ao scope passam por [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md) e [NON_GOALS.md](./NON_GOALS.md).

---

**Referências:** [VISION.md](./VISION.md) · [NON_GOALS.md](./NON_GOALS.md) · [docs/architecture/WHAT_WE_DO_NOT_PROCESS.md](./architecture/WHAT_WE_DO_NOT_PROCESS.md) · [strategy/SCOPE_FREEZE.md](./strategy/SCOPE_FREEZE.md) · [strategy/POSITIONING.md](./strategy/POSITIONING.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md).
