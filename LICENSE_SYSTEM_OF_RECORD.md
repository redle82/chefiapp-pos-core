LICENSE & GOVERNANCE — SYSTEM OF RECORD

Product: ChefIApp POS Core
Version: 1.0.0-AUDIT
Classification: NON-REPUDIABLE FINANCIAL ENGINE
Date: 2025-12-22

⸻

1. PURPOSE

This document defines the legal, technical, and governance conditions under which the ChefIApp POS Core may be used, integrated, distributed, or extended.

The Core is not a generic library.
It is a Certified System of Record.

⸻

2. DEFINITIONS

System of Record (SoR)
The immutable financial engine composed of Gates 0–5.2, whose outputs constitute legally defensible financial facts.

Frozen Core
A versioned engine whose logic, schemas, and invariants are sealed by audit. Any modification invalidates certification.

Adapter
External code that observes or consumes Core outputs without mutating them.

⸻

3. LICENSE GRANT

The Licensor grants a non-exclusive, non-transferable license to:
	•	Deploy the System of Record as a financial engine
	•	Integrate external adapters (UI, Fiscal, ERP, BI)
	•	Use outputs for accounting, reporting, and compliance

This license applies only to the audited version (v1.0.0-AUDIT).

⸻

4. STRICT PROHIBITIONS (NON-NEGOTIABLE)

The following actions are explicitly forbidden:
	1.	❌ Modifying Core logic (Gates 0–1)
	2.	❌ Altering Legal Boundary behavior (Gate 2)
	3.	❌ Changing persistence schemas or triggers (Gate 3)
	4.	❌ Bypassing atomic transaction enforcement (Gate 4)
	5.	❌ Mutating fiscal persistence or constraints (Gate 5.1–5.2)
	6.	❌ Re-using the “System of Record” designation after modification

Any of the above actions immediately void this license and all audit claims.

⸻

5. ADAPTER GOVERNANCE (ALLOWED EXTENSION)

Adapters may:
	•	Observe event_store, legal_seals, or fiscal records
	•	Transform outputs into UI, XML, APIs, reports
	•	Fail independently without blocking the Core

Adapters may not:
	•	Write to Core tables
	•	Influence transaction outcomes
	•	Introduce side-effects into Core execution

⸻

6. VERSIONING & AUDIT INTEGRITY
	•	Each audited release is immutable
	•	Changes require:
	1.	New version number
	2.	New Gate review
	3.	New Audit Verdict

Audit claims are version-bound, not project-bound.

⸻

7. DISCLAIMER OF WARRANTY

The System of Record guarantees integrity, immutability, and auditability.

It does not guarantee:
	•	Correct tax rates for specific jurisdictions
	•	Network availability of fiscal authorities
	•	Business profitability or compliance outcomes

⸻

8. GOVERNANCE MODEL

Layer	Governance
Core Engine	Frozen / Certified
Legal Proof	Frozen / Certified
Persistence	Frozen / Certified
Fiscal	Frozen / Certified
Adapters	Free / Replaceable
UI	Non-certified
ERP / BI	Non-certified


⸻

9. TERMINATION

Any breach of this governance model:
	•	Terminates the license
	•	Invalidates audit claims
	•	Removes the right to represent the system as “Non-Repudiable”

⸻

10. FINAL STATEMENT

This license protects truth, not convenience.

The ChefIApp POS Core is licensed as an engine of record, not a sandbox.

Signed:
ChefIApp POS Architecture Team
