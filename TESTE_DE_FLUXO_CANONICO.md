# TESTE DE FLUXO CANÔNICO

Checklist objetivo para assentamento estrutural do sistema.

---

## Fluxo 0 — Cold Start Absoluto
- [ ] localStorage limpo
- [ ] sessão expirada
- [ ] nenhuma variável residual
- [ ] Vai para `/login`?
- [ ] Algum redirect estranho?
- [ ] Alguma página renderiza sem FlowGate?

---

## Fluxo 1 — Autenticação → Autoridade
- [ ] Login válido
- [ ] Usuário com restaurante existente
- [ ] SystemState é hidratado uma vez
- [ ] restaurant_id entra uma vez
- [ ] Não existe lógica duplicada em páginas

---

## Fluxo 2 — Onboarding (Happy Path)
- [ ] Usuário sem `onboarding_completed_at`
- [ ] FlowGate bloqueia `/app/*`?
- [ ] Onboarding só avança?
- [ ] Ao concluir, grava no DB
- [ ] Atualiza SystemState
- [ ] Redireciona corretamente

---

## Fluxo 3 — App Operacional (Navegação Interna)
- [ ] Entrar em `/app/dashboard`
- [ ] Navegar para TPV, Orders, Staff, Menu
- [ ] Alguma rota tenta resolver tenantId?
- [ ] Algum módulo tenta “resolver contexto”?
- [ ] Algum erro silencioso aparece no console?

---

## Fluxo 4 — Estado Compartilhado
- [ ] Abrir 2 abas
- [ ] Navegar entre módulos
- [ ] Criar pedido numa aba, observar a outra
- [ ] SystemState se mantém?
- [ ] Algum contexto local diverge?
- [ ] Algum módulo depende de localStorage fora do bootstrap?

---

> Marque ✔️ ou ❌ para cada item. Não adicione opinião ou solução. Apenas observação factual.
