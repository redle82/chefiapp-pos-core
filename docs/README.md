# 📚 Documentação - Sistema Nervoso Operacional

**ChefIApp: O TPV que Pensa**

---

## 🎯 Visão Geral

Este diretório contém toda a documentação do projeto de transformação do ChefIApp em um **Sistema Nervoso Operacional**.

**Filosofia:** *"Last.app organiza o restaurante. ChefIApp deve guiá-lo."*

---

## ⚠️ Documentação histórica

Documentos em `audit/`, `archive/`, `pilots/` e outros runbooks antigos podem referir a porta **5173**. Essa porta foi usada em fases iniciais do projeto.

👉 **Porta oficial do portal:** **5157** ([CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md)).
👉 **Nota completa:** [HISTORICAL_NOTES.md](./HISTORICAL_NOTES.md).

👉 **Índice de todos os MDs:** [INDICE_MDS.md](./INDICE_MDS.md) — entradas canónicas (README, architecture, contracts, auditoria).

---

## 📖 Documentos Canónicos (fonte de verdade)

> Regra do projeto: **este README não referencia ficheiros inexistentes**.
> O índice canónico de documentação vive em **[INDICE_MDS.md](./INDICE_MDS.md)**.

### Entradas canónicas
- **[INDICE_MDS.md](./INDICE_MDS.md)** — índice único (o que existe e o que é canónico)
- **[Architecture README](./architecture/README.md)** — entrada canónica de arquitetura
- **[Contracts README](./contracts/README.md)** — entrada canónica de contratos
- **[CAMINHO_DO_CLIENTE.md](./architecture/CAMINHO_DO_CLIENTE.md)** — visão produto: fluxo do cliente (Landing → Signup → Portal → Billing → Operação)
- **[CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md)** — runtime/rotas/porta oficial do portal (5157)

### Documentos “principais” (planeados / em evolução)
Os itens abaixo fazem parte do roadmap documental, mas **podem ainda não existir**. O acesso deve ser feito via **INDICE_MDS** (que só lista o que existe).

- RESUMO_EXECUTIVO.md
- MANIFESTO_COMERCIAL.md
- PLANO_ROLLOUT.md
- EXECUCAO_30_DIAS.md
- VALIDACAO_RAPIDA.md
- GUIA_RAPIDO_GARCOM.md
- TROUBLESHOOTING.md
- ARQUITETURA_VISUAL.md
- SETUP_DEPLOY.md
- INDICE_COMPLETO.md
- METRICAS_KPIS.md
- MANUTENCAO_CONTINUA.md
- HANDOFF_EQUIPE.md
- QUICK_WINS.md

---

## 🗂️ Estrutura por Tipo

### Para Desenvolvedores
- `EXECUCAO_30_DIAS.md` - Implementação técnica
- `VALIDACAO_RAPIDA.md` - Testes e validação
- `ARQUITETURA_VISUAL.md` - Diagramas e fluxos
- `TROUBLESHOOTING.md` - Debug e resolução

### Para Vendas/Marketing
- `MANIFESTO_COMERCIAL.md` - Proposta de valor
- `PLANO_ROLLOUT.md` - Estratégia de lançamento
- `RESUMO_EXECUTIVO.md` - Visão geral executiva

### Para Usuários Finais
- `GUIA_RAPIDO_GARCOM.md` - Manual do garçom

### Para Gestão
- `RESUMO_EXECUTIVO.md` - Visão geral
- `PLANO_ROLLOUT.md` - Planejamento estratégico

---

## 🎯 Funcionalidades Implementadas

> Nota: esta secção é um **placeholder** e deve refletir apenas o que está comprovado no código e/ou contratos canónicos.
> Até validação final, consulte **INDICE_MDS.md** e **docs/architecture/** para status real.

---

## 📊 Métricas e KPIs

> Nota: KPIs e metas aqui devem ser mantidos apenas quando existirem medições reais e referência a um documento canónico.
> Até lá, usar o índice canónico: **[INDICE_MDS.md](./INDICE_MDS.md)**.

---

## 🚀 Próximos Passos

1. **Abrir o Portal (porta canónica 5175)** → http://localhost:5175
2. **Validar contratos e rotas** → `docs/architecture/CORE_CONTRACT_INDEX.md`
3. **Auditar referências de docs** → `./scripts/audit-md-references.sh`
4. **Auditar contratos referenciados** → `./scripts/audit-contracts-referenced.sh`
5. **Setup/Deploy** → seguir a entrada canónica em `docs/architecture/README.md`

## 🛠️ Scripts Úteis

### Validação Automatizada
```bash
./scripts/validate-system.sh
```
Valida estrutura de arquivos, imports e documentação.

---

## 📞 Contato e Suporte

**Documentação técnica:** Ver `EXECUCAO_30_DIAS.md`
**Dúvidas comerciais:** Ver `MANIFESTO_COMERCIAL.md`
**Treinamento:** Ver `GUIA_RAPIDO_GARCOM.md`
**Problemas técnicos:** Ver `TROUBLESHOOTING.md`
**Arquitetura:** Ver `ARQUITETURA_VISUAL.md`
**Setup/Deploy:** Ver `SETUP_DEPLOY.md`
**Índice completo:** Ver `INDICE_COMPLETO.md`

---

## 🔄 Atualizações

**Última atualização:** 2026-01-31
**Versão:** Sistema Nervoso Operacional v1.0
**Status:** ✅ Pronto para Validação

---

**Frase Final:**
*"Last.app organiza o restaurante. ChefIApp deve guiá-lo."*
