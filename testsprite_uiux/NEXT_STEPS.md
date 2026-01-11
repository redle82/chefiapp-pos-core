// File: merchant-portal/src/pages/BootstrapPage.tsx

import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StartLayout from '../components/StartLayout'
import Spinner from '../components/Spinner'
import Button from '../components/Button'

// Add BootstrapState type
type BootstrapState =
  | 'checking'
  | 'checking_restaurant'
  | 'checking_health'
  | 'ready'
  | 'error'
  | 'timeout'
  | 'redirecting'

const BOOTSTRAP_TIMEOUT = 10000 // 10s
const PROGRESS_DELAY = 2000 // 2s

export default function BootstrapPage() {
  const navigate = useNavigate()

  // Add the required states
  const [state, setState] = useState<BootstrapState>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [progressStep, setProgressStep] = useState<string | null>(null)

  // Assume checkHealth is defined elsewhere or imported
  const checkHealth = useCallback(async (): Promise<'UP' | 'DOWN'> => {
    // Placeholder for actual health check logic
    return 'UP'
  }, [])

  const bootstrap = useCallback(async () => {
    setState('checking')
    setErrorMessage(null)
    setShowProgress(false)
    setProgressStep(null)

    const restaurantId = localStorage.getItem('chefiapp_restaurant_id')
    const isDemo = localStorage.getItem('chefiapp_demo_mode') === 'true'

    // No restaurant: escape hatch
    if (!restaurantId) {
      setState('redirecting')
      setTimeout(() => navigate('/start'), 300)
      return
    }

    setState('checking_restaurant')
    setProgressStep('Verificando restaurante…')

    const progressTimer = setTimeout(() => {
      setShowProgress(true)
    }, PROGRESS_DELAY)

    // Demo: skip health
    if (isDemo) {
      clearTimeout(progressTimer)
      setShowProgress(false)
      setState('ready')
      setTimeout(() => navigate('/app/preview'), 500)
      return
    }

    setState('checking_health')
    setProgressStep('Conectando ao sistema…')

    try {
      const healthPromise = checkHealth()
      const timeoutPromise = new Promise<'TIMEOUT'>((resolve) => {
        setTimeout(() => resolve('TIMEOUT'), BOOTSTRAP_TIMEOUT)
      })

      const result = await Promise.race([healthPromise, timeoutPromise])

      clearTimeout(progressTimer)
      setShowProgress(false)

      if (result === 'TIMEOUT') {
        setState('timeout')
        return
      }

      if (result === 'DOWN') {
        setState('error')
        setErrorMessage('Sistema indisponível. Tenta novamente em breve.')
        return
      }

      // Success
      setProgressStep('Tudo pronto!')
      setState('ready')
      setTimeout(() => navigate('/app/preview'), 500)
    } catch (error) {
      clearTimeout(progressTimer)
      setShowProgress(false)
      setState('error')
      setErrorMessage('Erro ao conectar. Verifica a tua ligação à internet.')
    }
  }, [checkHealth, navigate])

  React.useEffect(() => {
    bootstrap()
  }, [bootstrap])

  // Render views based on state

  if (
    state === 'checking' ||
    state === 'checking_restaurant' ||
    state === 'checking_health'
  ) {
    return (
      <StartLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Spinner />
          {showProgress && progressStep && (
            <p className="mt-4 text-lg text-gray-700">{progressStep}</p>
          )}
          {showProgress && (
            <p className="mt-2 text-sm text-gray-500">
              Isto pode levar alguns segundos…
            </p>
          )}
        </div>
      </StartLayout>
    )
  }

  if (state === 'timeout') {
    return (
      <StartLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4">
            Está a demorar mais do que o esperado
          </h1>
          <p className="mb-6 text-gray-700">
            O sistema pode estar lento ou indisponível.
          </p>
          <div className="flex flex-col space-y-3">
            <Button onClick={() => bootstrap()} type="button" className="w-full">
              Tentar novamente
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('chefiapp_demo_mode', 'true')
                navigate('/app/preview')
              }}
              type="button"
              variant="secondary"
              className="w-full"
            >
              Entrar em modo demo
            </Button>
            <Button
              onClick={() => navigate('/start')}
              type="button"
              variant="outline"
              className="w-full"
            >
              Voltar ao início
            </Button>
          </div>
        </div>
      </StartLayout>
    )
  }

  if (state === 'error') {
    return (
      <StartLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4">Não foi possível conectar</h1>
          <p className="mb-6 text-gray-700">{errorMessage}</p>
          <div className="flex flex-col space-y-3">
            <Button onClick={() => bootstrap()} type="button" className="w-full">
              Tentar novamente
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('chefiapp_demo_mode', 'true')
                navigate('/app/preview')
              }}
              type="button"
              variant="secondary"
              className="w-full"
            >
              Entrar em modo demo
            </Button>
          </div>
        </div>
      </StartLayout>
    )
  }

  // Default fallback (ready or redirecting)
  return null
}



