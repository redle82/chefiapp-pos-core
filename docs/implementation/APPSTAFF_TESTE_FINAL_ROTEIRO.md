# Roteiro de teste final — AppStaff (execução + gates + modo de entrega)

**Objetivo:** Validar que o AppStaff funciona como aplicativo (entrada simples, troca de perfis, navegação, PWA).

---

## Pré-requisito

- `npm run dev` no merchant-portal (porta 5175).
- URL com `?debug=1` para ver Staff Switcher e faixa de debug do Gate.

---

## Roteiro obrigatório

1. **Abrir** `http://localhost:5175/app/staff/home?debug=1`
2. **Entrar como Gerente** — clicar no botão "🧠 Gerente" no bloco "Entrar como:"
3. **Confirmar** que vai para o launcher (grid de tiles)
4. **Abrir:**
   - TPV → deve abrir TPV real
   - KDS → deve abrir KDS
   - Tarefas → deve abrir Tarefas
5. **Voltar ao Launcher** (botão Início na bottom nav)
6. **Trocar para Garçom** — sair (check-out) ou recarregar e clicar "🍽️ Garçom"
7. **Abrir TPV** novamente
8. **Instalar como PWA** — Chrome: Menu → "Instalar ChefIApp" (ou equivalente)
9. **Abrir pelo ícone** (janela instalada)
10. **Repetir** passos 2–6 na janela PWA

**Critério de sucesso:** Tudo funciona sem reload estranho, sem telas vazias, sem layout quebrado.

---

## Debug (quando `?debug=1`)

- **Faixa no topo:** mostra `restaurant`, `location`, `contract`, `worker`, `role`, `source`, e `bloqueio:X` se algum gate falhar.
- **Console:** `[StaffAppGate]` com estado; `[StaffAppGate] Bloqueado em: X` quando aplicável.

---

## O que verificar

| Check | Esperado |
|------|----------|
| Gate bloqueado em contract | Ver Landing com "Entrar como:" (Staff Switcher) |
| Gate bloqueado em worker | Ver WorkerCheckInView com Staff Switcher no topo |
| Clicar Dono/Gerente/Garçom/Cozinha/Limpeza | Entra no launcher, role correto |
| Tiles TPV, KDS, Turno, Tarefas, Exceções | Abrem o modo correspondente |
| Voltar ao Launcher | Bottom nav "Início" |
| PWA instalada, abrir pelo ícone | Sem barra de URL; start em /app/staff/home |
