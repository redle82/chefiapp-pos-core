# Auditor de Mudanças Soberano — ChefIApp

**Status:** Contrato de auditoria (ativo)  
**Propósito:** Determinar se uma mudança (PR) viola algum eixo do Mapa de Soberania v1.  
**Referência única:** [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) (secções 2–15).

Este auditor é válido para **humanos (checklist de PR)** e **CI (script automatizado)**.

**Nota sobre falhas atuais (v1):** As falhas atuais no check 2 (escrita/acesso ao Core fora do boundary) representam **dívida técnica conhecida**, não bug do auditor. Ver [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md), secção Riscos AS-IS. O auditor v1 existe para **impedir novas violações** e servir de guia para refatoração progressiva. Uso recomendado: rodar manualmente ou em PRs sensíveis; não ligar em CI global até a dívida ser reduzida ou até implementar check apenas sobre ficheiros alterados (fase 2).

---

## Como usar (workflow de PR)

1. Ler este documento.
2. Responder às perguntas por eixo abaixo.
3. Executar `./scripts/auditor-soberania.sh`.
4. Se algum check falhar: **corrigir** ou **justificar explicitamente** na PR.

---

## EIXO 1 — GOVERNANÇA (quem manda em quem)

**Regra soberana**
- Core governa.
- Runtime espelha.
- Gates bloqueiam (não escrevem).
- UI nunca governa.

**Violação se**
- UI ou Gate altera estado soberano.
- Runtime inventa estado não vindo do Core.

**Verificação**
- Manual (leitura da PR).
- Automática: parcial.

---

## EIXO 2 — FRONTEIRA CORE / RUNTIME / UI

**Regra soberana**
- Escrita em `gm_restaurants`, `orders`, `payments` só via boundary.
- Exceção única documentada: **BootstrapPage** (1º restaurante).

**Violação se**
- Página ou componente escreve diretamente no Core sem RuntimeWriter/DbWriteGate.

**Verificação**
- Automática (script).
- Manual em caso de exceção.

---

## EIXO 3 — GATES & HARD STOPS

**Regra soberana**
- Gates apenas leem e redirecionam.
- Nunca fazem insert/update/upsert/setState persistente.

**Violação se**
- Qualquer ficheiro `*Gate*.ts(x)` fizer escrita.

**Verificação**
- Automática (heurística conservadora).

---

## EIXO 4 — CORE SOBERANO

**Regra soberana**
- Core é fonte de verdade.
- Frontend nunca sobrepõe Core.

**Violação se**
- PR ignora contratos soberanos ativos.

**Verificação**
- Manual (contratos).

---

## EIXO 5 — CONTRATOS ATIVOS

**Regra soberana**
- Contratos 🟢 não podem ser quebrados.
- Contratos 🟡 só evoluem conforme documentado.

**Violação se**
- Mudança quebra contrato 🟢 sem atualizar contrato e índice.

**Verificação**
- Manual (CORE_CONTRACT_INDEX).

---

## EIXOS MANUAIS (v1)

Estes eixos **não são automatizados** nesta versão e exigem revisão humana:

- Runtime não inventa estado.
- State machine respeitada (lifecycle + billing).
- Autoridade por decisão mantida.
- Zonas (livre / sensível / soberana) respeitadas.

Checklist obrigatório na PR.

---

## Resultado

- **PASS:** Nenhuma violação detectada.
- **FAIL:** Violação encontrada → corrigir ou justificar.

Em caso de dúvida: **falhar e rever manualmente**.

---

## Referências

- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) — mapa soberano v1; secções 2–15
- [DIAGRAMAS_SOBERANIA_CHEFIAPP.md](./DIAGRAMAS_SOBERANIA_CHEFIAPP.md) — diagramas Mermaid
- [PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md](./PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md) — guia de refatoração progressiva (check 2)
- `scripts/auditor-soberania.sh` — script de verificação automatizada
