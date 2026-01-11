
const dotenv = require('dotenv');
dotenv.config({ path: 'merchant-portal/.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function checkInfrastructure() {
    console.log('\n--- 🛡️  OVERSEER HEALTH MONITOR ---');
    console.log(`Target: ${SUPABASE_URL}\n`);

    const services = [
        { name: 'Health Service', url: 'functions/v1/health' },
        { name: 'Birth Engine', url: 'functions/v1/create-tenant' },
        { name: 'Sudo Repair', url: 'functions/v1/repair-membership' }
    ];

    for (const service of services) {
        try {
            const res = await fetch(`${SUPABASE_URL}/${service.url}`, {
                method: 'OPTIONS', // Check CORS/Existence
                headers: { 'apikey': ANON_KEY }
            });

            if (res.status === 200 || res.status === 204) {
                console.log(`✅ ${service.name.padEnd(15)} : ONLINE`);
            } else if (res.status === 404) {
                console.log(`❌ ${service.name.padEnd(15)} : OFFLINE (404 Not Found)`);
            } else {
                console.log(`⚠️  ${service.name.padEnd(15)} : UNKNOWN (Status: ${res.status})`);
            }
        } catch (e) {
            console.log(`❌ ${service.name.padEnd(15)} : ERROR (${e.message})`);
        }
    }

    console.log('\n👉 If any services are OFFLINE, run:');
    console.log('   supabase functions deploy health create-tenant repair-membership');
    console.log('\n--- MONITOR COMPLETE ---\n');
}

checkInfrastructure();
