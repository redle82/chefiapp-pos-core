# Como Aplicar a Migração: restaurant_web_presence

## ⚠️ Problema Atual

Você está vendo erros 404 ao tentar criar páginas web porque a tabela `restaurant_web_presence` ainda não existe no banco de dados.

## ✅ Solução: Aplicar a Migração SQL

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
2. Vá em **SQL Editor** (menu lateral)
3. Abra o arquivo: `supabase/migrations/20260130000001_restaurant_web_presence.sql`
4. **Copie TODO o conteúdo** do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** (ou pressione `Cmd+Enter` / `Ctrl+Enter`)

### Opção 2: Via CLI do Supabase

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase db push
```

## 🔍 Verificação

Após aplicar a migração, verifique:

1. **No Supabase Dashboard:**
   - Vá em **Table Editor**
   - Procure por `restaurant_web_presence`
   - Deve aparecer na lista de tabelas

2. **No Console do Navegador:**
   - Recarregue a página (`Cmd+R` ou `F5`)
   - Os erros 404 devem desaparecer
   - O wizard deve aparecer normalmente

## 📋 O que a migração cria

- ✅ Tabela `restaurant_web_presence`
- ✅ Políticas RLS (Row Level Security)
- ✅ Índices para performance
- ✅ Trigger para `updated_at`
- ✅ Constraints e validações

## 🐛 Se ainda houver problemas

1. **Verifique se a migração foi aplicada:**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'restaurant_web_presence'
   );
   ```

2. **Verifique permissões RLS:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'restaurant_web_presence';
   ```

3. **Verifique se você é owner/manager:**
   ```sql
   SELECT rm.role, r.id, r.name 
   FROM restaurant_members rm
   JOIN gm_restaurants r ON r.id = rm.restaurant_id
   WHERE rm.user_id = auth.uid();
   ```

## ✅ Após aplicar

1. Recarregue a página do aplicativo
2. O wizard deve aparecer sem erros
3. Você pode escolher uma das 3 opções
4. A criação deve funcionar normalmente
