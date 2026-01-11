import { Page, Route } from '@playwright/test'

type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED'

type Handler = Parameters<Page['route']>[1]

const healthBody = (status: HealthStatus) => {
  if (status === 'UP') return { status: 'UP' }
  if (status === 'DEGRADED') return { status: 'DEGRADED', latencyMs: 2500 }
  return { status: 'DOWN', reason: 'mocked' }
}

export async function mockHealth(page: Page, status: HealthStatus) {
  await page.route('**/api/health', async (route: Route) => {
    const body = JSON.stringify(healthBody(status))
    await route.fulfill({ status: status === 'DOWN' ? 503 : 200, body, contentType: 'application/json' })
  })
}

export async function clearHealthMocks(page: Page) {
  await page.unroute('**/api/health')
}
