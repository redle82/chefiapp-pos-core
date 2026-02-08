# Backoffice Linear — especificação (estilo GloriaFood)

**Status:** ESPECIFICAÇÃO PARA IMPLEMENTAÇÃO
**Relacionado:** [SETUP_LINEAR_VS_SYSTEM_TREE.md](SETUP_LINEAR_VS_SYSTEM_TREE.md)

---

## 1. Objetivo

Uma **sidebar esquerda simples** com itens de setup, cada um com estado claro e clique → tela direta. Sem árvore, sem filosofia. Fluxo que instala restaurante em ~20 minutos.

---

## 2. Estrutura do menu (sidebar)

Ordem sugerida (fluxo natural):

| #   | Item         | Ícone | Rota sugerida                   | Dados por baixo (reaproveitar)      |
| --- | ------------ | ----- | ------------------------------- | ----------------------------------- |
| 1   | Cardápio     | 📋    | `/app/setup/menu`               | `setup_status.menu`, menu Core/mock |
| 2   | Mesas        | 🪑    | `/app/setup/mesas`              | `setup_status.location`, gm_tables  |
| 3   | Equipe       | 👥    | `/app/setup/equipe`             | `setup_status.people`               |
| 4   | Horários     | 🕒    | `/app/setup/horarios`           | `setup_status.schedule`             |
| 5   | Pagamentos   | 💳    | `/app/setup/pagamentos`         | `setup_status.payments`             |
| 6   | TPV          | 🧾    | `/app/setup/tpv`                | módulo tpv, instalado/ativo         |
| 7   | KDS          | 🔥    | `/app/setup/kds`                | módulo kds                          |
| 8   | Estoque      | 📦    | `/app/setup/estoque` (opcional) | inventory/mock                      |
| 9   | Preferências | ⚙️    | `/app/setup/preferencias`       | config, runtime                     |

Cada item:

- **Label** curto (ex.: "Cardápio", "Mesas").
- **Estado:** ❌ incompleto | ⚠️ parcial | ✅ pronto (um único indicador visual).
- **Clique** → navega para a rota; **sem** subníveis na sidebar (tudo linear).

---

## 3. Estados (por item)

- **incompleto:** `setup_status[chave] === false` ou não definido.
- **parcial:** (opcional) ex.: cardápio com categorias mas sem produtos; mesas criadas mas sem mapa.
- **pronto:** `setup_status[chave] === true` (ou equivalente para módulos: instalado + ativo).

Fonte de verdade: **mesmo** `setup_status` e `installed_modules` / `active_modules` que o System Tree e o RestaurantRuntimeContext já usam. Nada novo no Core; só nova UX em cima.

---

## 4. Dependências (mínimas para “Pronto” no topo)

- **Cardápio:** pode ser primeiro (sem dependência obrigatória).
- **Mesas:** pode ser segundo (opcional: depois de identidade/local).
- **Equipe, Horários, Pagamentos:** independentes entre si na ordem da tabela.
- **TPV / KDS:** podem depender de “Pagamentos” e “Cardápio” como “recomendado”, mas não bloquear navegação — só indicar “recomendado completar X antes”.

Nada de árvore de dependências na UI; no máximo um badge “Recomendado: completar Cardápio” ao lado de TPV.

---

## 5. O que reaproveitar (sem mexer no que já existe)

- **RestaurantRuntimeContext:** `runtime.setup_status`, `runtime.installed_modules`, `runtime.active_modules`.
- **RuntimeReader / RuntimeWriter:** leitura e persistência de `setup_status` e módulos (Core ou mock).
- **Páginas/ secções já existentes:** Onboarding (LocationSection, MenuSection, ScheduleSection, PeopleSection, PaymentsSection, etc.) podem ser **reutilizadas** como conteúdo das rotas do Backoffice Linear; só falta definir rotas e a sidebar.
- **System Tree:** permanece como está; vira “Visão do Sistema” / “Diagnóstico” acessível por um link ou aba, não como substituto deste menu.

---

## 6. Regra de ouro

**Nenhuma decisão de sistema nasce no Backoffice Linear.**

Ele só:

- mostra estado
- permite completar
- recomenda próximo passo

As regras continuam no Core, no Runtime e no System Tree. O Backoffice Linear **organiza o acesso**; não cria lógica nova.

---

## 7. O que NÃO mexer

- System Tree (lógica, dados, contratos).
- Core (gm_restaurants, restaurant_setup_status, installed_modules).
- Fluxos de auth/FlowGate já ajustados para Docker.
- Módulos mock vs Core já migrados.

---

## 8. Entregável sugerido (próximo passo)

1. **Uma rota** (ex.: `/app/backoffice` ou `/app/setup`) que renderiza **só** a sidebar linear + área de conteúdo.
2. **Sidebar:** lista fixa com os 9 itens acima; cada um com estado derivado de `runtime.setup_status` / módulos; clique = `navigate(rota)`.
3. **Conteúdo:** reutilizar as secções atuais do onboarding (ou telas de config existentes) nas rotas indicadas, sem duplicar lógica — só encaminhar para as mesmas páginas ou componentes que já atualizam `setup_status` e módulos.

Assim mantemos “mapa” (System Tree) e “estrada” (Backoffice Linear) separados, com os mesmos dados por baixo.
