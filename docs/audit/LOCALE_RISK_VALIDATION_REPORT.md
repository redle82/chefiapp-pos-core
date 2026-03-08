# LOCALE_RISK_VALIDATION_REPORT

Validação dos 5 pontos de risco de locale/datas fora da camada de formatação já migrada para `getFormatLocale()` / `useFormatLocale()`.

Data: 2026-02-22  
Scope: merchant-portal, integration-gateway, fiscal-modules, mobile-app.

---

## 1. PDFs e recibos gerados fora do React

### 1.1 Achados

| Ficheiro | Linha(s) relevante(s) | Achado | Risco |
| -------- | --------------------- | ------ | ----- |
| `merchant-portal/src/core/fiscal/FiscalPrinter.ts` | 30–35 | Recibo fiscal principal usa `toLocaleDateString(getFormatLocale())` e `toLocaleTimeString(getFormatLocale())` para cabeçalho de data/hora. | OK — formato alinhado com locale da app. |
| `merchant-portal/src/core/fiscal/FiscalPrinter.ts` | 405 | Template HTML interno inclui `<div class="meta">\${now.toLocaleTimeString()}</div>` **sem** locale. | **Médio/alto** — hora no cabeçalho do recibo depende do locale do browser em vez do locale da app. |
| `merchant-portal/src/pages/AppStaff/utils/exportToPDF.ts` | 155–160 | Footer do PDF de relatório de turno usa `new Date().toLocaleString('pt-PT')`. | **Alto** — sempre pt-PT, independentemente do idioma/país do restaurante. |

Não foram encontrados outros geradores de PDF/HTML com `toLocale*` em ficheiros `.ts` fora destes dois pontos.

### 1.2 Conclusão (PDFs/Recibos)

- A infraestrutura principal de formatação (recibo fiscal e reporting) já respeita `getFormatLocale()`.
- Existem **dois pontos específicos** ainda culturalmente presos:
  - Hora do cabeçalho no template HTML de `FiscalPrinter` (browser locale).
  - Footer de `exportShiftReportToPDF` hardcoded para `pt-PT`.

**Recomendação:** Na próxima ronda de implementação:
- Trocar ambos os usos para `getFormatLocale()` (ou, em contexto React, `useFormatLocale()` passado como prop), para alinhar com o resto do sistema.

---

## 2. Exportações CSV / Excel

### 2.1 Call sites e formato de datas/números

**Funções de infraestrutura:**

- `merchant-portal/src/core/reports/csvExport.ts`
  - `buildCsvFromRows(headers, rows)`: não formata datas, apenas serializa valores recebidos.
  - `downloadCsvFile(csvContent, filename)`: apenas inicia download.
  - `exportCsv(headers, rows, filename)`: `buildCsvFromRows` + `downloadCsvFile`.
  - `centsToDecimal(cents)`: lida apenas com números, sem locale (usa `.toFixed(2)`).

**Call sites principais:**

- `merchant-portal/src/pages/Reports/DailyClosingReportPage.tsx`
  - Chama `exportCsv(...)` com headers traduzidos via `t(...)` e linhas montadas na própria página.
  - Datas/horas usadas nas linhas vêm de `new Date(...).toLocaleString(i18n.language)` na própria página (UI), **não** dentro da infra de CSV.

- `merchant-portal/src/pages/Reports/SalesSummaryReportPage.tsx`
  - Usa `exportCsv(...)` com headers a partir de `t("salesSummary.csv.*")`.
  - As colunas numéricas (`grossSales`, `averageTicket`, etc.) são calculadas via `centsToDecimal` e valores brutos; não há `toLocale*` nos dados exportados.

- `merchant-portal/src/pages/Reports/OperationalActivityReportPage.tsx`
  - Usa `exportCsv(...)`; datas são serializadas como strings já montadas no componente (sem `toLocale*` na infra).

- `merchant-portal/src/pages/Reports/GamificationImpactReportPage.tsx`
  - Usa `exportCsv(...)`; datas/intervalos são strings construídas com `toInput(date)` e não com `toLocale*`.

- `merchant-portal/src/pages/Reports/SalesByPeriodReportPage.tsx`
  - Funções `buildCsv`, `buildCsvDaily`, `buildCsvMonthly` (no próprio ficheiro) usam `getFormatLocale()` para `toLocaleDateString` / `toLocaleTimeString`.
  - Download é feito via `Blob` e `a.download` local ao ficheiro, sem passar pela infra de `csvExport.ts`.

- `merchant-portal/src/core/fiscal/FiscalBackupService.ts`
  - `convertToCSV` gera CSV para backup fiscal com campos `created_at` e `reported_at` em bruto (strings ISO vindas da BD).
  - Não há `toLocale*` aqui; formato é adequado para consumo máquina-máquina.

