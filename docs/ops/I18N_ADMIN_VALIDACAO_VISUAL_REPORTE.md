# Validação visual i18n — Superfície Admin (relatório)

**Data:** 2026-03-15  
**Objetivo:** Validar no browser as correções de i18n já aplicadas no Admin (P0/P1/P2), sem alterar código.  
**Metodologia:** Auditoria estática do código + checklist para validação visual manual.

---

## 1. Estado

- **Validação estática concluída.** Todos os componentes no escopo (ReservasPage, LocationEntityTableCard, SoftwareTpvPage, AdminSidebar, AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel, DesktopPairingSection) usam `useTranslation` e exibem textos através de `t(key)`. As chaves utilizadas existem nos quatro locales (pt-BR, pt-PT, en, es) nas secções `config.reservas`, `config.legalEntities`, `config.devices`, `config.qr`, `config.softwareTpv` e `sidebar.adminNav`.
- **Validação visual no browser** depende de execução manual: trocar idioma na app, percorrer as rotas listadas abaixo e confirmar que não aparecem hardcodes, chaves literais nem mistura de idiomas. Este documento inclui o checklist para esse passo.

---

## 2. O que o Cursor fez

- **Auditoria estática (sem alterar código):**
  - Verificação, em cada ficheiro do escopo, de que não restam strings visíveis em hardcode (exceto os residuais listados em § 3).
  - Confirmação de que todas as chaves referenciadas em `t(...)` existem em `merchant-portal/src/locales/{pt-BR,pt-PT,en,es}/config.json` e, para o sidebar, em `sidebar.json`.
- **Checklist de validação visual** (secção abaixo) para o utilizador executar no browser.
- **Listagem de residuais** de baixa severidade e recomendação da próxima superfície (i18n).

Nenhum ficheiro de código foi alterado nesta etapa.

---

## 3. O que ficou validado (por código)

| Superfície | Ficheiro | Estado |
|------------|----------|--------|
| **ReservasPage** | `reservas/pages/ReservasPage.tsx` | Título, subtítulo, abas e conteúdo das secções vêm de `t("reservas.*")`. Chaves presentes nos 4 locales. |
| **LocationEntityTableCard** | `legal-entities/components/LocationEntityTableCard.tsx` | Título, descrição, colunas, empty state e aviso vêm de `t("legalEntities.*")`. Chaves presentes nos 4 locales. |
| **SoftwareTpvPage** | `software-tpv/pages/SoftwareTpvPage.tsx` | Select de idioma usa `t("softwareTpv.localePtBR")` etc. Demais textos já migrados em P0. |
| **AdminSidebar** | `dashboard/components/AdminSidebar.tsx` | Grupos e itens de navegação e badges vêm de `t("sidebar.adminNav.*")`. |
| **AdminDevicesPage** | `devices/AdminDevicesPage.tsx` | Títulos, secções, formulário, tabela e estados vêm de `t("devices.*")`. |
| **AdminTPVTerminalsPage** | `devices/AdminTPVTerminalsPage.tsx` | Cabeçalho, fluxo, 4 blocos, formulário, tabela e empty state vêm de `t("devices.*")`. |
| **DesktopDownloadSection** | `devices/DesktopDownloadSection.tsx` | Textos de release, build local, PROD, passos e botões vêm de `t("devices.download*")`. O interpolado `{{label}}` em "Descarregar para {{label}}" recebe "macOS" ou "Windows" de `getDownloadTargets` (nomes de SO, não chaves). |
| **InstallQRPanel** | `devices/InstallQRPanel.tsx` | Títulos, expiração, botão Copiar URL, tipo/token e instruções iOS/Android vêm de `t("qr.*")`. |
| **DesktopPairingSection** | `devices/DesktopPairingSection.tsx` | Já migrado em P0 com `t("devices.*")`. |

---

## 4. Checklist para validação visual no browser

Executar com o merchant-portal a correr (`pnpm --filter merchant-portal run dev`), abrir o Admin e, para cada idioma (pt-BR, pt-PT, en, es), confirmar:

