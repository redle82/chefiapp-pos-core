// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const REQUIRED_ENV_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_MAPS_KEY'
];

async function verify() {
    console.log('🚀 Starting Pre-Flight Deployment Check...');

    // 1. Check for Vercel Config
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
        console.log('✅ vercel.json detected.');
    } else {
        console.error('❌ vercel.json missing in merchant-portal root.');
        process.exit(1);
    }

    // 2. Check Environment Variables (Mock check for .env or Vercel envs)
    // In CI/CD, these come from the environment. Locally, we check .env
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
        console.log('✅ Local .env detected.');
    } else {
        console.warn('⚠️ No local .env file. Ensure Vercel Environment Variables are set.');
    }

    const missingVars = REQUIRED_ENV_VARS.filter(key => {
        // Check process.env OR .env content
        return !process.env[key] && !envContent.includes(key);
    });

    if (missingVars.length > 0) {
        console.warn(`⚠️ Potentially missing Environment Variables: ${missingVars.join(', ')}`);
        console.warn('   (This is fatal if not set in Vercel Project Settings)');
    } else {
        console.log('✅ All required Environment Variables appear to be referenced.');
    }

    // 3. Type Check
    try {
        console.log('🔍 Running Type Check...');
        execSync('npm run type-check', { stdio: 'inherit' });
        console.log('✅ Type Check Passed.');
    } catch (e) {
        console.error('❌ Type Check Failed.');
        process.exit(1);
    }

    console.log('✨ READY FOR DEPLOYMENT.');
}

verify();
