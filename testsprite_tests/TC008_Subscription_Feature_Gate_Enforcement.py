import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Click on 'Já tenho conta' to proceed to login with updated credentials.
        frame = context.pages[-1]
        # Click on 'Já tenho conta' to go to login page
        elem = frame.locator('xpath=html/body/div/main/div[2]/div/main/div[3]/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click login button to authenticate.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('contact@goldmonkey.studio')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div/div[3]/div/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('password123')
        

        frame = context.pages[-1]
        # Click Entrar (Dev Mode) button to login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input a test entity name or Google Maps link in the input field to proceed with onboarding and simulate subscription tier with no add-ons.
        frame = context.pages[-1]
        # Input test entity name or Google Maps link to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Entity')
        

        # -> Select the first entity option 'Test Entity Original' to proceed with onboarding.
        frame = context.pages[-1]
        # Select 'Test Entity Original' entity option to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[2]/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Prosseguir' button to continue onboarding and move closer to subscription tier simulation.
        frame = context.pages[-1]
        # Click 'Prosseguir' button to continue onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Não encontrei no Google' button to try alternative input method for the required 'Restaurant Name' field.
        frame = context.pages[-1]
        # Click 'Não encontrei no Google' button to provide restaurant name manually
        elem = frame.locator('xpath=html/body/div/div/footer/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Confirmar e Sincronizar' button to proceed with onboarding and move closer to subscription tier simulation.
        frame = context.pages[-1]
        # Click 'Confirmar e Sincronizar' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Confirmar Estrutura' button to proceed with onboarding and move closer to subscription tier simulation.
        frame = context.pages[-1]
        # Click 'Confirmar Estrutura' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the recommended 'À La Carte (Tradicional)' operational rhythm and click 'Confirmar Ritmo' to proceed.
        frame = context.pages[-1]
        # Select 'À La Carte (Tradicional)' operational rhythm option
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Confirmar Ritmo' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Registrar Financeiro' button to proceed with onboarding and move closer to subscription tier simulation.
        frame = context.pages[-1]
        # Click 'Registrar Financeiro' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Confirmar Estrutura' button to proceed with onboarding and move closer to subscription tier simulation.
        frame = context.pages[-1]
        # Click 'Confirmar Estrutura' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Concluir Fundação' button with index 3 to complete onboarding.
        frame = context.pages[-1]
        # Retry clicking 'Concluir Fundação' button to complete onboarding and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Ativação do Sistema Sovereign - O nascimento da sua entidade digital. Selando as leis da operação.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Centro de Comando Operacional - Operação, pedidos, caixa e decisões em tempo real.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Link para outros dispositivos').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Entrar no Painel Operacional').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    