1. **Troca de idioma**
   - [ ] O seletor de idioma (ou configuração da app) permite escolher pt-BR, pt-PT, en e es.
   - [ ] Ao trocar, as páginas do Admin passam a exibir textos no idioma escolhido (sem atraso indevido ou flashes de chaves).

2. **ReservasPage** (rota que inclui reservas, ex.: `/admin/config/reservas` ou equivalente)
   - [ ] Título e subtítulo no idioma ativo.
   - [ ] Abas (Disponibilidade, Garantia e Cancelamento, Turnos, Mensagens e recordatórios, Resumo) no idioma ativo.
   - [ ] Conteúdo da secção visível (título + descrição) no idioma ativo.
   - [ ] Nenhuma chave literal visível (ex.: `reservas.tabDisponibilidad`).
   - [ ] Nenhuma mistura de idiomas na mesma tela.

3. **LocationEntityTableCard** (onde o card é renderizado, ex.: configuração / entidades legais / localizações)
   - [ ] Título "Associação a localizações" (ou equivalente) no idioma ativo.
   - [ ] Descrição e cabeçalhos de tabela no idioma ativo.
   - [ ] Mensagem de empty state e aviso sem entidade no idioma ativo.
   - [ ] Nenhuma chave literal visível.

4. **SoftwareTpvPage** (Software TPV no Admin)
   - [ ] Select de idioma com opções no idioma ativo (ex.: "Português (Brasil)", "English (US)").
   - [ ] Restante da página (títulos, labels, atalhos) no idioma ativo e sem chaves literais.

5. **Superfícies P0/P1**
   - [ ] **Sidebar:** Grupos (Comando, Operar, Analisar, Governar, Conectar) e itens no idioma ativo; badges BETA/BREVE/OFF conforme locale.
   - [ ] **AdminDevicesPage** (/admin/devices): Título AppStaff, subtítulo, fluxo, secção "Adicionar dispositivo", tabela e empty state no idioma ativo.
   - [ ] **AdminTPVTerminalsPage** (/admin/devices/tpv): Título TPV, fluxo, 4 blocos (Baixar, Primeiro arranque, Vincular, TPVs criados), botões e tabela no idioma ativo.
   - [ ] **DesktopDownloadSection** (dentro da página TPV): Textos de preparação/build/download e verificação no idioma ativo.
   - [ ] **InstallQRPanel** (ao gerar QR em devices ou TPV): Títulos desktop/mobile, "Expira em", "Copiar URL", instruções iOS/Android no idioma ativo.
   - [ ] **DesktopPairingSection** (onde for usado): Textos de pairing no idioma ativo.

6. **Consistência pt-BR / pt-PT**
   - [ ] Em pt-BR não aparecem formas típicas de pt-PT (ex.: "actualizados", "actividade") nos textos já alinhados (ex.: dispositivos, TPV).
   - [ ] Em pt-PT o tom e vocabulário são consistentes (ex.: "Provisão", "registados", "localizações").

7. **Chaves literais e mistura**
   - [ ] Em nenhuma das telas acima aparece uma chave como texto (ex.: `devices.appstaffTitle` ou `reservas.tabResumen`).
   - [ ] Não há mistura óbvia de idiomas na mesma tela (ex.: título em es e corpo em pt).

---

## 5. O que ainda falhou visualmente

- **N/A nesta etapa.** A validação foi feita por auditoria estática; não foi possível executar o browser. Qualquer falha visual (chave exposta, texto errado, idioma misturado) deve ser assinalada ao percorrer o checklist acima e, se for o caso, registada aqui como “falha visual” com: página, idioma, texto visível e esperado.

---

## 6. Residuais (possível melhoria futura, sem falha)

Textos ainda não migrados para i18n, de severidade baixa, identificados na auditoria:

