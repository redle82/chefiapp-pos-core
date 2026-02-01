# Índice das Leis Invisíveis — Core

**Propósito:** Nomear as dimensões que sistemas operacionais maduros têm e que ainda não viraram contrato explícito no ChefIApp. **Isto é mapa, não backlog.**

**Regra:** Só escrever contrato quando a dor aparecer — mas **saber que eles existem**. Evita que toda falha vire “bug”, toda decisão seja emocional, e que o sistema cresça sem leis.

---

## 1. Contrato de Falha (Failure as First-Class Citizen)

**O que é:** Falha como cidadão de primeira classe. O que é falha aceitável, o que é crítica, o que acontece automaticamente quando algo falha. Sistemas grandes partem do fracasso (Linux assume que drivers falham; bancos assumem que transações caem).

**Documento quando existir:** CORE_FAILURE_MODEL.md

**Sem isso:** Toda falha vira “bug”; decisões são emocionais; cada erro vira exceção ad-hoc.

---

## 2. Hierarquia de Verdade (Truth Layers)

**O que é:** Verdade instantânea, eventual, histórica, percebida pelo humano. Ex.: pedido foi criado (histórica), está “em preparo” (operacional), parece atrasado (percebida).

**Documento quando existir:** CORE_TRUTH_HIERARCHY.md

**Sem isso:** Conflitos de estado; UI “parece errada”; discussões infinitas sobre “qual estado vale”.

---

## 3. Contrato de Tempo (Time as a System Resource)

**O que é:** Tempo governado como memória ou CPU. Tempo máximo de decisão, de espera; tempo que pode ser ignorado; tempo que vira incidente.

**Documento quando existir:** CORE_TIME_GOVERNANCE_CONTRACT.md

**Sem isso:** Tudo vira “urgente”; nada é prioritário de verdade; humanos queimam.

---

## 4. Modelo de Consciência do Sistema (o sistema sabe que sabe?)

**O que é:** O que o sistema está a monitorizar, o que não está, quando está “cego”. Ex.: “Não recebo dados da cozinha há 3 min”; “Não sei o estado real agora”.

**Documento quando existir:** CORE_SYSTEM_AWARENESS_MODEL.md

**Sem isso:** Dashboards mentem; silêncio parece normal; falhas passam despercebidas.

---

## 5. Contrato de Poder e Autoridade (quem pode quebrar o sistema)

**O que é:** Quem pode operar, configurar, suspender regras, forçar exceções. Ex.: capitão pode quebrar protocolo; caixa não pode.

**Documento quando existir:** CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md

**Sem isso:** Exceções viram hacks; decisões críticas ficam ambíguas; bugs “necessários” surgem.

---

## 6. Modelo de Evolução do Sistema (como o sistema muda sem quebrar)

**O que é:** Compatibilidade de versões, comportamento legado, feature flags governadas, “modo antigo” vs “modo novo”.

**Documento quando existir:** CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md

**Sem isso:** Medo de mudar; dívidas acumulam; upgrades quebram clientes.

---

## 7. Contrato de Silêncio (o que o sistema NÃO faz)

**O que é:** Quando não alertar, não registar, não reagir. Ex.: 1 pedido atrasado ≠ alerta; 10 atrasados pode ser incidente; 1 erro ≠ falha sistêmica.

**Documento quando existir:** CORE_SILENCE_AND_NOISE_POLICY.md

**Sem isso:** Ruído constante; alert fatigue; ninguém confia no sistema.

---

## Sequência recomendada (quando a dor aparecer)

1. **Failure Model** — estabilidade.
2. **Truth Hierarchy** — clareza.
3. **Time Governance** — confiança.

Estes três sozinhos mudam completamente: estabilidade, clareza, confiança do sistema.

---

**Não implementar tudo agora.** Este índice existe para que as leis invisíveis tenham nome. Quando uma delas virar dor real, criar o documento correspondente no mesmo nível dos contratos já existentes.
