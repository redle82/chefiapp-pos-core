# Contrato: Superfícies Operacionais

**Propósito:** Definir onde cada superfície vive, que papel tem e o que pode/não pode fazer — fonte de verdade para decisões de produto e implementação.

**Referências:** [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](FLUXO_DE_PEDIDO_OPERACIONAL.md), [FASE_2_PLANO_COMPLETO.md](../plans/FASE_2_PLANO_COMPLETO.md).

---

## 1. Superfícies e regras

| Superfície | Função | Pode | Não pode |
|------------|--------|------|----------|
| **Dashboard Web** | Observação, estado geral | Ver métricas, estado, alertas | Criar pedidos; controlar cozinha |
| **TPV** | Criar e confirmar pedidos | Rascunho, confirmação, iniciar pagamento | Controlar estados de cozinha |
| **KDS** | Controlar estados de cozinha | Marcar EM_PREPARO, READY, CLOSED-served | Criar pedido |
| **AppStaff** | Suporte à operação humana | Notificações, confirmar entrega, ações simples | Assumir papel completo de TPV/KDS |

---

## 2. Gate

Qualquer nova funcionalidade que atribua ações a uma superfície deve respeitar esta matriz. Alterações à matriz exigem revisão explícita do contrato.

---

## 3. Relação com instalação

Um dispositivo instalado como **TPV** só deve expor superfície TPV (não “TPV meio dashboard”). Um dispositivo instalado como **KDS** só KDS. O ritual em `/app/install` deve:

- Registar o dispositivo (identidade persistente, ex.: gm_equipment / installedDeviceStorage).
- Atribuir o papel (TPV, KDS, Staff, Observer).
- Bloquear uso indevido (ex.: impedir que um terminal instalado como KDS crie pedidos).

Ver [TERMINAL_INSTALLATION_RITUAL.md](TERMINAL_INSTALLATION_RITUAL.md).

---

Última atualização: Contrato de Superfícies Operacionais; gate Fase 2.1.
