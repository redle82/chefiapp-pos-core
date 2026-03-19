/**
 * DeliverooOAuth - OAuth 2.0 para Deliveroo
 * 
 * TASK-3.1.3: Removido client_secret do frontend
 * Agora usa endpoint backend /api/oauth/exchange
 */

import { CONFIG } from '../../../config';

const DELIVEROO_AUTH_URL = 'https://api.deliveroo.com/oauth2/authorize';

export interface DeliverooOAuthConfig {
    clientId: string;
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
     * TASK-3.1.3: Usa endpoint backend /api/oauth/exchange (client_secret no backend)
     */
    async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
        const response = await fetch(`${CONFIG.API_BASE}/api/oauth/exchange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Incluir cookies de sessão
            body: JSON.stringify({
                code,
                provider: 'deliveroo',
                redirectUri,
                restaurantId: this.config.restaurantId,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'UNKNOWN_ERROR' }));
            throw new Error(`Deliveroo OAuth failed: ${error.error || response.statusText}`);
        }

        const data = await response.json();
        // Token já foi salvo no DB pelo backend (criptografado)
        return data.access_token;
    }

    /**
     * Obter token (com refresh se necessário)
     * TASK-3.1.3: Usa endpoint backend /api/oauth/token (descriptografa token)
     */
    async getAccessToken(): Promise<string | null> {
        try {
            const response = await fetch(
                `${CONFIG.API_BASE}/api/oauth/token?provider=deliveroo&restaurantId=${this.config.restaurantId}`,
                {
                    method: 'GET',
                    credentials: 'include', // Incluir cookies de sessão
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Token não encontrado
                }
                console.error('[DeliverooOAuth] Failed to get token:', response.statusText);
                return null;
            }

            const data = await response.json();
            
            // Check if token expired — attempt refresh via backend
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                if (data.refresh_token) {
                    try {
                        const refreshResponse = await fetch(`/api/integrations/deliveroo/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refresh_token: data.refresh_token, restaurant_id: this.restaurantId }),
                        });
                        if (refreshResponse.ok) {
                            const refreshed = await refreshResponse.json();
                            return refreshed.access_token;
                        }
                    } catch {
                        console.warn('[DeliverooOAuth] Token refresh failed, re-auth required');
                    }
                }
                return null;
            }

            return data.access_token;
        } catch (error) {
            console.error('[DeliverooOAuth] Error getting token:', error);
            return null;
        }
    }
}
