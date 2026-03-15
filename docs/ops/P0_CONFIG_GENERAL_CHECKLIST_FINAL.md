# Checklist final — Validação `/admin/config/general` (estado limpo)

Objetivo: fechar **definitivamente** a validação funcional da tela no browser, distinguindo log/cache antigo de erro novo.

---

## Pré-requisitos

- [ ] Backend/schema fechado (migration opcional aplicada; colunas confirmadas).
- [ ] Portal a correr: `pnpm --filter merchant-portal run dev` → **http://localhost:5175**.

---

## Parte A — Estado limpo no browser

1. [ ] Abrir **http://localhost:5175** (e fazer login em `/auth` se necessário; user do seed).
2. [ ] Abrir **DevTools** (F12).
3. [ ] **Console:** Clicar em **Clear console** (ou `console.clear()`).
4. [ ] **Network:** Clicar em **Clear** / limpar o log; marcar **Disable cache**.
5. [ ] **Hard refresh:** Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac).
6. [ ] Navegar para **http://localhost:5175/admin/config/general**.

A partir daqui, qualquer 400 ou erro no Console/Network é **erro novo**.

---

## Parte B — Leitura

7. [ ] A página abre (sem crash, sem tela em branco).
8. [ ] **Não** surgem **novos** 400 por `column does not exist` (nem em gm_restaurants nem em restaurant_setup_status).
9. [ ] Os cards **Identidade do Restaurante** e **Idioma e localização** carregam (de "A carregar..." para formulário com campos).
10. [ ] Campos visíveis e editáveis: nome, tipo, país, telefone, e-mail, morada, cidade, código postal, região, URL do logo; idioma, fuso horário, moeda.

---

## Parte C — Escrita (card Identidade)

11. [ ] Alterar 1 ou 2 campos no card **Identidade do Restaurante** (ex.: Cidade, Telefone).
12. [ ] Clicar **Guardar**.
13. [ ] Não aparece alerta de erro.
14. [ ] F5 (refresh).
15. [ ] Os valores alterados **persistem** (continuam preenchidos).

---

## Parte D — Escrita (card Idioma/localização)

16. [ ] Alterar 1 campo no card **Idioma e localização** (ex.: Moeda ou Idioma do TPV).
17. [ ] Clicar **Guardar**.
18. [ ] Não aparece alerta de erro.
19. [ ] F5 (refresh).
20. [ ] O valor alterado **persiste**.

---

## Parte E — E2E

21. [ ] No terminal (com o portal a correr em 5175):

```bash
cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
```

22. [ ] Os **3 testes** passam (1 setup + 2 config-general). Duração típica: ~2–3 min.

---

## Resultado

- **Se todos os itens estiverem assinalados:** validação funcional da tela `/admin/config/general` **fechada** no browser.
- **Se algum 400 novo aparecer (Parte B):** anotar request (GET), status, mensagem e coluna; é read/select.
- **Se o save falhar (Partes C ou D):** anotar request (PATCH gm_restaurants), status (400/403), mensagem; é update/save ou RLS.

Refs: `docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md`, `docs/ops/P0_CONFIG_GENERAL_RELATORIO_FINAL.md`.
