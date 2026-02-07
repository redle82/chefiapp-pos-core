# LEI 12: Disciplina de Commits

## MOTIVO

Historico de commits legivel e rastreavel e essencial para debugging,
code review e releases automatizadas.

## GATILHO

Ativado quando commitar qualquer alteracao de codigo.

## FORMATO OBRIGATORIO (Conventional Commits)

```
<type>(<scope>): <descricao curta>

[corpo opcional explicando O QUE e POR QUE, nao COMO]
```

## TIPOS PERMITIDOS

| Tipo     | Quando usar                            |
| -------- | -------------------------------------- |
| feat     | Nova funcionalidade                    |
| fix      | Correcao de bug                        |
| docs     | Apenas alteracao em documentacao       |
| style    | Formatacao (nao altera logica)         |
| refactor | Reestruturacao sem mudar comportamento |
| test     | Criacao/alteracao de testes            |
| chore    | Manutencao (deps, configs, scripts)    |

## REGRAS

1. Primeira linha: maximo 72 caracteres
2. Corpo: explica o que e por que, nao como
3. Um commit = uma mudanca logica
4. NUNCA commitar com -m "fix" ou "update"

## EXEMPLO ERRADO

```bash
git commit -m "fix"
git commit -m "mudancas"
git commit -m "WIP"
git commit -m "atualizando coisas"
```

## EXEMPLO CORRETO

```bash
git commit -m "feat(orders): add coupon validation endpoint

Validates coupon code, checks expiration date and usage limits.
Returns discount percentage or 422 with specific error code."

git commit -m "fix(auth): prevent session fixation on login

Regenerate session ID after successful authentication to prevent
session fixation attacks. Adds test coverage for the scenario."
```
