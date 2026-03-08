# Notas sobre documentação histórica

**Status:** Canónico  
**Objetivo:** Contextualizar documentação antiga sem reescrever a história.

---

## Nota sobre portas históricas

Alguns documentos antigos (audit, archive, pilots, runbooks antigos) referem a porta **5173**.

Essa porta foi usada em fases iniciais do projeto.

👉 **A porta oficial do Merchant Portal é 5157**, conforme definido em [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md).

Documentos históricos são mantidos como estão para **contexto e auditoria**. Não são atualizados retroativamente.

---

## Regra de ouro

- **Contrato canónico manda.** (Runtime, rotas, porta oficial.)
- **Docs históricos explicam.** (Memória do projeto.)
- **Porta oficial do portal:** **5157** (não mudar).

Em caso de dúvida sobre porta ou URL do portal: usar **localhost:5157** e o contrato de runtime.
