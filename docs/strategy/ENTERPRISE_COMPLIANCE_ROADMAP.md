# ENTERPRISE_COMPLIANCE_ROADMAP — Roteiro de compliance para 2026

> Mapa de alto nível das frentes de compliance necessárias para que o
> ChefIApp™ OS possa atender grupos e hotelaria com requisitos
> enterprise. Não é compromisso legal; é guia de produto+engenharia.

---

## 1. Áreas principais

- **Proteção de dados / privacidade**
  - Continuidade de alinhamento com RGPD (ou equivalente local).
  - Gestão de dados pessoais de staff, clientes e contactos comerciais.
- **Fiscal / contabilístico**
  - Integração clara com POS fiscais locais.
  - Reconciliação ChefIApp vs POS (ver `FISCAL_RECONCILIATION_CONTRACT.md`).
- **Segurança de aplicação**
  - Gestão de acessos, roles, multi‑tenant isolado.
  - Proteção contra acessos indevidos e fuga de dados entre restaurantes.
- **Pagamentos (se/onde aplicável)**
  - Quando ChefIApp intermediar pagamentos diretos, seguir boas práticas PCI‑like
    (tokenização via PSP, nunca armazenar dados sensíveis de cartão).

---

## 2. Estado atual (2025/2026)

- Multi‑tenant e isolamento por restaurante:
  - `TenantContext` + `RestaurantRuntimeContext` já impõem fronteira clara
    por `restaurant_id` e membership.
- Dados sensíveis:
  - Dados fiscais de pedidos passam pelo POS fiscal;
  - ChefIApp não assume, por enquanto, papel de emissor fiscal direto.
- Pagamentos:
  - Ligações a PSPs (quando existirem) são feitas via tokens/SDKs próprios;
  - ChefIApp não armazena PAN de cartão.

---

## 3. Roteiro por fase

### Fase 1 — 2025/2026 (foundation)

- Documentar claramente:
  - que dados pessoais são armazenados (staff, clientes, contactos);
  - onde vivem (tabelas Core, storage externo);
  - quem tem acesso (roles).
- Implementar:
  - processo padrão de export/delete por restaurante, quando exigido;
  - controlo de acesso multi‑tenant endurecido (ver `MULTI_TENANT_ROLES_CONTRACT.md`).

### Fase 2 — pós‑fiscal piloto

- Ao ligar‑se a 1 POS fiscal específico:
  - garantir trilho de auditoria (`core_event_log` + reconciliações);
  - mapear requisitos fiscais locais (layout de documentos, retenção).
- Rever políticas de logs:
  - evitar logs com dados pessoais desnecessários em texto claro.

### Fase 3 — escala de grupo / hotelaria

- Para grupos com dezenas de unidades:
  - validar que o modelo de dados suporta retenção segura de históricos;
  - implementar ferramentas de export/auditoria:
    - reconciliações por período,
    - logs de acesso administrativo,
    - alterações de configuração crítica.

---

## 4. Documentos relacionados

- `CORE_EVENTS_CONTRACT.md`
- `FISCAL_RECONCILIATION_CONTRACT.md`
- `MULTI_TENANT_ROLES_CONTRACT.md`
- `COMMERCIAL_CLAIMS_GUARDRAILS.md`
- `SLA_INTERNAL_CONTRACT.md`

