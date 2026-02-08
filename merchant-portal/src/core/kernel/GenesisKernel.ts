/**
 * SHIM FOR [Operation Jailbreak]
 * Redirects to the Sovereign Kernel in core-engine.
 */
import type {
  OnboardingDraft,
  RealityResolution,
} from "../../../../core-engine/kernel/Kernel";
import { Kernel } from "../../../../core-engine/kernel/Kernel";

export { Kernel as GenesisKernel };
export type { OnboardingDraft, RealityResolution };
