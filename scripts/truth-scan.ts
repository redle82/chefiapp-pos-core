#!/usr/bin/env node

/**
 * 🔍 TRUTH SCAN — The System Judge
 * 
 * Validates that the ROADMAP_AS_CODE.yaml matches reality.
 * Checks existence of verification files.
 * 
 * Usage: npx tsx scripts/truth-scan.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import chalk from 'chalk';
import glob from 'glob';

const ROOT_DIR = path.resolve(__dirname, '..');
const ROADMAP_PATH = path.join(ROOT_DIR, 'docs/architecture/ROADMAP_AS_CODE.yaml');

// Schema from ROADMAP_AS_CODE.yaml
interface Feature {
    id: string;
    status: 'LIVE' | 'BETA' | 'ALPHA' | 'PLANNED' | 'PARTIAL';
    verification?: string; // filename or path
    notes?: string;
    target_sprint?: string;
}

interface Surface {
    description: string;
    expected_state: string;
    features: Feature[];
}

interface Roadmap {
    meta: {
        version: string;
        last_updated: string;
        enforcement_level: string;
    };
    surfaces: {
        [key: string]: Surface;
    };
}

// Stats tracking
const stats = {
    total: 0,
    verified: 0,
    warnings: 0,
    missing: 0,
    skipped: 0
};

function findFile(filename: string): string | null {
    // 1. Try direct path
    let attempt = path.resolve(ROOT_DIR, filename);
    if (fs.existsSync(attempt)) return attempt;

    // 2. Try merchant-portal/src
    attempt = path.resolve(ROOT_DIR, 'merchant-portal/src', filename);
    if (fs.existsSync(attempt)) return attempt;

    // 3. Try recursive search (slow but effective for verification)
    // We assume filename is unique enough or we just need *an* existence proof
    const basename = path.basename(filename);
    const matches = glob.sync(`**/${basename}`, { cwd: ROOT_DIR, ignore: ['**/node_modules/**', '**/dist/**'] });

    if (matches.length > 0) return path.resolve(ROOT_DIR, matches[0]);

    return null;
}

function scanFeature(surfaceParams: { id: string, name: string }, feature: Feature) {
    stats.total++;

    if (feature.status === 'PLANNED') {
        stats.skipped++;
        console.log(chalk.gray(`  ⏭️  ${feature.id} — PLANNED (${feature.target_sprint})`));
        return;
    }

    // Verification
    if (!feature.verification) {
        if (feature.status === 'LIVE' || feature.status === 'PARTIAL') {
            console.log(chalk.yellow(`  ⚠️  ${feature.id} — No verification file specified`));
            stats.warnings++;
        }
        return;
    }

    const foundPath = findFile(feature.verification);

    if (foundPath) {
        if (feature.status === 'PARTIAL') {
            console.log(chalk.yellow(`  ⚠️  ${feature.id} — PARTIAL (File exists)`));
            stats.verified++; // It exists, even if partial logic
        } else {
            console.log(chalk.green(`  ✅ ${feature.id} — VERIFIED`));
            stats.verified++;
        }
    } else {
        console.log(chalk.red(`  ❌ ${feature.id} — FAILED`));
        console.log(chalk.red.dim(`     └─ Evidence not found: ${feature.verification}`));
        stats.missing++;
    }
}

async function main() {
    console.log(chalk.bold.white('\n🔍 CHEFIAPP TRUTH SCAN (Roadmap As Code)\n'));

    if (!fs.existsSync(ROADMAP_PATH)) {
        console.error(chalk.red(`FATAL: Roadmap file not found at ${ROADMAP_PATH}`));
        process.exit(1);
    }

    try {
        const fileContents = fs.readFileSync(ROADMAP_PATH, 'utf8');
        const roadmap = yaml.parse(fileContents) as Roadmap;

        console.log(chalk.gray(`Version: ${roadmap.meta.version} | Updated: ${roadmap.meta.last_updated}`));

        for (const [surfaceId, surfaceData] of Object.entries(roadmap.surfaces)) {
            console.log(chalk.blue.bold(`\n${surfaceId.toUpperCase()} (${surfaceData.expected_state})`));

            if (surfaceData.features) {
                for (const feature of surfaceData.features) {
                    scanFeature({ id: surfaceId, name: surfaceId }, feature);
                }
            }
        }

        console.log(chalk.gray('\n' + '─'.repeat(40)));

        // Summary
        const validTotal = stats.total - stats.skipped;
        const successRate = validTotal > 0 ? Math.round((stats.verified / validTotal) * 100) : 100;

        console.log(chalk.bold(`\nTotal Features: ${stats.total}`));
        console.log(chalk.green(`Verified:       ${stats.verified}`));
        console.log(chalk.yellow(`Warnings:       ${stats.warnings}`));
        console.log(chalk.red(`Missing:        ${stats.missing}`));
        console.log(chalk.gray(`Skipped:        ${stats.skipped}`));

        console.log('\nIntegrity Score: ' +
            (successRate === 100 ? chalk.green.bold('100%') :
                successRate > 80 ? chalk.yellow.bold(`${successRate}%`) :
                    chalk.red.bold(`${successRate}%`))
        );

        if (stats.missing > 0) {
            process.exit(1);
        }

    } catch (e) {
        console.error(chalk.red('Error parsing roadmap YAML:'), e);
        process.exit(1);
    }
}

main();
