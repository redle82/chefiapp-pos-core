/**
 * CLI entry point for Amazon catalog refresh
 * 
 * Usage:
 *   npx ts-node server/amazon/refresh-catalog-cli.ts [country_code]
 * 
 * If no country_code provided, refreshes all countries
 */

import { refreshAmazonCatalog, runRefreshCatalogCron } from './refresh-catalog';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

async function main() {
    const countryCode = process.argv[2];

    if (countryCode) {
        console.log(`[CLI] Refreshing catalog for ${countryCode}...`);
        await refreshAmazonCatalog(countryCode);
    } else {
        console.log('[CLI] Refreshing catalog for all countries...');
        await runRefreshCatalogCron();
    }

    console.log('[CLI] Done.');
    process.exit(0);
}

main().catch((error) => {
    console.error('[CLI] Fatal error:', error);
    process.exit(1);
});

