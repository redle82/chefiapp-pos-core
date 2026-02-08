# Formatos de Export — ChefIApp™ (v1)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-4 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Especificação dos formatos de export suportados na v1 (CSV, JSON). Base para [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md), [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) e implementação (Onda 2).

---

## 1. Âmbito

Este documento define:

- **Formatos v1:** CSV e JSON.
- **Regras gerais:** Encoding, estrutura, metadados de versão.
- **Uso:** Work log export, DSR (portabilidade), exports de auditoria; formato concreto por tipo de export pode ser especificado no doc respetivo (ex.: [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md)).

**Implementação:** Export real = Onda 2; este doc é a spec de formato.

---

## 2. Regras gerais

| Regra | Especificação |
|-------|----------------|
| **Encoding** | UTF-8 |
| **Versão do schema** | Incluir em metadados ou nome do ficheiro (ex.: work_log_export_v1); permite compatibilidade futura |
| **Identificação do tenant** | Todo o export inclui identificador do tenant (restaurant_id) e, quando aplicável, período (data_início, data_fim) |
| **Sem dados de cartão** | Exports não incluem PAN, CVV ou dados sensíveis de pagamento; apenas referências (ex.: transaction_id, amount, method) |
| **Entrega** | Download seguro (link temporário ou canal conforme DPA); registo de quem pediu e quando para auditoria |

---

## 3. Formato CSV (v1)

| Aspeto | Especificação |
|--------|----------------|
| **Extensão** | .csv |
| **Separador** | Vírgula (,) |
| **Encoding** | UTF-8 (com BOM opcional para Excel) |
| **Cabeçalho** | Primeira linha = nomes das colunas |
| **Valores com vírgula ou newline** | Entre aspas duplas ("); aspas internas escapadas ("") |
| **Datas/horas** | ISO 8601 UTC (ex.: 2026-02-01T12:00:00Z) |
| **Múltiplos ficheiros** | Um ficheiro por categoria (ex.: shifts.csv, check_ins.csv) ou ficheiro único; especificado por tipo de export |
| **Metadados** | Ficheiro opcional metadata.csv ou README no pacote: tenant_id, período, export_id, schema_version, generated_at |

---

## 4. Formato JSON (v1)

| Aspeto | Especificação |
|--------|----------------|
| **Extensão** | .json |
| **Encoding** | UTF-8 |
| **Estrutura** | Objeto raiz com: version (schema), tenant_id, period (start, end), generated_at, e arrays por categoria (ex.: users, shifts, check_ins, tasks) |
| **Datas/horas** | ISO 8601 UTC (string) |
| **IDs** | UUID ou identificador estável (string) |
| **Números** | Valores monetários em cêntimos (integer) ou unidades mínimas; evitar float para dinheiro |
| **Metadados** | Incluir no objeto raiz: export_id, schema_version (ex.: "work_log_v1") |

**Exemplo de estrutura (work log):**

```json
{
  "schema_version": "work_log_v1",
  "tenant_id": "uuid-restaurant",
  "period": { "start": "2026-01-01T00:00:00Z", "end": "2026-01-31T23:59:59Z" },
  "generated_at": "2026-02-01T10:00:00Z",
  "export_id": "uuid-export",
  "users": [],
  "shifts": [],
  "check_ins": [],
  "tasks": []
}
```

---

## 5. Tipos de export e documentos associados

| Tipo de export | Documento de spec | Formatos v1 |
|----------------|-------------------|-------------|
| Work log (turnos, check-in, tarefas) | [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) | CSV, JSON |
| DSR (portabilidade, acesso) | [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) | JSON (recomendado para portabilidade) |
| Auditoria (eventos de segurança) | [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) + implementação | CSV, JSON (a definir na implementação) |

---

## 6. Implementação (Onda 2)

- **Estado atual:** Spec aprovada; export real não implementado.
- **Onda 2:** Geração de ficheiros CSV/JSON conforme este doc e especificações por tipo (work log, DSR); entrega segura e registo para auditoria.

---

**Referências:** [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