- `merchant-portal/src/core/reporting/AdvancedReportingService.ts`
  - `exportToCSV` / `exportToExcel` usam `convertToCSV` que apenas constrói CSV a partir de dados crus.
  - Comentários indicam futuro uso de `xlsx`, mas hoje não há formatação de datas com locale.

### 2.2 Conclusão (CSV/Excel)

- **Relatórios de vendas/turnos**:
  - SalesByPeriod: datas/horas usam `getFormatLocale()` (alinhado com app).
  - DailyClosing/SalesSummary/OperationalActivity/Gamification: CSV contém strings já montadas nos componentes; quando há datas human-readable, dependem do uso de `toLocale*` no próprio componente (já migrado em grande parte para `useFormatLocale` / `getFormatLocale()`), não da infra CSV.

- **Backups fiscais / reporting avançado**:
  - Usam strings ISO (`toISOString()`) ou valores numéricos crus, sem dependência de locale da UI.

**Recomendação:**  
Manter a política actual:
- Para CSVs “para humanos”: usar `getFormatLocale()` ao gerar datas antes de passar para `exportCsv`.
- Para CSVs técnicos (fiscal/backup): manter ISO e evitar `toLocale*`.

---

## 3. Logs fiscais e documentos legais

### 3.1 Achados

**Módulos fiscais (fora do portal):**

- `fiscal-modules/pt/saft/saftXml.ts`  
  - Usa `doc.raw_payload?.issued_at || new Date().toISOString()`.

- `fiscal-modules/adapters/SAFTAdapter.ts`  
  - Usa `payload.issued_at || new Date().toISOString()`.  
  - `generated_at: new Date().toISOString()`.

- `fiscal-modules/adapters/TicketBAIAdapter.ts`  
  - `generated_at: new Date().toISOString()`.  
  - `const now = new Date().toISOString()`.

**Fiscal no merchant-portal:**

- `merchant-portal/src/core/fiscal/SaftExportService.ts`
  - `issuedAt = doc.created_at || new Date().toISOString()`.

- `merchant-portal/src/core/fiscal/FiscalService.ts`
  - `generated_at: new Date().toISOString()`.

- `merchant-portal/src/core/fiscal/ATIntegrationService.ts`
  - Payloads para AT usam `submitted_at: new Date().toISOString()`.

- `merchant-portal/src/core/fiscal/FiscalQueueWorker.ts`
  - `last_retry_at: new Date().toISOString()` em vários pontos.

- `merchant-portal/src/core/fiscal/FiscalBackupService.ts`
  - Filtros e nomes de ficheiros usam `toISOString()` (ou `split("T")[0]`), nunca `toLocale*`.

**Única excepção relevante já tratada na secção 1:**  
- `FiscalPrinter.ts` tem um `toLocaleTimeString()` sem locale em template HTML de recibo (apresentação, não payload fiscal).

### 3.2 Conclusão (logs/documentos fiscais)

- Toda a camada fiscal (SAFT, AT, backups, integrações PT) usa **ISO 8601 (`toISOString()`)** para timestamps persistidos ou enviados a serviços externos.
- Não há uso de locale de UI (pt-PT, pt-BR, etc.) em payloads fiscais, apenas na camada de apresentação do recibo.

**Recomendação:**  
Manter a política de usar sempre `toISOString()` em qualquer payload ou log fiscal. O único ajuste futuro sugerido é alinhar a apresentação do recibo (template HTML) com `getFormatLocale()`, já coberto na secção 1.

---

## 4. Webhooks externos que serializam datas

### 4.1 Achados

**integration-gateway**

- Grep em `integration-gateway/src` por `toLocaleString|toLocaleDateString|toLocaleTimeString|Intl.(DateTimeFormat|NumberFormat)` → **nenhum resultado**.
- `integration-gateway/src/services/webhook-handler.ts`:  
  - Recebe payloads (`payload: Record<string, unknown>`) e delega para RPC `process_webhook_event` no Supabase.  
  - Não transforma datas para strings de apresentação; payloads são armazenados como JSON.

**Funções Supabase (Stripe/SumUp/Pix)**

- Grep em `supabase/functions` pelos mesmos padrões → **nenhum resultado**.
- Funções actuam como handlers de gateway; datas vêm em formato definido pelo provider (geralmente ISO) e são propagadas como tal.

### 4.2 Conclusão (webhooks)

