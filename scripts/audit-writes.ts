/**
 * SUPREME AUDIT SCRIPT
 * 
 * Scans the codebase for unauthorized direct database writes.
 * Enforces the Single Writer Principle (Law 1).
 * 
 * USAGE:
 *   npx ts-node scripts/audit-writes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../merchant-portal/src');
const BANNED_PATTERNS = [
    /\.from\(['"]gm_.*?\)\s*\.(insert|update|delete|upsert)/g
];
const IGNORED_FILES = [
    'DbWriteGate.ts', // The Gatekeeper itself
    'audit-writes.ts', // This script
    'LegacyTestSetup.ts', // Test setup helpers
    'OrderProjection.ts', // SOVEREIGN: Authorized Kernel Projections (Law 1 Exceptions)
    'ProductProjection.ts', // SOVEREIGN: Product Domain

    // AUTHORIZED ENFORCERS (Law 2.5)
    'ReconciliationEngine.ts',

    // LEGACY CORE (Authorized Transitional)
    // 'OrderEngine.ts' - Migrated to DbWriteGate (Step 11908)
    'DiagnosticEngine.ts',
    'HistoricalDataEngine.ts',
    'AuditService.ts',

    // LEGACY SERVICES (Authorized Transitional)
    // 'WebOrderingService.ts' - Migrated (Phase 12)

    // LEGACY FRONTEND (Authorized Transitional)
    // All known contexts migrated to DbWriteGate or Kernel.
    // 'PlanContext.tsx', 'useMenuState.ts', etc... - Migrated
];

let violations = 0;

function scanDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            checkFile(fullPath);
        }
    }
}

function checkFile(filePath: string) {
    if (IGNORED_FILES.some(ignored => filePath.includes(ignored))) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const pattern of BANNED_PATTERNS) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            // Find line number
            const lineNum = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNum - 1].trim();

            // Check if it's commented out
            if (line.startsWith('//') || line.startsWith('*')) continue;

            console.error(`\n❌ VIOLATION DETECTED:`);
            console.error(`   File: ${path.relative(ROOT_DIR, filePath)}:${lineNum}`);
            console.error(`   Code: ${line}`);
            console.error(`   Rule: Law 1 - Direct DB write forbidden outside DbWriteGate.`);
            violations++;
        }
    }
}

console.log('🦅 Starting Supreme Write Audit...');
scanDir(ROOT_DIR);

if (violations > 0) {
    console.error(`\n🛑 AUDIT FAILED: ${violations} violations found.`);
    console.error('   Fix: Use DbWriteGate or route through Kernel.');
    process.exit(1);
} else {
    console.log('\n✅ AUDIT PASSED: No unauthorized writes detected.');
    process.exit(0);
}
