// @ts-nocheck
import { useEffect, useRef, useCallback } from 'react'

/**
 * useOperationLock — Prevents navigation during critical operations
 *
 * TRUTH LOCK: User cannot accidentally leave during critical work.
 *
 * Uses:
 * - Beforeunload event for browser close/refresh
 * - Sets a flag that can be checked by navigation guards
 */

export interface UseOperationLockOptions {
  /** Whether lock is active */
  isLocked: boolean
  /** Message to show in beforeunload dialog (browser may ignore) */
  message?: string
}

export function useOperationLock(options: UseOperationLockOptions) {
  const { isLocked, message = 'Tens uma operacao em curso. Tens a certeza que queres sair?' } = options
  const isLockedRef = useRef(isLocked)

  // Keep ref in sync
  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isLockedRef.current) return

      e.preventDefault()
      // Modern browsers ignore custom message, but we set it anyway
      e.returnValue = message
      return message
    }

    if (isLocked) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isLocked, message])

  // Store lock state in sessionStorage for cross-component access
  useEffect(() => {
    if (isLocked) {
      sessionStorage.setItem('chefiapp_operation_lock', 'true')
    } else {
      sessionStorage.removeItem('chefiapp_operation_lock')
    }
  }, [isLocked])

  return {
    isLocked,
  }
}

/**
 * Check if there's an active operation lock
 */
export function isOperationLocked(): boolean {
  return sessionStorage.getItem('chefiapp_operation_lock') === 'true'
}

/**
 * Hook for simple busy state with automatic lock
 */
export function useBusyLock() {
  const busyRef = useRef(false)

  const setBusy = useCallback((busy: boolean) => {
    busyRef.current = busy
    if (busy) {
      sessionStorage.setItem('chefiapp_operation_lock', 'true')
    } else {
      sessionStorage.removeItem('chefiapp_operation_lock')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (busyRef.current) {
        sessionStorage.removeItem('chefiapp_operation_lock')
      }
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!busyRef.current) return
      e.preventDefault()
      e.returnValue = 'Operacao em curso.'
      return 'Operacao em curso.'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return { setBusy, isBusy: busyRef.current }
}
