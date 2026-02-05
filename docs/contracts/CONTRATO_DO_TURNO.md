# Contrato do Turno

Contrato operacional temporal: definição, responsabilidades, quem abre, quem observa, e relação com Core e Menu. Base de UX, implementação e testes.

**Referência:** Hierarquia de Contratos do Sistema (Arquitetura Viva). Lei de aplicação: [LEI_DO_TURNO.md](./LEI_DO_TURNO.md).

---

## 1. O que é o Turno

O turno **não é** UI, botão nem contexto local.

O turno é um **contrato operacional temporal** que diz:

> _Durante este intervalo, estas pessoas estão autorizadas a operar o dinheiro deste restaurante._

É único por restaurante (por contexto de tempo). Vive como **entidade global do Core operacional** — evento auditável, estado observável — não no TPV, não no Dashboard, não num contexto local.

---

## 2. Lugar na hierarquia (Cadeia de Autoridade)

Nenhum nível inferior **cria** factos para cima. Só **consome**.

```
Core Financeiro (Rei)     — dinheiro, pedidos, pagamentos, auditoria
        ↓
Contrato do Menu (Rainha) — o que pode ser vendido; produtos, preços
        ↓
Contrato do Turno (Regente) — quando o restaurante está operacional
        ↓
Pessoas (Gerente / Staff)  — quem está autorizado a operar
        ↓
Dispositivos (TPV, KDS, AppStaff) — consomem estado; não criam turno
```

- **Rei (Core):** Nada “abre”, “fecha” ou “existe” se não puder ser auditado financeiramente. O Core regista, não pergunta.
- **Rainha (Menu):** Sem menu válido, não existe venda possível. O menu autoriza o dinheiro a existir.
- **Regente (Turno):** Se não existe Turno Ativo, não existe operação. Se existe pedido, o Turno tem de existir.

---

## 3. Responsabilidades do Contrato do Turno

O Contrato do Turno é responsável por:

- **Definir** quando o restaurante está operacional.
- **Autorizar:**
  - TPV a criar pedidos
  - KDS a exibir pedidos
  - Dashboard a mostrar métricas do dia
- **Ligar:** Pessoas (staff), equipamentos (TPV/KDS), dinheiro (Core).

**Regra de Ouro:** Se não existe Turno Ativo, não existe operação. E: **se existe pedido, o Turno tem que existir.**

---

## 4. Quem abre o Turno (autoridade humana)

Só **uma pessoa, num ponto operacional**, abre o turno. Quem **não** abre:

- ❌ Dashboard
- ❌ Web de configuração
- ❌ KDS
- ❌ Sistema automático invisível

Esses **observam**, não iniciam.

**Quem pode abrir (apenas duas opções):**

| Opção                              | Quem                 | Modelo                                                                                   | Ideal para                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **🅰️ TPV (Caixa)**                 | Operador do caixa    | Chega → abre turno → começa a vender. TPV é o ritual de abertura do dia.                 | Restaurantes pequenos, operação centralizada, “caixa manda”. |
| **🅱️ App Staff (Chefe / Gerente)** | Gerente no App Staff | Abre turno no App Staff; TPVs entram em modo operativo. Turno é humano, não dispositivo. | Equipas maiores, múltiplos TPVs, hierarquia clara.           |

Recomendação arquitetural: **o Contrato do Turno pertence às Pessoas, não aos dispositivos.** Turno é aberto por um humano autorizado; TPV consome o estado do turno; KDS observa; Dashboard reflete.

---

## 5. Quem só observa

| Superfície              | Papel                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **KDS**                 | Observa o estado do turno e a fila de pedidos; exibe e permite transições (preparar → pronto). Não abre nem fecha turno. |
| **Dashboard**           | Reflete métricas do dia, histórico por turno, turnos ativos. Não abre nem fecha turno.                                   |
| **Web de configuração** | Observa; não inicia operação.                                                                                            |

TPV (ou App Staff) **abre**; as restantes **consomem** o mesmo estado global.

---

## 6. Relação com Core e Menu

- **Core (Rei):** Regista pedidos, pagamentos, caixa. O turno **autoriza** a criação de pedidos no Core; sem turno ativo, o TPV não deve criar pedidos (ou o Core não aceita).
- **Menu (Rainha):** Define o que se pode vender. O turno **não altera** o menu; durante o turno, TPV e KDS operam sobre o menu válido.
- **Turno (Regente):** É a janela temporal em que Core + Menu + Pessoas + Dispositivos estão alinhados para operação. Sem turno, não há operação; com pedido, o turno tem de existir.

---

## 7. Onde o Turno vive (conceitualmente)

- **Não** vive no TPV, no Dashboard nem num Context local.
- Vive como **entidade global do Core operacional** (ou camada operacional que o Core expõe).
- Pode ser: um contrato separado, um evento auditável, um estado observável. É **único** por restaurante.

---

## 8. Consequência para o sistema

Quando o Contrato do Turno estiver aplicado:

- O banner “O turno ainda não está aberto” deixa de entrar em contradição com pedidos já criados no TPV.
- TPV, KDS e Dashboard falam a mesma língua (uma única fonte de verdade).
- O sistema tende a passar no Teste Sistémico v3.0 (narrativa, causalidade, espaço/lugar).
- A operação “parece viva”.

---

## 9. Referência à Lei

As regras operativas de estado (uma única verdade, criação explícita, integridade “se há pedido, turno existe”, quem lê e quem não recalculam) estão na [LEI_DO_TURNO.md](./LEI_DO_TURNO.md). Este contrato define a **arquitetura de responsabilidade**; a Lei define as **regras de conformidade** para implementação e testes.

---

_Documento canónico. Base de UX, implementação e testes futuros._
