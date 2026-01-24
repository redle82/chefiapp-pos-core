# Auditoria Genesis: ChefApp (Manifesto de Verdade)
**Alvo:** ChefApp (Product Layer)
**Contexto:** Tentativa de desacoplamento do "Empire" (Core/Infrastructure).
**Status:** AUDIT IN PROGRESS

## ❓ Hipótese Central
"ChefApp nasceu como produto antes de nascer como mundo."
Se isso for verdade, ele viola a ordem ontológica do Genesis, tornando impossível removê-lo sem destruir o projeto.

---

## 🟦 CAMADA 00 — VOID (Existência Independente)
**Pergunta:** O ChefApp existe como shell isolado?
*   [ ] **Shell Isolation:** Existe um `ChefAppLayout` ou `ChefAppRoot` que não depende de `App.tsx` global?
*   [ ] **Render Isolation:** Ele renderiza sem `AuthProvider` global? (Ou tem seu próprio?)
*   [ ] **Config Isolation:** Ele lê `CONFIG` direto ou recebe via props/contexto injetado?

**Veredito Preliminar:**
*   Em `src/App.tsx`, vemos estados misturados (`menuItemName`, `designLevel`) junto com infra (`stripePk`).
*   **Sinal de Alerta:** O estado do produto está na raiz da aplicação.

---

## 🟨 CAMADA 01 — WORLD (Contexto & Fronteiras)
**Pergunta:** O ChefApp é um inquilino ou o dono da casa?
*   [ ] **Tenant Identity:** O ChefApp sabe que é um "App" dentro de um "SO"?
*   [ ] **Routing:** As rotas `/app/*` são exclusivas dele ou misturadas?
*   [ ] **Dependency:** Ele importa `src/core/supabase` diretamente? (Violação se Core for externo).

**Veredito Preliminar:**
*   `src/pages/TPV` importa `useOrders` que importa `supabase` direto.
*   Acoplamento Hard: ChefApp depende da implementação específica de banco do Core.

---

## 🟧 CAMADA 02 — STATE (Verdade & Schema)
**Pergunta:** A verdade do ChefApp é dele mesmo?
*   [ ] **Schema Ownership:** `orders`, `products` são tabelas do ChefApp ou do Core?
*   [ ] **Read-Only Mode:** O ChefApp funciona se o banco estiver em manutenção (só UI)?

**Veredito Preliminar:**
*   A lógica de negócio (`OrderContext`) está fortemente ligada ao Supabase Realtime.
*   Não parece haver uma camada de abstração (Adapter) entre ChefApp e Dados.

---

## 🟥 CAMADA 03 — ACTION (Ação & Permissão)
**Pergunta:** Quem autoriza as ações do ChefApp?
*   [ ] **RBAC:** O ChefApp define seus próprios papéis (`manager`, `waiter`) ou usa os do Core?
*   [ ] **Action Isolation:** `createOrder` é uma função importável ou um hook global?

---

## 🏁 Conclusão do Auditor (Provisória)
O ChefApp não é um módulo. Ele **É** a aplicação atual.
Para "tirar" o ChefApp, precisaríamos refatorar `App.tsx` para ser um container genérico (Empire Shell) que monta o `ChefApp` como um plugin.

**Ação Recomendada:**
Não tentar separar agora. Aceitar que este repositório **é** o ChefApp Monolith por enquanto.
Se o objetivo for Multitenancy real ou Multi-App, a "Opção B (Renascimento)" é o único caminho: criar um novo repo `chefiapp-next` e mover peças limpas para lá, deixando o `merchant-portal` como o "Legacy Monolith" que funciona.

Mas, para a **Operation K (Pilot)**, isso não impede o sucesso.
O acoplamento é ruim para expansão, mas ótimo para estabilidade de um único produto.

**Decisão Genesis:**
Manter acoplamento para a Fase K.
Marcar refatoração para Fase L (Scalability).
