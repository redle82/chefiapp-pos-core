# Genesis Protocol: The Proof Specification
**Status:** DRAFT (Canonical Truth)
**Objective:** Define "Quem valida o quê, como e quando".

## O Triunvirato
A verdade nasce quando os 3 concordam:
1.  🟦 **CORE (Lei):** "Isso é permitido."
2.  🟨 **KERNEL (Estado):** "Estamos aqui."
3.  🟥 **PROOF (Validador):** "Isso foi cumprido."

---

## Matriz de Validação (The Proof Matrix)

### Layer 0: Void (Código/Existência)
*   **Gate:** `no_critical_bloat`
    *   **Validator:** `tsc -b` (Build limpo)
    *   **Critério:** Exit Code 0.
*   **Gate:** `routes_alive`
    *   **Validator:** `playwright` (Testes E2E de navegação)
    *   **Critério:** Todos os cenários críticos (TPV, Setup) passam.
*   **Gate:** `env_sanitized`
    *   **Validator:** `grep` (Busca por segredos)
    *   **Critério:** Zero ocorrências de chaves vivas.

### Layer 1: Universe (Dados/Verdade)
*   **Gate:** `db_reachable`
    *   **Validator:** `ping_supabase` (Conexão direta via SDK)
    *   **Critério:** Resposta de ping < 2s.
*   **Gate:** `schema_valid`
    *   **Validator:** `check_tables` (Query de metadados)
    *   **Critério:** Tabelas críticas (`companies`, `orders`) existem.
*   **Gate:** `seed_verified`
    *   **Validator:** `check_pilot` (Query de negócio)
    *   **Critério:** Entidade "Sophia Gastrobar" existe. (WARN se fail, não BLOCK).

### Layer 2: State (Lógica/Regras)
*   **Gate:** `pricing_logic_valid`
    *   **Validator:** `unit_test_pricing` (Testes isolados)
    *   **Critério:** `price + tax - discount == total`.
*   **Gate:** `state_consistency`
    *   **Validator:** `simulation_run`
    *   **Critério:** Estado final == Estado esperado após N eventos.

### Layer 3: Action (Verbos/Segurança)
*   **Gate:** `rbac_enforced`
    *   **Validator:** `security_scan` (Tentativa de acesso não autorizado)
    *   **Critério:** 403 Forbidden em rotas protegidas.
*   **Gate:** `flow_complete`
    *   **Validator:** `e2e_critical_path`
    *   **Critério:** Order -> Kitchen -> Pay -> Receipt com sucesso.

---

## Mecanismo de Prova (The Mechanism)
1.  **Trigger:** O desenvolvedor executa `npm run genesis:prove`.
2.  **Execution:** O script roda todos os validadores da camada atual.
3.  **Signing:** Se PASS, gera um JSON assinado com Timestamp e Hash.
4.  **Verdict:** O Kernel lê o JSON na próxima inicialização/CI e desbloqueia o sistema.

> "O Proof não decide. O Proof atesta fatos. O Kernel decide."
