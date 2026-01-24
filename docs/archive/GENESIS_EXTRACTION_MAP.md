# Genesis Map: Future Extraction Plan (Phase L)
**Status:** FROZEN (Planning Only)
**Trigger Event:** > 10 Active Tenants OR > 1000 Weekly Orders.

## A Extração (The Surgery)
Esta é a estratégia técnica para separar o `ChefApp` do `Empire` (Core) quando a escala exigir.

### 1. The Shell (Camada 00)
*   **Atual:** `App.tsx` contém estado do produto.
*   **Futuro:** `App.tsx` torna-se `EmpireShell`.
    *   `src/apps/chefiapp/*`: Novo diretório raiz.
    *   `EmpireShell` monta `ChefApp` como um componente dinâmico.

### 2. The Data Adapter (Camada 01/02)
*   **Atual:** ChefApp importa `supabase.ts` direto.
*   **Futuro:** Dependency Injection.
    *   Interface: `StorageAdapter` (definida no Core).
    *   Implementação: `SupabaseStorage` (injetada no runtime).
    *   O ChefApp não saberá que o banco é Supabase.

### 3. The Action Bus (Camada 03)
*   **Atual:** ChefApp chama funções globais.
*   **Futuro:** Event Bus.
    *   ChefApp emite: `intent:ORDER_CREATED`.
    *   Empire escuta e persiste.
    *   Isolamento total de efeitos colaterais.

### 4. The Intelligence Layer (Camada 05)
*   **Atual:** GoldMonkey lê UI state.
*   **Futuro:** GoldMonkey lê `EventStream`.
    *   A IA torna-se um observador passivo do Barramento de Eventos, invisível para a UI.

---

## 🚦 Critérios de Gatilho (Quando executar?)
Não executaremos este plano até que UM destes seja verdade:
1.  **Metric:** Custo de manutenção do monólito > Custo de refatoração.
2.  **Product:** Necessidade de lançar um Segundo Produto ("BioShare") no mesmo Core.
3.  **Scale:** Performance do banco exige Sharding por Tenant.

Até lá: **MONOLITH IS KING.**
