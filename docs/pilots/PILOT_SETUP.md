# Setup do Piloto Real - ChefIApp

**Data:** 2026-01-25  
**Objetivo:** Configurar restaurante piloto para teste de 7 dias

---

## Pré-requisitos

- Supabase local rodando (`supabase start`)
- Migrations aplicadas (`supabase db reset`)
- Merchant Portal rodando (`npm -w merchant-portal run dev`)

---

## Passo 1: Criar Restaurante Piloto

Execute o script de setup:

```bash
npx ts-node scripts/setup-pilot-restaurant.ts --restaurant-name="Restaurante Piloto"
```

Isso cria:
- 1 restaurante
- 10 mesas
- 4 categorias de menu (15 produtos)
- 6 funcionários (1 gerente, 3 garçons, 2 cozinha)

---

## Passo 2: Configurar no Merchant Portal

1. Acesse `http://localhost:5175/app/dashboard`
2. Selecione o restaurante criado (ou configure via localStorage)
3. Verifique que mesas e produtos aparecem

---

## Passo 3: Treinar Staff Básico

### Gerente
- Como abrir/fechar caixa
- Como ver dashboard de observabilidade
- Como verificar pedidos ativos
- Como entender mensagens de erro

### Garçons (2-3)
- Como criar pedido no TPV
- Como adicionar itens
- Como ver pedidos ativos
- O que fazer quando aparece erro "mesa já tem pedido aberto"

### Cozinha
- Como ver pedidos no KDS
- Como avançar status (preparando → pronto)
- O que fazer quando offline

---

## Passo 4: Instalar Dispositivos

### TPV (Terminal de Vendas)
- **Dispositivo:** Tablet ou computador
- **URL:** `http://localhost:5175/app/tpv`
- **Localização:** Caixa/balcão
- **Operador:** Gerente ou garçom autorizado

### KDS (Kitchen Display)
- **Dispositivo:** Tablet ou TV
- **URL:** `http://localhost:5175/app/kds/{restaurantId}`
- **Localização:** Cozinha
- **Operador:** Chef/cozinha

---

## Passo 5: Validar Conexão

### Teste 1: Criar Pedido
1. No TPV, selecione uma mesa
2. Adicione 2-3 itens
3. Crie o pedido
4. **Esperado:** Pedido aparece no KDS em < 2 segundos

### Teste 2: Avançar Status
1. No KDS, clique em "Iniciar Preparo"
2. **Esperado:** Status muda para "PREPARING"
3. Clique em "Pronto"
4. **Esperado:** Status muda para "READY"

### Teste 3: Constraint (Uma Mesa = Um Pedido)
1. Crie pedido na mesa 1
2. Tente criar outro pedido na mesma mesa 1
3. **Esperado:** Mensagem clara: "Esta mesa já possui um pedido aberto. Feche ou pague o pedido existente antes de criar um novo."

---

## Checklist Pré-Piloto

- [ ] Restaurante criado
- [ ] Mesas configuradas (10 mesas)
- [ ] Cardápio completo (15 produtos)
- [ ] Staff criado (6 funcionários)
- [ ] TPV instalado e funcionando
- [ ] KDS instalado e funcionando
- [ ] Gerente treinado
- [ ] Garçons treinados (2-3)
- [ ] Cozinha treinada
- [ ] Testes de conexão passando

---

## Próximo Passo

Após setup completo, iniciar [Piloto de 7 Dias](./PILOT_7DAYS_LOG.md).
