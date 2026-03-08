# Checklist Compliance Fiscal PT (Fase 4 — 25 Mar)

**Objetivo:** Documento fiscal válido, log imutável, numeração sequencial, export SAF-T testado. Preparação para AT.

**Ref:** [CERTIFICACAO_AT_PRIMEIRO_PASSO.md](../plans/CERTIFICACAO_AT_PRIMEIRO_PASSO.md), [FISCAL_RECONCILIATION_CONTRACT.md](../architecture/FISCAL_RECONCILIATION_CONTRACT.md).

---

## 1. Implementação actual

| Componente | Ficheiro / local | Função |
|------------|------------------|--------|
| Cadeia hash (SHA-256) | `fiscal-modules/pt/saft/saftUtils.ts` | `computeHashChain(prevHash, content)` — formato `prevHash\|content` |
| Numeração e ATCUD | `saftUtils.ts` | `formatSequence`, `buildInvoiceNumber`, `buildAtcud` |
| Fragmentos XML SAF-T | `fiscal-modules/pt/saft/saftXml.ts` | `generateSaftInvoiceFragment`, `SaftExportCompany`; InvoiceNo, Hash, ATCUD, DocumentTotals |
| QR AT | `fiscal-modules/pt/atQrUrl.ts` | `buildAtQrUrl` — NIF, ATCUD, data, total, hash (Portaria 195/2020) |
| Export por período | `merchant-portal/src/core/fiscal/SaftExportService.ts` | Orders → TaxDocument[] → SAF-T XML |
| Script local | `scripts/audit/generate-saft-local.ts` | Gera SAF-T de teste com hash chain |

---

## 2. Checklist pré-abertura (DoD Fase 4)

### 2.1 Hash de fatura e imutabilidade

- [ ] Cada documento fiscal tem hash (cadeia ATCUD/SHA-256) gerado por `computeHashChain`.
- [ ] Documentos fiscais não são alterados após emissão: apenas INSERT; UPDATE proibido em campos fiscais (ou apenas campos não fiscais permitidos). Confirmar em `gm_fiscal_documents` e triggers Core.
- [ ] Referência: [saftUtils.ts](../../fiscal-modules/pt/saft/saftUtils.ts), schema Core `gm_fiscal_documents`, [FISCAL_RECONCILIATION_CONTRACT](../architecture/FISCAL_RECONCILIATION_CONTRACT.md).

### 2.2 Numeração sequencial

- [ ] Números de fatura são sequenciais por NIF/série; sem lacunas não justificadas.
- [ ] `buildInvoiceNumber(series, sequence)` e atribuição de `sequence` por série em Core ou app (RPC ou lógica de emissão).
- [ ] Referência: [SaftExportService](../../merchant-portal/src/core/fiscal/SaftExportService.ts), [saftUtils](../../fiscal-modules/pt/saft/saftUtils.ts).

### 2.3 Trilha de auditoria

- [ ] Eventos fiscais (emissão, alteração de estado, export SAF-T) registados em `event_store` ou `core_event_log` com timestamp e actor.
- [ ] Referência: [FISCAL_RECONCILIATION_CONTRACT](../architecture/FISCAL_RECONCILIATION_CONTRACT.md), migrações Core `event_store`, `core_event_log`.

### 2.4 Export SAF-T testado

- [ ] Executar `scripts/audit/generate-saft-local.ts` com período e NIF de teste; validar XML gerado (schema/local).
- [ ] Documentar passos para entrega à AT (período, formato, suporte).
- [ ] Referência: [generate-saft-local.ts](../../scripts/audit/generate-saft-local.ts), [SaftExportService](../../merchant-portal/src/core/fiscal/SaftExportService.ts).

### 2.5 Validação AT (esquema SAF-T PT)

- [ ] Comparar estrutura em `saftXml.ts` com esquema SAF-T PT oficial (namespaces, elementos obrigatórios, HashControl).
- [ ] Referência: [CERTIFICACAO_AT_PRIMEIRO_PASSO](../plans/CERTIFICACAO_AT_PRIMEIRO_PASSO.md) § 4.

---

## 3. Passos para export SAF-T (teste local)

1. **Script local (sem Core):**  
   `npx ts-node scripts/audit/generate-saft-local.ts --restaurant-id <UUID> --start 2026-01-01 --end 2026-01-31 --nif <NIF>`
2. **Com Core:** Usar SaftExportService (UI ou API) com `restaurantId`, `from`, `to`; obter XML e guardar.
3. **Validação:** Abrir XML; confirmar presença de Invoice, Hash, ATCUD, DocumentTotals; opcional: validar contra XSD SAF-T PT se disponível.

---

## 4. Critério de conclusão Fase 4

- Documento fiscal válido (hash, ATCUD, numeração).
- Log imutável (sem updates em campos fiscais após emissão).
- Numeração sequencial por série.
- Export SAF-T testado e passos documentados para AT.
