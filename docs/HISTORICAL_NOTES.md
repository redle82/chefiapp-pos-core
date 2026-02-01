# Notas sobre documentação histórica

**Status:** Canónico  
**Objetivo:** Contextualizar documentação antiga sem reescrever a história.

---

## Nota sobre portas históricas

Alguns documentos antigos (audit, archive, pilots, runbooks antigos) referem a porta **5173**.

Essa porta foi usada em fases iniciais do projeto.

👉 **A porta canónica atual do Merchant Portal é 5175**, conforme definido em [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md).

Documentos históricos são mantidos como estão para **contexto e auditoria**. Não são atualizados retroativamente.

---

## Regra de ouro

- **Contrato canónico manda.** (Runtime, rotas, porta oficial.)
- **Docs históricos explicam.** (Memória do projeto.)
- **Código executa.** (Vite, testes, scripts vivos usam 5175.)

Em caso de dúvida sobre porta ou URL do portal: usar **localhost:5175** e o contrato de runtime.
