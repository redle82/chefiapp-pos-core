# Contrato: Header Operacional (Identidade)

**Propósito:** Definir o novo topo do dashboard em modo OPERATIONAL_OS: **sujeito da frase = restaurante**, não produto. Documento de contrato apenas; implementação em sprint seguinte.

**Referências:** [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md), [CURRENT_SYSTEM_MAP.md](../architecture/CURRENT_SYSTEM_MAP.md), [ROADMAP_POS_FREEZE.md](../strategy/ROADMAP_POS_FREEZE.md).

---

## 1. Princípio

**Hoje o dashboard começa implicitamente com: "ChefIApp OS".**

**A verdade operacional é: "Restaurante X está em operação / bloqueado".**

O novo header comunica essa verdade: o primeiro elemento visual é o **restaurante**, não a marca do produto. Isso ancora a UI num ente real, faz o operador sentir "isto é o meu restaurante" e prepara o terreno para terminais e pessoas (gm_staff como primeira entidade humana visível).

---

## 2. Estrutura do novo topo

O topo do dashboard (e da sidebar) deve mostrar, nesta ordem:

1. **Restaurante**
   - Nome do restaurante (ex.: "SEED ENTERPRISE", "Restaurante (Pilot)").
   - Uma única linha; fonte de destaque; primeiro elemento que o olho vê.

2. **Estado**
   - Uma linha compacta: **Operação Pronta | Core ON | Turno Aberto** (ou Bloqueada / Core OFF / Turno Fechado conforme o estado real).
   - Não repetir blocos; uma única frase de estado.

3. **Operador actual** (quando aplicável)
   - Quando existe turno aberto: quem abriu o turno (ex.: "Gerente", "Caixa Principal — João").
   - Fonte: turno activo (CashRegister) → `opened_by`; quando existir gm_staff / gm_restaurant_members, resolver identificador para nome/role para exibir "Operador actual: [nome ou role]".
   - Quando não há turno aberto: omitir ou mostrar "—" para não inventar.

Nada mais no topo. Sem "ChefIApp OS" como título principal; a marca pode ficar em rodapé ou logotipo pequeno, mas não como sujeito da página.

---

## 3. Sidebar ancorada no restaurante

- **Título da sidebar:** Nome do restaurante (mesma fonte que no header do centro).
- **Subtítulo da sidebar:** "Estado: Pronta" ou "Estado: Operação bloqueada" (já definido no OPERATIONAL_DASHBOARD_V2_CONTRACT).
- Não usar "ChefIApp OS" ou "Estado do sistema" como título da sidebar quando houver restaurante seleccionado. Quando não houver restaurante (fluxo de seleção de tenant / bootstrap), aí sim pode aparecer "ChefIApp OS" ou "Seleccionar restaurante".

Ou seja: a sidebar responde à pergunta "O que impede ou permite **este restaurante** operar agora?" — não "o que impede o sistema genérico".

---

## 4. Fontes de dados (mapeamento backend ↔ UI)

| Elemento no header | Fonte de verdade | Notas |
|--------------------|------------------|--------|
| **Nome do restaurante** | `gm_restaurants.name` via RuntimeReader.fetchRestaurantForIdentity(restaurantId) ou TenantContext (restaurant?.name, memberships[].restaurant_name) | RestaurantRuntimeContext tem restaurant_id; identidade (name) vem do Core (gm_restaurants) ou do tenant resolver. |
| **Estado operação (Pronta/Bloqueada)** | ORE / preflight: usePreflightOperational(), computePreflight() | Já usado no OperacaoCard. |
| **Core ON/OFF** | Preflight (blockers CORE_OFFLINE) ou core health | Já usado na primeira dobra. |
| **Turno Aberto/Fechado** | ShiftContext.isShiftOpen; CashRegisterEngine.getOpenCashRegister(restaurantId) | Já usado. |
| **Operador actual (turno)** | Turno activo: CashRegister.opened_by, CashRegister.name (ex.: "Caixa Principal"). Quando existir: gm_restaurant_members ou gm_staff para resolver opened_by → nome/role | Hoje opened_by pode ser identificador ou label; quando gm_staff estiver visível como entidade, mostrar "Operador actual: [nome]" ou "Turno: [name] — [role]". |

Nenhuma destas fontes é inventada: todas existem no código ou no Core (gm_restaurants, gm_cash_registers, futuramente gm_terminals, gm_staff / gm_restaurant_members).

---

## 5. Como isto muda a leitura de toda a UI (sem redesenhar tudo)

- **Antes:** O utilizador vê "ChefIApp OS" e uma lista de estados. A pergunta implícita é "em que estado está o sistema?".
- **Depois:** O utilizador vê "Restaurante X" e "Operação Pronta | Core ON | Turno Aberto" (e, se aplicável, "Operador actual: Gerente"). A pergunta implícita passa a ser "em que estado está **este restaurante** e quem está a operar?".

Consequências sem alterar layout de cards nem cores:

- A primeira dobra (OperacaoCard + Core · Turno · Terminais) passa a ser **contexto do restaurante**, não do produto.
- A sidebar deixa de ser "menu do ChefIApp" e passa a ser "mapa do restaurante" (Começar, Operar, Equipa, Gestão).
- O histórico por turno e as métricas passam a ser claramente "deste restaurante".
- Quando existir ritual de instalação de terminais, "TPV Caixa Principal — Online" será naturalmente "do restaurante X", não um botão genérico.

Ou seja: o mesmo layout e os mesmos blocos ganham **sujeito claro**. O redesign cirúrgico (Passo 3) virá depois, quando restaurante, terminais e pessoas já forem entidades visíveis.

---

## 6. O que NÃO fazer neste contrato

- Não definir cores, fontes, tamanhos: isso fica para o Passo 3 (redesign cirúrgico).
- Não obrigar a mudanças no backend: as fontes de dados já existem (gm_restaurants, preflight, shift, CashRegister).
- Não incluir terminais como "objetos vivos" no header: isso é Passo 2 (Ritual de Instalação). No header basta "Terminais: Instalados / Não instalados" na linha de estado, como hoje na primeira dobra.

---

## 7. Ordem de implementação sugerida

1. **Leitura de identidade:** Garantir que o dashboard (e a sidebar) têm acesso ao nome do restaurante (RuntimeReader.fetchRestaurantForIdentity ou TenantContext) a partir de runtime.restaurant_id.
2. **Header do centro:** Substituir o título "Seu Sistema Operacional" + subtítulo genérico por: linha 1 = nome do restaurante; linha 2 = estado (Operação Pronta | Core ON | Turno Aberto).
3. **Sidebar:** Substituir título "ChefIApp OS" por nome do restaurante quando restaurant_id estiver definido; manter subtítulo "Estado: Pronta/Bloqueada".
4. **Operador actual:** Quando houver turno aberto, obter CashRegister.name e opened_by; exibir na primeira dobra ou no header (ex.: "Turno: Caixa Principal — Gerente"). Resolução de opened_by para nome humano quando gm_staff/gm_restaurant_members estiver disponível.

---

Última atualização: Passo 1 — Identidade Operacional; contrato apenas, sem código. Próximo: implementação em sprint; depois Passo 2 (Ritual de Instalação).