- Não foi encontrado nenhum ponto em que datas sejam convertidas para `toLocale*` ou `Intl.DateTimeFormat` antes de serem:
  - Armazenadas em logs de webhooks.
  - Reencaminhadas para sistemas externos.
- Payloads de webhooks permanecem em formato técnico (JSON, datas ISO).

**Recomendação:**  
Documentar como regra de arquitectura:
- “Payloads de webhooks nunca usam `toLocale*` ou formatos de apresentação; apenas ISO ou formatos definidos por contrato com o parceiro.”

---

## 5. Mobile app (Expo) — formatação de datas/números

### 5.1 Achados

Grep em `mobile-app/` por `toLocaleString|toLocaleDateString|toLocaleTimeString|Intl.` resultou em:

| Ficheiro | Linha(s) | Achado | Tipo |
| -------- | -------- | ------ | ---- |
| `mobile-app/app/(tabs)/kitchen.tsx` | 123 | `now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })` | Usa locale do dispositivo (sem override). |
| `mobile-app/services/PrinterService.ts` | 132, 166, 216 | `.line(new Date().toLocaleString())` e `.line(new Date().toLocaleTimeString())` | Timestamps de impressão seguem locale do dispositivo. |
| `mobile-app/app/(tabs)/manager.tsx` | 449, 613, 711, 715 | Vários `toLocaleTimeString`/`toLocaleDateString`/`toLocaleString` sem locale explícito. | UI de manager depende do locale do dispositivo. |
| `mobile-app/components/WaitlistBoard.tsx` | 135 | `new Date().toLocaleTimeString('pt-PT', { ... })` | **Locale fixo pt-PT** para hora na board de espera. |
| `mobile-app/components/ShiftGate.tsx` | 119 | `new Date(notice.created_at).toLocaleDateString()` | Locale do dispositivo. |
| `mobile-app/components/ManagerCalendarView.tsx` | 36, 188 | `toLocaleDateString('pt-BR', { weekday: 'short' })`, `toLocaleTimeString([], {...})` | Dia da semana fixo `pt-BR`; horas com locale do dispositivo. |
| `mobile-app/components/FinancialVault.tsx` | 227 | `new Date(sessionData.started_at).toLocaleTimeString()` | Locale do dispositivo. |
| `mobile-app/components/CashManagementModal.tsx` | 178 | `new Date(currentShift.started_at).toLocaleTimeString()` | Locale do dispositivo. |

Não há qualquer integração com `react-i18next`, `getFormatLocale()` ou equivalente no mobile-app.

### 5.2 Conclusão (mobile)

- **Estado actual:**  
  - O mobile app usa **sempre o locale do dispositivo**, com vários pontos hardcoded para `pt-PT`/`pt-BR`.  
  - Não existe uma camada de i18n nem locale de app controlado pelo restaurante/tenant.

- **Risco:**  
  - Para operações em países onde o device locale não coincide com o idioma do restaurante/equipa, pode haver inconsistência entre AppStaff web e mobile.  
  - Hardcodes `pt-PT` e `pt-BR` mantêm viés cultural explícito.

**Recomendação:**  
Para uma fase futura (fora deste plano de validação):
- Introduzir um pequeno serviço de locale no mobile, idealmente alinhado com o mesmo `SupportedLocale` (`pt-PT`, `pt-BR`, `en`, `es`) vindo do backend ou da sessão.
- Substituir hardcodes `pt-PT`/`pt-BR` por esse locale lógico, com fallback para locale do dispositivo apenas onde fizer sentido.

---

## 6. Resíduos no merchant-portal (locale fixo ou ausente em contexto de UI)

Durante a auditoria, além dos 65+ pontos já migrados para `getFormatLocale()` / `useFormatLocale()`, permanecem alguns usos de `toLocale*` com locale fixo ou sem locale em contextos de UI no portal.

### 6.1 Lista de resíduos relevantes

| Ficheiro | Linha(s) | Achado | Nota |
| -------- | -------- | ------ | ---- |
| `merchant-portal/src/features/admin/customers/pages/CustomerDetailPage.tsx` | 143, 168, 187 | `toLocaleDateString("pt")`, `toLocaleString("pt")`, `toLocaleDateString("pt")`. | Locale fixo `"pt"`. |
| `merchant-portal/src/core/activation/ActivationMetrics.ts` | 231–232 | `new Date(earliest).toLocaleDateString('pt-BR')`, idem para `latest`. | Locale fixo `pt-BR` em texto de métricas. |
| `merchant-portal/src/features/admin/config/pages/integrations/IntegrationsWebhooksPage.tsx` | 399, 683 | `new Date(...).toLocaleString()` sem locale. | Usa locale do browser. |
| `merchant-portal/src/pages/People/TimeTrackingPage.tsx` | 104, 142, 145, 146 | `toLocaleString()`, `toLocaleDateString()`, `toLocaleTimeString()` sem locale. | UI de time tracking depende de locale do browser. |
| `merchant-portal/src/pages/Config/RestaurantPeopleSection.tsx` | 56 | `d.toLocaleDateString(undefined, { ... })`. | Usa fallback do runtime. |
| `merchant-portal/src/pages/AppStaff/PulseList.tsx` | 142 | `new Date(pulse.created_at).toLocaleTimeString()`. | Hora de pulse depende de locale do browser. |
| `merchant-portal/src/core/adapter/empire-pulse.ts` | 65 | `new Date().toLocaleTimeString()` em log de debug. | Apenas debug, baixo impacto. |

