# Sofia Gastrobar — Runbook: validação do TPV oficial (instalável/Electron)

**Objetivo:** Checklist executável para validar o **TPV oficial instalável/Electron** no contexto do Sofia Gastrobar. Este documento define o checkpoint da próxima superfície oficial após o Admin.

**Regra:** A rota web `/op/tpv` é **apenas apoio técnico e de desenvolvimento**; **não** fecha a validação oficial do TPV. Só a validação no ambiente **instalável/Electron** com contexto Sofia, sessão coerente do dono e operação sob contrato de hardware/rede/impressão considera o checkpoint do TPV oficial fechado.

**Referências:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) §13, [SOFIA_PLANO_EXECUCAO_PRATICA.md](./SOFIA_PLANO_EXECUCAO_PRATICA.md) §8–§9, [DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md](./DESKTOP_LAUNCH_PROTOCOL_CONTRACT.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).

---

## 1. Alvo e âmbito

| Item | Definição |
|------|-----------|
| **Superfície oficial** | TPV instalável/Electron (app empacotado, ex.: ChefIApp Desktop.app ou equivalente). |
| **O que não vale como validação oficial** | Abrir apenas a rota web `http://localhost:5175/op/tpv` no browser. Isso é apoio técnico/dev (SPA, fluxo, integração com KDS); **não** substitui este checkpoint. |
| **Contexto obrigatório** | Sofia Gastrobar: `restaurant_id = 00000000-0000-0000-0000-000000000100`. |
| **Sessão** | Coerente do dono (herdada ou autenticada no cliente instalável). |
| **Contrato operacional** | Hardware/rede/impressão conforme contrato (periféricos, rede, impressora quando aplicável). |

---

## 2. Pré-condições do ambiente

Antes de executar o checklist, garantir:

- [ ] **Core (Docker)** acessível (PostgREST em 3001 ou URL configurada para o cliente Electron).
- [ ] **Migrações** aplicadas para o restaurante 100 (identidade Sofia, membership owner, mesas, catálogo).
- [ ] **Admin do Sofia já validado** (topbar “Sofia Gastrobar”, menu de sessão com dono/DONO); ver [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) e [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).
- [ ] **Desktop app (Electron)** construído e instalável: build concluído; artefactos em `desktop-app/out/`. **Apple Silicon:** instalar `ChefIApp Desktop-0.1.0-arm64.dmg`; **Intel x64:** instalar `ChefIApp Desktop-0.1.0.dmg`. Ver [DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md](./DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md) §2 e §8 (checklist de instalação e validação do handler `chefiapp-pos://`).
- [ ] **Configuração do cliente** para apontar ao Core do Sofia (URL do Core e, se aplicável, tenant/restaurant_id ou deep link com `restaurant=00000000-0000-0000-0000-000000000100`).
- [ ] **Rede e periféricos** (quando no âmbito do contrato): impressora, rede local e dispositivos conforme definição do TPV oficial para o ambiente de validação.

---

## 3. Passos de execução

1. **Preparar ambiente**
   - Subir Core (3001) se local; ou confirmar URL do Core acessível pelo host onde o Electron corre.
   - Garantir que o Admin já está validado no mesmo contexto (Sofia, dono ativo).

2. **Lançar o TPV oficial (instalável/Electron)**
   - Abrir o app empacotado (ex.: ChefIApp Desktop.app).
   - Iniciar o módulo TPV no contexto do Sofia (via deep link `chefiapp://open?app=tpv&restaurant=00000000-0000-0000-0000-000000000100` a partir do Admin, ou via configuração interna do app que fixe `restaurant_id` 100 para o Sofia).

3. **Verificar contexto Sofia**
   - No cliente TPV (Electron), confirmar que o **restaurant_id** efetivo é `00000000-0000-0000-0000-000000000100`.
   - Confirmar que a UI mostra o contexto do **Sofia Gastrobar** (nome do restaurante, mesas/catálogo do 100).

4. **Verificar sessão**
   - Confirmar que a sessão é coerente com o dono (sessão ativa herdada ou autenticada no instalável; sem “Sessão encerrada” ou equivalente no fluxo do TPV quando aplicável).

5. **Verificar operação sob contrato (hardware/rede/impressão)**
   - Conforme contrato operacional do TPV oficial: confirmar que rede e periféricos (ex.: impressora) estão acessíveis e que o fluxo operacional do TPV (abrir mesa, adicionar itens, imprimir/comunicar) funciona no ambiente instalável, quando esse contrato for exigido para a validação.

6. **Registar evidências**
   - Preencher o checklist de aceite (§4) e anotar evidências mínimas (§5).

---

## 4. Critérios de aceite (checklist)

| # | Critério | OK / Falha / N/A | Notas |
|---|----------|------------------|--------|
| 1 | TPV em execução é o **instalável/Electron** (app empacotado), não o browser em `/op/tpv`. | | |
| 2 | **restaurant_id** efetivo no TPV = `00000000-0000-0000-0000-000000000100` (Sofia Gastrobar). | | |
| 3 | UI do TPV mostra contexto do Sofia Gastrobar (nome do restaurante, dados do 100). | | |
| 4 | Sessão coerente do dono (ativa no cliente instalável; sem estado “Sessão encerrada” quando aplicável). | | |
| 5 | Operação sob contrato de hardware/rede/impressão verificada (conforme definição do TPV oficial para este ambiente). | | |
| 6 | Pedido de teste (opcional): criar um pedido a partir do TPV instalável e confirmar que aparece no Core (ex.: `gm_orders`) com `restaurant_id` 100 e origem CAIXA. | | |

**Regra de fecho:** O checkpoint do **TPV oficial** só é considerado **validado no Sofia** quando todos os critérios aplicáveis (1–5, e 6 se executado) estiverem OK e as evidências mínimas (§5) tiverem sido registadas.

