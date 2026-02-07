# Auditoria de Mapas Visuais — ChefIApp POS Core

**Data:** 2026-02-07
**Autor:** GitHub Copilot (auditoria automática)
**Objetivo:** Catalogar todos os mapas/diagramas visuais existentes, avaliar estado, e consolidar.

---

## Mapas Visuais (HTML/Pen) — SUBSTITUÍDOS

| #   | Arquivo                              | Linhas | Estado                                                             | Ação                                             |
| --- | ------------------------------------ | ------ | ------------------------------------------------------------------ | ------------------------------------------------ |
| 1   | `appstaff-map.html`                  | 811    | Desorganizado — posição absoluta, JS complexo, mistura 3 conceitos | **SUBSTITUÍDO** por novo mapa completo           |
| 2   | `appstaff-mapa-por-trabalhador.html` | 120    | Apenas AppStaff por papel — parcial, duplica dados do .md          | **DELETADO** — conteúdo absorvido pelo novo mapa |
| 3   | `appstaff-map.pen`                   | N/A    | Diagrama Pencil — funcionalidades por trabalhador                  | **MANTIDO** — editor visual interativo           |

---

## Mapas em Markdown — MANTIDOS (referência textual)

| #   | Arquivo                                  | Linhas | Conteúdo                                                  | Estado                 |
| --- | ---------------------------------------- | ------ | --------------------------------------------------------- | ---------------------- |
| 1   | `SURFACE_MAP.md`                         | 258    | Mapa de superfícies (Kernel, Admin, TPV, KDS, Staff, Web) | OK — doc de referência |
| 2   | `FOLDER_MAP.md`                          | 97     | Mapeamento pasta→superfície em `src/pages`                | OK — doc de referência |
| 3   | `APPSTAFF_ROUTE_MAP.md`                  | 163    | Rotas canónicas do AppStaff por papel                     | OK — canonical         |
| 4   | `APPSTAFF_APPSHELL_MAP.md`               | 151    | Estrutura do AppShell (áreas, nav, por papel)             | OK — canonical         |
| 5   | `APPSTAFF_SYNC_MAP.md`                   | 655    | Sincronização TPV↔KDS↔AppStaff↔NOW ENGINE                 | OK — doc de referência |
| 6   | `APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md` | 117    | Mapa por trabalhador (texto) — referência para .pen       | OK — canonical         |
| 7   | `CURRENT_SYSTEM_MAP.md`                  | 101    | Sistema actual — o que existe, o que é legacy             | OK — doc de referência |
| 8   | `CONFIGURATION_MAP_V1.md`                | 183    | Configuração estilo Last.app                              | OK — doc de referência |
| 9   | `SYSTEM_OVERVIEW_DIAGRAM.md`             | 160    | Diagrama Mermaid macro (World→Kernel→Runtime)             | OK — doc de referência |

---

## Mapas JSON (sovereignty) — MANTIDOS

| #   | Arquivo                                     | Conteúdo              |
| --- | ------------------------------------------- | --------------------- |
| 1   | `docs/sovereignty/backend-power-map.json`   | Endpoints por domínio |
| 2   | `docs/sovereignty/frontend-routes-map.json` | Rotas frontend        |
| 3   | `docs/sovereignty/database-states-map.json` | Estados do banco      |
| 4   | `docs/sovereignty/MAPAS_SOBERANIA.md`       | Análise consolidada   |

---

## Novo Mapa Visual Consolidado

**Arquivo:** `docs/architecture/appstaff-map.html`
**Substitui:** O HTML antigo (811 linhas desorganizadas) + o `appstaff-mapa-por-trabalhador.html`
**Conteúdo:** Mapa completo do projeto em 6 seções:

1. **CORE / Infra** — Docker, PostgreSQL, migrations, tabelas-chave
2. **Merchant Portal** — React app, todas as páginas organizadas por domínio
3. **AppStaff** — Entry chain, gates, shell, modos, homes por papel
4. **Core Engine** — Kernel, domains, guards, governance
5. **Mapa por Trabalhador** — 5 colunas (owner/manager/waiter/kitchen/cleaning)
6. **Mobile App + Docs** — Estrutura complementar

**Tecnologia:** CSS Grid/Flexbox (não coordenadas absolutas), seções colapsáveis, dark theme, zero JS complexo.

---

## Resultado

- 2 HTML antigos → 1 HTML novo completo
- 0 arquivos .md deletados (são referência textual valiosa)
- 0 JSON deletados (dados estruturados para scripts)
- 1 `.pen` mantido (editor visual interativo)
