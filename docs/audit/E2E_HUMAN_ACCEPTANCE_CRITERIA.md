# Teste Humano E2E — Critérios de Aceitação para Go-Live

**Objetivo:** Simular um teste humano E2E do ChefIApp POS Core. Cada etapa deve produzir o resultado esperado abaixo. Se algum passo falhar, o sistema **não** está pronto para produção. Se tudo passar, está **aprovado para go-live**.

---

## 1. Onboarding e Signup

| Verificação | Resultado esperado |
|-------------|--------------------|
| Acesso ao portal | Usuário acessa o portal, realiza cadastro, recebe confirmação e faz login. |
| Trial Stripe | Trial Stripe é ativado automaticamente, com status e limites visíveis. |

**Critério de sucesso:** Cadastro completo, confirmação recebida, login bem-sucedido; trial ativo e informações visíveis na interface.

---

## 2. Configuração Inicial

| Verificação | Resultado esperado |
|-------------|--------------------|
| Dados do restaurante | Usuário preenche dados do restaurante, horários, ementa e operadores. |
| Idiomas | Troca de idioma (pt / en / es) reflete imediatamente em toda a interface. |

**Critério de sucesso:** Configuração guardada e visível; mudança de locale aplicada em todos os textos relevantes.

---

## 3. Operação de Caixa (TPV)

| Verificação | Resultado esperado |
|-------------|--------------------|
| Pedidos | Pedidos são criados, editados e fechados sem erros. |
| Modo offline | No modo offline, operações são permitidas e sincronizam ao reconectar. |
| Recibos fiscais | Recibos fiscais exibem ATCUD, QR code e todos os dados obrigatórios. |

**Critério de sucesso:** Fluxo de pedido completo estável; offline operacional com sync ao voltar online; documentos fiscais conformes.

---

## 4. Faturação e Subscrição

| Verificação | Resultado esperado |
|-------------|--------------------|
| Fim do trial | Ao fim do trial, usuário é notificado e pode fazer upgrade ou cancelar plano. |
| Webhooks | Mudanças de subscrição são refletidas em tempo real (webhook funcional). |

**Critério de sucesso:** Notificação de fim de trial e ações de upgrade/cancelamento; estado de subscrição atualizado via webhook.

---

## 5. GDPR

| Verificação | Resultado esperado |
|-------------|--------------------|
| Exportação de dados | Exportação de dados gera arquivo legível e completo. |
| Deleção de conta | Deleção de conta remove todos os dados do usuário, sem resíduos. |

**Critério de sucesso:** Export completo e utilizável; conta e dados associados eliminados sem vestígios.

---

## 6. Guardrails e UX

| Verificação | Resultado esperado |
|-------------|--------------------|
| Rotas protegidas | Rotas protegidas não são acessíveis sem login. |
| Mensagens | Mensagens de erro e feedbacks são claros e multilíngues. |

**Critério de sucesso:** Acesso negado a áreas restritas sem autenticação; erros e feedbacks compreensíveis e alinhados ao idioma ativo.

---

## 7. Auditoria e Logs

| Verificação | Resultado esperado |
|-------------|--------------------|
| Logs de operações | Logs de operações críticas estão disponíveis e completos. |
| Persistência | Dados fiscais e legais persistem após restart do sistema. |

**Critério de sucesso:** Logs consultáveis e coerentes com as ações; dados fiscais e legais intactos após reinício.

---

## Resultado global esperado

- Todos os fluxos funcionam **sem erros críticos**.
- Dados **fiscais e legais** corretos.
- **Sincronização** estável (online/offline).
- Experiência **multilíngue** consistente.
- **GDPR** funcional (export + deleção).
- **Segurança** garantida (guardrails, rotas protegidas).

**Se algum passo falhar → sistema não está pronto para produção.**  
**Se tudo passar → aprovado para go-live.**

---

## Referências

- Gate de release (portal): `npm run audit:release:portal`
- E2E existentes: `merchant-portal/tests/e2e/`
- Checklist operacional: [docs/ops/GO_LIVE_CHECKLIST.md](../ops/GO_LIVE_CHECKLIST.md)
- Estado da auditoria: [RELEASE_AUDIT_STATUS.md](./RELEASE_AUDIT_STATUS.md)
