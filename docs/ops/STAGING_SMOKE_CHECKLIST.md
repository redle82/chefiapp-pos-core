# Staging Smoke Checklist (Go-Live Comercial)

**Objetivo:** validar que o fluxo comercial está pronto para venda com evidência operacional mínima.

**Escopo:**

1. Instala (sem devtools)
2. Pairing (token puro + URL)
3. Impressão (labels/kitchen/receipt)
4. Handoff (mobile → caixa)
5. Rota `/app/install`
6. Observabilidade mínima

---

## Como executar

- **Passos manuais (UI):** neste documento.
- **Checks automáticos (não-UI):** `bash scripts/staging/smoke.sh`
- **Política de falha:**
  - **Fail hard:** Core, onboarding base, contratos críticos.
  - **Warn:** observabilidade externa não-bloqueante.
- **Evidence pack automático:** `tmp/staging-smoke-YYYYMMDD-HHMMSS/`

---

## 0) Pré-requisitos de staging (1 vez)

### Variáveis do `merchant-portal`

- `VITE_DESKTOP_RELEASES_AVAILABLE=1`
- `VITE_DESKTOP_DOWNLOAD_BASE=<URL_BASE_BINARIOS>`
- `VITE_DESKTOP_DOWNLOAD_MAC_FILE=<NOME_DMG>`
- `VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=<NOME_EXE>`

### Binários publicados

- `ChefIApp-Desktop-Setup.exe`
- `ChefIApp-Desktop.dmg`

### Validação de binários (modo atual)

- **Default (ativado):** valida URL/acesso HTTP dos binários.
- **Opcional (modo estrito):** valida tamanho mínimo/checksum.
  - `DESKTOP_DOWNLOAD_MIN_BYTES`
  - `DESKTOP_DOWNLOAD_WINDOWS_SHA256`
  - `DESKTOP_DOWNLOAD_MAC_SHA256`

### Aceite

- Abrir `/admin/devices` mostra links reais (sem "coming soon").
- Clicar nos links inicia download sem `403/404`.

---

## 1) Smoke “Instalação” (Desktop)

### Passos

1. Em browser normal, abrir `/admin/devices`.
2. Em “Software desktop”, baixar instalador (Windows).
3. Instalar e abrir o app desktop.

### Aceite

- App abre sem bloqueio.
- Não cai em `BrowserBlockGuard`.
- Não exige devtools.

---

## 2) Smoke “Pairing” (token puro + URL)

### Passos

1. Em `/admin/devices`, gerar token de instalação.
2. No app desktop, colar **token puro**.
3. No app desktop, colar **URL completa** de instalação (`/install?token=...` ou URL full).
4. Confirmar finalização do pairing em ambos os casos.

### Aceite

- Token puro funciona.
- URL completa funciona.
- App fica associado à estação/restaurante sem gambiarras.

### Evidência opcional Core

- Registro de terminal em `gm_terminals`.
- Heartbeat (quando disponível no ambiente).

---

## 3) Smoke “Impressoras — Wizard 3 funções”

### 3.1 Listagem spooler

- No desktop em `/admin/devices`, wizard lista impressoras (ex.: `Microsoft Print to PDF`).

**Aceite:** dropdown não vazio.

### 3.2 Guardar assignments (3 funções)

- Etiquetas → target spooler → Guardar
- Cozinha → target spooler → Guardar
- Recibo → target spooler → Guardar

**Aceite:** UI confirma sucesso e os dados persistem.

**Evidência opcional DB:** 3 linhas em `gm_printer_assignments` para `labels`, `kitchen`, `receipt`.

### 3.3 Test print (3 funções)

- Clicar “Imprimir teste” para cada função.

**Aceite:**

- Job evolui para `sent` **ou** `retry` com `next_retry_at` + `error_message`.
- Não fica “pendente eterno” sem claim.

**Evidência opcional DB (`gm_print_jobs`):**

- `claimed_by_station_id` preenchido ao claim.
- `attempt_count` incrementa em falha.
- `status` muda (`sent` ou `pending` com retry agendado).

---

## 4) Smoke “Handoff” (mobile → caixa)

### Passos

1. No mobile (AppStaff/Waiter):
   - lançar itens numa mesa;
   - tentar pagar/fechar (deve bloquear);
   - enviar para caixa.
2. No TPV central (desktop):
   - abrir inbox de handoff;
   - confirmar mesa pendente;
   - clicar “Finalizar & pagar”.

### Aceite

- Mobile sem caminho direto para pagamento.
- Handoff aparece no TPV em ~2s (poll/refresh).
- TPV abre fluxo normal de pagamento.

---

## 5) Smoke “Rota `/app/install`”

### Evidência obrigatória (dupla)

1. **Manual runtime:** abrir `/app/install` no browser de staging.
2. **Técnica de suporte:** check HTTP/contrato via `scripts/staging/smoke.sh`.

### Aceite

- Sem loop e sem dead-end.
- Runtime leva para `/admin/devices`.

---

## 6) Smoke “Suporte & observabilidade mínima”

### Aceite

- Fora de runtime desktop: `GlobalBlockedView` com CTA correto.
- Falha de print: erro claro ao operador e `error_message` no job.
- Download mal configurado: UI não quebra e fornece fallback claro.

### Observabilidade operacional (mínimo)

- Health Core e app verificáveis.
- Logs de erro acessíveis ao time (app/core).
- Resultado dos checks automáticos registrado no run.

---

## Evidence Pack (obrigatório por execução)

Anexar ao PR/ticket de release:

1. Diretório automático `tmp/staging-smoke-YYYYMMDD-HHMMSS/` contendo:

- `env.summary` (sem segredos)
- `curl-core-health.txt`
- `curl-frontend-head.txt`
- `contracts.txt`
- `result.json`

2. Screenshot de `/admin/devices` com links reais.
3. Screenshot do pairing com token puro e com URL completa.
4. Screenshot/registro dos 3 testes de impressão.
5. Screenshot do handoff pendente e da finalização no TPV.
6. Prova manual de `/app/install` runtime (sem loop).

---

## Comandos úteis

```bash
# Smoke não-UI automatizado
bash scripts/staging/smoke.sh

# Gate opcional no trilho de auditoria (SKIP se env ausente)
npm run audit:staging

# Health rápido Core local
bash scripts/core/health-check-core.sh

# Health pós-deploy (URLs explícitas)
FRONTEND_URL=https://staging.example.com CORE_URL=https://staging-api.example.com \
  bash scripts/ops/healthcheck-post-deploy.sh
```
