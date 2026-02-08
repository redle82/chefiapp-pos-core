# AppStaff — Baseline consolidado (estado oficial)

**Estado:** congelado e protegido. Não é hipótese — é baseline.

---

## 🔒 Estado oficial do sistema

- **Modelo mental ≡ código** — nenhuma fricção ativa.
- **Papel = estado de sessão** — nunca URL, nunca rota. Fontes de verdade: código, auto-join, storage/session. `?role=` é ferramenta de debug apenas.
- **AppStaff é um só** — com camadas de autoridade (Owner / Manager / Staff / …), não variantes por função. Uma estrutura, perfis, autoridade contextual.

---

## 🧭 O que NÃO deve ser mexido (sem motivo real)

Qualquer alteração aqui sem justificação vira regressão cognitiva.

- Rotas (já corretas).
- Fluxo de entrada: auth → sessão → operação.
- Estrutura do AppStaff / bottom bar.
- AUTO-JOIN + contract síncrono na primeira render.

---

## 📄 Contrato do ecrã Home (launcher)

O ecrã `/app/staff/home` **não é dashboard** — é **launcher de modos operacionais**. Identidade visual e anti-patterns: [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](APPSTAFF_HOME_LAUNCHER_CONTRACT.md).

---

## 📌 Próximo passo (só quando solicitado)

**Quando** for dito *"vamos fazer a auditoria de visibilidade agora"*:

- Tratar como **auditoria cirúrgica**, não refactor.
- **Sem** criar apps, **sem** criar rotas, **sem** mover telas.
- Apenas alinhar `canSee` / `canDo` / `canExecute` com o checklist de visibilidade por papel (Owner vê tudo; Manager quase tudo; Staff só o necessário; Cozinha não vê dinheiro; Limpeza não vê TPV).

---

*Ciclo fechado. Modelo restaurado; código obedece ao modelo.*
