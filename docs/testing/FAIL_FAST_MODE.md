# FAIL-FAST MODE - Validação Rápida do Core

> Modo de validação rápida para uso durante refatorações e desenvolvimento iterativo.

---

## OBJETIVO

Validar integridade do Core em **~1 minuto real** (1 hora simulada), parando no primeiro erro detectado.

---

## USO

### Via Makefile (Recomendado)

```bash
cd docker-tests
make simulate-failfast
```

### Direto

```bash
cd docker-tests
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
MODE=failfast DURATION_MINUTES=1 \
node simulators/simulate-failfast.js
```

---

## CARACTERÍSTICAS

| Característica | Valor |
|----------------|-------|
| Duração real | 1 minuto |
| Duração simulada | 1 hora |
| Multiplicador | 60x |
| Restaurantes | 5 (pequeno) |
| Validações | Integridade apenas |
| Output | Minimalista |
| Exit code | 0 = OK, 1 = FALHA |

---

## VALIDAÇÕES EXECUTADAS

1. **Orphan Items**
   - Verifica se há `gm_order_items` sem `gm_orders` correspondente
   - Falha imediata se detectado

2. **Orphan Print Jobs**
   - Verifica se há `gm_print_jobs` sem `gm_orders` correspondente
   - Falha imediata se detectado

---

## QUANDO USAR

✅ **Use fail-fast quando:**
- Refatorando código do Core
- Adicionando novas features
- Fazendo mudanças em lógica crítica
- Antes de commits importantes
- Durante desenvolvimento iterativo

❌ **NÃO use fail-fast para:**
- Validação completa (use `simulate-24h-small`)
- Testes de escala (use `simulate-24h-large`)
- Validação de governança completa (use `simulate-24h-small`)

---

## INTEGRAÇÃO COM CI/CD

```yaml
# Exemplo GitHub Actions
- name: Fail-Fast Validation
  run: |
    cd docker-tests
    make simulate-failfast
```

**Vantagem:** Validação rápida em PRs sem bloquear o pipeline.

---

## EXIT CODES

| Código | Significado |
|--------|-------------|
| 0 | ✅ Core intacto |
| 1 | ❌ Erro de integridade detectado |

---

## OUTPUT

### Sucesso

```
⚡ FAIL-FAST MODE
   Duração: 1 min → 1h simulada
   Multiplicador: 60.0x

🚀 Iniciando simulação...

🔍 Validando integridade...

✅ PASS
   Pedidos: X
   Eventos: Y
   Erros: 0

✅ FAIL-FAST: Core intacto
```

### Falha

```
❌ FAIL-FAST: Orphan items detectados: 5
```

---

## DIFERENÇAS DO MODO COMPLETO

| Aspecto | Fail-Fast | Completo (24h) |
|---------|-----------|----------------|
| Duração | 1 min | 5-7 min |
| Horas simuladas | 1h | 24h |
| Validações | Integridade | Tudo |
| Governança | Não | Sim |
| Offline | Não | Sim |
| Escalonamento | Não | Sim |
| Relatório | Não | Sim |

---

## PRÓXIMOS PASSOS

Após fail-fast passar:
1. ✅ Core está funcionalmente correto
2. ⏭️ Execute `simulate-24h-small` para validação completa
3. ⏭️ Execute `make assertions` para validação final

---

## NOTAS TÉCNICAS

- Usa seed fixo para reprodutibilidade
- Limpa dados antes de executar
- Não cria relatórios (foco em velocidade)
- Para no primeiro erro (fail-fast)

---

*Este modo é parte do MEGA OPERATIONAL SIMULATOR v2.1*
