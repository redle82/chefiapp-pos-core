import { Pool } from 'pg';
import fetch from 'node-fetch';

const UBER_AUTH_URL = 'https://login.uber.com/oauth/v2/authorize';
const UBER_TOKEN_URL = 'https://login.uber.com/oauth/v2/token';

interface UberConfig {
    clientId: string;
    clientSecret: string;
}

export class UberEatsAuthHandler {
    private config: UberConfig;
    private pool: Pool;

    constructor(pool: Pool) {
        const clientId = process.env.UBER_CLIENT_ID;
        const clientSecret = process.env.UBER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.warn('[UberAuth] Missing UBER_CLIENT_ID or UBER_CLIENT_SECRET. OAuth will fail.');
        }

        this.config = {
            clientId: clientId || '',
            clientSecret: clientSecret || '',
        };
        this.pool = pool;
    }

    /**
     * Generates the authorization URL for the frontend to redirect to.
     */
    getAuthorizationUrl(redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: 'eats.store',
        });
        return `${UBER_AUTH_URL}?${params.toString()}`;
    }

    /**
     * Exchanges the authorization code for an access token.
     * This runs 100% on the server, keeping the Client Secret safe.
     */
    async exchangeCode(code: string, redirectUri: string, restaurantId: string): Promise<any> {
        if (!this.config.clientSecret) {
            throw new Error('Server misconfiguration: Missing UBER_CLIENT_SECRET');
        }

        const body = new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        });

        try {
            const response = await fetch(UBER_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Uber Token API failed: ${response.status} ${errText}`);
            }

            const data = await response.json();

            // Persist credentials securely
            await this.saveCredentials(restaurantId, data);

            return { success: true, scope: data.scope };

        } catch (error) {
            console.error('[UberAuth] Exchange failed:', error);
            throw error;
        }
    }

    private async saveCredentials(restaurantId: string, data: any) {
        const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

        await this.pool.query(
            `INSERT INTO integration_credentials 
       (restaurant_id, integration_type, access_token, refresh_token, expires_at, updated_at)
       VALUES ($1, 'ubereats', $2, $3, $4, NOW())
       ON CONFLICT (restaurant_id, integration_type) 
       DO UPDATE SET 
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()`,
            [restaurantId, data.access_token, data.refresh_token, expiresAt.toISOString()]
        );
    }
}
