/**
 * useKdsAlerts — Audio notification system for KDS
 *
 * Plays a professional 2-tone ascending beep (800Hz -> 1200Hz) when new orders
 * arrive in the kitchen. Uses Web Audio API exclusively (no external files).
 *
 * Features:
 * - Page Visibility API: only plays when tab is visible
 * - Debounce: minimum 3s between alerts
 * - localStorage persistence: `kds_audio_enabled` (default: true)
 * - No audio on initial mount (only on count increase)
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "kds_audio_enabled";
const DEBOUNCE_MS = 3000;

function getStoredAudioEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored === "true";
  } catch {
    return true;
  }
}

function setStoredAudioEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // localStorage unavailable (e.g. incognito mode full)
  }
}

/**
 * Generates a clean 2-tone ascending beep using Web Audio API.
 * Tone 1: 800Hz for 100ms, Tone 2: 1200Hz for 100ms.
 * Smooth gain envelope to avoid clicks.
 */
function playKitchenBeep(): void {
  try {
    const AudioCtx =
      typeof AudioContext !== "undefined"
        ? AudioContext
        : (globalThis as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: 800Hz, 0ms-100ms
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(800, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain1.gain.linearRampToValueAtTime(0, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Tone 2: 1200Hz, 120ms-220ms (20ms gap for clarity)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.13);
    gain2.gain.linearRampToValueAtTime(0, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.22);

    // Clean up AudioContext after playback
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Web Audio API unavailable or blocked by browser policy
  }
}

export interface UseKdsAlertsOptions {
  orderCount: number;
  enabled?: boolean;
}

export interface UseKdsAlertsReturn {
  audioEnabled: boolean;
  toggleAudio: () => void;
}

export function useKdsAlerts({
  orderCount,
  enabled = true,
}: UseKdsAlertsOptions): UseKdsAlertsReturn {
  const [audioEnabled, setAudioEnabled] = useState(getStoredAudioEnabled);
  const prevCountRef = useRef<number | null>(null);
  const lastBeepRef = useRef<number>(0);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      setStoredAudioEnabled(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // Skip the very first render (mount) — don't beep on page load
    if (prevCountRef.current === null) {
      prevCountRef.current = orderCount;
      return;
    }

    const prevCount = prevCountRef.current;
    prevCountRef.current = orderCount;

    // Only alert when count increases (new orders)
    if (orderCount <= prevCount) return;

    // Respect enabled prop and user preference
    if (!enabled || !audioEnabled) return;

    // Page Visibility: only play when tab is visible
    if (typeof document !== "undefined" && document.hidden) return;

    // Debounce: minimum 3s between alerts
    const now = Date.now();
    if (now - lastBeepRef.current < DEBOUNCE_MS) return;
    lastBeepRef.current = now;

    playKitchenBeep();
  }, [orderCount, enabled, audioEnabled]);

  return { audioEnabled, toggleAudio };
}
