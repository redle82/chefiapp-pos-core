const fs = require("fs");
const path = require("path");

const ANSI_RED = "\x1b[31m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_RESET = "\x1b[0m";

const FORBIDDEN_TABLES = [
  "gm_orders",
  "gm_order_items",
  "fiscal_event_store",
  "inventory_", // Prefix check
];

const EXCLUDED_PATHS = [
  "core/supabase/index.ts", // The Shim
  "useSupabaseAuth", // Auth is allowed
  "__tests__",
  ".test.ts",
  ".spec.ts",
  "mocks",
  "node_modules",
  "dist",
  ".git",
];

// Helper to check if file should be excluded
function isExcluded(filePath) {
  return EXCLUDED_PATHS.some((excluded) => filePath.includes(excluded));
}

function checkContent(filePath, content) {
  // Check for Legacy Marker
  if (content.includes("// LEGACY") || content.includes("// LAB")) {
    return [];
  }

  let violations = [];

  // Robust Regex for multi-line Supabase calls
  // Matches: supabase followed by optional cast/whitespace, then .from or .rpc, then forbidden table
  const regex =
    /supabase(?:\s|as\s+any|\.)*(?:\.functions)?\.(from|rpc)\s*\(\s*['"](gm_orders|gm_order_items|fiscal_event_store|inventory_[^'"]*)['"]/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    // Calculate line number
    const codeUpToMatch = content.substring(0, match.index);
    const lineNumber = codeUpToMatch.split("\n").length;

    violations.push({
      line: lineNumber,
      table: match[2],
      code: match[0].replace(/\n/g, " "), // Flatten for display
    });
  }

  return violations;
}

function scanDirectory(dir) {
  let files = fs.readdirSync(dir);
  let allViolations = [];

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (isExcluded(fullPath)) return;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      allViolations = allViolations.concat(scanDirectory(fullPath));
    } else if (
      fullPath.endsWith(".ts") ||
      fullPath.endsWith(".tsx") ||
      fullPath.endsWith(".js")
    ) {
      const content = fs.readFileSync(fullPath, "utf8");
      const fileViolations = checkContent(fullPath, content);
      if (fileViolations.length > 0) {
        allViolations.push({
          file: fullPath,
          violations: fileViolations,
        });
      }
    }
  });

  return allViolations;
}

console.log(
  `${ANSI_GREEN}Starting Anti-Regression Check for Supabase Violations...${ANSI_RESET}`,
);
console.log(
  `Scanning for direct access to: ${FORBIDDEN_TABLES.join(
    ", ",
  )} via Supabase client.\n`,
);

try {
  const srcDir = path.join(__dirname, "../src");
  if (!fs.existsSync(srcDir)) {
    console.error(
      `${ANSI_RED}Error: src directory not found at ${srcDir}${ANSI_RESET}`,
    );
    process.exit(1);
  }

  const violations = scanDirectory(srcDir);

  if (violations.length > 0) {
    console.error(
      `${ANSI_RED}❌ CRITICAL ARCHITECTURE VIOLATION DETECTED${ANSI_RESET}`,
    );
    console.error(
      `${ANSI_RED}The following files are bypassing Docker Core and accessing financial tables directly via Supabase:${ANSI_RESET}\n`,
    );

    violations.forEach((v) => {
      console.error(`${ANSI_RED}File: ${v.file}${ANSI_RESET}`);
      v.violations.forEach((violation) => {
        console.error(
          `  Line ${violation.line}: Accessing forbidden table '${violation.table}'`,
        );
        console.error(`  Code: ${violation.code}`);
      });
      console.error("");
    });

    console.error(
      `${ANSI_RED}Action Required: Refactor to use Core Readers/Writers (Docker Mode).${ANSI_RESET}`,
    );
    process.exit(1);
  } else {
    console.log(
      `${ANSI_GREEN}✅ No violations found. System is Sovereign.${ANSI_RESET}`,
    );
    process.exit(0);
  }
} catch (e) {
  console.error(`Script error: ${e.message}`);
  process.exit(1);
}
