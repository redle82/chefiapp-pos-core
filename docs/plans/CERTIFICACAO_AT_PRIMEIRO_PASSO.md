# Certificação AT (Portugal) — Primeiro passo executável

**Objetivo:** Reunir requisitos oficiais da AT e comparar com a implementação atual, como base para iniciar o processo de certificação de software de faturação.

**Referência no plano:** [FASE_2_POS_VENDAVEL_PORTUGAL.md](FASE_2_POS_VENDAVEL_PORTUGAL.md) § 1. Certificação AT.

---

## 1. Fontes oficiais a consultar

- **Portal das Finanças — Faturação Eletrónica:**  
  https://www.portaldasfinancas.gov.pt/at/html/index.html  
  (requisitos técnicos, formato QR AT, SAF-T, certificação de software)

- **Código QR para validação:**  
  Base URL usada no recibo: `https://www.portaldasfinancas.gov.pt/at/qa`  
  Parâmetros: NIF, ATCUD, data, total, hash (conforme Portaria n.º 195/2020).

---

## 2. Requisitos a reunir (checklist)

Antes de comparar com o código, reunir da documentação AT:

- [ ] Formato exato do **código QR** (parâmetros obrigatórios, nomes, encoding).
- [ ] Esquema e regras do **SAF-T PT** (XML, namespaces, elementos obrigatórios).
- [ ] Regras de **ATCUD** e cadeia de hash (sequência, selo).
- [ ] Requisitos de **certificação de software** (processo, evidências, testes).
- [ ] Regras de **IVA e arredondamentos** em documentos fiscais.

---

## 3. Implementação atual no repositório

### QR AT (recibo)

- **Ficheiro:** `fiscal-modules/pt/atQrUrl.ts`
- **Função:** `buildAtQrUrl(params)` — constrói o URL para o QR com NIF, ATCUD, data (`d`), total (`t`), opcionalmente hash (`h`).
- **Referência no código:** Portaria n.º 195/2020; base `https://www.portaldasfinancas.gov.pt/at/qa`.

### SAF-T e cadeia de hash

- **Pasta:** `fiscal-modules/pt/saft/`
  - **saftUtils.ts:** `formatSequence`, `buildInvoiceNumber`, `buildAtcud`, `computeHashChain` (SHA-256, formato `prevHash|content`).
  - **saftXml.ts:** `generateSaftInvoiceFragment`, `SaftExportCompany`; fragmentos XML para Invoice (InvoiceNo, Hash, ATCUD, DocumentTotals, linhas com IVA PT).
- **Tipos:** `fiscal-modules/types.ts` (ex.: `TaxDocument`).

### Roadmap fiscal global

- **Documento:** `docs/audit/FISCAL_ROADMAP_GLOBAL.md` — fases PT (Phase 0 a 4), incluindo Phase 3 Certification (AT certification process, audit readiness).

---

## 4. Comparação (próximo passo)

Depois de reunir os requisitos da AT:

1. **QR:** Comparar parâmetros e URL em `atQrUrl.ts` com a especificação AT (Portaria 195/2020 e portal).
2. **SAF-T:** Comparar estrutura XML em `saft/saftXml.ts` com o esquema SAF-T PT oficial (namespaces, elementos obrigatórios, HashControl, etc.).
3. **ATCUD e hash:** Confirmar que `saftUtils.ts` (formato ATCUD, cadeia SHA-256) cumpre as regras da AT.
4. **Certificação:** Mapear evidências atuais (testes, amostras SAF-T, logs) para o que a AT exige no processo de certificação.

---

## 5. Ações seguintes

- Documentar diferenças encontradas (gap analysis) neste ficheiro ou num anexo.
- Ajustar `atQrUrl.ts` ou `saft/` conforme feedback da AT.
- Manter referência no Help do produto ao formato usado (QR AT, SAF-T) para transparência com o utilizador e auditoria.

## 6. Checklist operacional (Fase 4)

Ver [FISCAL_COMPLIANCE_PT_CHECKLIST.md](../compliance/FISCAL_COMPLIANCE_PT_CHECKLIST.md) para checklist de hash, imutabilidade, numeração sequencial, trilha de auditoria e export SAF-T testado.
