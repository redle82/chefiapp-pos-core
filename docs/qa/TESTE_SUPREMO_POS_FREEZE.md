# Teste Supremo pós-freeze — checklist QA

**Objectivo:** Validar que, após o corte estrutural e freeze, o sistema está operacional, coerente, soberano e livre de legado (sem código legado, sem redirects ilegítimos, Kernel soberano, Core ON, TPV/KDS vivos, DB coerente).

**Referências:** [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md); [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md); script [scripts/test-supremo-pos-freeze.sh](../../scripts/test-supremo-pos-freeze.sh).

---

## 1. Automático (obrigatório primeiro)

Correr primeiro:

```bash
./scripts/test-supremo-pos-freeze.sh
```

Flags opcionais: `--skip-docker` (não subir Docker), `--skip-db` (não executar queries DB), `--allow-dirty` (não falhar em git sujo).

**Se o script falhar, não prosseguir.** Corrigir os passos assinalados com falha antes dos manuais.

---

## 2. Manual obrigatório (passos 3–7)

Após o script passar, executar na ordem:

| # | Passo | Acção | Resultado esperado |
|---|--------|--------|---------------------|
| 3 | Frontend arranque | `npm run dev` em merchant-portal; abrir http://localhost:5175 | Logs: [Runtime] Mode, [CoreHealth] Status; nenhum loop de redirect; nenhum spam de log repetido. (Porta oficial: 5175; ver vite.config ou VITE_PORT.) |
| 4 | Navegação soberana (FlowGate) | Aceder /, /app/dashboard, /app/install; Core OFF e Core ON | / vai para /auth ou /app/dashboard conforme estado; /app/dashboard nunca redirecciona para /; /app/install nunca redirecciona para landing; Core OFF = "Operação bloqueada"; Core ON = "Operação pronta". |
| 5 | Bootstrap / Restaurante | Criar restaurante novo; entrar no dashboard | gm_restaurants populado; restaurant_id válido; nome do restaurante visível (header + sidebar); estado operacional correto; nenhum banner trial/primeira venda/atalho mágico. |
| 6 | Ritual de instalação de terminais | Aceder /app/install; instalar 1 TPV e 1 KDS | gm_equipment populado; device_id persistido; terminal aparece Online; heartbeat ativo; nenhum redirect para landing. |
| 7 | Operação real (TPV → KDS → Fecho) | Abrir TPV; abrir turno; criar pedido; enviar para KDS; marcar pronto; fechar pedido/turno | gm_orders, gm_order_items, gm_cash_registers actualizados; KDS reage em tempo real; Kernel reflete estado correcto; nenhuma lógica mock. |

---

## 3. Conclusão

Se **automático + manual** estiverem OK, declarar:

**«O sistema está operacional, coerente, soberano e livre de legado.»**

Opcional:

```bash
git tag operational-freeze-v1
git push --tags
```

---

## 4. Referências

- [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md) — Padrões e módulos proibidos de reintrodução.
- [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md) — FlowGate + ORE; destino canónico /app/dashboard.
- [scripts/test-supremo-pos-freeze.sh](../../scripts/test-supremo-pos-freeze.sh) — Script de auditoria automática (passos 0, 1, 2, 8, 9).
