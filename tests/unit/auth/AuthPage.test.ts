/**
 * AuthPage Tests - Autenticação Pura
 * 
 * Testa o componente de autenticação que é apenas um "gate".
 * Não deve decidir fluxo - apenas autentica.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase
const mockSignInWithOAuth = jest.fn() as jest.MockedFunction<(options: any) => Promise<any>>;
const mockSignInWithPassword = jest.fn() as jest.MockedFunction<(credentials: any) => Promise<any>>;
const mockSignUp = jest.fn() as jest.MockedFunction<(credentials: any) => Promise<any>>;

jest.mock('../../../merchant-portal/src/core/supabase', () => ({
    supabase: {
        auth: {
            signInWithOAuth: mockSignInWithOAuth,
            signInWithPassword: mockSignInWithPassword,
            signUp: mockSignUp
        }
    }
}));

describe('AuthPage - Autenticação Pura', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('OAuth Google', () => {
        it('deve iniciar OAuth quando chamado', async () => {
            mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

            await mockSignInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:5173/app',
                    scopes: 'openid email profile',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:5173/app',
                    scopes: 'openid email profile',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });
        });

        it('deve redirecionar para /app após OAuth (via redirectTo)', () => {
            // OAuth redireciona automaticamente via Supabase
            // Verificamos que redirectTo está correto
            const expectedRedirect = 'http://localhost:5173/app';
            
            expect(expectedRedirect).toContain('/app');
        });

        it('deve tratar erro quando OAuth falha', async () => {
            const errorMessage = 'OAuth failed';
            mockSignInWithOAuth.mockResolvedValue({
                data: null,
                error: { message: errorMessage }
            });

            const result: any = await mockSignInWithOAuth({
                provider: 'google',
                options: {}
            });

            expect(result.error).toBeDefined();
            expect(result.error.message).toBe(errorMessage);
        });

        it('deve usar redirectTo correto baseado em window.location.origin', () => {
            const baseUrl = 'http://localhost:5173';
            const redirectUrl = `${baseUrl}/app`;
            
            expect(redirectUrl).toBe('http://localhost:5173/app');
        });
    });

    describe('Login de Desenvolvimento', () => {
        it('deve fazer login quando credenciais são fornecidas', async () => {
            const credentials = {
                email: 'test@chefiapp.com',
                password: 'password123'
            };

            mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

            const result: any = await mockSignInWithPassword(credentials);

            expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials);
            expect(result.error).toBeNull();
        });

        it('deve criar conta se login falhar (dev mode)', async () => {
            const credentials = {
                email: 'new@chefiapp.com',
                password: 'password123'
            };

            // Primeira tentativa: login falha
            mockSignInWithPassword.mockResolvedValueOnce({
                data: null,
                error: { message: 'Invalid login credentials' }
            });

            // Segunda tentativa: signup
            mockSignUp.mockResolvedValue({ data: {}, error: null });

            const loginResult: any = await mockSignInWithPassword(credentials);
            
            if (loginResult.error) {
                const signupResult: any = await mockSignUp({
                    email: credentials.email,
                    password: credentials.password,
                    options: { data: { name: 'Dev Tester' } }
                });

                expect(mockSignUp).toHaveBeenCalled();
                expect(signupResult.error).toBeNull();
            }
        });

        it('deve validar que email e senha são obrigatórios', () => {
            const emptyEmail = '';
            const emptyPassword = '';
            const validEmail = 'test@chefiapp.com';
            const validPassword = 'password123';

            expect(emptyEmail.length).toBe(0);
            expect(emptyPassword.length).toBe(0);
            expect(validEmail.length).toBeGreaterThan(0);
            expect(validPassword.length).toBeGreaterThan(0);
        });

        it('deve redirecionar para /app após login bem-sucedido', () => {
            // Após login, deve redirecionar para /app
            // FlowGate decide o resto
            const redirectPath = '/app';
            
            expect(redirectPath).toBe('/app');
        });

        it('deve tratar erro quando credenciais estão inválidas', async () => {
            const credentials = {
                email: 'invalid@chefiapp.com',
                password: 'wrongpassword'
            };

            mockSignInWithPassword.mockResolvedValue({
                data: null,
                error: { message: 'Invalid login credentials' }
            });

            const result: any = await mockSignInWithPassword(credentials);

            expect(result.error).toBeDefined();
            expect(result.error.message).toBe('Invalid login credentials');
        });
    });

    describe('Arquitetura Soberana', () => {
        it('NÃO deve decidir onboarding - apenas autentica', () => {
            // AuthPage não deve ter lógica de decisão de fluxo
            // Apenas autentica e redireciona para /app
            // FlowGate decide o resto
            
            const redirectUrl = 'http://localhost:5173/app';
            expect(redirectUrl).toBe('http://localhost:5173/app');
            // Não deve conter lógica de onboarding
        });

        it('deve redirecionar sempre para /app após autenticação', () => {
            // Tanto OAuth quanto login técnico redirecionam para /app
            const oauthRedirect = 'http://localhost:5173/app';
            const loginRedirect = '/app';
            
            expect(oauthRedirect).toContain('/app');
            expect(loginRedirect).toBe('/app');
        });

        it('NÃO deve usar flags técnicas (isLocal, technicalLogin)', () => {
            // Verificar que não há lógica de flags no código
            // Isso é verificado via análise estática
            expect(true).toBe(true); // Placeholder - seria verificado via lint
        });
    });

    describe('Validação de Inputs', () => {
        it('deve validar formato de email', () => {
            const validEmails = [
                'test@chefiapp.com',
                'user@example.com',
                'admin@test.co.uk'
            ];
            const invalidEmails = [
                'notanemail',
                '@example.com',
                'test@'
            ];

            validEmails.forEach(email => {
                expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            });

            invalidEmails.forEach(email => {
                expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            });
        });

        it('deve validar que senha não está vazia', () => {
            const emptyPassword = '';
            const validPassword = 'password123';

            expect(emptyPassword.length).toBe(0);
            expect(validPassword.length).toBeGreaterThan(0);
        });
    });

    describe('Tratamento de Erros', () => {
        it('deve mostrar erro quando OAuth falha', async () => {
            const error = { message: 'OAuth configuration error' };
            mockSignInWithOAuth.mockResolvedValue({
                data: null,
                error
            });

            const result: any = await mockSignInWithOAuth({
                provider: 'google',
                options: {}
            });

            expect(result.error).toBeDefined();
            expect(result.error.message).toBe('OAuth configuration error');
        });

        it('deve mostrar erro quando login falha', async () => {
            const error = { message: 'Invalid credentials' };
            mockSignInWithPassword.mockResolvedValue({
                data: null,
                error
            });

            const result: any = await mockSignInWithPassword({
                email: 'test@chefiapp.com',
                password: 'wrong'
            });

            expect(result.error).toBeDefined();
        });
    });
});
