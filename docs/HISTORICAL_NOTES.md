# Notas sobre documentação histórica

**Status:** Canónico
**Objetivo:** Contextualizar documentação antiga sem reescrever a história.

---

## Nota sobre portas históricas

O Merchant Portal passou por 3 eras de portas:

| Era                  | Porta    | Notas                                                      |
| -------------------- | -------- | ---------------------------------------------------------- |
| Era 0 (legacy)       | **5157** | Configuração inicial pré-Vite                              |
| Era 1 (Vite default) | **5173** | Porta padrão do Vite; nunca foi explicitamente configurada |
| Era 2 (canónica)     | **5175** | Porta explícita em `vite.config.ts`; é a **porta oficial** |

Documentos antigos (audit, archive, pilots, runbooks) podem referir **5157** ou **5173**. Ambas são obsoletas.

👉 **A porta oficial do Merchant Portal é 5175**, conforme definido em [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md).

---

## Regra de ouro

- **Contrato canónico manda.** (Runtime, rotas, porta oficial.)
- **Docs históricos explicam.** (Memória do projeto.)
- **Porta oficial do portal:** **5175** (não mudar).

Em caso de dúvida sobre porta ou URL do portal: usar **localhost:5175** e o contrato de runtime.
