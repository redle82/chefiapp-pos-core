# Checklist — FASE B (pós-FASE C · Local Human Safe Mode ATIVO)

Contexto para quem executa (humano ou agente): estás a testar o ChefiApp em ambiente local, com Docker/Core OFF de propósito. O objetivo não é validar backend, dados reais ou integrações. O objetivo é validar **sensação humana**: confiança, fluidez e ausência total de medo técnico.

**Pré-requisito:** [FASE C — Local Human Safe Mode](FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md) implementada e ativa.

---

## Regras do teste

- Não podes abrir terminal.
- Não podes pedir ajuda técnica.
- Se algo falhar, avalia **como o sistema te tratou**, não "porque falhou".

---

## Objetivo do Teste

Confirmar que, com a FASE C ativa, um utilizador consegue:

- Entrar
- Explorar
- Clicar
- Navegar

**sem medo, sem bloqueio e sem linguagem técnica**, mesmo com Core OFF.

---

## Cenário de Teste

- **Ambiente:** Local
- **Core:** OFF
- **Docker:** OFF
- **Perfil mental:** "Sou dono curioso, não sou dev"

---

## Checklist de Validação Humana

### 1. Entrada e Primeira Impressão

- Abrir a app e não ver erros técnicos
- Não ver palavras como: Core, Docker, CLI, servidor, indisponível
- Entender claramente que estou num modo seguro/demonstração

**Critério de falha:** qualquer sensação de "isto quebrou".

---

### 2. Ecrã Zero / Dashboard

- O dashboard carrega
- Existe um caminho claro do tipo: "Explorar em modo demonstração", "Ver como funciona"
- Nenhum botão parece morto ou perigoso

**Pergunta-chave:** "Eu clicaria aqui sem medo de estragar algo?"

---

### 3. Navegação Livre

Explorar sem objetivo específico:

- Dashboard
- TPV (se abrir, mesmo em demo)
- KDS (mesmo vazio)
- Configurações
- Relatórios (mesmo simulados)

**Validar:** nada trava; nada pede ajuda técnica; nada exige setup.

---

### 4. Momentos de Falha (intencionais)

Se algo não puder funcionar:

- A mensagem é humana
- Existe sempre uma alternativa ("continuar em demonstração")
- Nunca fico encurralado num beco sem saída

---

## Pergunta Antigravity Final

"Se eu fosse dono de restaurante e isto desaparecesse amanhã, eu sentiria…"

- Alívio
- Indiferença
- Perda

**PASSOU** só se a resposta for **Indiferença** ou **Perda**.
(Alívio = ainda existe medo / fricção invisível)

---

## Veredito

Marcar apenas um:

- **PASSOU** — posso entregar isto a um humano sem explicações
- **FALHOU** — ainda exige contexto técnico invisível

Se falhou: anotar o **exato momento emocional**, não o bug.

---

## Critério de Encerramento da FASE B (pós-FASE C)

- **PASSOU** → Supabase deploy → repetir FASE B em URL real
- **FALHOU** → micro-ajuste de copy/CTA → repetir FASE B local

---

## Referências

- [FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md](FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md) — Contrato e checklist da camada humana
- [FASE_5_FASE_B_TESTE_HUMANO.md](FASE_5_FASE_B_TESTE_HUMANO.md) — Checklist geral FASE B
- [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md) — Template para registar resultado
- [FASE_5_LOCAL_NAO_PRODUCAO.md](FASE_5_LOCAL_NAO_PRODUCAO.md) — Declaração Local ≠ Produção

Documento criado para validar que a camada humana (FASE C) segurou o sistema antes de qualquer backend real.
