# Índice dos 4 Terminais — ChefIApp

**Propósito:** Referência única para a separação dos 4 terminais. O Core é soberano; cada terminal tem um contrato explícito. Nada mistura papéis.

**Lei:** Página Web ≠ App. App ≠ KDS. KDS ≠ TPV.  
Se **vende** → Web. Se **trabalha** → AppStaff. Se **executa** cozinha → KDS. Se **executa** caixa → TPV.

---

## 1. 🌍 Web Pública (GloriaFood Mode) — Navegador

| Item | Valor |
|------|--------|
| **Onde** | Navegador (merchant-portal rotas `/public/*`) |
| **Contrato** | [CORE_PUBLIC_WEB_CONTRACT.md](./CORE_PUBLIC_WEB_CONTRACT.md) |
| **Responsabilidade** | Venda online: menu, pedido, checkout, status, mesa QR, contacto, FAQ. Sem login, sem dashboard. |

---

## 2. 📱 AppStaff — iOS + Android (Expo)

| Item | Valor |
|------|--------|
| **Onde** | `/mobile-app` — Expo; simulador iOS/Android ou dispositivo físico |
| **Contrato** | [CORE_APPSTAFF_CONTRACT.md](../architecture/CORE_APPSTAFF_CONTRACT.md) (e subcontratos em docs/architecture) |
| **Responsabilidade** | Trabalho do funcionário: login, check-in/out, tarefas, avisos, métricas de turno, mini-KDS/mini-TPV (somente leitura). Não é configuração global, menu builder, financeiro completo, nem web pública. |

---

## 3. 🍳 KDS — Terminal de Cozinha (Instalado)

| Item | Valor |
|------|--------|
| **Onde** | Aplicação instalada (Electron/WebView ou dedicada); ecrã cozinha |
| **Contrato** | [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md) |
| **Responsabilidade** | Execução cozinha: fila de pedidos, prioridade do Core, SLA, estados (recebido / em preparo / pronto), alertas. Não cria pedidos, não altera preços, não acede a financeiro nem staff. |

---

## 4. 🖥 TPV — Terminal de Caixa (Instalado)

| Item | Valor |
|------|--------|
| **Onde** | Aplicação instalada; ecrã caixa |
| **Contrato** | [CORE_TPV_BEHAVIOUR_CONTRACT.md](../architecture/CORE_TPV_BEHAVIOUR_CONTRACT.md) |
| **Responsabilidade** | Execução de venda: abertura de pedido, fecho de conta, pagamento local, impressão, estado de caixa. Não cria regras, não altera preços, não edita menu, não gere staff. |

---

## 5. Resultado esperado

- Web abre no browser → **vende**
- AppStaff abre no iOS/Android → **trabalha**
- KDS instalado → **cozinha**
- TPV instalado → **caixa**
- **Core governa tudo.** Sem sobreposição. Sem confusão. Sem regressão arquitetural.
