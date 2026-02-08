# Rota — Multi-Unidade (Web de Configuração)

**Path exato:** `/groups`  
**Tipo:** WEB CONFIG  
**Estado atual:** DOCUMENTADO (UI/backend em evolução; rota presente no dashboard como “EM EVOLUÇÃO”).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** Para donos com mais de um local — ver e comparar unidades (vendas, desempenho, benchmarks), gerir grupos de restaurantes e eventualmente configuração partilhada. Um único local usa esta rota como “pronto para o futuro”.
- **Para quem é:** Dono apenas — web de configuração.
- **Em que momento do ciclo de vida:** TRIAL e ACTIVE; em SETUP pode mostrar estado vazio (“Um único restaurante configurado. Multi-unidade disponível quando tiver mais locais.”).

---

## 2. Rota & Acesso

- **Path:** `/groups`
- **Tipo:** WEB CONFIG.
- **Guard aplicado:** CoreFlow — ALLOW para hasOrg; nunca bloquear por systemState nem por billing.
- **Comportamento por SystemState:**
  - **SETUP:** ALLOW; estado vazio ou mensagem de “um único restaurante”.
  - **TRIAL:** ALLOW; se houver mais de um tenant/restaurante, mostrar lista e benchmarks; senão estado vazio honesto.
  - **ACTIVE:** ALLOW; idem.
  - **SUSPENDED:** ALLOW leitura; escritas (criar grupo, alterar associações) conforme política.

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant (ou tenants), Orders/Payments agregados por restaurante, Shifts por unidade. Referência: modelo pode incluir `operation_type: 'MULTIUNIDADE'` (docker-core/types).
- **Entidades escritas:** Grupos de restaurantes, associações tenant–grupo (quando implementado).
- **Eventos gerados:** Leitura de dados agregados; eventos de “grupo criado” ou “unidade adicionada” quando existirem no Core.

---

## 4. Backend & Dados

- **Tabelas envolvidas (nome lógico):** `restaurants` (multi-tenant), `groups` ou `restaurant_groups`, tabelas de agregação por tenant. RPCs esperadas: ex. `list_restaurants_by_owner`, `get_group_benchmarks`, `get_sales_by_unit`. Se não existirem, estado vazio.
- **Backend local:** Docker/Supabase local; comportamento idêntico: sem dados = estado vazio honesto.
- **Estado vazio honesto:** “Um único restaurante configurado.” / “Multi-unidade estará disponível quando tiver mais locais.”

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — um único restaurante; mensagem clara; sem “demo”. (2) **Em uso** — lista de unidades, comparação de vendas/desempenho, filtros por período. (3) **Erro** — “Não foi possível carregar os dados das unidades. Tente novamente.”
- **Mensagens:** Sem “demo”; dados reais.
- **CTAs:** “Ver por unidade”, “Comparar período”, “Adicionar unidade” (quando suportado).

---

## 6. Integração com Outras Rotas

- **De onde vem:** Dashboard (módulo Multi-Unidade).
- **Para onde vai:** Dashboard, Config (por unidade), Financeiro (totais por unidade).
- **Dependências:** Não depende de TPV/KDS ativos; depende de modelo multi-tenant quando houver mais de um restaurante.

---

## 7. Regras de Negócio

- **Permitido:** Ver unidades e benchmarks quando existirem; estado vazio quando só há um restaurante.
- **Bloqueado:** Não bloquear a rota por billing; não inventar “unidades de demonstração”.
- **Regra de ouro:** Multi-unidade é funcionalidade real para donos com vários locais; um único local = mensagem honesta, não demo.

---

## 8. Estado Atual

- **Estado:** DOCUMENTADO — rota listada no dashboard em “EM EVOLUÇÃO”; implementação completa pendente.
- **Próximo passo técnico:** (1) Garantir `/groups` em `isWebConfigPath` se necessário; (2) Definir modelo de grupos/unidades no Core ou Supabase; (3) Implementar página com estado vazio e depois lista/benchmarks quando houver dados.
