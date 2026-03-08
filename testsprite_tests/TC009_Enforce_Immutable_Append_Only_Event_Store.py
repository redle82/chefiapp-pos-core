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
        # -> Click on 'Já tenho conta' (I already have an account) to access the login form.
        frame = context.pages[-1]
        # Click on 'Já tenho conta' to open the login form.
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
        # Click login button to authenticate
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input an entity name in the Google or Google Maps input field to proceed with onboarding.
        frame = context.pages[-1]
        # Input entity name to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Entity for Event Store')
        

        # -> Click the 'Não encontrei no Google' button to confirm the entity name and proceed with onboarding.
        frame = context.pages[-1]
        # Click 'Não encontrei no Google' to confirm entity name and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select the first suggested address 'Test Entity for Event Store Original Rua Principal, 123 · Lisboa' to satisfy the restaurant name requirement and proceed with onboarding.
        frame = context.pages[-1]
        # Select the first suggested address to satisfy the restaurant name requirement and proceed
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[3]/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input a valid Google Maps link or a recognizable entity name in the input field to trigger suggestions or enable the next step in onboarding.
        frame = context.pages[-1]
        # Input a full valid entity name or Google Maps link to trigger suggestions and enable next step
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Entity for Event Store Original Rua Principal, 123 Lisboa')
        

        # -> Try clicking the first suggested address again to ensure selection is registered and check if any new controls appear.
        frame = context.pages[-1]
        # Click the first suggested address again to confirm selection
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div/div[2]/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Prosseguir' button to continue onboarding.
        frame = context.pages[-1]
        # Click 'Prosseguir' button to proceed with onboarding
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Confirmar e Sincronizar' button to confirm and synchronize the establishment data.
        frame = context.pages[-1]
        # Click 'Confirmar e Sincronizar' to confirm and synchronize establishment data
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Confirmar Estrutura' button to confirm the operational territory structure and proceed.
        frame = context.pages[-1]
        # Click 'Confirmar Estrutura' to confirm the operational territory structure and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Confirmar Ritmo' button to confirm the selected operational rhythm model and proceed to the next onboarding step.
        frame = context.pages[-1]
        # Click 'Confirmar Ritmo' button to confirm operational rhythm and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Registrar Financeiro' button to register financial settings and proceed to the next onboarding step.
        frame = context.pages[-1]
        # Click 'Registrar Financeiro' to register financial settings and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Confirmar Estrutura' button to confirm the team structure and proceed to the final onboarding step.
        frame = context.pages[-1]
        # Click 'Confirmar Estrutura' button to confirm team structure and proceed
        elem = frame.locator('xpath=html/body/div/div/footer/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Reconhecimento').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Realidade').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Soberania').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pilar: Território').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pilar: Ritmo').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ritual: Caixa').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ritual: Equipe').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ativação Final').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Consagração').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=O ato final de fundação.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=MODO CONSTRUÇÃO').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Test Entity for Event Store').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Original Rua Principal, 123 Lisboa').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=OriginalLisboa').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Soberano').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Elder Miranda de Andrade').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🚧 FOUNDER (Construction)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1 Unidades').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ID: d5b14a25-4a7d-4a03-977a-0e87de36d3d4').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ao inaugurar, você declara que as informações fornecidas são verdadeiras e assume responsabilidade legal pela operação.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Revisar Leis').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Concluir Fundação').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    