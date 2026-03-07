# ADR: Integração e Runtime Authority (Gateway)

**Data:** 2026-03-07
**Status:** Proposto
**Contexto:** Monorepo Fragmentation P0 (D3)

## 1. O Problema

Atualmente, o monorepo ChefIApp POS Core possui dois módulos lidando com integrações e webhooks financeiros:

1. `/integration-gateway/`: Um pacote Node.js/Express estruturado, focado em SumUp, Stripe e Pix.
2. `/server/`: O entrypoint Node.js nativo (sem Express) que atua como BFF (Backend-For-Frontend) da aplicação, lidando com ativação mobile, ACKs do desktop, webhooks de billing, eventos internos, uploads e também com as **mesmas rotas financeiras** do `integration-gateway`.

Essa duplicidade gera fragmentação de autoridade: desenvolvedores não sabem onde implementar novas integrações, e testes/logs ficam divididos entre "o gateway oficial" e o "server real".

## 2. A Decisão

Elegemos o diretório `/server/` como a **Única Autoridade de Runtime (Single Runtime Authority)** para integrações e rotas de BFF. O módulo `/integration-gateway/` será arquivado e seu código não duplicado será absorvido pelo `server/`.

## 3. Justificativa

- **Eficiência Operacional:** O `server/` já roda em produção de forma nativa e enxuta, processando a vasta maioria do tráfego crítico (Mobile Auth, Desktop ACKs, Billing).
- **Semântica:** O `server` já funciona como o Gateway unificado da arquitetura. Ter um segundo módulo "integration-gateway" rodando Express adiciona overhead de runtime e dependências sem agregar isolamento, dado que o `server` acaba fazendo proxy das mesmas funções.
- **Redução de Superfície:** Eliminar o `integration-gateway` reduz a pegada de dependências do monorepo (remoção do `express`, pacotes duplicados de `jest`, etc).

## 4. Consequências

- **Positivas:** Uma única porta de entrada para auditoria de logs, um único arquivo de rotas financeiras e de infraestrutura, redução do peso do monorepo.
- **Negativas:** Exigirá migração cuidadosa (D4 e D5 do Plano P0) de quaisquer lógicas de checkout ou webhooks exclusivas que existam apenas no `/integration-gateway/src` para o formato nativo do `/server/integration-gateway.ts`.
- **Risco:** Quebra de fluxo de pagamento se a migração esquecer algum edge-case de parsing de JSON contido no Express. Será mitigado por testes rigorosos e uma camada de compatibilidade, se necessário.

## 5. Próximos Passos (D4 e D5)

1. Mover rotas como `/api/v1/webhook/stripe` e `/api/v1/payment/merchants` para o roteador do `server/`.
2. Validar o parsing nativo de JSON (`parseBody`).
3. Adicionar aviso de DEPRECATED no `integration-gateway` e removê-lo do pipeline de build.
