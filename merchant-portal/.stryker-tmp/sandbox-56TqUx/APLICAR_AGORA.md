# 🛑 PARADA OBRIGATÓRIA: REPARO FINAL DO BANCO 🛑

O erro persiste porque o banco de dados remoto (Supabase) tem uma versão desatualizada da função de criação, mesmo com os patches nas tabelas.

Precisamos substituir o "cérebro" da criação (a função `create_tenant_atomic`) agora.

---

### PASSO A PASSO (3 MINUTOS)

1. **Abra o painel do seu projeto no Supabase:**
   [https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl](https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl)

2. **No menu lateral esquerdo, clique em** `SQL Editor`.

3. **Crie uma nova consulta (New Query) ou use uma em branco.**

4. **Copie TODO o conteúdo do arquivo abaixo:**
   👉 `FIX_ONBOARDING_SQL.sql` 
   *(Este arquivo foi criado na raiz do pasta `merchant-portal`)*

5. **Cole no editor do Supabase.**

6. **Clique no botão verde** `RUN` (ou `RUN SELECTION`).
   
   *Se aparecer "Success" na parte inferior, deu certo.*

---

### DEPOIS DE RODAR:

Volte para a tela de Onboarding do aplicativo (localhost) e clique em **"Estabelecer Entidade"** novamente.

Agora vai funcionar. 🚀
