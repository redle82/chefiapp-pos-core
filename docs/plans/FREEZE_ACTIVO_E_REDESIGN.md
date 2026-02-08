# Freeze activo e visão do Redesign

**Propósito:** Declarar que as opções de freeze foram executadas (freeze consciente activo) e concentrar as referências para **quando** for altura de considerar redesign — gate + documentação existente.

**Contexto:** [PLANO_A_MAIS_B_RITUAL_TERMINAIS_E_KERNEL.md](PLANO_A_MAIS_B_RITUAL_TERMINAIS_E_KERNEL.md); [FREEZE_EXIT_CRITERIA.md](FREEZE_EXIT_CRITERIA.md); [MATURIDADE_PRE_REDESIGN.md](MATURIDADE_PRE_REDESIGN.md); [AUDITORIA_RITUAL_CORTE.md](AUDITORIA_RITUAL_CORTE.md); [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md).

---

## 1. Freeze activo (opções executadas)

- **Estrutura congelada:** Kernel operacional, contratos (OPERATIONAL_KERNEL, TERMINAL_INSTALLATION_RITUAL, OPERATIONAL_DASHBOARD_V2), rituais (instalação de terminais), fluxos principais (TPV/KDS, turno, preflight).
- **Observação activa:** Logs, métricas e anotação de desconfortos continuam; não há freeze de feedback.
- **Artefactos de apoio:** Critérios de saída em [FREEZE_EXIT_CRITERIA.md](FREEZE_EXIT_CRITERIA.md); checklist de maturidade em [MATURIDADE_PRE_REDESIGN.md](MATURIDADE_PRE_REDESIGN.md).

---

## 2. Gate para Redesign

Redesign (refinamento visual ou cirúrgico) só deve ser considerado **depois de**:

1. **Critérios de saída do freeze** cumpridos — [FREEZE_EXIT_CRITERIA.md](FREEZE_EXIT_CRITERIA.md).
2. **Checklist de maturidade** preenchido com base em uso real — [MATURIDADE_PRE_REDESIGN.md](MATURIDADE_PRE_REDESIGN.md).

Sem isto, redesign seria antecipação estética, não decisão baseada em padrões reais.

---

## 3. Onde está o Redesign (quando descongelar)

Documentação e contratos que definem **o que** fazer no redesign, quando o gate for aberto:

| Documento | Conteúdo relevante para redesign |
|-----------|-----------------------------------|
| [OPERATIONAL_HEADER_CONTRACT.md](../contracts/OPERATIONAL_HEADER_CONTRACT.md) | Passo 3: redesign cirúrgico (cores, fontes, tamanhos); só depois de restaurante, terminais e pessoas como entidades visíveis. |
| [TEMPLATE_SELECTION_CONTRACT.md](../architecture/TEMPLATE_SELECTION_CONTRACT.md) | Escolhas canónicas de templates por camada; novas páginas ou redesign devem usar estas referências. |
| [HTMLREV_TEMPLATES_BY_LAYER.md](../design/HTMLREV_TEMPLATES_BY_LAYER.md) | Lista detalhada de templates por camada (HTMLrev). |
| [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](../architecture/PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) | Regras para novas páginas, redesign ou alterações de UX. |
| [docs/design/](../design/) | GM_STAFF_FIRST_CLASS_DESIGN, AppStaff, Landing, etc. — referências de design por área. |

Ou seja: o **redesign** está documentado como próximo passo (Passo 3 no header, templates canónicos, tipos de página); a **execução** desse redesign fica gated pelos critérios de saída do freeze e pelo checklist de maturidade.

---

## 4. Congelamento formal (Ritual Corte)

**Tag de versão:** `operational-freeze-v1` (ou nome acordado). Aplicar **após** auditoria + testes soberanos verdes. Ver [AUDITORIA_RITUAL_CORTE.md](AUDITORIA_RITUAL_CORTE.md); [TESTES_GUARDIOES_RITUAL_CORTE.md](TESTES_GUARDIOES_RITUAL_CORTE.md).

### 4.1 O que pode mudar

- Correção de bugs (sem alterar contratos soberanos).
- Logs e observabilidade mínima ([OBSERVABILITY_POST_CUT.md](../ops/OBSERVABILITY_POST_CUT.md)).
- Documentação (docs, contratos, runbooks).
- Ajustes que não toquem em FlowGate, ORE, Kernel ou ritual de terminais sem contrato.

### 4.2 O que não pode mudar

- Contratos soberanos (OPERATIONAL_KERNEL, OPERATIONAL_NAVIGATION_SOVEREIGNTY, OPERATIONAL_DASHBOARD_V2, TERMINAL_INSTALLATION_RITUAL, CORE_SYSTEM_TREE_CONTRACT) sem processo explícito.
- FlowGate, ORE, useOperationalKernel como únicas autoridades de navegação e estado operacional.
- Comportamento em OPERATIONAL_OS: nunca redirect para "/"; destino canónico /app/dashboard; /app/install rota operacional.
- Regra "código sem teste morre; teste sem contrato morre" ([TESTES_GUARDIOES_RITUAL_CORTE.md](TESTES_GUARDIOES_RITUAL_CORTE.md)).

### 4.3 O que exige novo contrato

- Novas rotas que afectem navegação ou gates.
- Novos gates ou fontes de verdade para CoreHealth, Preflight, navegação.
- Novas flags env/config que dupliquem decisão do Kernel ou ORE (ou documentar data de remoção e contrato associado).
- Alterações que conflituem com [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md).

### 4.4 Regras de CI (documentadas)

- **Testes soberanos:** CI deve exigir que testes etiquetados como soberanos passem. Ver [TESTES_GUARDIOES_RITUAL_CORTE.md](TESTES_GUARDIOES_RITUAL_CORTE.md).
- **Blacklist:** Alterações que reintroduzam entradas de [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md) devem ser bloqueadas (checklist em PR ou script de grep).
- **Código novo em áreas soberanas:** Exige teste (soberano ou compatibilidade).
- **Flags temporárias:** Proibidas sem data de remoção e contrato associado (policy documentada; checagem manual ou script).
- **Rollback:** Ver [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md) em caso de necessidade de reverter.

---

## 5. Resumo

- **Agora:** Freeze activo. Estrutura estável; observação continua. Congelamento formal documentado (§4).
- **Para descongelar:** Cumprir [FREEZE_EXIT_CRITERIA.md](FREEZE_EXIT_CRITERIA.md) e preencher [MATURIDADE_PRE_REDESIGN.md](MATURIDADE_PRE_REDESIGN.md) com uso real.
- **Para executar redesign:** Usar os contratos e docs em §3 (header Passo 3, templates, design) após abrir o gate.
- **Tag:** Aplicar `operational-freeze-v1` após auditoria e testes verdes; preencher [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md).

---

Última actualização: Freeze activo; congelamento formal e regras CI adicionados (Ritual Corte).
