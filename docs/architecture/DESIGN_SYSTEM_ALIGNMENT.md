# Alinhamento ao Design System (Fase 4.3)

**Fonte:** `merchant-portal/src/ui/design-system/tokens.ts` e `@chefiapp/core-design-system`.

---

## Regras de consolidação

1. **Cores:** Usar tokens (Brand, Colors, core-design-system) em vez de hex/rgba hardcoded em código novo. Em CSS: variáveis em `tokens.css`.
2. **Espaçamento:** Usar `Spacing.*` / `coreSpace` em vez de valores em px soltos.
3. **Tipografia:** Usar `fontSize`, `fontWeight`, `lineHeight` do design-system.
4. **Componentes reutilizáveis:** Botões, cards e formulários devem usar componentes do design-system quando existirem (ex.: `Button`, `Card`); evitar criar variantes one-off com estilos inline duplicados.
5. **Não reescrever tudo:** Alinhamento é incremental. Em alterações novas ou em ficheiros que já se tocam, preferir tokens e componentes partilhados.

---

## Onde está definido

- **Tokens TS:** `src/ui/design-system/tokens.ts` (Brand, Colors, Spacing, etc.; re-exporta de core-design-system).
- **Tokens CSS:** `src/ui/design-system/tokens.css` (variáveis CSS para uso em módulos CSS).
- **Core design system:** pacote `@chefiapp/core-design-system` (cores, elevação, fontes, radius, space).

---

## Checklist por PR

- [ ] Novos estilos usam tokens (ou variáveis de tokens.css) em vez de valores fixos.
- [ ] Não foi criado componente duplicado quando já existe um equivalente no design-system.
- [ ] Cores de marca (ouro, etc.) vêm de Brand / tokens.
