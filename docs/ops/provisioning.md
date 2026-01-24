# 🚀 Provisioning de Restaurantes - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Implementado

---

## 🎯 OBJETIVO

Documentar o processo de provisioning manual de novos restaurantes. Provisioning automatizado será implementado na Fase 2.

---

## 📋 PROCESSO DE PROVISIONING

### Pré-requisitos

- ✅ Supabase CLI instalado
- ✅ Projeto Supabase linkado (`supabase link`)
- ✅ Usuário owner criado no Supabase Auth

### Executar Provisioning

```bash
./scripts/provision-restaurant.sh "Nome do Restaurante" "owner@email.com"
```

**Exemplo:**
```bash
./scripts/provision-restaurant.sh "Sofia Gastrobar" "owner@sofia.com"
```

---

## 🔧 O QUE O SCRIPT FAZ

### 1. Criar Restaurante
- Cria registro em `gm_restaurants`
- Gera slug automaticamente
- Retorna `restaurant_id`

### 2. Buscar/Criar Usuário
- Busca usuário por email
- Se não existir, instrui criação manual

### 3. Associar Owner
- Cria registro em `gm_restaurant_members`
- Associa usuário como 'owner'
- Permite acesso ao restaurante

### 4. Criar Dados Seed
- Cria 12 mesas padrão (1-12)
- Cria 4 categorias padrão:
  - Entradas
  - Pratos Principais
  - Bebidas
  - Sobremesas

---

## 📊 RESULTADO

Após provisioning bem-sucedido:

- ✅ Restaurante criado e funcional
- ✅ Owner associado e com acesso
- ✅ Mesas e categorias prontas
- ✅ Pronto para uso imediato

**Tempo estimado:** < 2 minutos

---

## 🔍 VALIDAÇÃO

### Verificar Restaurante Criado

```sql
SELECT id, name, slug FROM gm_restaurants WHERE slug = 'nome-do-restaurante';
```

### Verificar Associação

```sql
SELECT rm.*, r.name, u.email
FROM gm_restaurant_members rm
JOIN gm_restaurants r ON r.id = rm.restaurant_id
JOIN auth.users u ON u.id = rm.user_id
WHERE r.slug = 'nome-do-restaurante';
```

### Verificar Dados Seed

```sql
-- Mesas
SELECT COUNT(*) FROM gm_tables WHERE restaurant_id = 'restaurant-id';
-- Deve retornar 12

-- Categorias
SELECT name FROM gm_menu_categories WHERE restaurant_id = 'restaurant-id';
-- Deve retornar 4 categorias
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Supabase CLI não encontrado"

**Solução:**
```bash
npm install -g supabase
# ou
brew install supabase/tap/supabase
```

### Erro: "Não conectado ao projeto"

**Solução:**
```bash
supabase link --project-ref your-project-ref
```

### Erro: "Usuário não encontrado"

**Solução:**
1. Criar usuário no Supabase Dashboard:
   - Authentication > Users > Add User
   - Email: `owner@email.com`
   - Senha: (definir ou enviar reset)
2. Executar script novamente

### Erro: "Falha ao criar restaurante"

**Possíveis causas:**
- Slug já existe (único)
- Permissões insuficientes
- Banco de dados offline

**Solução:**
- Verificar logs do Supabase
- Tentar com slug diferente
- Verificar conexão

---

## 📚 REFERÊNCIAS

- **Script:** `scripts/provision-restaurant.sh`
- **Tabela:** `gm_restaurants`
- **Associação:** `gm_restaurant_members`
- **Supabase CLI:** https://supabase.com/docs/guides/cli

---

## 🔄 PRÓXIMOS PASSOS (Fase 2)

Na Fase 2, provisioning será automatizado:
- ✅ API de provisioning (Edge Function)
- ✅ UI de self-service
- ✅ Provisioning em < 5 minutos
- ✅ Email de boas-vindas automático

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Implementado
