#!/usr/bin/env npx tsx

/**
 * 🔧 Aplicar Fix de Onboarding via Supabase API
 * Usa as credenciais do projeto para executar SQL diretamente
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL ou SUPABASE_URL não encontrado');
    process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado');
    console.error('   Use a Service Role Key (não a Anon Key) para executar SQL');
    process.exit(1);
}

async function applyFix() {
    console.log('🔧 Aplicando Fix de Onboarding via Supabase API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, '..', 'FIX_ONBOARDING_SQL.sql');
    if (!fs.existsSync(sqlFile)) {
        console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log(`✅ SQL carregado: ${sqlFile}`);
    console.log(`   Tamanho: ${sql.length} caracteres`);
    console.log('');

    // Criar cliente Supabase com Service Role Key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL}`);
    console.log('');

    try {
        // Executar SQL via RPC (usando função interna do Supabase)
        // Nota: Supabase não expõe execução direta de SQL via API pública
        // Precisamos usar uma abordagem alternativa
        
        console.log('⚠️  Supabase API não permite execução direta de SQL arbitrário.');
        console.log('   Isso é uma limitação de segurança da API.');
        console.log('');
        console.log('📋 OPÇÕES DISPONÍVEIS:');
        console.log('');
        console.log('1. Via Supabase Dashboard (Recomendado):');
        console.log('   → https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new');
        console.log('   → Cole o SQL e execute');
        console.log('');
        console.log('2. Via Supabase CLI (após login):');
        console.log('   → supabase login');
        console.log('   → supabase link --project-ref qonfbtwsxeggxbkhqnxl');
        console.log('   → supabase db push');
        console.log('');
        console.log('3. Criar migration e aplicar:');
        console.log('   → Copiar FIX_ONBOARDING_SQL.sql para supabase/migrations/');
        console.log('   → supabase db push');
        console.log('');

        // Tentar alternativa: criar migration temporária
        const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
        if (fs.existsSync(migrationDir)) {
            const migrationFile = path.join(
                migrationDir,
                `${Date.now()}_fix_onboarding_heartbeat.sql`
            );
            
            console.log('💡 Criando migration temporária...');
            fs.writeFileSync(migrationFile, sql);
            console.log(`✅ Migration criada: ${path.basename(migrationFile)}`);
            console.log('');
            console.log('📋 Próximo passo:');
            console.log('   1. Execute: supabase login');
            console.log('   2. Execute: supabase link --project-ref qonfbtwsxeggxbkhqnxl');
            console.log('   3. Execute: supabase db push');
            console.log('');
        }

    } catch (error: any) {
        console.error('❌ Erro ao aplicar fix:', error.message);
        console.error('');
        console.error('📋 Use a opção manual via Dashboard:');
        console.error('   https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new');
        process.exit(1);
    }
}

applyFix();
