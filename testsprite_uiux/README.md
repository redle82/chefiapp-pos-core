# TestSprite UI/UX Audit Suite

**Versão:** 1.0.0  
**Status:** Pré-Lançamento  
**Objetivo:** Auditoria completa de UI/UX de todas as telas, fluxos, acessibilidade e consistência visual

---

## 📋 Estrutura

```
testsprite_uiux/
├── SCREEN_MATRIX.md          # Matriz completa de telas e estados
├── specs/
│   └── uiux_audit.spec.ts    # Suíte de testes Playwright
├── scripts/
│   └── generate-reports.js   # Gerador de relatórios
├── output/
│   ├── screenshots/          # Screenshots por tela/viewport/estado
│   ├── a11y_report.json       # Relatório de acessibilidade
│   ├── UIUX_AUDIT_REPORT.md  # Relatório narrativo
│   └── UIUX_ISSUES.csv       # Backlog priorizado
├── package.json
└── playwright.config.ts
```

---

## 🚀 Instalação

```bash
cd testsprite_uiux
npm install
npx playwright install
```

---

## 🧪 Executar Testes

### Todos os Testes
```bash
npm test
```

### Testes Específicos
```bash
# Smoke tests (rotas abrem sem crash)
npm run test:smoke

# Screenshots (captura visual)
npm run test:screenshots

# Acessibilidade (Axe audit)
npm run test:a11y

# Estados (loading/empty/error)
npm run test:states
```

### Modo Interativo
```bash
npm run test:ui
```

### Modo Headed (ver browser)
```bash
npm run test:headed
```

---

## 📊 Gerar Relatórios

Após executar os testes:

```bash
npm run report:generate
```

Isso gera:
- `output/UIUX_AUDIT_REPORT.md` - Relatório narrativo com scores
- `output/UIUX_ISSUES.csv` - Backlog priorizado (S0-S3)

### Ver Relatório HTML do Playwright
```bash
npm run report
```

---

## 🎯 Critérios de Score

| Categoria | Peso | Critérios |
|-----------|------|-----------|
| **Navegação & IA** | 20% | Rotas funcionam, navegação clara, hierarquia lógica |
| **Consistência Visual** | 20% | Design system consistente, botões uniformes, espaçamento |
| **Clareza de Ações** | 15% | CTAs claros, affordances óbvias, feedback imediato |
| **Estados & Feedback** | 15% | Loading, empty, error, success bem tratados |
| **Acessibilidade** | 15% | Contraste, foco, labels, navegação por teclado |
| **Performance Percebida** | 10% | Skeleton vs spinner, jank, tempo de resposta |
| **Delight / Identidade** | 5% | Microcopy, animações, tom de voz |

**Score Total:** 0-100

---

## 🔍 Severidade de Issues

- **S0 Bloqueador:** Impede usar/entender/continuar
- **S1 Crítico:** Causa erro, confusão forte, perda de confiança
- **S2 Médio:** Atrito frequente, queda de conversão/uso
- **S3 Baixo:** Polimento, consistência, estética

---

## 📸 Screenshots

Screenshots são capturados automaticamente em:
- **4 viewports:** mobile-small (320px), mobile (375px), tablet (768px), desktop (1024px)
- **4 estados:** default, loading, empty, error
- **40+ rotas:** Todas as telas mapeadas

Localização: `output/screenshots/`

---

## ♿ Acessibilidade (A11y)

Usa **Axe Core** para detectar:
- Contraste de cores
- Labels ausentes
- Navegação por teclado
- ARIA attributes
- Tamanho de toque (44x44px mínimo)

Relatório: `output/a11y_report.json`

---

## 🏷️ data-testid (Componentes Críticos)

Para estabilizar os testes, adicione `data-testid` nos componentes:

### Obrigatórios
- `data-testid="topbar-title"` - Título do header
- `data-testid="primary-cta"` - Botão principal de ação
- `data-testid="tab-dashboard"` - Tab de dashboard
- `data-testid="tab-tasks"` - Tab de tarefas
- `data-testid="empty-state"` - Estado vazio
- `data-testid="error-state"` - Estado de erro
- `data-testid="loading-state"` - Estado de carregamento

### Opcionais (mas recomendados)
- `data-testid="secondary-cta"` - Botão secundário
- `data-testid="form-submit"` - Submit de formulário
- `data-testid="list-item"` - Item de lista
- `data-testid="modal-close"` - Fechar modal

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Base URL do app (default: http://localhost:5173)
BASE_URL=http://localhost:5173 npm test

# CI mode (retries, workers)
CI=true npm test
```

### Playwright Config

Edite `playwright.config.ts` para:
- Ajustar viewports
- Adicionar browsers
- Configurar timeouts
- Ajustar workers

---

## 📝 Adicionar Novas Rotas

1. Adicione a rota em `SCREEN_MATRIX.md`
2. Adicione em `ROUTES` array em `specs/uiux_audit.spec.ts`
3. Execute `npm test` para validar

---

## 🐛 Troubleshooting

### Testes falhando por timeout
- Aumente `timeout` no `playwright.config.ts`
- Verifique se o servidor está rodando (`npm run dev` no merchant-portal)

### Screenshots não aparecem
- Verifique permissões da pasta `output/screenshots/`
- Execute `mkdir -p output/screenshots`

### A11y report vazio
- Verifique se `@axe-core/playwright` está instalado
- Execute `npm install` novamente

---

## 📚 Próximos Passos

1. ✅ Executar primeira auditoria
2. ✅ Revisar `UIUX_ISSUES.csv`
3. ✅ Priorizar correções S0/S1
4. ✅ Adicionar `data-testid` nos componentes críticos
5. ✅ Re-executar auditoria após correções
6. ✅ Validar com usuários reais

---

**Status:** ✅ Estrutura completa, pronto para executar

