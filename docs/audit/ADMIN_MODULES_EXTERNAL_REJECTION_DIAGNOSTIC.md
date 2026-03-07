# Diagnóstico — `/admin/modules` e erro `reading 'payload'`

## Conclusão
O erro observado em runtime (`Cannot read properties of undefined (reading 'payload')`) **não foi identificado no source do portal** nem nos sourcemaps do bundle da aplicação.

## Evidências resumidas
- Busca no código do workspace: sem ficheiro/fonte interna correspondente a `giveFreely.tsx-*`.
- Inspeção de build/sourcemaps do `merchant-portal`: sem referência rastreável do chunk externo.
- Fluxo do Admin Modules e EventMonitor analisado: sem uso equivalente que explique o stack externo reportado.

## Interpretação
O incidente é compatível com rejeição assíncrona de origem externa ao bundle (ex.: extensão de navegador/script injetado/terceiro no runtime), ocorrendo enquanto a rota `/admin/modules` está ativa.

## Escopo deste documento
Este registo cobre apenas a **Parte A (diagnóstico + prova)** e não introduz alteração comportamental em produção por si só.
