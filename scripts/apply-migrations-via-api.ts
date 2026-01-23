#!/usr/bin/env npx tsx

/**
 * ⚠️ DEPRECATED: Use aplicar_migration.sh (raiz) como script oficial
 * Este script é mantido apenas para casos específicos.
 * 
 * Script oficial: ./aplicar_migration.sh
 * Fonte da verdade: docs/architecture/SCRIPTS_OFICIAIS.md
 */

/**
 * 🚀 Aplicar Migrations Críticas via Supabase API
 * 
 * Aplica DEPLOY_MIGRATIONS_CONSOLIDADO.sql usando Service Role Key
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
    console.error('   Obtenha em: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/settings/api');
    process.exit(1);
}

async function applyMigrations() {
    console.log('🚀 Aplicando Migrations Críticas (RLS + Race Conditions)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Ler arquivo SQL consolidado
    const sqlFile = path.join(__dirname, '..', 'DEPLOY_MIGRATIONS_CONSOLIDADO.sql');
    if (!fs.existsSync(sqlFile)) {
        console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log(`✅ SQL carregado: ${path.basename(sqlFile)}`);
    console.log(`   Tamanho: ${sql.length} caracteres`);
    console.log('');

    // Criar cliente Supabase com Service Role Key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('📡 Conectando ao Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log('');

    try {
        // Nota: Supabase não permite execução direta de SQL arbitrário via API pública
        // Precisamos usar uma abordagem alternativa via RPC ou Management API
        
        // Tentar via Management API (se disponível)
        // Alternativa: Dividir SQL em statements menores e executar via RPC
        
        console.log('⚠️  Supabase API não permite execução direta de SQL arbitrário.');
        console.log('   Isso é uma limitação de segurança da API.');
        console.log('');
        console.log('📋 OPÇÕES DISPONÍVEIS:');
        console.log('');
        console.log('1. Via Supabase Dashboard (Recomendado - 5 min):');
        console.log('   → https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new');
        console.log('   → Cole o conteúdo de DEPLOY_MIGRATIONS_CONSOLIDADO.sql');
        console.log('   → Execute (Cmd+Enter)');
        console.log('');
        console.log('2. Via Supabase CLI (após login):');
        console.log('   → supabase login');
        console.log('   → supabase link --project-ref qonfbtwsxeggxbkhqnxl');
        console.log('   → supabase db push');
        console.log('');

        // Tentar alternativa: usar Supabase Management API (requer token especial)
        // Por enquanto, apenas mostrar instruções
        
        console.log('💡 Arquivo SQL pronto em:');
        console.log(`   ${sqlFile}`);
        console.log('');
        console.log('✅ Próximo passo: Aplicar via Dashboard ou CLI');
        
    } catch (error: any) {
        console.error('❌ Erro ao tentar aplicar migrations:', error.message);
        console.error('');
        console.error('📋 Use uma das opções acima para aplicar manualmente.');
        process.exit(1);
    }
}

applyMigrations().catch(console.error);
