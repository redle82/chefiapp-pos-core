# AppStaff — Checklist "APP ou não APP"

Lista objetiva para validar se o AppStaff é percebido como **aplicativo** e não como "site" ou "painel web". Usar na revisão de produto e antes de go-live.

---

## 1. Abertura sem browser

- [ ] A aplicação é aberta **sem barra de URL** (PWA instalado ou Chrome App Mode).
- [ ] Não há abas do browser visíveis.
- [ ] Não há botão de atualizar nem controlos de navegação do browser.
- [ ] Se estiver em browser: existe indicação clara para "Adicionar ao ecrã" / instalar como app.

**Referência:** [APPSTAFF_PWA_E_ABERTURA.md](APPSTAFF_PWA_E_ABERTURA.md)

---

## 2. Ritual de entrada

- [ ] Ao entrar em `/app/staff/home` (após gates: localização, contrato, worker), aparece brevemente o **boot** (tela escura + logo/texto "Sistema Operacional do Restaurante").
- [ ] O boot dura ~300 ms e faz fade-out antes de mostrar o painel.
- [ ] Não há "queda" direta no painel sem nenhum momento de entrada.

---

## 3. Viewport e fundo

- [ ] O fundo é **contínuo** (cor de superfície do app) em toda a viewport; não há faixas brancas ou de cor diferente nas laterais.
- [ ] O conteúdo da home está limitado em largura (ex.: maxWidth 420px) e centrado, com o resto do espaço a usar a mesma cor de fundo.
- [ ] Em scroll, não aparece nenhuma "faixa" de cor diferente.

**Referência:** [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](../architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md)

---

## 4. Interação

- [ ] Os botões principais têm **feedback visual ao toque** (ex.: scale ~0.97 em press).
- [ ] Não há comportamentos típicos de "site": hover excessivo, sublinhados em links, cursor pointer muito destacado.
- [ ] A sensação é de **toque/gesto**, não apenas de "clique em página".

---

## 5. TopBar e contexto

- [ ] A TopBar mostra **contexto operacional**: restaurante/local, hora, **papel** (Dono, Gerente, Garçom, etc.) e estado do **turno** (TURNO ATIVO, etc.).
- [ ] Não aparece "nome de utilizador" ou identidade pessoal como foco principal (não é portal administrativo).
- [ ] A linguagem é de "sistema operacional", não de dashboard web.

**Referência:** [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md)

---

## 6. Home por papel

- [ ] Cada papel (Dono, Gerente, Garçom, Cozinha, Limpeza) vê uma **home adequada ao papel**, não um launcher genérico de "modos".
- [ ] Não existe "grid de apps" como ecrã principal; existe foco (ex.: FOCO AGORA) e uma ação dominante contextual.

**Referência:** [APPSTAFF_ROLE_HOME_REDESIGN.md](../architecture/APPSTAFF_ROLE_HOME_REDESIGN.md)

---

## Critério de sucesso

O utilizador **não deve conseguir dizer** onde começa o sistema e termina o mundo externo (browser, SO). A experiência deve ser de **terminal operacional**, não de página web.

---

## Referências cruzadas

- Lei final de UI: [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md)
- Contrato de superfície: [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](../architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md)
- PWA e abertura: [APPSTAFF_PWA_E_ABERTURA.md](APPSTAFF_PWA_E_ABERTURA.md)
- Finalização e teste: [APPSTAFF_FINALIZACAO_CANONICO.md](APPSTAFF_FINALIZACAO_CANONICO.md)
