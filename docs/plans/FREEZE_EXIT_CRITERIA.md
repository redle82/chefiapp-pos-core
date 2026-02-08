# Critérios de saída do freeze

**Propósito:** Gatilhos objectivos (não emocionais) para considerar válido descongelar estrutura ou visual. Quando estes critérios forem verdadeiros, pode-se avançar com refinamento ou alterações planeadas.

**Contexto:** [PLANO_A_MAIS_B_RITUAL_TERMINAIS_E_KERNEL.md](PLANO_A_MAIS_B_RITUAL_TERMINAIS_E_KERNEL.md); freeze consciente pós A+B+Gate.

---

## 1. Tempo

- **Critério:** X dias de uso contínuo.
- **Valor sugerido:** 7 dias (preencher após uso real).
- **Preenchido:** [ ] Sim — _____ dias.

---

## 2. Operação

- **Critério:** Pelo menos N turnos abertos/fechados sem intervenção manual (abrir/fechar caixa, sem correcções de dados).
- **Valor sugerido:** 5 turnos (preencher após uso real).
- **Preenchido:** [ ] Sim — _____ turnos.

---

## 3. Kernel

- **Critério:** Nenhum estado UNKNOWN recorrente; CoreHealth estável (UP ou DOWN claro, não UNKNOWN persistente).
- **Preenchido:** [ ] Sim — CoreHealth estável.

---

## 4. Terminais

- **Critério:** TPV e KDS online/offline detectados correctamente quando o trilho está activo (TERMINAL_INSTALLATION_TRACK=true e backend com gm_terminals).
- **Preenchido:** [ ] Sim — estados Online/Offline correctos.  
- **N/A se trilho ainda não implementado:** [ ] Sim.

---

## 5. Logs

- **Critério:** Zero spam estrutural; apenas eventos reais (sem repetição de "[CoreHealth] Status changed", "relation does not exist", etc.).
- **Preenchido:** [ ] Sim — logs limpos.

---

## 6. UX

- **Critério:** Lista curta de desconfortos **repetidos** (não opiniões soltas). Padrões do tipo "acontece sempre quando X".
- **Preenchido:** [ ] Sim — lista de desconfortos documentada.  
- **Nota:** _______________________________________________

---

## Regra de saída

Quando **todos** os critérios aplicáveis estiverem marcados como cumpridos, considera-se válido **descongelar** (estrutura ou visual), conforme decisão do produto.

---

Última actualização: Critérios de saída do freeze; placeholders para preenchimento após uso real.
