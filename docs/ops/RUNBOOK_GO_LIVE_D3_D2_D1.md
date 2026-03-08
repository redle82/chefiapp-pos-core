CHEFIAPP – GO LIVE RUNBOOK

Versão: 1.0
Objetivo: validar prontidão comercial para 1 restaurante real

⸻

CRITÉRIO FINAL (BINÁRIO)

| Item                                          | Status | Evidência |
| --------------------------------------------- | ------ | --------- |
| Domínio público online                        | ☐      |           |
| Gateway health 200                            | ☐      |           |
| Core protegido corretamente                   | ☐      |           |
| Login + Onboarding completos                  | ☐      |           |
| Tarefa criar → atribuir → concluir persistida | ☐      |           |
| Specimen capturado                            | ☐      |           |

Se qualquer item = ❌ → NO-GO.

⸻

D-3 – INFRA E EXPOSIÇÃO

1. Domínio público

Comando:
curl -i https://www.chefiapp.com/

Critério:

- HTTP 200
- Sem DEPLOYMENT_NOT_FOUND
- Página renderiza

Resultado:

- Status:
- Evidência (colar output ou screenshot):

⸻

2. Gateway

curl -i https://SEU_GATEWAY/health

Critério:

- HTTP 200
- JSON válido
- Sem erro 404

Resultado:

- Status:
- Evidência:

⸻

3. Core / PostgREST

curl -i https://SEU_CORE/rest/v1/
curl -i "https://SEU_CORE/rest/v1/gm_restaurants?select=id&limit=1"

Critério:

- NÃO deve permitir acesso indevido sem autenticação
- Se retornar dados sem token → BLOQUEADOR

Resultado:

- Status:
- Evidência:

⸻

D-2 – FLUXO COMERCIAL

Checklist manual obrigatório:

☐ Criar conta
☐ Criar restaurante
☐ Concluir onboarding
☐ Acessar dashboard principal

Critério:

- Sem erro 500
- Sem fallback mock
- Dados persistem após reload

Evidência:

- Screenshot
- Payload API
- ID restaurante criado

⸻

D-1 – TAREFAS E SPECIMEN

Fluxo obrigatório:

☐ Criar tarefa
☐ Atribuir a funcionário
☐ Funcionário concluir
☐ Estado muda no banco
☐ Pontos/gamificação atualizam

Critério:

- Mudança persistida no DB
- Confirmado via API

Evidência exigida para trademark:

- Screenshot com marca CHEFIAPP visível
- URL ativa
- Data/hora
- Usuário real
- Registro persistido (ID da tarefa)

⸻

DECISÃO FINAL

Data:
Responsável:

GO ☐
NO-GO ☐

Motivo (se NO-GO):

⸻