| Ficheiro | String visível | Contexto | Severidade |
|----------|----------------|---------|------------|
| `LocationEntityTableCard.tsx` | `"—"` | Fallback quando não há entidade legal (`entityName = entity?.legalName ?? "—"`) | P2 |
| `AdminDevicesPage.tsx` / `AdminTPVTerminalsPage.tsx` | `"—"` | Coluna "Último sinal" / "Última atividade" quando não há data (retorno de `timeSinceRaw`) | P2 |
| `AdminTPVTerminalsPage.tsx` | `macOS:` | Label no passo 2 do primeiro arranque (`<strong>macOS:</strong>`) | P2 (opcional; nome de plataforma) |
| `DesktopDownloadSection.tsx` | `macOS`, `Windows` | Valores de `label` em `getDownloadTargets` interpolados em "Descarregar para {{label}}" | P2 (opcional; marcas/SO) |

Nenhum destes é chave literal exposta nem mistura crítica de idiomas; podem ser migrados numa fase posterior (ex.: chave `common.dash` ou `devices.platformMac`/`devices.platformWindows`).

---

## 7. O que pode ser considerado fechado no Admin

- **i18n da superfície Admin (P0+P1+P2)** pode ser considerado **fechado** para o escopo atual:
  - ReservasPage, LocationEntityTableCard, SoftwareTpvPage (select de idioma), AdminSidebar, AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel e DesktopPairingSection usam apenas chaves de locale para textos visíveis.
  - As chaves existem nos quatro idiomas (pt-BR, pt-PT, en, es).
  - Foi aplicado alinhamento pt-BR/pt-PT (ortografia brasileira em pt-BR).
- A **validação visual** fica dependente da execução do checklist no browser; quando concluída sem falhas, pode considerar-se a validação Admin concluída.

---

## 8. Próxima superfície recomendada

- **TPV/KDS operacional** (telas e fluxos do ponto de venda e cozinha) **ou**
- **AppStaff** (shell, modos, listas e mensagens visíveis ao staff),

conforme a auditoria i18n (`docs/audit/AUDITORIA_I18N_SISTEMA_2026-03.md`), sem alterar rotas, lógica, Electron nem o escopo já fechado do Admin.

---

## 9. O que falta

- Executar o **checklist de validação visual** (§ 4) no browser e assinalar quaisquer falhas (e, se desejado, registá-las em § 5).
- Opcional: migrar os residuais de § 6 para chaves i18n numa etapa posterior.

---

## 10. Próximo passo único

Executar o checklist de validação visual (§ 4) no browser para pt-BR, pt-PT, en e es e, se tudo estiver conforme, considerar a validação i18n do Admin concluída; em seguida, avançar para a próxima superfície (TPV/KDS operacional ou AppStaff) conforme a auditoria.

---

## 11. Prompt para o Cursor

```
Objetivo: executar a validação visual de i18n do Admin no browser usando o checklist em docs/ops/I18N_ADMIN_VALIDACAO_VISUAL_REPORTE.md (§ 4). Trocar idioma para pt-BR, pt-PT, en e es e percorrer ReservasPage, LocationEntityTableCard (onde renderizado), SoftwareTpvPage, sidebar, AdminDevicesPage, AdminTPVTerminalsPage, DesktopDownloadSection, InstallQRPanel e DesktopPairingSection. Reportar: (1) quais itens do checklist passaram; (2) quais falharam (página, idioma, texto visível); (3) se há chaves literais expostas ou mistura de idiomas. Não alterar código; apenas validar e reportar.
```

Se o Cursor não tiver acesso ao browser, o utilizador pode executar o checklist manualmente e preencher (2) e (3) com as falhas encontradas.

---

## 12. Roteiro operacional (validação visual manual)

**Fonte única:** § 4 deste documento. **Objetivo:** Fechar a frente de i18n do Admin por validação visual final. **Sem alterar código.**

### Pré-requisito

- Merchant-portal a correr: `pnpm --filter merchant-portal run dev` (ex.: `http://localhost:5175`).
- Acesso ao Admin (autenticação já feita) e forma de trocar idioma da app (pt-BR, pt-PT, en, es).

### Passos por idioma

Para **cada** um dos 4 idiomas (pt-BR → pt-PT → en → es):

1. **Trocar idioma** para o idioma em teste. Confirmar que o seletor permite os 4 e que, ao trocar, as páginas atualizam sem mostrar chaves literais nem flashes indevidos.

