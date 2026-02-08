# Configuración > Ubicaciones — Contrato funcional

**Status:** CANONICAL  
**Tipo:** Contrato funcional — o que criar/editar localização faz, não faz e como alimenta operação.  
**Subordinado a:** [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md), [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md).

---

## 1. O que criar uma localização FAZ

- Cria um **contexto operacional** (ChefIApp Location): nome, endereço, cidade, país, código postal, fuso horário, moeda, ativo, principal.
- Permite ter **vários locais** sem plano nem pagamento (multi-locais, eventos, franquias).
- Alimenta depois:
  - **TPV** — seleção de local para sessão; fuso e moeda por local.
  - **Staff** — turnos e presença por local.
  - **KDS** — cozinha por local.
  - **Dashboard** — agregados por local (quando implementado).
- Persistência: estado mínimo em store/API; sem bloqueio comercial.

---

## 2. O que criar uma localização NÃO FAZ

- **Não** exige plano, assinatura nem pagamento.
- **Não** exige informação fiscal nem entidade legal no mesmo fluxo.
- **Não** bloqueia configuração (plano não bloqueia criar/editar ubicaciones).
- **Não** é wizard comercial (Last.app style); é página dedicada limpa.

---

## 3. Modelo de estado (Location — ChefIApp)

| Campo       | Tipo    | Editável | Notas                          |
|------------|---------|----------|--------------------------------|
| id         | string  | Não      | Estrutural.                    |
| name       | string  | Sim      | Nome do local.                 |
| address    | string  | Sim      | Endereço.                      |
| city       | string  | Sim      |                                |
| country    | string  | Sim      | Código (ex.: ES, PT, BR).      |
| postalCode | string  | Sim      |                                |
| timezone   | string  | Sim      | IANA (ex.: Europe/Madrid).     |
| currency   | string  | Sim      | EUR, BRL, USD, etc.            |
| isActive   | boolean | Sim      | Local ativo na operação.       |
| isPrimary  | boolean | Sim      | Local principal (um por conta).|
| createdAt  | string  | Não      | Estrutural.                    |
| updatedAt  | string  | Não      | Estrutural.                    |

---

## 4. Rotas canónicas

| Rota                         | Contrato              | Conteúdo                    |
|-----------------------------|-----------------------|-----------------------------|
| `/config/ubicaciones`      | PORTAL_MANAGEMENT     | Lista de ubicaciones.       |
| `/config/ubicaciones/nova` | PORTAL_MANAGEMENT     | Página dedicada criar.      |
| `/config/ubicaciones/:id`  | PORTAL_MANAGEMENT     | Página dedicada editar.     |

Gate: FlowGate (não ORE). Sem billing no fluxo.

---

## 5. Referências

- [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md) — Location vs contrato.
- [CONFIG_GENERAL_WIREFRAME.md](./CONFIG_GENERAL_WIREFRAME.md) — Geral (identidade); Ubicaciones = operação.
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — Índice rota → contrato.

**Última atualização:** 2026-02-05
