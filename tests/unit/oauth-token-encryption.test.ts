/**
 * OAUTH TOKEN ENCRYPTION TEST
 * 
 * TASK-3.1.2: Teste para verificar que tokens são criptografados antes de salvar no DB
 * 
 * Testa que:
 * - Tokens são criptografados antes de salvar
 * - Tokens são descriptografados ao ler
 * - Token criptografado não é legível no DB
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { encryptOAuthToken, decryptOAuthToken } from '../../server/middleware/security';

describe('TASK-3.1.2: OAuth Token Encryption', () => {
  // Set encryption key for tests
  beforeEach(() => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes
  });

  it('should encrypt token before saving to DB', () => {
    const plainToken = 'mock_access_token_12345';
    const encrypted = encryptOAuthToken(plainToken);

    // Verificar que o token criptografado é diferente do original
    expect(encrypted).not.toEqual(Buffer.from(plainToken));
    expect(encrypted.length).toBeGreaterThan(plainToken.length);
    
    // Verificar que o token criptografado não contém o texto original
    expect(encrypted.toString('utf8')).not.toContain(plainToken);
  });

  it('should decrypt token when reading from DB', () => {
    const plainToken = 'mock_access_token_12345';
    const encrypted = encryptOAuthToken(plainToken);
    const decrypted = decryptOAuthToken(encrypted);

    // Verificar que descriptografado é igual ao original
    expect(decrypted).toBe(plainToken);
  });

  it('should not be readable in DB (encrypted token is not plain text)', () => {
    const plainToken = 'sensitive_token_data_12345';
    const encrypted = encryptOAuthToken(plainToken);

    // Verificar que o token criptografado não é legível como texto
    const encryptedString = encrypted.toString('utf8');
    expect(encryptedString).not.toContain('sensitive_token_data');
    expect(encryptedString).not.toContain('12345');
    
    // Verificar que é binário (não texto válido)
    expect(() => {
      JSON.parse(encryptedString);
    }).toThrow();
  });

  it('should handle null/undefined refresh token', () => {
    const plainToken = 'mock_access_token';
    const encrypted = encryptOAuthToken(plainToken);
    const decrypted = decryptOAuthToken(encrypted);

    expect(decrypted).toBe(plainToken);

    // Verificar que descriptografar null/undefined retorna string vazia
    expect(decryptOAuthToken(null)).toBe('');
    expect(decryptOAuthToken(undefined)).toBe('');
  });

  it('should produce different encrypted values for same token (due to random IV)', () => {
    const plainToken = 'same_token_value';
    const encrypted1 = encryptOAuthToken(plainToken);
    const encrypted2 = encryptOAuthToken(plainToken);

    // Verificar que cada criptografia produz resultado diferente (IV aleatório)
    expect(encrypted1).not.toEqual(encrypted2);
    
    // Mas ambos descriptografam para o mesmo valor
    expect(decryptOAuthToken(encrypted1)).toBe(plainToken);
    expect(decryptOAuthToken(encrypted2)).toBe(plainToken);
  });

  it('should fail to decrypt with wrong key', () => {
    // Set first key
    process.env.CREDENTIALS_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const plainToken = 'mock_token';
    const encrypted = encryptOAuthToken(plainToken);

    // Change key
    process.env.CREDENTIALS_ENCRYPTION_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

    // Tentar descriptografar com chave errada deve falhar
    expect(() => {
      decryptOAuthToken(encrypted);
    }).toThrow();
  });
});