> Nota: A grande maioria dos outros usos de `toLocale*` em `.tsx` já foi migrada para usar `useFormatLocale()` (React) ou `getFormatLocale()` (serviços), e não está listada aqui.

### 6.2 Conclusão (resíduos portal)

- O portal já está **maioritariamente desalinhado de locale fixo**; os pontos acima são “últimos vestígios” em áreas menos críticas (detalhe de cliente, métricas de activação, logs, secções de configuração específicas).
- Não são bloqueadores imediatos para multi-país, mas:
  - Mantêm viés cultural (pt/pt-BR).
  - Podem gerar inconsistência visual entre páginas já migradas e páginas residuais.

**Recomendação:**  
Num próximo ciclo de hardening:
- Substituir todos os `toLocale*("pt" | "pt-BR")` por `getFormatLocale()` ou por `useFormatLocale()` no componente React.
- Substituir `toLocale*()` sem locale por `toLocale* (locale)` usando `useFormatLocale()` (ou `getFormatLocale()` em serviços).

---

## 7. Resumo executivo e recomendações

### 7.1 Resumo por área

- **PDFs/Recibos:**  
  - 2 achados de risco (template HTML em `FiscalPrinter`, footer de `exportToPDF`).  
  - Resto alinhado com `getFormatLocale()`.

- **CSV/Excel:**  
  - Infraestrutura (`csvExport`, `AdvancedReportingService`, `FiscalBackupService`) não introduz locale fixo.  
  - Relatórios principais usam `getFormatLocale()` ou ISO; cabeçalhos ainda em PT em alguns casos (questão de tradução, não de formato).

- **Logs fiscais:**  
  - Usa-se consistentemente `toISOString()` em payloads e logs.  
  - Sem uso de locale de UI em dados enviados ao fisco ou para SAFT.

- **Webhooks externos:**  
  - Nenhum uso de `toLocale*` ou `Intl.*` em `integration-gateway` ou funções Supabase.  
  - Datas em payloads permanecem em formato técnico (normalmente ISO).

- **Mobile app:**  
  - Vários `toLocale*` sem locale e alguns com `pt-PT` / `pt-BR` fixos.  
  - Sem infraestrutura de i18n; depende do locale do dispositivo.

- **Resíduos portal:**  
  - Um punhado de usos em páginas específicas (CustomerDetail, ActivationMetrics, Webhooks, TimeTracking, RestaurantPeopleSection, PulseList, um adapter de debug).

### 7.2 Recomendações globais (sem implementação neste relatório)

1. **PDFs/Recibos (prioridade alta):**
   - Ajustar `FiscalPrinter` (template HTML) e `exportToPDF` para usar `getFormatLocale()` em vez de browser locale ou `pt-PT` fixo.

2. **Portal — resíduos de locale:**
   - Numa próxima iteração, migrar todos os usos residentes listados na secção 6 para `getFormatLocale()` / `useFormatLocale()`.

3. **Mobile app:**
   - Definir estratégia:  
     - ou aceitar “sempre device locale” como política explícita,  
     - ou introduzir um locale lógico por restaurante/app com pequeno serviço de formatação.

4. **Fiscal / Webhooks / CSV técnico:**
   - Manter a política de usar ISO 8601 (`toISOString()`) nesses contextos e bloquear `toLocale*` via lint/regra de revisão.

5. **Governança futura:**
   - Considerar uma regra de ESLint ou script de auditoria (`npm run audit:locale`) que verifique:
     - `toLocale*("pt" | "pt-BR" | "pt-PT" | "es-ES")` proibido, excepto em ficheiros de config de locale.
     - `toLocale*()` sem locale proibido em `merchant-portal/src` (excepto testes).

Este relatório confirma que a **camada de formatação está, em grande parte, neutra em relação a PT**, com alguns pontos bem delimitados a endereçar numa próxima fase de implementação.

