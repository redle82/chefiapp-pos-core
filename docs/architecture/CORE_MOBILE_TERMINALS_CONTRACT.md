# CORE_MOBILE_TERMINALS_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de terminal mobile (iOS / Android) — soberania e arquitectura
**Local:** docs/architecture/CORE_MOBILE_TERMINALS_CONTRACT.md
**Hierarquia:** Subordinado a [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md) e a [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)

---

## Lei do sistema

iOS e Android são terminais soberanos. Sem este contrato, o comportamento do AppStaff fica implícito — e implícito = fora da lei. IA, código e humanos não podem inferir; o que não estiver aqui **NÃO EXISTE**.

---

## 1. Natureza do AppStaff

- **AppStaff NÃO é Web.**
- **AppStaff NÃO depende do merchant-portal.**
- AppStaff roda **apenas** como app nativo:
  - **iOS** (simulador ou dispositivo)
  - **Android** (emulador ou dispositivo)

**Se abrir no browser → violação.**

---

## 2. Runtime oficial (piloto)

| Item       | Valor                 |
| ---------- | --------------------- |
| Plataforma | Expo (React Native)   |
| Execução   | App nativo            |
| Browser    | ❌ proibido           |
| Porta Web  | ❌ proibido           |
| Backend    | Docker Core           |
| URL Core   | http://localhost:3001 |

---

## 3. Comunicação permitida

AppStaff **só** pode falar com:

- ✅ **Docker Core** (Postgres + RPC / REST)

AppStaff **não** fala com:

- ❌ merchant-portal
- ❌ TPV
- ❌ KDS
- ❌ Web Pública

**Regra de ouro:** Terminais nunca falam entre si. Todos falam com o Core.

---

## 4. Papéis suportados no AppStaff

| Papel           | Pode                                |
| --------------- | ----------------------------------- |
| **Funcionário** | Executar tarefas, pedidos, check-in |
| **Garçom**      | Mini-TPV, tarefas                   |
| **Gerente**     | Criar tarefas, ver métricas         |
| **Dono**        | Tudo acima + leitura financeira     |

Se algo aparecer no AppStaff fora destes papéis → bug ou violação.

---

## 5. Funcionalidades obrigatórias no AppStaff

Por contrato, não por vontade. No piloto, o AppStaff inclui **exatamente**:

- Mini TPV
- Mini KDS (visualização)
- Sistema de tarefas
- Check-in / Check-out
- Perfil
- Mural de avisos
- Chat técnico (não social)

Nada além disso no piloto.

---

## 6. O que o AppStaff NÃO faz

- ❌ Configurar sistema
- ❌ Billing
- ❌ Instalação de hardware
- ❌ Lógica financeira
- ❌ Reconciliação
- ❌ Gestão de gateways

Tudo isso é Web / Command Center.

---

## 7. Regra para IA, humanos e scripts

- Se algo de AppStaff **não** estiver neste contrato, **NÃO EXISTE**.
- IA não pode inferir.
- Dev não pode "adiantar".
- Teste não pode simular fora disso.

**Violação = regressão arquitectural.**

---

## 8. Relação com outros contratos

| Relação       | Documento                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Subordinado a | [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md), [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) |
| Alinhado a    | [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) (lei macro; este contrato fixa runtime e comunicação)                       |
| Não substitui | Contratos de soberania financeira; apenas define o terminal mobile.                                                                  |

---

_Fim do contrato._
