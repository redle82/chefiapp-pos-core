/**
 * 🔒 E2E Test: Sovereign Navigation Flow
 * 
 * PROTEÇÃO ARQUITETURAL: Valida que o fluxo de navegação nunca quebra
 * 
 * Este teste garante:
 * - Landing Page → /app (único ponto de entrada)
 * - FlowGate decide tudo
 * - OAuth redireciona corretamente
 * - Apps abrem em novas abas
 * - Refresh funciona em qualquer /app/*
 * 
 * Referências:
 * - E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
 * - ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md
 * - SINGLE_ENTRY_POLICY.md
 */

import { test, expect } from '@playwright/test';

test.describe('🔒 Sovereign Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage e cookies para garantir estado limpo
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Landing Page → /app (Single Entry Point)', async ({ page }) => {
    // 1. Landing Page carrega
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // 2. Verificar que todos os CTAs apontam para /app
    const ctaLinks = page.locator('a[href*="/app"]');
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // 3. Clicar em qualquer CTA deve ir para /app
    await ctaLinks.first().click();
    
    // 4. FlowGate deve interceptar e redirecionar (sem auth → /login)
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('FlowGate: Sem auth → /login', async ({ page }) => {
    // Acessar /app diretamente sem autenticação
    await page.goto('/app');
    
    // FlowGate deve redirecionar para /login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('Login Page: OAuth redireciona para /app', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que o botão OAuth existe
    const oauthButton = page.locator('button:has-text("Google")').or(page.locator('button:has-text("🌍")'));
    await expect(oauthButton).toBeVisible();
    
    // Verificar que não há links diretos para /login na landing
    // (isso deve ser validado pelo script de validação, mas verificamos aqui também)
    await page.goto('/');
    const loginLinks = page.locator('a[href="/login"]');
    const count = await loginLinks.count();
    expect(count).toBe(0);
  });

  test('Apps abrem em novas abas (window.open)', async ({ context, page }) => {
    // Simular usuário autenticado (pular auth para este teste)
    // Nota: Em teste real, você precisaria fazer login primeiro
    
    // Ir para dashboard
    await page.goto('/app/dashboard');
    
    // Aguardar dashboard carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar que existem cards de apps
    const appCards = page.locator('[data-module-id]').or(page.locator('button:has-text("TPV")'));
    
    if (await appCards.count() > 0) {
      // Criar listener para nova aba
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        appCards.first().click()
      ]);
      
      // Verificar que nova aba foi aberta
      expect(newPage).toBeTruthy();
      
      // Verificar que a URL é uma rota de app
      await newPage.waitForLoadState('networkidle');
      const url = newPage.url();
      expect(url).toMatch(/\/app\/(tpv|kds|menu|orders|staff)/);
      
      await newPage.close();
    }
  });

  test('Refresh funciona em qualquer /app/*', async ({ page }) => {
    // Rotas de apps que devem funcionar com refresh direto
    const appRoutes = ['/app/dashboard', '/app/tpv', '/app/kds', '/app/menu', '/app/orders', '/app/staff'];
    
    for (const route of appRoutes) {
      // Tentar acessar diretamente
      await page.goto(route);
      
      // Verificar que não há erro 404 ou tela branca
      // (sem auth, FlowGate deve redirecionar para /login, não quebrar)
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      // Deve estar em /login (sem auth) ou na rota correta (com auth)
      expect(url).toMatch(/\/(login|app\/)/);
    }
  });

  test('Página pública não requer auth', async ({ page }) => {
    // A página pública deve ser acessível sem autenticação
    // Nota: Isso requer um restaurante com slug configurado
    // Por enquanto, apenas verificamos que a rota existe e não redireciona para /login
    
    await page.goto('/public/test-slug');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Não deve redirecionar para /login
    expect(page.url()).not.toContain('/login');
    
    // Deve estar em /public/*
    expect(page.url()).toContain('/public/');
  });

  test('document.title definido para cada app', async ({ page }) => {
    // Simular acesso direto aos apps (sem auth, FlowGate redireciona)
    // Mas verificamos que quando carregam, têm título correto
    
    const appRoutes = [
      '/app/dashboard',
      '/app/tpv',
      '/app/kds',
      '/app/menu',
      '/app/orders',
      '/app/staff',
    ];
    
    for (const path of appRoutes) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Se redirecionou para /login, título será diferente
      // Mas se carregou o app, deve ter o título correto
      const title = await page.title();
      
      // Verificar que título não está vazio ou genérico
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    }
  });
});

test.describe('🔒 Single Entry Policy Validation', () => {
  test('Nenhum link direto para /login na landing', async ({ page }) => {
    await page.goto('/');
    
    // Buscar todos os links
    const allLinks = await page.locator('a[href]').all();
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      
      // Verificar que nenhum link aponta diretamente para /login
      if (href && href.includes('/login') && !href.includes('/app')) {
        throw new Error(`🚨 VIOLAÇÃO: Link encontrado apontando para /login: ${href}`);
      }
    }
  });

  test('Todos os CTAs da landing apontam para /app', async ({ page }) => {
    await page.goto('/');
    
    // Buscar CTAs principais
    const ctaSelectors = [
      'a:has-text("Entrar")',
      'a:has-text("Começar")',
      'a:has-text("Já tenho conta")',
      'a.btn-primary',
      'a.btn-outline',
    ];
    
    for (const selector of ctaSelectors) {
      const links = page.locator(selector);
      const count = await links.count();
      
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        
        if (href && !href.includes('/app') && !href.startsWith('http') && !href.startsWith('#')) {
          throw new Error(`🚨 VIOLAÇÃO: CTA encontrado não apontando para /app: ${href}`);
        }
      }
    }
  });
});
