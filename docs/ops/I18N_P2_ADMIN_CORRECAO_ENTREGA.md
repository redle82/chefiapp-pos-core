# Entrega — Correção P2 i18n (superfície Admin)

**Data:** 2026-03-15  
**Escopo:** P2 da auditoria i18n na superfície Admin: ReservasPage, LocationEntityTableCard, alinhamento pt-BR/pt-PT, labels dos selects em SoftwareTpvPage. Sem rotas, lógica, Electron, TPV/KDS operacional nem AppStaff.

---

## 1. Estado

- **P2 Admin concluído.** ReservasPage e LocationEntityTableCard passaram a usar i18n (namespace `config`, secções `reservas` e `legalEntities`). Alinhamento pt-BR/pt-PT aplicado nas chaves Admin (ortografia brasileira em pt-BR). Labels do select de idioma em SoftwareTpvPage migrados para chaves `softwareTpv.locale*`.
- **Mensagens de erro/toasts:** As páginas Admin já migradas em P1 (AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel, DesktopPairingSection, SoftwareTpvPage) já utilizam `t()` para mensagens visíveis ao utilizador; não foi encontrado texto de erro/toast hardcoded restante nessas páginas. Outros componentes Admin (GeneralCard*, DiscountModal, etc.) não foram alterados por não integrarem o conjunto “páginas já migradas” e para não alargar o escopo.

---

## 2. O que o Cursor fez

### Ficheiros alterados

1. **merchant-portal/src/features/admin/reservas/pages/ReservasPage.tsx**
   - Adicionado `useTranslation("config")`.
   - Título e subtítulo: `t("reservas.title")`, `t("reservas.subtitle")`.
   - `SECTIONS` passou de `label` para `labelKey` (reservas.tabDisponibilidad, tabGarantia, tabTurnos, tabMensajes, tabResumen); botões de aba usam `t(s.labelKey)`.
   - Conteúdo de cada secção unificado num único bloco: título e descrição obtidos via `SECTION_TITLE_KEYS` e `SECTION_DESC_KEYS` (reservas.sectionResumenTitle/Desc, sectionDisponibilidadTitle/Desc, etc.).

2. **merchant-portal/src/features/admin/legal-entities/components/LocationEntityTableCard.tsx**
   - Adicionado `useTranslation("config")`.
   - Título do card: `t("legalEntities.cardTitle")`.
   - Descrição: `t("legalEntities.cardDesc")`.
   - Cabeçalhos de tabela: `t("legalEntities.columnLocation")`, `t("legalEntities.columnEntity")`.
   - Empty state: `t("legalEntities.emptyLocations")`.
   - Aviso sem entidade: `t("legalEntities.warningNoEntity")`.

3. **merchant-portal/src/locales/pt-BR/config.json**
   - Nova secção **reservas:** title, subtitle, tabDisponibilidad, tabGarantia, tabTurnos, tabMensajes, tabResumen, sectionResumenTitle/Desc, sectionDisponibilidadTitle/Desc, sectionGarantiaTitle/Desc, sectionTurnosTitle/Desc, sectionMensajesTitle/Desc (pt-BR como referência).
   - Nova secção **legalEntities:** cardTitle, cardDesc, columnLocation, columnEntity, emptyLocations, warningNoEntity.
   - **Alinhamento pt-BR:** Em `devices.registeredDesc` substituído "actividade" por "atividade"; em `devices.tpvSection4Desc` substituído "actualizados" por "atualizados" (ortografia brasileira).
   - Em **softwareTpv:** adicionadas localePtBR, localeEsES, localeEnUS, localePtPT.

4. **merchant-portal/src/locales/pt-PT/config.json**
   - Secções **reservas** e **legalEntities** com equivalência em português de Portugal (ex.: "lembretes", "comparência", "separadores").
   - **softwareTpv:** localePtBR, localeEsES, localeEnUS, localePtPT.

