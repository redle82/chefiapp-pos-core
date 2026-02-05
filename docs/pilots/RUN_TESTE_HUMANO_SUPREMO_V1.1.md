# Executar Teste Humano Supremo v1.1

**Data:** 2026-02-02
**Prompt:** [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md)
**Checklist pós-correções:** [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md) → secção "Checklist para repetir o teste (v2)"

**Execução rápida (~10 min):** [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md) — uma página, passos numerados, sem precisar do prompt completo.

---

## Pré-flight (antes de abrir o Antigravity)

1. **Frontend (5175):** Confirmar que `http://localhost:5175` responde.

   - Se não estiver a correr: `cd merchant-portal && npm run dev`

2. **Core (3001):** Confirmar que o Docker Core está online.

   - `docker compose -f docker-core/docker-compose.core.yml up -d` (na raiz do repo)
   - Se o Core estiver em baixo, o banner "Servidor operacional offline. Inicie o Docker Core." aparece no topo da app; o teste humano deve ver isso e não confundir com bug de dados.

3. **Browser:** Abrir o Antigravity (ou o contexto onde vais colar o prompt).

---

## Passo a passo

1. Abrir [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md) e **copiar o documento na íntegra**.
2. Colar no Antigravity e executar o fluxo completo (entrada → restaurante → config → menu → billing → abrir turno → TPV → KDS → ciclo fechado).
3. Ao validar, usar a **checklist v2** (tabela no plano de correção) para F1–F5.
4. Registar resultado: **PASSOU** / **PASSOU COM FALHAS** / **FALHOU** + lista de falhas.
5. Não corrigir nada antes de ler o relatório como investidor/dono.

---

## Checklist v2 (validar em especial)

| O que validar            | Onde                            | Esperado após correções                                                                                   |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **F1** Menu Builder      | Configuração → Menu             | Sem "Unexpected token"; lista vazia ou itens; fallback se backend indisponível.                           |
| **F2** Abrir Turno       | Antes do TPV                    | Título "Começar a vender"; botão "Clique aqui para começar a vender AGORA"; mensagem clara se RPC falhar. |
| **F3** Tarefas / Pessoas | Config → Tarefas, Pessoas       | Lista vazia ou dados; mensagem humana em erro; sem crash.                                                 |
| **F4** Presença online   | Config → Localização → Endereço | Formulário carrega; se falhar, "Tentar novamente" e mensagem clara.                                       |
| **F5** Dashboard         | Dashboard (métricas, histórico) | Copy honesta ("Ainda sem vendas hoje", "Modo demonstração..."); sem "simulação" confusa.                  |

---

## Quando terminar

- Preencher "Resultado do teste v2" no [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md).
- Decidir próximo corte: DoR para venda **ou** Teste Humano Supremo v2 (AppStaff).
