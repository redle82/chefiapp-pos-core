# tests/legacy-skip

Tests moved here depend on **removed or obsolete architecture** (legal-boundary, event-log, gateways, projections, core-engine state-machines, server/\*, billing-core, etc.). They are **excluded from the default test run** (Jest testPathIgnorePatterns). Current system of truth: Docker Core + ORE + TPV/KDS. Do not recreate removed modules to satisfy these tests.