5. **merchant-portal/src/locales/en/config.json**
   - Secções **reservas** e **legalEntities** em inglês.
   - **softwareTpv:** localePtBR, localeEsES, localeEnUS, localePtPT.

6. **merchant-portal/src/locales/es/config.json**
   - Secções **reservas** e **legalEntities** em espanhol (mantendo os textos originais da página, agora via chaves).
   - **softwareTpv:** localePtBR, localeEsES, localeEnUS, localePtPT.

7. **merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.tsx**
   - Constante `LOCALES` passou de `label` para `labelKey` (softwareTpv.localePtBR, localeEsES, localeEnUS, localePtPT).
   - Select de idioma: opções renderizadas com `t(l.labelKey)` em vez de `l.label` hardcoded.

### Chaves novas criadas

- **config.reservas:** title, subtitle, tabDisponibilidad, tabGarantia, tabTurnos, tabMensajes, tabResumen, sectionResumenTitle, sectionResumenDesc, sectionDisponibilidadTitle, sectionDisponibilidadDesc, sectionGarantiaTitle, sectionGarantiaDesc, sectionTurnosTitle, sectionTurnosDesc, sectionMensajesTitle, sectionMensajesDesc.
- **config.legalEntities:** cardTitle, cardDesc, columnLocation, columnEntity, emptyLocations, warningNoEntity.
- **config.softwareTpv:** localePtBR, localeEsES, localeEnUS, localePtPT.

### Textos hardcoded removidos

- **ReservasPage:** "Reservas", "Disponibilidad, garantía, turnos, mensajes y recordatorios.", "Disponibilidad", "Garantía y Cancelación", "Turnos", "Mensajes y recordatorios", "Resumen", "Resumen de reservas", "Configuración central de reservas. Usa las pestañas…", títulos e descrições das secções disponibilidad, garantia, turnos, mensajes.
- **LocationEntityTableCard:** "Asociación a ubicaciones", "Qué entidad legal se usa en cada ubicación…", "Ubicación", "Entidad legal asociada", "No hay ubicaciones. Crea ubicaciones en Configuración → Ubicaciones.", "Define la entidad legal principal…".
- **SoftwareTpvPage:** Labels do select de idioma "Português (Brasil)", "Español (España)", "English (US)", "Português (Portugal)".

### Residual e razão

- **Mensagens de erro/toasts noutras páginas Admin (GeneralCard*, DiscountModal, CreateClosureModal, etc.):** Não migradas nesta etapa. O escopo limitou-se a “mensagens nas páginas Admin já migradas”, que já usam i18n; alargar a outros componentes seria sair do P2 definido.
- **TIMEZONES e CURRENCIES em SoftwareTpvPage:** Mantidos com labels hardcoded (ex.: "America/Sao_Paulo (Brasil)"). O pedido era “opcionalmente labels dos selects… se ainda estiverem hardcoded”; foi feita apenas a migração mínima do select de idioma para coerência e impacto reduzido.

---

## 3. O que falta

- **Fora do escopo P2 Admin:** Erros/toasts noutros componentes Admin; labels dos selects de timezone e moeda em SoftwareTpvPage; restante superfícies (TPV/KDS operacional, AppStaff) conforme auditoria i18n.
- **Validação:** Testar no browser as páginas Reservas (config) e Legal Entities (localizações) em pt-BR, pt-PT, en e es.

---

## 4. Próximo passo único

Validar manualmente as páginas Reservas e Localizações/Entidades legais em vários idiomas **ou** avançar com i18n noutras superfícies conforme a auditoria (fora do Admin P2).

---

## 5. Prompt para o Cursor

```
Objetivo: validar no browser as alterações P2 i18n do Admin (ReservasPage, LocationEntityTableCard, select de idioma em SoftwareTpvPage) em pt-BR, pt-PT, en e es; ou, se preferir, aplicar i18n aos labels dos selects de timezone e moeda em SoftwareTpvPage (config.softwareTpv) sem alterar rotas nem lógica.
```
