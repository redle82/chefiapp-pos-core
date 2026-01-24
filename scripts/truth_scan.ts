
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------
// 🔍 TRUTH SCANNER v1.0
// "The system cannot lie to itself."
// ---------------------------------------------------------

const ROOT_DIR = process.cwd();
const ROADMAP_PATH = path.join(ROOT_DIR, 'docs/architecture/ROADMAP_AS_CODE.yaml');

// Colors for console
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface FeatureCheck {
    id: string;
    status: string;
    verification_file?: string;
}

interface GuardCheck {
    id: string;
    file: string;
    pattern: string;
}

interface Surface {
    name: string;
    features: FeatureCheck[];
}

function parseRoadmap(content: string): { surfaces: Surface[], guards: GuardCheck[] } {
    const surfaces: Surface[] = [];
    const guards: GuardCheck[] = [];

    // Naive regex parsing for the specific structure of ROADMAP_AS_CODE.yaml
    // 1. Extract Surfaces
    const surfaceRegex = /surfaces:\n([\s\S]*?)genesis:/;
    const surfaceBlock = content.match(surfaceRegex)?.[1] || '';

    // Split by surface keys (indentation level 2)
    const surfaceBlocks = surfaceBlock.split(/\n  [a-z]+:/);

    // Recovery of names is tricky with split, let's iterate lines
    const lines = content.split('\n');
    let currentSurface: Surface | null = null;
    let inGuards = false;
    let currentGuard: Partial<GuardCheck> | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect Surface Start (e.g., "  tpv:")
        const surfaceMatch = line.match(/^  ([a-z_]+):$/);
        if (surfaceMatch && !inGuards && !line.includes('genesis') && !line.includes('runtime_guards') && !line.includes('meta')) {
            if (currentSurface) surfaces.push(currentSurface);
            currentSurface = { name: surfaceMatch[1], features: [] };
        }

        // Detect Feature ( - id: "orders")
        if (currentSurface && line.trim().startsWith('- id:')) {
            const id = line.match(/"?id"?: "?([^"]+)"?/)?.[1] || 'unknown';
            // Look ahead for details
            let status = 'UNKNOWN';
            let verification = undefined;

            // Scan next few lines for this feature
            for (let j = 1; j < 5; j++) {
                if (lines[i + j] && lines[i + j].trim().startsWith('- id')) break; // Next item
                if (lines[i + j] && lines[i + j].includes('status:')) {
                    status = lines[i + j].match(/status: "?([^"\n]+)"?/)?.[1] || 'UNKNOWN';
                }
                if (lines[i + j] && lines[i + j].includes('verification:')) {
                    verification = lines[i + j].match(/verification: "?([^"\n]+)"?/)?.[1];
                }
            }
            if (verification) {
                currentSurface.features.push({ id, status, verification_file: verification });
            }
        }

        // Detect Runtime Guards
        if (line.startsWith('runtime_guards:')) {
            if (currentSurface) surfaces.push(currentSurface); // Flush last surface
            currentSurface = null;
            inGuards = true;
        }

        if (inGuards && line.trim().startsWith('- id:')) {
            const id = line.match(/"?id"?: "?([^"]+)"?/)?.[1] || 'unknown';
            let file = '';
            let pattern = '';
            for (let j = 1; j < 5; j++) {
                if (lines[i + j] && lines[i + j].trim().startsWith('- id')) break;
                if (lines[i + j] && lines[i + j].includes('file:')) file = lines[i + j].match(/file: "?([^"\n]+)"?/)?.[1] || '';
                if (lines[i + j] && lines[i + j].includes('pattern:')) pattern = lines[i + j].match(/pattern: "?([^"\n]+)"?/)?.[1] || '';
            }
            if (file && pattern) {
                guards.push({ id, file, pattern });
            }
        }
    }

    return { surfaces, guards };
}

function findFile(filename: string): string | null {
    try {
        // Use 'find' to locate the file in merchant-portal/src OR fiscal-modules
        const cmd = `find merchant-portal/src fiscal-modules -name "${filename}" -print -quit`;
        const result = execSync(cmd, { encoding: 'utf8', cwd: ROOT_DIR }).trim();
        return result || null;
    } catch (e) {
        return null;
    }
}

function checkPatternInFile(filePath: string, pattern: string): boolean {
    try {
        // Adjust path to include merchant-portal if it starts with src
        let adjustedPath = filePath;
        if (filePath.startsWith('src/')) {
            adjustedPath = path.join('merchant-portal', filePath);
        }

        const fullPath = path.join(ROOT_DIR, adjustedPath);
        if (!fs.existsSync(fullPath)) return false;
        const content = fs.readFileSync(fullPath, 'utf8');
        return content.includes(pattern);
    } catch (e) {
        return false;
    }
}

async function run() {
    console.log(`${BOLD}🔬 INITIATING TRUTH SCAN...${RESET}`);

    if (!fs.existsSync(ROADMAP_PATH)) {
        console.error(`${RED}❌ FATAL: Roadmap as Code not found at ${ROADMAP_PATH}${RESET}`);
        process.exit(1);
    }

    const content = fs.readFileSync(ROADMAP_PATH, 'utf8');
    const { surfaces, guards } = parseRoadmap(content);

    let passed = 0;
    let total = 0;

    console.log(`\n${BOLD}--- COMPONENT VERIFICATION ---${RESET}`);

    for (const surface of surfaces) {
        // console.log(`\nChecking Surface: ${surface.name.toUpperCase()}`);
        for (const feature of surface.features) {
            total++;
            const foundPath = findFile(feature.verification_file!);

            if (foundPath) {
                console.log(`${GREEN}✅ [${surface.name.toUpperCase()}] ${feature.id.padEnd(15)} -> FOUND: ${foundPath}${RESET}`);
                passed++;
            } else {
                if (feature.status === 'LIVE') {
                    console.log(`${RED}❌ [${surface.name.toUpperCase()}] ${feature.id.padEnd(15)} -> MISSING: ${feature.verification_file} (Expected LIVE)${RESET}`);
                } else {
                    console.log(`${YELLOW}⚠️ [${surface.name.toUpperCase()}] ${feature.id.padEnd(15)} -> SKIPPED: ${feature.verification_file} (${feature.status})${RESET}`);
                    passed++; // Count as passed if strictly not live? Or just ignore. Let's count as pass for non-live items if missing.
                }
            }
        }
    }

    console.log(`\n${BOLD}--- RUNTIME GUARDS VERIFICATION ---${RESET}`);

    for (const guard of guards) {
        total++;
        const hasPattern = checkPatternInFile(guard.file, guard.pattern);
        if (hasPattern) {
            console.log(`${GREEN}✅ [GUARD] ${guard.id.padEnd(20)} -> ENFORCED: ${guard.pattern} in ${guard.file}${RESET}`);
            passed++;
        } else {
            console.log(`${RED}❌ [GUARD] ${guard.id.padEnd(20)} -> BROKEN: Pattern "${guard.pattern}" not found in ${guard.file}${RESET}`);
        }
    }

    const score = Math.round((passed / total) * 100);
    console.log(`\n${BOLD}========================================${RESET}`);
    console.log(`${BOLD}TRUTH SCORE: ${score}%${RESET}`);

    if (score === 100) {
        console.log(`${GREEN}System is completely ALIGNED with Truth.${RESET}`);
    } else {
        console.log(`${YELLOW}System has partial misalignment with Truth.${RESET}`);
    }
    console.log(`${BOLD}========================================${RESET}`);
}

run();