2. **ReservasPage**  
   - Ir à rota de reservas (ex.: `/admin/config/reservas` ou onde a ReservasPage estiver montada).  
   - Verificar: título e subtítulo no idioma ativo; abas (Disponibilidade, Garantia e Cancelamento, Turnos, Mensagens e recordatórios, Resumo) no idioma ativo; conteúdo da secção visível (título + descrição) no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = ReservasPage, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

3. **LocationEntityTableCard**  
   - Ir onde o card é renderizado (ex.: configuração / entidades legais / localizações).  
   - Verificar: título (ex. "Associação a localizações") no idioma ativo; descrição e cabeçalhos de tabela no idioma ativo; empty state e aviso sem entidade no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = LocationEntityTableCard, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

4. **SoftwareTpvPage**  
   - Ir à página Software TPV no Admin.  
   - Verificar: select de idioma com opções no idioma ativo; restante da página (títulos, labels, atalhos) no idioma ativo e sem chaves literais.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = SoftwareTpvPage, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

5. **AdminSidebar**  
   - Em qualquer página Admin, olhar a barra lateral.  
   - Verificar: grupos (Comando, Operar, Analisar, Governar, Conectar) e itens no idioma ativo; badges (BETA, BREVE, OFF) conforme locale.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = AdminSidebar, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

6. **AdminDevicesPage**  
   - Ir a `/admin/devices`.  
   - Verificar: título AppStaff, subtítulo, fluxo, secção "Adicionar dispositivo", tabela e empty state no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = AdminDevicesPage, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

7. **AdminTPVTerminalsPage**  
   - Ir a `/admin/devices/tpv`.  
   - Verificar: título TPV, fluxo, 4 blocos (Baixar, Primeiro arranque, Vincular, TPVs criados), botões e tabela no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = AdminTPVTerminalsPage, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

8. **DesktopDownloadSection**  
   - Na mesma página TPV, ver o bloco de download.  
   - Verificar: textos de preparação/build/download e verificação no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = DesktopDownloadSection, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

9. **InstallQRPanel**  
   - Em /admin/devices ou /admin/devices/tpv, gerar um QR (AppStaff ou TPV) para o painel aparecer.  
   - Verificar: títulos desktop/mobile, "Expira em", "Copiar URL", instruções iOS/Android no idioma ativo.  
   - Anotar: [ ] passou / [ ] falhou. Se falhou: página = InstallQRPanel, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

10. **DesktopPairingSection**  
    - Ir onde o componente é renderizado (ex.: /admin/devices com tipo desktop).  
    - Verificar: textos de pairing no idioma ativo.  
    - Anotar: [ ] passou / [ ] falhou. Se falhou: página = DesktopPairingSection, idioma = ___, texto visível errado = ___, chave literal exposta? ___, mistura de idiomas? ___.

11. **Consistência pt-BR / pt-PT** (apenas quando o idioma ativo for pt-BR ou pt-PT)  
    - pt-BR: não deve aparecer "actualizados" nem "actividade" nos textos de dispositivos/TPV.  
    - pt-PT: tom consistente (ex.: "Provisão", "registados", "localizações").  
    - Anotar: [ ] passou / [ ] falhou. Se falhou: página = ___, idioma = ___, texto visível errado = ___.

12. **Chaves literais e mistura (global)**  
    - Em nenhuma das telas acima deve aparecer uma chave como texto (ex.: `devices.appstaffTitle`, `reservas.tabResumen`).  
    - Não deve haver mistura óbvia de idiomas na mesma tela.  
    - Anotar: [ ] passou / [ ] falhou. Se falhou: página = ___, idioma = ___, chave literal exposta = ___ / mistura = ___.

### Resultado

- **Itens que passaram:** preencher com os números/etapas e superfícies que passaram em todos os idiomas.
- **Itens que falharam:** lista objetiva: página, idioma, texto visível errado, chave literal exposta? (sim/não), mistura de idiomas? (sim/não).
- **Frente i18n Admin:** só pode ser dada como **fechada** se, para os 4 idiomas, todos os itens acima tiverem passado e não houver chave literal exposta nem mistura de idiomas. Caso contrário, permanece **em aberto** até correção e nova validação.
