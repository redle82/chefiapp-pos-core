#!/usr/bin/env node
/**
 * 🏛️ ARCHITECTURE GUARDIAN
 * 
 * Enforces architectural invariants at CI time.
 * If any invariant is violated, this script exits with code 1.
 * 
 * Usage:
 *   npm run audit:architecture
 *   node scripts/audit-architecture.js
 * 
 * Invariants Checked:
 *   INV-001: Domain Never Reads Storage Directly
 *   INV-002: No Hook Resolves Tenant (outside TenantProvider)
 *   INV-003: Gate Before Domain (provider hierarchy)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SRC_DIR = path.join(__dirname, '../src');
const DOMAIN_PATHS = [
    'pages/TPV/context',
    'core/tpv',
    'core/menu',
    'hooks/useMenuItems.ts',
    'hooks/useOrders.ts',
];

const FORBIDDEN_PATTERNS = {
    'INV-001': {
        name: 'Domain Never Reads Storage Directly',
        // Forbidden in Domain layer
        patterns: [
            /getTabIsolated\s*\(\s*['"]chefiapp_restaurant_id['"]\s*\)/,
            /localStorage\.getItem\s*\(\s*['"]chefiapp_restaurant_id['"]\s*\)/,
        ],
        // Exceptions (files allowed to use storage)
        exceptions: [
            'TenantContext.tsx',
            'TenantResolver.ts',
            'FlowGate.tsx',
            'useRestaurantIdentity.ts',
            'TabIsolatedStorage.ts',
            'OrderContext.tsx', // Legacy - not used in new architecture (use OrderContextReal)
            'AppDomainWrapper.tsx', // Bridge layer - P0.2 guard needs to check active state
        ],
    },
    'INV-003': {
        name: 'Gate Before Domain',
        // Check that App.tsx has correct provider order
        patterns: [
            // Forbidden: OrderProvider wrapping TenantProvider
            /<OrderProvider[^>]*>[\s\S]*<TenantProvider/,
            // Forbidden: AppDomainProvider outside FlowGate
            /<AppDomainProvider[^>]*>[\s\S]*<FlowGate/,
        ],
        files: ['App.tsx'],
    },
    'INV-006': {
        name: 'UI Never Calculates Totals',
        // Forbidden in UI components (pages/)
        patterns: [
            /\.items\.reduce\s*\([^)]*price\s*\*\s*quantity/,
        ],
        // Allowed exceptions
        exceptions: [
            'OrderContextReal.tsx', // Domain can calculate
            'OrderContext.tsx',      // Legacy Domain
            'PaymentEngine.ts',      // Engine can calculate
        ],
    },
};

// ============================================================================
// HELPERS
// ============================================================================

const colors = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

function findFiles(dir, extensions = ['.ts', '.tsx']) {
    const results = [];
    
    function walk(currentDir) {
        if (!fs.existsSync(currentDir)) return;
        
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.includes('node_modules')) {
                walk(filePath);
            } else if (extensions.some(ext => file.endsWith(ext))) {
                results.push(filePath);
            }
        }
    }
    
    walk(dir);
    return results;
}

function checkPattern(filePath, pattern) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return pattern.test(content);
}

function getLineNumber(filePath, pattern) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            return i + 1;
        }
    }
    return null;
}

// ============================================================================
// CHECKS
// ============================================================================

const violations = [];

console.log(colors.bold('\n🏛️ ARCHITECTURE GUARDIAN\n'));
console.log('Checking architectural invariants...\n');

// ----- INV-001: Domain Never Reads Storage Directly -----
console.log(colors.cyan('INV-001: Domain Never Reads Storage Directly'));

for (const domainPath of DOMAIN_PATHS) {
    const fullPath = path.join(SRC_DIR, domainPath);
    
    if (!fs.existsSync(fullPath)) continue;
    
    const files = fs.statSync(fullPath).isDirectory() 
        ? findFiles(fullPath)
        : [fullPath];
    
    for (const file of files) {
        const fileName = path.basename(file);
        
        // Skip exceptions
        if (FORBIDDEN_PATTERNS['INV-001'].exceptions.includes(fileName)) {
            continue;
        }
        
        for (const pattern of FORBIDDEN_PATTERNS['INV-001'].patterns) {
            if (checkPattern(file, pattern)) {
                const lineNum = getLineNumber(file, pattern);
                violations.push({
                    invariant: 'INV-001',
                    file: path.relative(SRC_DIR, file),
                    line: lineNum,
                    message: 'Domain reads storage directly (forbidden)',
                    pattern: pattern.toString(),
                });
            }
        }
    }
}

if (violations.filter(v => v.invariant === 'INV-001').length === 0) {
    console.log(colors.green('  ✓ PASS\n'));
} else {
    console.log(colors.red('  ✗ FAIL\n'));
}

// ----- INV-003: Gate Before Domain -----
console.log(colors.cyan('INV-003: Gate Before Domain'));

const appTsxPath = path.join(SRC_DIR, 'App.tsx');
if (fs.existsSync(appTsxPath)) {
    for (const pattern of FORBIDDEN_PATTERNS['INV-003'].patterns) {
        if (checkPattern(appTsxPath, pattern)) {
            violations.push({
                invariant: 'INV-003',
                file: 'App.tsx',
                line: null,
                message: 'Provider hierarchy violation: Domain wrapping Gate',
                pattern: pattern.toString(),
            });
        }
    }
}

if (violations.filter(v => v.invariant === 'INV-003').length === 0) {
    console.log(colors.green('  ✓ PASS\n'));
} else {
    console.log(colors.red('  ✗ FAIL\n'));
}

// ----- INV-006: UI Never Calculates Totals -----
console.log(colors.cyan('INV-006: UI Never Calculates Totals'));

const uiPaths = ['pages/TPV', 'pages/Finance'];
for (const uiPath of uiPaths) {
    const fullPath = path.join(SRC_DIR, uiPath);
    if (!fs.existsSync(fullPath)) continue;
    
    const files = findFiles(fullPath);
    for (const file of files) {
        const fileName = path.basename(file);
        
        // Skip exceptions
        if (FORBIDDEN_PATTERNS['INV-006'].exceptions.includes(fileName)) {
            continue;
        }
        
        for (const pattern of FORBIDDEN_PATTERNS['INV-006'].patterns) {
            if (checkPattern(file, pattern)) {
                const lineNum = getLineNumber(file, pattern);
                violations.push({
                    invariant: 'INV-006',
                    file: path.relative(SRC_DIR, file),
                    line: lineNum,
                    message: 'UI calculates totals (should use order.total from Domain)',
                    pattern: pattern.toString(),
                });
            }
        }
    }
}

if (violations.filter(v => v.invariant === 'INV-006').length === 0) {
    console.log(colors.green('  ✓ PASS\n'));
} else {
    console.log(colors.red('  ✗ FAIL\n'));
}

// ----- Additional Check: AppDomainWrapper uses useTenant() -----
console.log(colors.cyan('CHECK: AppDomainWrapper uses useTenant()'));

const wrapperPath = path.join(SRC_DIR, 'app/AppDomainWrapper.tsx');
if (fs.existsSync(wrapperPath)) {
    const content = fs.readFileSync(wrapperPath, 'utf-8');
    
    if (!content.includes('useTenant()')) {
        violations.push({
            invariant: 'INV-001',
            file: 'app/AppDomainWrapper.tsx',
            line: null,
            message: 'AppDomainWrapper must use useTenant() to get tenantId',
        });
        console.log(colors.red('  ✗ FAIL\n'));
    } else if (content.includes("getTabIsolated('chefiapp_restaurant_id')")) {
        // P0.2 EXCEPTION: Allow storage access for operational state (activeOrderId, queue)
        // but NOT for tenant ID (that must come from useTenant)
        violations.push({
            invariant: 'INV-001',
            file: 'app/AppDomainWrapper.tsx',
            line: null,
            message: 'AppDomainWrapper must not read restaurant_id from storage (use useTenant)',
        });
        console.log(colors.red('  ✗ FAIL\n'));
    } else {
        // P0.2: Allow getTabIsolated for activeOrderId/queue checks (operational state)
        console.log(colors.green('  ✓ PASS\n'));
    }
}

// ============================================================================
// REPORT
// ============================================================================

console.log(colors.bold('━'.repeat(60) + '\n'));

if (violations.length === 0) {
    console.log(colors.green(colors.bold('✓ ALL INVARIANTS SATISFIED\n')));
    console.log('Architecture is in a valid state.\n');
    process.exit(0);
} else {
    console.log(colors.red(colors.bold(`✗ ${violations.length} VIOLATION(S) FOUND\n`)));
    
    for (const v of violations) {
        console.log(colors.red(`  [${v.invariant}] ${v.file}${v.line ? `:${v.line}` : ''}`));
        console.log(`    ${v.message}`);
        if (v.pattern) {
            console.log(colors.yellow(`    Pattern: ${v.pattern.slice(0, 50)}...`));
        }
        console.log('');
    }
    
    console.log(colors.red('Architecture is in an ILLEGAL state.\n'));
    console.log('Fix violations before committing.\n');
    process.exit(1);
}
