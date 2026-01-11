/**
 * DeliverooOAuth - OAuth 2.0 para Deliveroo
 * 
 * FASE 3: Autenticação Deliveroo
 */

import { supabase } from '../../../core/supabase';

const DELIVEROO_AUTH_URL = 'https://api.deliveroo.com/oauth2/authorize';
const DELIVEROO_TOKEN_URL = 'https://api.deliveroo.com/oauth2/token';

export interface DeliverooOAuthConfig {
    clientId: string;
    clientSecret: string;
    restaurantId: string;
}

export class DeliverooOAuth {
    private config: DeliverooOAuthConfig;

    constructor(config: DeliverooOAuthConfig) {
        this.config = config;
    }

    /**
     * Obter URL de autorização
     */
    getAuthorizationUrl(redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope: 'orders.read orders.write',
        });

        return `${DELIVEROO_AUTH_URL}?${params.toString()}`;
    }

    /**
     * Trocar código por token
     */
    async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
        const response = await fetch(DELIVEROO_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`Deliveroo OAuth failed: ${response.statusText}`);
        }

        const data = await response.json();
        const accessToken = data.access_token;

        // Salvar token no Supabase
        await this.saveToken(accessToken, data.refresh_token, data.expires_in);

        return accessToken;
    }

    /**
     * Obter token (com refresh se necessário)
     */
    async getAccessToken(): Promise<string | null> {
        const { data } = await supabase
            .from('integration_credentials')
            .select('access_token, refresh_token, expires_at')
            .eq('restaurant_id', this.config.restaurantId)
            .eq('integration_type', 'deliveroo')
            .single();

        if (!data) return null;

        // Verificar se token expirou
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            // Refresh token
            return await this.refreshToken(data.refresh_token);
        }

        return data.access_token;
    }

    /**
     * Refresh token
     */
    private async refreshToken(refreshToken: string): Promise<string | null> {
        const response = await fetch(DELIVEROO_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            console.error('[DeliverooOAuth] Token refresh failed');
            return null;
        }

        const data = await response.json();
        await this.saveToken(data.access_token, data.refresh_token, data.expires_in);

        return data.access_token;
    }

    /**
     * Salvar token no Supabase
     */
    private async saveToken(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        await supabase
            .from('integration_credentials')
            .upsert({
                restaurant_id: this.config.restaurantId,
                integration_type: 'deliveroo',
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'restaurant_id,integration_type',
            });
    }
}
