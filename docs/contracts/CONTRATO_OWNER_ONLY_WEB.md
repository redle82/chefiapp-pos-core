# Contrato: Web exclusiva do Dono (Owner-only)

**Regra canónica:** A web de configuração (merchant-portal) é exclusiva do Dono. Gerente e Staff não existem neste contexto; só fazem sentido na operação (TPV, KDS, AppStaff).

---

## Decisão estrutural

1. **A web é exclusiva do Dono.** Não há simulação, troca ou visualização cruzada de papéis na web.
2. **Gerente e Staff só existem na operação.** TPV, KDS, AppStaff podem ter papéis operacionais; a web de configuração não.
3. **Qualquer acesso à web que não seja como Dono é bug.** RoleContext na web assume sempre owner; não há toggle nem seletor de papel.
4. **Esta regra é estrutural, não temporária.** Evita estados mortos, guards contraditórios e bugs de render vazio.

Frase de referência: *A web não é um simulador de papéis. É a sala de máquinas do dono.*

---

## Consequências práticas

- **RoleContext (merchant-portal):** role é sempre `owner`; sem override, não há leitura de localStorage para papel; em produção não existe seletor de papel.
- **Componentes:** Nenhuma lógica condicional que retorne null ou esconda conteúdo por `role !== "owner"`. Se um ecrã mexe em billing, módulos, métricas ou configuração → é Dono ou nada.
- **Papéis operacionais:** Vivem apenas em TPV, KDS, AppStaff (e futuros clientes de operação), em contexto separado da web de configuração.

---

## Referências

- FASE B (refatoração): RoleContext, AdminSidebar sem "MODO DE VISÃO".
- [CONTRATO_TRIAL_REAL.md](./CONTRATO_TRIAL_REAL.md) — SystemState (SETUP/TRIAL/ACTIVE/SUSPENDED).
- [docs/implementation/RETURN_NULL_AUDIT.md](../implementation/RETURN_NULL_AUDIT.md) — Nenhum return null por papel.
