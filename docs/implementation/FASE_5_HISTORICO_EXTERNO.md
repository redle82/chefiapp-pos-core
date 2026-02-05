# FASE 5 — Histórico externo (baseline)

Documento do Passo 1.5 da FASE 5 (pré-live). Referência: [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md), [FASE_5_ESTADO_REAL.md](FASE_5_ESTADO_REAL.md).

**Objetivo:** Nomear oficialmente que o sistema aceita dados de fora (outros TPVs, POS antigos, CSVs, relatórios fiscais) e definir o conceito de **dados herdados** vs **dados nativos**. Sem ETL complexo nem UI completa de importação — só contrato, modelo e ponto de entrada definido.

**Risco que isto mitiga:** O Dono sente que, ao mudar, perde a memória do negócio. O sistema já sabe dizer a verdade sobre o presente; este doc assume a história passada do restaurante.

---

## Contrato: dados herdados vs dados nativos

| Conceito           | Definição                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dados nativos**  | Dados gerados e persistidos pelo ChefiApp (pedidos, turnos, caixa, inventário, pessoas). Fonte única: Core/Supabase.                       |
| **Dados herdados** | Dados importados de sistemas externos (outro TPV, POS antigo, CSV, relatório fiscal). Têm origem, período e grau de fidelidade explícitos. |

O sistema **aceita** dados herdados como baseline histórico. Relatórios podem combinar dados nativos (a partir da data de go-live) com dados herdados (período anterior), desde que a origem e o grau de fidelidade estejam claros.

---

## Tipos de dados aceitos (histórico externo)

| Tipo                   | Descrição                              | Formato mínimo                                                  |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------- |
| **Vendas**             | Totais por dia/semana/mês (agregados). | CSV: data, total_vendas_cents, num_pedidos (ou equivalente).    |
| **Caixa**              | Fechos de caixa ou totais por período. | CSV: data_abertura, data_fecho, total_cents, método (opcional). |
| **Produtos**           | Catálogo ou movimentos (opcional).     | CSV: id_externo, nome, preço, categoria (ou equivalente).       |
| **Clientes**           | Base de clientes (opcional).           | CSV: id_externo, nome, contacto (ou equivalente).               |
| **Relatórios fiscais** | Dados já fechados para fins fiscais.   | CSV ou formato acordado (período, totais, IVA, etc.).           |

**Formato mínimo:** CSV com cabeçalho; encoding UTF-8; separador vírgula ou ponto-e-vírgula. Sem esquema rígido único — o ponto de entrada define mapeamentos por tipo.

---

## Modelo de dados para histórico importado

Cada conjunto de dados herdados deve ser descrito por:

| Campo                             | Descrição                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **source_system**                 | Origem (ex.: `gloriafood`, `ifood`, `legacy_pos`, `csv_import`, `fiscal_report`).                                                                    |
| **period_from** / **period_to**   | Período coberto (data início e fim).                                                                                                                 |
| **data_type**                     | Tipo: vendas, caixa, produtos, clientes, fiscal.                                                                                                     |
| **fidelity**                      | Grau de fidelidade: `exact` (dado exato do sistema de origem), `aggregated` (totais por dia/semana/mês), `estimated` (estimativa ou arredondamento). |
| **imported_at**                   | Data/hora da importação (auditoria).                                                                                                                 |
| **tenant_id** / **restaurant_id** | Restaurante a que se aplica.                                                                                                                         |

Sem este modelo explícito, relatórios ficam "curtos" no início e comparações mensais perdem sentido. A implementação futura (tabela `gm_imported_history` ou equivalente) deve respeitar estes campos.

---

## Como os dados herdados entram nos relatórios

- **Relatórios "Vendas por período" e "Fecho diário":** Podem incluir linhas de dados herdados (agregados por dia) quando o intervalo solicitado cobre período anterior ao go-live. A UI deve distinguir visualmente (ex.: badge "Importado" ou secção "Histórico anterior ao ChefiApp") e indicar origem e fidelidade.
- **Comparações mensais:** Totais mensais podem somar dados nativos + dados herdados do mesmo mês, desde que a origem esteja visível (ex.: "Jan 2026: 1.234 € (nativo) + 560 € (importado)").
- **Data Mode:** Dados herdados são tratados como dados reais (não simulação) quando `dataMode === "live"`; a bandeira "simulação" não se aplica a histórico importado com fidelidade conhecida.

---

## Ritual de transição com memória

**Mensagem operacional (pré-live):**

_"Antes de ligar ao vivo, queres trazer a tua história?"_

Mesmo que seja só um CSV simples ou totais mensais, o gesto importa tanto quanto o dado: o Dono não começa do zero; o sistema assume a história passada do restaurante.

**Ponto de entrada definido (futuro):** Um único canal oficial de ingestão (ex.: upload CSV na área de relatórios ou API de importação) que persiste em tabela de histórico importado e expõe `source_system`, `period_*`, `data_type`, `fidelity`. Não é obrigatório implementar na FASE 5; o que é obrigatório é que este contrato e modelo existam para quando a funcionalidade for construída.

---

## O que NÃO é necessário agora

- ETL complexo.
- Integração com todos os TPVs do mercado.
- UI completa de importação com validação em tempo real.
- Migração automática de dados de outros sistemas.

Só é necessário: **contrato** (dados herdados vs nativos), **modelo** (campos acima), **ponto de entrada definido** (CSV ou API, documentado).

---

## Resumo em uma frase

O sistema já sabe dizer a verdade sobre o presente; este documento assume oficialmente a história passada do restaurante e define como dados externos (herdados) entram no modelo e nos relatórios.

**Status Passo 1.5:** Contrato, modelo e ponto de entrada (CSV/API) documentados; critério de aceite cumprido. Implementação (tabela gm_imported_history, UI de upload) fica para quando a funcionalidade for construída.

Última atualização: 2026-02-01.
