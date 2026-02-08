/**
 * Worker/Cron: Refresh Amazon Catalog
 * 
 * Runs daily to:
 * 1. Search products for each category in each country
 * 2. Calculate scores and select Top 5 per category
 * 3. Generate 3 kits (Budget/Standard/Pro)
 * 4. Update expires_at timestamps
 */

import { createPaApiClient, parsePrice, calculateScore } from './pa-api-client';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create Postgres Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});

type CandidateProduct = Record<string, any> & {
    score: number;
};

interface KitTierConfig {
    tier: 'budget' | 'standard' | 'pro';
    categories: string[]; // Required categories for this tier
}

const KIT_TIERS: KitTierConfig[] = [
    {
        tier: 'budget',
        categories: ['MiniPC', 'Monitor', 'ReceiptPrinter80', 'CashDrawer', 'BarcodeScanner2D'],
    },
    {
        tier: 'standard',
        categories: ['MiniPC', 'TouchMonitor', 'ReceiptPrinter80', 'CashDrawer', 'BarcodeScanner2D', 'POSStand'],
    },
    {
        tier: 'pro',
        categories: ['MiniPC', 'TouchMonitor', 'ReceiptPrinter80', 'CashDrawer', 'BarcodeScanner2D', 'POSStand', 'KDS', 'UPS', 'LabelPrinter'],
    },
];

/**
 * Refresh catalog for a specific country
 */
export async function refreshAmazonCatalog(countryCode: string): Promise<void> {
    console.log(`[RefreshCatalog] Starting refresh for ${countryCode}`);

    const client = createPaApiClient(countryCode);
    if (!client) {
        console.warn(`[RefreshCatalog] PA API client not available for ${countryCode}. Check env vars.`);
        return;
    }

    // 1. Get all categories
    const { rows: categories } = await pool.query('SELECT * FROM category ORDER BY key');
    
    if (!categories || categories.length === 0) {
        throw new Error('No categories found');
    }

    // 2. For each category, search and cache Top 20, select Top 5
    for (const category of categories) {
        await refreshCategory(client, countryCode, category);
    }

    // 3. Generate kits
    await generateKits(countryCode);

    console.log(`[RefreshCatalog] Completed refresh for ${countryCode}`);
}

/**
 * Refresh products for a single category
 */
async function refreshCategory(
    client: any, // PaApiClient
    countryCode: string,
    category: any
): Promise<void> {
    console.log(`[RefreshCatalog] Refreshing ${category.key} for ${countryCode}`);

    try {
        // Search with category keywords
        const keywords = category.keywords?.join(' ') || category.key;
        
        // Call PA API
        const response = await client.searchItems({
            keywords,
            itemCount: 20, // Get Top 20
            resources: [
                'Images.Primary.Medium',
                'Images.Primary.Large',
                'ItemInfo.Title',
                'ItemInfo.ByLineInfo',
                'ItemInfo.Features',
                'Offers.Listings.Price',
                'Offers.Listings.Availability.Message',
                'Offers.Listings.DeliveryInfo',
                'CustomerReviews.StarRating',
                'CustomerReviews.TotalCount',
            ],
        });

        if (!response.ok) {
            console.error(`[RefreshCatalog] PA API error for ${category.key}:`, response.error);
            return;
        }

        const items = (response.data.SearchResult?.Items || []) as any[];

        // Process and score each item
        const candidates: CandidateProduct[] = items
            .map((item: any): CandidateProduct | null => {
                const price = item.Offers?.Listings?.[0]?.Price;
                const priceCents = price
                    ? parsePrice(price.DisplayAmount || '0')
                    : null;

                // Filter by price range if specified
                if (category.min_price_cents && priceCents && priceCents < category.min_price_cents) {
                    return null;
                }
                if (category.max_price_cents && priceCents && priceCents > category.max_price_cents) {
                    return null;
                }

                const rating = item.CustomerReviews?.StarRating?.Value;
                const reviewsCount = item.CustomerReviews?.TotalCount || 0;
                const isPrime = item.Offers?.Listings?.[0]?.DeliveryInfo?.IsAmazonFulfilled || false;

                const score = calculateScore(rating, reviewsCount, isPrime);

                return {
                    country_code: countryCode,
                    category_key: category.key,
                    asin: item.ASIN,
                    title: item.ItemInfo?.Title?.DisplayValue || 'Unknown',
                    price_cents: priceCents,
                    currency: price?.Currency || 'EUR',
                    prime: isPrime,
                    rating: rating || null,
                    reviews_count: reviewsCount,
                    image_url: item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || null,
                    detail_url: item.DetailPageURL || `https://www.amazon.com/dp/${item.ASIN}`,
                    score,
                    updated_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
                };
            })
            .filter((c: CandidateProduct | null): c is CandidateProduct => c !== null)
            .sort((a: CandidateProduct, b: CandidateProduct) => b.score - a.score); // Sort by score DESC

        // Upsert Top 20
        if (candidates.length > 0) {
            const toUpsert = candidates.slice(0, 20);
            const cols = Object.keys(toUpsert[0]);
            const placeholders = toUpsert.map((_p: CandidateProduct, i: number) => 
                `(${cols.map((_c: string, j: number) => `$${i * cols.length + j + 1}`).join(', ')})`
            ).join(', ');
            
            const values = toUpsert.flatMap((d: CandidateProduct) => cols.map((c: string) => d[c]));
            const updateCols = cols.filter(c => !['country_code', 'category_key', 'asin'].includes(c));
            const updateSet = updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
            
            const query = `
                INSERT INTO candidate_product (${cols.join(', ')})
                VALUES ${placeholders}
                ON CONFLICT (country_code, category_key, asin) DO UPDATE SET ${updateSet}
            `;
            
            try {
                await pool.query(query, values);
                console.log(`[RefreshCatalog] Upserted ${toUpsert.length} products for ${category.key}`);
            } catch (err: any) {
                console.error(`[RefreshCatalog] Failed to upsert products for ${category.key}:`, err.message);
            }
        } else {
            console.warn(`[RefreshCatalog] No valid products found for ${category.key}`);
        }
    } catch (error) {
        console.error(`[RefreshCatalog] Error refreshing ${category.key}:`, error);
        // Continue with next category
    }
}

