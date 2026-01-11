/**
 * GlovoOAuth — Autenticação OAuth 2.0 com Glovo
 * 
 * Gerencia tokens de acesso e refresh tokens
 */

import type { GlovoOAuthTokenResponse, GlovoOAuthError } from './GlovoTypes';

const GLOVO_API_BASE = 'https://open-api.glovoapp.com';
const TOKEN_ENDPOINT = '/oauth/token';

export interface GlovoOAuthOptions {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
}

export class GlovoOAuth {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(options: GlovoOAuthOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.baseUrl = options.baseUrl || GLOVO_API_BASE;
  }

  /**
   * Obter access token via OAuth 2.0 Client Credentials
   * 
   * Nota: Glovo pode usar diferentes flows OAuth dependendo do tipo de app.
   * Este é o flow básico para server-to-server.
   */
  async getAccessToken(): Promise<string> {
    // Se temos token válido, retornar
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Se temos refresh token, tentar refresh
    if (this.refreshToken) {
      try {
        const newToken = await this.refreshAccessToken(this.refreshToken);
        return newToken;
      } catch (error) {
        console.warn('[GlovoOAuth] Refresh token failed, getting new token', error);
        // Continuar para obter novo token
      }
    }

    // Obter novo token
    try {
      const response = await fetch(`${this.baseUrl}${TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const error: GlovoOAuthError = await response.json().catch(() => ({
          error: 'unknown_error',
          error_description: `HTTP ${response.status}`,
        }));
        throw new Error(`OAuth error: ${error.error} - ${error.error_description}`);
      }

      const data: GlovoOAuthTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || null;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 min de margem

      return this.accessToken;
    } catch (error) {
      console.error('[GlovoOAuth] Failed to get access token', error);
      throw error;
    }
  }

  /**
   * Refresh access token usando refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}${TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const error: GlovoOAuthError = await response.json().catch(() => ({
          error: 'invalid_refresh_token',
        }));
        throw new Error(`Refresh token error: ${error.error}`);
      }

      const data: GlovoOAuthTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || refreshToken; // Manter o antigo se não vier novo
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;

      return this.accessToken;
    } catch (error) {
      console.error('[GlovoOAuth] Failed to refresh token', error);
      // Limpar tokens inválidos
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
      throw error;
    }
  }

  /**
   * Obter token atual (pode ser null se não autenticado)
   */
  getCurrentToken(): string | null {
    return this.accessToken;
  }

  /**
   * Verificar se token está válido
   */
  isTokenValid(): boolean {
    return this.accessToken !== null && 
           this.tokenExpiresAt !== null && 
           Date.now() < this.tokenExpiresAt;
  }

  /**
   * Limpar tokens (logout)
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Definir tokens manualmente (útil para persistência)
   */
  setTokens(accessToken: string, refreshToken: string | null, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000) - 60000;
  }
}