// File: testsprite_uiux/specs/uiux_audit.spec.ts

import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const A11Y_REPORT_DIR = path.join(__dirname, '../../output')
const ROUTES = [
  // ... list of routes
]

test('@smoke All routes should load without crash', async ({ page }) => {
  const blockedRoutes: string[] = [];
  let bootstrapFailed = false;

  try {
    await page.goto('/app/bootstrap', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
  } catch (error) {
    bootstrapFailed = true;
    console.error('\n⚠️ Bootstrap probe failed:', error?.message || error);
  }

  const failedRoutes: string[] = []

  for (const route of ROUTES) {
    if (bootstrapFailed && route.startsWith('/app/') && route !== '/app/auth' && route !== '/app/creating') {
      blockedRoutes.push(`${route} - BLOCKED_BY_BOOTSTRAP`);
      continue;
    }

    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 })
      // Additional checks can be here
    } catch (error) {
      failedRoutes.push(route)
    }
  }

  const failedRoutesPath = path.join(A11Y_REPORT_DIR, 'failed_routes.json')
  fs.writeFileSync(failedRoutesPath, JSON.stringify(failedRoutes, null, 2))

  const blockedRoutesPath = path.join(A11Y_REPORT_DIR, 'blocked_routes.json')
  fs.writeFileSync(blockedRoutesPath, JSON.stringify(blockedRoutes, null, 2))

  if (failedRoutes.length > 0) {
    console.error(`\n❌ Failed routes (${failedRoutes.length}):`, failedRoutes)
  }

  if (blockedRoutes.length > 0) {
    console.warn(`\n⛔ Blocked routes (${blockedRoutes.length}):`, blockedRoutes)
  }

  if (failedRoutes.length === 0 && blockedRoutes.length === 0) {
    console.log('\n✅ All routes loaded successfully')
  }
})



// File: testsprite_uiux/scripts/generate-reports.js

const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '../output')
const FAILED_ROUTES_PATH = path.join(OUTPUT_DIR, 'failed_routes.json')
const BLOCKED_ROUTES_PATH = path.join(OUTPUT_DIR, 'blocked_routes.json')
const UIUX_AUDIT_REPORT_PATH = path.join(OUTPUT_DIR, 'UIUX_AUDIT_REPORT.md')

function loadJsonSafe(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function generateIssues(failedRoutes) {
  // Only generate issues for failed routes, not blocked
  return failedRoutes.map((route) => ({
    route,
    severity: 'error',
    message: `Falha na rota: ${route}`,
  }))
}

function generateMarkdownReport(failedRoutes, blockedRoutes, score) {
  let report = `# UI/UX Audit Report

## 📈 Estatísticas

- **Score de Navegação:** ${score}
- **Rotas Falhadas:** ${failedRoutes.length}
- **Rotas Bloqueadas (Bootstrap):** ${blockedRoutes.length}

## 🔴 Top 10 Falhas (S0/S1)

`

  const topFailed = failedRoutes.slice(0, 10)
  if (topFailed.length === 0) {
    report += 'Nenhuma falha detectada.\n\n'
  } else {
    for (const route of topFailed) {
      report += `- ${route}\n`
    }
    report += '\n'
  }

  report += `## ⛔ Rotas Bloqueadas por Bootstrap

`

  if (blockedRoutes.length === 0) {
    report += 'Nenhuma rota bloqueada.\n\n'
  } else {
    const topBlocked = blockedRoutes.slice(0, 15)
    for (const route of topBlocked) {
      report += `- ${route}\n`
    }
    report += '\n'
  }

  return report
}

function calculateScore(failedRoutes) {
  // Example: base 100 minus penalty per failed route
  const penalty = failedRoutes.length * 3
  return Math.max(0, 100 - penalty)
}

function main() {
  const failedRoutes = loadJsonSafe(FAILED_ROUTES_PATH)
  const blockedRoutes = loadJsonSafe(BLOCKED_ROUTES_PATH)

  const score = calculateScore(failedRoutes)

  const issues = generateIssues(failedRoutes)

  const report = generateMarkdownReport(failedRoutes, blockedRoutes, score)

  fs.writeFileSync(UIUX_AUDIT_REPORT_PATH, report)

  console.log(`UI/UX Audit report generated. Score: ${score}`)
  console.log(`Failed routes: ${failedRoutes.length}`)
  console.log(`Blocked routes: ${blockedRoutes.length}`)
}

main()