/**
 * Generate kits (Budget/Standard/Pro) for a country
 */
async function generateKits(countryCode: string): Promise<void> {
    console.log(`[RefreshCatalog] Generating kits for ${countryCode}`);

    for (const tierConfig of KIT_TIERS) {
        const kitItems: any[] = [];
        let totalPriceCents: number | null = 0;
        let hasExpiredPrice = false;

        // For each required category, get Top 1 product
        for (const categoryKey of tierConfig.categories) {
            const { rows } = await pool.query(
                `SELECT * FROM candidate_product 
                 WHERE country_code = $1 AND category_key = $2 AND expires_at > $3 
                 ORDER BY score DESC LIMIT 1`,
                [countryCode, categoryKey, new Date().toISOString()]
            );

            if (!rows || rows.length === 0) {
                console.warn(`[RefreshCatalog] No valid product for ${categoryKey} in ${countryCode}`);
                hasExpiredPrice = true;
                continue;
            }

            const products = rows[0];

            kitItems.push({
                asin: products.asin,
                category_key: products.category_key,
                title: products.title,
                price_cents: products.price_cents,
                image_url: products.image_url,
                detail_url: products.detail_url,
            });

            if (products.price_cents) {
                totalPriceCents = (totalPriceCents || 0) + products.price_cents;
            } else {
                hasExpiredPrice = true;
            }
        }

        // Upsert kit
        const kitData = {
            country_code: countryCode,
            tier: tierConfig.tier,
            title: `${tierConfig.tier.charAt(0).toUpperCase() + tierConfig.tier.slice(1)} TPV Kit`,
            items_json: JSON.stringify(kitItems),
            total_price_cents: hasExpiredPrice ? null : totalPriceCents,
            updated_at: new Date().toISOString(),
        };

        try {
            await pool.query(
                `INSERT INTO kit_bundle (country_code, tier, title, items_json, total_price_cents, updated_at)
                 VALUES ($1, $2, $3, $4::jsonb, $5, $6)
                 ON CONFLICT (country_code, tier) DO UPDATE SET
                     title = EXCLUDED.title,
                     items_json = EXCLUDED.items_json,
                     total_price_cents = EXCLUDED.total_price_cents,
                     updated_at = EXCLUDED.updated_at`,
                [kitData.country_code, kitData.tier, kitData.title, kitData.items_json, kitData.total_price_cents, kitData.updated_at]
            );
            console.log(`[RefreshCatalog] Generated ${tierConfig.tier} kit with ${kitItems.length} items`);
        } catch (err: any) {
            console.error(`[RefreshCatalog] Failed to upsert kit ${tierConfig.tier}:`, err.message);
        }
    }
}

/**
 * Cron entry point (call from your cron system)
 */
export async function runRefreshCatalogCron(): Promise<void> {
    // Validate env vars
    if (!process.env.AMAZON_PA_API_ACCESS_KEY || !process.env.AMAZON_PA_API_SECRET_KEY || !process.env.AMAZON_PA_API_PARTNER_TAG) {
        console.error('[RefreshCatalog] Missing required env vars: AMAZON_PA_API_ACCESS_KEY, AMAZON_PA_API_SECRET_KEY, AMAZON_PA_API_PARTNER_TAG');
        return;
    }

    const countries = ['US', 'ES', 'PT', 'FR', 'DE', 'IT', 'UK'];

    for (const country of countries) {
        try {
            await refreshAmazonCatalog(country);
            // Small delay between countries to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`[RefreshCatalog] Failed for ${country}:`, error);
            // Continue with next country
        }
    }
}
