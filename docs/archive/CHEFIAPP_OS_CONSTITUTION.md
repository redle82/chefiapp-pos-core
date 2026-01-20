# ChefIApp™ OS — The Sovereign Constitution

> **Status:** RATIFIED
> **Enforcement:** `OSFrame.tsx` + `OSCopy.ts`

This document defines the immutable laws of the ChefIApp User Interface. These rules are not style suggestions; they are system requirements.

---

## Law 1: Identity is State
The application's "Climate" (Thermal State) and "Flag" (Logo) are determined by the **System Context**, not by individual page preference.

| Context | Fire State | Description | Logo Presence |
| :--- | :--- | :--- | :---: |
| **Landing** | `Ignition` | High heat, dynamic, attracting | ✅ Sovereign |
| **Onboarding** | `Ritual` | Controlled fire, solemn, linear | ✅ Sovereign |
| **Dashboard** | `Ember` | Deep heat, low fatigue, operational | ✅ Discreet |
| **Auth** | `Void` | Absolute zero, silent, waiting | ✅ Sovereign |
| **Alert** | `Alert` | Red Critical (Kernel Panic) | ✅ Black/Red |
| **Public** | `N/A` | Customer-facing (White Label support) | ❌ Forbidden |

**Implementation:**
- Pages MUST NOT manually render backgrounds or logos.
- Pages MUST be wrapped in `<OSFrame context="...">`.

---

## Law 2: Text is Regulated
The implementation of text is a controlled process.
- **NO** hardcoded strings for operational terms.
- **NO** "Oops", "Success!", or marketing jargon.
- **NO** exclamation marks in system messages.

All strings must originate from `OSCopy.ts`. This ensures the tone remains:
- **Direct**: "Command Central", not "Your Dashboard".
- **Calm**: "System awaits input", not "Please add items!!!".
- **Secure**: "Session terminated", not "You have been logged out".

---

## Law 3: Context is Sovereign
The ChefIApp™ OS brand is the "hidden governor". It exists to support the Restaurant Owner (Merchant), not the End Customer (Diner).

| Surface | ChefIApp Logo | Restaurant Logo |
| :--- | :---: | :---: |
| **Back Office (Admin)** | **Primary** | Secondary |
| **Onboarding** | **Primary** | Preview |
| **Login / Auth** | **Primary** | None |
| **Table QR Code** | None | **Primary** |
| **Printed Ticket** | None | **Primary** |
| **Public Menu** | None | **Primary** |

The System must never compete with the Restaurant's brand in front of their customers.
