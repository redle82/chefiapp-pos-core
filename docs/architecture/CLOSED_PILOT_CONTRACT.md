# Closed Pilot Contract — ChefIApp

**Status:** CANONICAL  
**Tipo:** Contrato de escopo fechado (Pilot Law)  
**Local:** docs/architecture/CLOSED_PILOT_CONTRACT.md  
**Hierarquia:** Subordinado ao [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md)  
**Autoridade:** Core Docker (Financial Core)

---

## 0. Lei do Contrato

Este contrato define o **ÚNICO** escopo válido do piloto do ChefIApp.

- Tudo o que estiver explicitamente definido aqui **DEVE** funcionar.
- Tudo o que **não** estiver aqui **NÃO** é feito neste piloto, mesmo que exista no sistema.

Este contrato tem precedência sobre: ideias, backlog, melhorias, desejos futuros, "já que estamos aqui…".

---

## 1. Cenário Único do Piloto (Scope Fixo)

O piloto é **exatamente** este cenário:

| Elemento | Escopo |
|----------|--------|
| Restaurante | 1 restaurante, 1 local físico |
| Dono | 1 dono presente |
| TPV | 1 TPV central |
| KDS | 1 KDS na cozinha |
| AppStaff | 2–5 pessoas |
| **Pedidos** | TPV central, AppStaff (mini TPV), Web Pública (QR mesa) |
| Internet | Presente; pode falhar temporariamente |
| Pagamento | 1 gateway único |
| Impressão | Opcional |
| Offline | Degradação graciosa, não autonomia total |

**Nenhum** outro cenário (multi-local, franquia, marketplace, delivery externo, etc.) faz parte deste piloto.

---

## 2. Autoridade e Verdade (Não negociável)

### 2.1 Autoridade Máxima

O **Core Financeiro Docker** é a única autoridade para:

- pedidos
- totais
- estados financeiros
- caixa
- reconciliação

Se houver conflito entre UI, AppStaff, KDS, TPV, Web ou qualquer cache → **o Core Docker vence sempre.**

### 2.2 Supabase (Tolerância Controlada)

Durante o piloto, é **explicitamente tolerado**:

- Supabase **apenas** para: autenticação, verificação de sessão, identidade temporária de utilizador.

Supabase **NÃO PODE** ser autoridade para: totais, pagamentos, caixa, reconciliação, criação de pedidos finais.

Qualquer uso fora disso é **violação do piloto.**

---

## 3. Fluxo Único de Pagamento

O piloto opera com **UM** único gateway de pagamento.

**Características obrigatórias:**

- Um único fluxo: **INIT → AUTH → PAID → RECONCILED**
- Sem split
- Sem fallback automático
- Sem simulação de sucesso
- Sem pagamento "offline"

Se o pagamento falhar: o estado fica claro, o operador entende o que aconteceu, o Core mantém consistência.

---

## 4. Instalação Mínima (Obrigatória)

Este piloto exige uma **instalação mínima funcional**.

### 4.1 Terminais (TPV, KDS)

Devem:

- iniciar
- registrar-se no Core
- receber um `terminal_id`
- passar a operar sem setup manual recorrente

**Não** é exigido: criptografia avançada, provisioning enterprise, MDM, hardware trust completo.

**É** exigido: funcionamento real, previsibilidade, repetibilidade.

---

## 5. Heartbeat Simples (Obrigatório)

O piloto exige um **heartbeat funcional**.

**Regras mínimas:**

- Cada terminal envia um "I'm alive" periódico.
- O Core distingue: **ONLINE** | **OFFLINE**.
- OFFLINE não é erro lógico; é **estado operacional**.

Sem heartbeat, o piloto **não** é considerado fechado.

---

## 6. AppStaff (Escopo do Piloto)

O AppStaff inclui **exatamente**:

- Login
- Check-in / Check-out
- Execução de tarefas
- Mini TPV (criação de pedidos)
- Mini KDS (visualização)
- Mural / avisos operacionais
- Perfil
- Banco de horas (básico)

**Permissões:** Staff executa; Gerente/Dono executa + cria tarefas + vê financeiro resumido.

Nada além disso entra no piloto.

---

## 7. Critério de Sucesso (Lei Final)

O piloto só é considerado **bem-sucedido** se o sistema rodar **30 dias consecutivos** sem intervenção manual no Core.

**Intervenção** inclui: reset de base, correção manual de estado, scripts de emergência, explicações constantes ao operador.

Se isso acontecer → o piloto **falhou**, mesmo que "tenha funcionado".

---

## 8. O que NÃO se faz neste piloto (Proibições)

Durante o piloto, é **explicitamente proibido**:

- multi-local
- franquias
- múltiplos gateways
- split payments
- automações avançadas
- gamificação
- relatórios complexos
- extração do Kernel
- refactor arquitetural grande
- otimizações prematuras
- features "porque o concorrente tem"

---

## 9. Relação com outros contratos

| Relação | Documento |
|---------|-----------|
| Deriva de | [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) |
| Restringe | [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) (apenas o necessário) |
| Orienta | Plano de 30 dias |
| Define | Mínimo para instalação + heartbeat (§§4–5) |
| Não substitui | Contratos de soberania; apenas limita ao piloto |

---

## 10. Regra de Ouro

- **Se algo não está neste contrato, não faz parte do piloto.**
- **Se algo está neste contrato, tem que funcionar.**

---

*Fim do contrato.*
