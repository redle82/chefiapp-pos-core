import { test, expect } from '@playwright/test';

test.describe('Landing = Produto ("/")', () => {
  test('Overlay visível em "/" com CTAs e barra de demo', async ({ page }) => {
    await page.goto('/');

    // Overlay: preço ou CTA visível
    await expect(
      page.getByText(/79 €\/mês/i)
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /Começar agora/i })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /Explorar primeiro/i })
    ).toBeVisible();

    // Barra de demo sempre visível
    await expect(
      page.getByText(/Modo Demonstração/i)
    ).toBeVisible();
  });

  test('"Explorar primeiro" esconde overlay e mantém TPV visível', async ({ page }) => {
    await page.goto('/');

    const explorarBtn = page.getByRole('button', { name: /Explorar primeiro/i });
    await explorarBtn.click();

    // Overlay desaparece
    await expect(explorarBtn).toBeHidden();

    // Barra de demo continua
    await expect(
      page.getByText(/Modo Demonstração/i)
    ).toBeVisible();

    // Sinal mínimo de TPV/conteúdo operacional visível (vários elementos podem coincidir)
    await expect(
      page.getByText(/TPV|Pedido|Mesa|Produto/i).first()
    ).toBeVisible();
  });

  test('"Começar agora" navega para /auth', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Começar agora/i }).click();

    await expect(page).toHaveURL(/\/auth/);
  });
});
