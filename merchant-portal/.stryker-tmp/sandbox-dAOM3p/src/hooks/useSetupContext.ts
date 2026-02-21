// @ts-nocheck
import { createContext, useContext } from 'react'
import type { OnboardingHook } from './useOnboardingState'

const OnboardingContext = createContext<OnboardingHook | null>(null)

export function useSetupContext() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useSetupContext must be used within SetupLayout')
  return ctx
}

export { OnboardingContext }
