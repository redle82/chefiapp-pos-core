# 🚀 USAR POSTGRES LANGUAGE SERVER COM SUPABASE

**Extensão:** Postgres Language Server (Supabase)  
**Benefícios:** Autocompletar, linting e validação de SQL no VS Code

---

## ✅ INSTALAÇÃO

A extensão já está instalada! (v1.4.0)

**Publisher:** supabase  
**ID:** `supabase.postgres-language-server`

---

## 🔧 CONFIGURAÇÃO

### 1. Conectar ao Supabase

A extensão precisa se conectar ao seu banco de dados Supabase. Configure a conexão:

**Opção A: Via Supabase CLI (Recomendado)**

Se você já executou `supabase link`, a extensão pode detectar automaticamente a conexão.

**Opção B: Configuração Manual**

1. Abra as configurações do VS Code (Cmd+,)
2. Procure por "Postgres Language Server"
3. Configure a connection string do Supabase:
   - URL: `postgresql://postgres:[PASSWORD]@db.qonfbtwsxeggxbkhqnxl.supabase.co:5432/postgres`
   - Obtenha a senha em: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/settings/database

---

## 📋 USAR COM MIGRATIONS

### Validar SQL antes de aplicar

1. **Abrir migration:**
   - Abra: `supabase/migrations/20260111182110_deploy_rls_race_conditions.sql`
   - OU: `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`

2. **A extensão irá:**
   - ✅ Autocompletar nomes de tabelas, colunas e funções
   - ✅ Validar sintaxe SQL
   - ✅ Mostrar erros em tempo real
   - ✅ Sugerir correções

3. **Verificar erros:**
   - Erros aparecem sublinhados em vermelho
   - Passe o mouse para ver detalhes
   - Use Cmd+. (Mac) ou Ctrl+. (Windows) para ver sugestões

---

## 🎯 RECURSOS ÚTEIS

### Autocompletar
- Digite `SELECT * FROM gm_` e veja sugestões de tabelas
- Digite `CREATE POLICY` e veja templates
- Digite nomes de funções e veja parâmetros

### Linting
- Detecta erros de sintaxe antes de executar
- Valida nomes de tabelas e colunas
- Verifica tipos de dados

### Type Checking
- Valida tipos de dados em queries
- Detecta incompatibilidades
- Sugere correções

---

## 🚀 WORKFLOW RECOMENDADO

1. **Editar migration no VS Code:**
   - Use autocompletar da extensão
   - Veja erros em tempo real
   - Corrija antes de aplicar

2. **Aplicar via CLI:**
   ```bash
   supabase db push
   ```

3. **OU aplicar via Dashboard:**
   - Copiar SQL validado
   - Colar no SQL Editor
   - Executar

---

## ✅ VALIDAR MIGRATION ATUAL

Abra a migration e verifique:

- ✅ Sem erros sublinhados em vermelho
- ✅ Autocompletar funcionando
- ✅ Sintaxe SQL válida

**Arquivo para validar:**
- `supabase/migrations/20260111182110_deploy_rls_race_conditions.sql`
- `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`

---

## 🔍 TROUBLESHOOTING

### Extensão não está funcionando

1. **Verificar conexão:**
   - A extensão precisa de conexão com o banco
   - Configure a connection string nas settings

2. **Reiniciar VS Code:**
   - Às vezes precisa reiniciar após instalar

3. **Verificar logs:**
   - Abra Output (Cmd+Shift+U)
   - Selecione "Postgres Language Server"
   - Veja mensagens de erro

### Autocompletar não aparece

- Certifique-se de que o arquivo tem extensão `.sql`
- Verifique se a conexão está ativa
- Tente recarregar a janela (Cmd+Shift+P → "Reload Window")

---

## 📚 RECURSOS ADICIONAIS

- **Documentação:** https://github.com/supabase/postgres-language-server
- **Marketplace:** https://marketplace.visualstudio.com/items?itemName=supabase.postgres-language-server
- **Repository:** https://github.com/supabase/postgres-language-server

---

**💡 Dica:** Use a extensão para validar todas as migrations antes de aplicar via CLI ou Dashboard!
