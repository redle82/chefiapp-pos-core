# ChefIApp Core Architecture

> **Tag:** `v1.0-core-validated`  
> **Data:** 2026-01-24  
> **Status:** VALIDADO

---

## Princípio Fundamental

```
Apps são CASCA. O CORE manda.
```

---

## O Que Isso Significa

### Separação Arquitetural

| Camada | Responsabilidade | Testável via Docker? |
|--------|------------------|---------------------|
| **CORE** | Lógica de negócio, integridade, eventos | ✅ SIM |
| **CASCA** | UI, UX, experiência visual | ❌ Não necessário |

### Implicações Práticas

- **iOS pode quebrar** → Sistema continua funcionando
- **Android pode atrasar** → Não bloqueia desenvolvimento
- **Expo pode dar bug** → Core permanece válido
- **UI pode ser refeita** → Lógica não precisa mudar

---

## Validação do Core

### Comando Único

```bash
cd docker-tests && make full-system-test
```

### Resultados Obtidos (v1.0-core-validated)

| Métrica | Valor | Status |
|---------|-------|--------|
| Pedidos criados | 39 | ✅ |
| Print jobs | 53 | ✅ |
| Eventos | 39 | ✅ |
| Orphan items | 0 | ✅ |

### Fontes de Pedido Testadas

- `mobile-sim` (Garçom headless)
- `pos-sim` (TPV headless)
- `qr-web-sim` (Cliente QR headless)

---

## Arquitetura de Teste

```
┌─────────────────────────────────────────────────────────┐
│                 CHEFIAPP FULL STACK (DOCKER)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │ mobile-sim   │   │ pos-sim      │   │ qr-web-sim │  │
│  │ (waiter)     │   │ (tpv)        │   │ (customer) │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬─────┘  │
│         │                  │                  │        │
│         └──────────┬───────┴──────────┬───────┘        │
│                    │                  │                │
│              ┌─────▼──────────────────▼─────┐          │
│              │        SUPABASE LOCAL        │          │
│              │  Postgres + Auth + Realtime  │          │
│              └─────┬──────────────────┬─────┘          │
│                    │                  │                │
│      ┌─────────────▼──────┐   ┌───────▼──────────┐     │
│      │ PRINT EMULATOR     │   │ TASK ENGINE      │     │
│      │ (thermal tickets)  │   │ (event-driven)   │     │
│      └────────────────────┘   └──────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Regras de Desenvolvimento

### Antes de Qualquer Mudança

```bash
make full-system-test
```

**Se passa** → Mudança é segura  
**Se falha** → Bug é real, não visual

### O Que NÃO Bloqueia Desenvolvimento

- iOS Simulator não abre
- Android Emulator lento
- Expo Go com erro
- Metro bundler travado

### O Que BLOQUEIA Desenvolvimento

- `make full-system-test` falha
- Orphan items > 0
- Eventos perdidos
- Print jobs não gerados

---

## Diferencial Técnico

### Comparação com Mercado

| Aspecto | Maioria dos Apps | ChefIApp |
|---------|------------------|----------|
| Teste de lógica | Via UI | Via Docker |
| Dependência de simulador | Alta | Zero |
| Reprodutibilidade | Baixa | Total |
| Auditabilidade | Manual | Automática |
| Tempo para validar | Horas | 40 segundos |

### O Que Isso Permite

1. **CI/CD Confiável** - Testes rodam em qualquer máquina
2. **Onboarding Rápido** - Novo dev valida em 1 comando
3. **Refatoração Segura** - Core protegido por teste
4. **Escala Previsível** - Comportamento verificado antes

---

## Comandos Disponíveis

```bash
# Teste completo do sistema
make full-system-test

# Teste rápido (3 tenants)
make full-system-test-quick

# Ver estado atual
make system-status

# Limpar dados
make system-clean

# Teste universal (mais canais)
make universal-test
```

---

## Conclusão

O ChefIApp possui uma arquitetura onde:

- **O sistema é testável sem UI gráfica**
- **Apps são clientes, não o sistema**
- **Integridade é verificável em 40 segundos**
- **Bugs de UI são cosméticos, não sistêmicos**

Esta é a base para escalar com confiança.

---

*Documento gerado em 2026-01-24 após validação completa do core.*
