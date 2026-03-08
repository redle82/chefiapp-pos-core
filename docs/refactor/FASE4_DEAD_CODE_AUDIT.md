# Fase 4.2 — Auditoria de código morto e duplicação

**Objetivo:** Identificar candidatos a remoção sem quebrar build nem testes. Escopo limitado.

---

## Como encontrar

- **Exports não usados:** `pnpm exec knip` (se instalado) ou busca por import do módulo em `src/`.
- **Ficheiros órfãos:** ficheiros que nenhum outro importa (excluir entrypoints e testes).
- **Duplicação de componentes:** dois componentes que fazem o mesmo (ex.: dois modais de confirmação com lógica idêntica); consolidar num só com props.

---

## Candidatos (amostra; validar antes de apagar)

- **Legacy/archive:** `tests/archive/`, referências em `testPathIgnorePatterns` — já não correm no Jest; manter como referência ou remover em fase posterior.
- **Páginas/rotas não referenciadas:** verificar se alguma rota em `OperationalRoutes` aponta para componente que já não existe ou foi substituído.
- **Hooks não usados:** procurar `useX` definido mas nunca importado (ex.: hooks em `hooks/` que nenhum componente usa).
- **Cópia de estilos:** dois `.module.css` com classes equivalentes; considerar extrair para design-system ou partilhar um ficheiro.

---

## Regra

Não remover em bloco. Por cada remoção: (1) confirmar que nenhum import referencia o ficheiro/símbolo; (2) rodar `pnpm run type-check` e `pnpm test`; (3) commit pequeno.

---

## Estado

- [ ] Executar auditoria com ferramenta (knip ou grep manual).
- [ ] Listar removais propostos num PR separado.
- [ ] Aplicar removais em lotes pequenos.
