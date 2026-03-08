# Mobile App — Fase 2 de i18n e locale

## 1. Estado actual (resumo)

Com base em `docs/audit/LOCALE_RISK_VALIDATION_REPORT.md`:

- O mobile app (Expo) usa sempre **locale do dispositivo**.
- Existem vários `toLocale*` sem locale explícito e alguns hardcodes `pt-PT` / `pt-BR`.
- Não há camada de i18n nem locale “lógico” controlado pelo Core.

Impacto:

- Inconsistência visual entre AppStaff web e mobile em ambientes multi‑país.
- Viés cultural para PT em ecrãs como waitlist, manager calendar, financial vault.

## 2. Objetivo da Fase 2

Introduzir uma camada leve de **i18n/locale** no mobile, alinhada com:

- os mesmos idiomas do portal (`pt-PT`, `pt-BR`, `en`, `es`);
- a currency/país configurados no Core para o restaurante;
- o modelo de `getFormatLocale()` já usado no merchant‑portal.

Sem bloquear:

- aquisições iniciais em novos mercados (mobile continua funcional, apenas polido aos poucos);
- operações existentes em PT/BR (mantendo defaults compatíveis).

## 3. Estratégia de alto nível

1. **Definir modelo de locale lógico no mobile**
   - Introduzir um tipo `SupportedLocale = "pt-PT" | "pt-BR" | "en" | "es"`.
   - Guardar este locale em:
     - contexto React (`LocaleContext`), com provider em `_layout.tsx`;
     - armazenamento persistente leve (`AsyncStorage`) para reabrir com o mesmo locale.
   - Fonte inicial:
     - tentar ler do backend (`gm_restaurants.country/currency` → mapear para locale recomendada);
     - fallback: `deviceLocale` (por exemplo, `expo-localization`).

2. **Camada de formatação**
   - Criar util `formatLocale.ts` com:
     - `getFormatLocale(locale: SupportedLocale): string` (mesmo contrato do portal);
     - helpers `formatDate`, `formatTime`, `formatDateTime`, `formatMoney`.
   - Proibir novos usos directos de `toLocale*` em componentes; usar sempre os helpers.

3. **Introduzir i18n de strings**

Passo incremental:

1. Adicionar `react-i18next` + ficheiros `mobile-app/locales/{pt-BR,pt-PT,en,es}.json`.
2. Wrap raiz com `I18nextProvider` e `LocaleContext`:
   - `i18n.language` ligado ao `SupportedLocale`.
3. Migrar gradualmente:
   - labels de navegação/tab bar;
   - textos principais de operação (kitchen, manager, staff);
   - mensagens de erro/alertas.

4. **Refactor das chamadas `toLocale*` mais críticas**

Prioridade:

1. **Impressão/recibos (`services/PrinterService.ts`)**
   - Substituir `new Date().toLocaleString()` / `toLocaleTimeString()` por:
     - `formatDateTime(now, locale)` com base em `getFormatLocale`.
2. **Waitlist / Manager Calendar / FinancialVault / CashManagementModal**
   - Onde existirem hardcodes `pt-PT` / `pt-BR`, substituir por:
     - `getFormatLocale(locale)` vindo do contexto.
3. **Restante UI (kitchen, manager tabs)**
   - Trocar `toLocale*()` sem locale por helpers (`formatDate` / `formatTime`).

## 4. Roadmap sugerido (sprints)

### Sprint A — Infraestrutura

- [ ] Introduzir `LocaleContext` com `SupportedLocale`.
- [ ] Implementar `formatLocale.ts` + helpers de data/hora.
- [ ] Ligar `SupportedLocale` a `expo-localization` como seed.
- [ ] Criar skeleton de i18n (`react-i18next`) com ficheiros de idioma vazios.

### Sprint B — Flows críticos (kitchen / manager)

- [ ] Migrar textos principais de:
  - `app/(tabs)/kitchen.tsx`
  - `app/(tabs)/manager.tsx`
- [ ] Substituir `toLocale*` em:
  - `kitchen.tsx` (tempo de tickets);
  - `ManagerCalendarView.tsx` (datas/horas de agenda);
  - `WaitlistBoard.tsx` (hora na board de espera).

### Sprint C — Impressão e fluxos financeiros

- [ ] Refactor `services/PrinterService.ts` para usar `formatDateTime` / `formatTime`.
- [ ] Migrar `FinancialVault.tsx` e `CashManagementModal.tsx` para helpers de formatação.

### Sprint D — Polimento e governance

- [ ] Adicionar script de auditoria para `mobile-app/` similar ao `LOCALE_RISK_VALIDATION_REPORT`.
- [ ] Introduzir regra ESLint opcional para proibir `toLocale*` sem locale no mobile.
- [ ] Completar traduções EN/ES dos principais fluxos.

## 5. Riscos e mitigação

- **Risco:** regressões visuais em PT/BR ao trocar `toLocale*` por helpers.  
  **Mitigação:** manter defaults dos helpers compatíveis com `pt-BR`/`pt-PT` e testar manualmente flows mais usados.

- **Risco:** divergência entre mobile e web em novas línguas.  
  **Mitigação:** partilhar tabela de `SupportedLocale` e convenções de `getFormatLocale` entre projects (`docs/i18n` + tipos partilhados).

## 6. Definition of Done (Fase 2)

- [ ] Mobile consegue correr em EN/ES sem textos obviamente em PT em ecrãs principais.
- [ ] Não há `toLocale*("pt-PT" | "pt-BR")` hardcoded em componentes; apenas via helpers.
- [ ] Impressões/recibos do mobile usam locale coerente com o restaurante.
- [ ] Existe documentação mínima de como configurar idioma/locale do mobile por tenant.

