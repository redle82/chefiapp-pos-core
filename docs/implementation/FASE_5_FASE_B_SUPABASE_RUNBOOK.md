# FASE B em Supabase — Runbook

**Objetivo:** Executar o Teste Humano (FASE B) em **ambiente real** (URL do dono). Local = dev-only; o critério de "produto pronto" é FASE B **PASSOU** em Supabase. Ref: [FASE_5_LOCAL_NAO_PRODUCAO.md](FASE_5_LOCAL_NAO_PRODUCAO.md).

---

## Pré-requisitos

1. **Deploy Supabase e app em produção**

   - [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md) concluído: projeto Supabase, migrations, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no frontend (ex.: Vercel/Netlify).
   - App acessível por **URL pública** (ex.: `https://app.chefiapp.com` ou URL de preview).

2. **FASE C (Local Human Safe Mode)** já implementada
   - [FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md](FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md): copy humana, Core OFF sem jargão, CTAs de saída.

---

## Cenário

| Item         | Local (FASE B pós-C)       | **Supabase (este runbook)**    |
| ------------ | -------------------------- | ------------------------------ |
| **Ambiente** | Localhost, Docker/Core OFF | **URL real** (domínio da app)  |
| **Backend**  | OFF (demonstração)         | **ON** (Supabase; dados reais) |
| **Perfil**   | Dono curioso, não dev      | **Dono real** abre um link     |

---

## Checklist de execução

1. **Abrir a app pela URL real** (sem terminal, sem ajuda técnica).
2. **Usar o mesmo checklist de validação humana** que em local: [FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md](FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md).
   - Entrada e primeira impressão (sem erros técnicos, sem Core/Docker/CLI).
   - Ecrã Zero / Dashboard (caminho claro "Explorar em modo demonstração" ou equivalente).
   - Navegação livre (Dashboard, TPV, KDS, Config, Relatórios).
   - Momentos de falha: mensagem humana e alternativa ("continuar em demonstração").
3. **Pergunta Antigravity final:** "Se isto desaparecesse amanhã, eu sentiria…" Alívio / Indiferença / Perda. **PASSOU** só se Indiferença ou Perda.
4. **Registar o resultado** em [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md) (indicar **Ambiente: Supabase / URL real**).

---

## E2E automatizado (opcional)

Para validar critérios objectivos (sem palavras proibidas, copy humana):

- **Contra URL real (Supabase):** `cd merchant-portal` e
  `E2E_BASE_URL=https://tua-app.vercel.app npx playwright test tests/e2e/fase-b-teste-humano.spec.ts`
  (baseURL vem de `E2E_BASE_URL` em `playwright.config.ts`; não arranca webServer local).
- **Contra local:** garantir que a porta **5175** está livre (ou ter `npm run dev` já a correr); depois
  `npx playwright test tests/e2e/fase-b-teste-humano.spec.ts`
  (arranca o dev server automaticamente se `E2E_BASE_URL` não estiver definido).

O spec cobre rotas `/`, `/auth`, `/demo-guiado` e fluxo demo (4 passos + interstitial + CTA para `/auth`).

---

## Veredito e próximo passo

- **PASSOU** → [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) (piloto €79).
- **FALHOU** → anotar o momento emocional exacto; micro-ajuste de copy/CTA; repetir FASE B em Supabase.

---

## Referências

- [FASE_5_LOCAL_NAO_PRODUCAO.md](FASE_5_LOCAL_NAO_PRODUCAO.md) — Declaração Local ≠ Produção; FASE B repete-se em Supabase.
- [FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md](FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md) — Regras e checklist de validação humana.
- [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md) — Checklist técnico para ter URL real.

Última atualização: 2026-02-01.