---

## 5. Evidências mínimas para considerar o TPV oficial validado no Sofia

- **Ambiente:** TPV instalável/Electron (nome do app, versão ou build, SO se relevante).
- **Contexto:** `restaurant_id` efetivo = `00000000-0000-0000-0000-000000000100` (como verificado na UI, config ou pedido criado).
- **Sessão:** Confirmação de que a sessão do dono está ativa no cliente (método de verificação usado).
- **Contrato hardware/rede/impressão:** Breve descrição do que foi testado (ex.: impressora responde, rede estável) ou N/A se fora do âmbito desta execução.
- **Data e executor:** Data da execução e quem executou o checklist.

*(Registo livre em texto ou tabela; pode ser anexado a este runbook ou guardado no registo de execução do checklist Fase 3 / operacional.)*

---

## 6. Resumo

- **Alvo:** TPV oficial = **instalável/Electron**.
- **/op/tpv:** Apenas apoio técnico/dev; **não** fecha validação oficial.
- **Checkpoint fechado quando:** Checklist §4 preenchido com OK nos critérios aplicáveis e evidências §5 registadas para o contexto Sofia (restaurant_id 100, sessão dono, operação sob contrato quando aplicável).

---

## 7. Resultado da execução (runbook aplicado)

**Data da execução:** 2026-03-15 (execução no contexto atual: código, Core e build; sem app Electron em execução nem observação humana na UI.)

### Pré-condições verificadas no contexto atual

| Pré-condição | Resultado | Detalhe |
|-------------|-----------|---------|
| Core (Docker) acessível | **OK** | `GET http://localhost:3001/rest/v1/` → 200. |
| Migrações / restaurante 100 | **Não verificado nesta execução** | Requer confirmação em ambiente de quem executa (ex.: migrações aplicadas, Sofia no Core). |
| Admin do Sofia já validado | **Assumido conforme doc** | Documentação declara Admin/topbar fechado. |
| Desktop app (Electron) construído e instalável | **Concluído** | Build do `desktop-app` concluído com sucesso; artefactos em `desktop-app/out/` (ex.: `ChefIApp Desktop-0.1.0-arm64.dmg`, `ChefIApp Desktop-0.1.0.dmg`). Próximo passo: instalar o .dmg correto e validar o handler `chefiapp-pos://` conforme [DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md](./DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md) §8. |
| Configuração do cliente para Core/Sofia | **Código alinhado** | Deep link `chefiapp://open?app=tpv&restaurant=<id>` documentado (DESKTOP_LAUNCH_PROTOCOL_CONTRACT); código em `desktop-app/src/main.ts` trata `app=tpv` e rota `/op/tpv`. Passagem explícita de `restaurant` do deep link para a janela carregada depende do fluxo completo (Admin → deep link → Electron → SPA). |
| Rede e periféricos | **N/A** | Fora do âmbito desta execução (sem ambiente instalável em uso). |

### Checklist de aceite (§4) — estado por critério

| # | Critério | Estado | O que foi confirmado / o que não foi possível |
|---|----------|--------|-----------------------------------------------|
| 1 | TPV em execução é o **instalável/Electron** (app empacotado), não o browser em `/op/tpv`. | **Pendente de validação manual** | Não foi lançado o app empacotado; não há confirmação de que o TPV em uso é o Electron. Código e build do `desktop-app` existem e compilam. |
| 2 | **restaurant_id** efetivo no TPV = `00000000-0000-0000-0000-000000000100` (Sofia Gastrobar). | **Pendente de validação manual** | Só é verificável no cliente TPV em execução (UI, config ou pedido criado). Deep link suporta `restaurant=<id>`. |
| 3 | UI do TPV mostra contexto do Sofia Gastrobar (nome do restaurante, dados do 100). | **Pendente de validação manual** | Requer observação visual no TPV instalável. |
| 4 | Sessão coerente do dono (ativa no cliente instalável; sem "Sessão encerrada" quando aplicável). | **Pendente de validação manual** | Requer observação no fluxo do TPV instalável (sessão herdada ou autenticada). |
| 5 | Operação sob contrato de hardware/rede/impressão verificada. | **N/A** | Ambiente de execução atual não inclui app instalado nem periféricos; pode ser preenchido numa execução manual com TPV Electron em uso. |
| 6 | Pedido de teste criado no TPV instalável e confirmado no Core (restaurant_id 100, origem CAIXA). | **Pendente de validação manual** | Requer lançar o TPV instalável, criar pedido e verificar em `gm_orders`. |

### Conclusão da execução

- **Checkpoint do TPV oficial:** **Continua em aberto.**
- **Bloqueio principal:** A validação exige **execução no TPV instalável/Electron** e **observação humana** (critérios 1–4 e 6). Nesta execução não foi lançado o app empacotado nem feita verificação na UI; apenas se confirmou Core acessível, existência e build do `desktop-app`, e alinhamento do código ao deep link com `restaurant`.
- **Próximo passo operacional:** (1) Instalar o .dmg correto (Apple Silicon: `ChefIApp Desktop-0.1.0-arm64.dmg`; Intel: `ChefIApp Desktop-0.1.0.dmg`) em `desktop-app/out/`, mover para Applications e abrir o app uma vez. (2) No Admin `/admin/devices/tpv`, clicar em «Abrir app TPV» e confirmar que `chefiapp-pos://setup` abre o ChefIApp Desktop (checklist em [DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md](./DESKTOP_INSTALAVEL_BUILD_E_DISTRIBUICAO.md) §8). (3) Com o TPV instalável em execução no contexto Sofia, preencher o checklist §4 com OK nos critérios 1–4 (e 5 se aplicável, 6 se executado) e registar as evidências mínimas (§5).
