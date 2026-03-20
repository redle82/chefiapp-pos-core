#!/usr/bin/env npx tsx
/**
 * i18n-check.ts -- Validates i18n completeness across all locales.
 *
 * Checks:
 *   1. All JSON locale files have the same key set across en, pt-PT, pt-BR, es
 *   2. Reports missing keys per locale (compared to the union of all keys)
 *   3. Scans source files for t('key') / t("key") patterns
 *   4. Reports keys used in code but missing from ALL locales
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/i18n-check.ts
 *
 * Exit code: 0 = all pass, 1 = missing critical keys
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MERCHANT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(MERCHANT, "src/locales");
const SRC_DIR = path.join(MERCHANT, "src");

const LOCALE_DIRS = ["en", "pt-PT", "pt-BR", "es"] as const;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getAllFiles(dir: string, ext: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .git, locales (we scan source only)
      if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
      results.push(...getAllFiles(full, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Flatten a nested JSON object into dot-separated key paths.
 * e.g. { a: { b: "c" } } -> ["a.b"]
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// 1. Load all locale files and flatten keys per namespace per locale
// ---------------------------------------------------------------------------

interface LocaleData {
  locale: string;
  namespace: string;
  keys: Set<string>;
}

function loadLocaleData(): LocaleData[] {
  const data: LocaleData[] = [];

  for (const locale of LOCALE_DIRS) {
    const localeDir = path.join(LOCALES_DIR, locale);
    if (!fs.existsSync(localeDir)) {
      console.warn(`Warning: Locale directory missing: ${locale}`);
      continue;
    }

    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith(".json")) continue;
      const namespace = file.replace(".json", "");
      const content = JSON.parse(fs.readFileSync(path.join(localeDir, file), "utf-8"));
      const keys = new Set(flattenKeys(content));
      data.push({ locale, namespace, keys });
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// 2. Compare keys across locales
// ---------------------------------------------------------------------------

interface MissingReport {
  locale: string;
  namespace: string;
  missingKeys: string[];
}

function compareKeys(data: LocaleData[]): MissingReport[] {
  // Group by namespace
  const byNamespace = new Map<string, Map<string, Set<string>>>();
  for (const entry of data) {
    if (!byNamespace.has(entry.namespace)) {
      byNamespace.set(entry.namespace, new Map());
    }
    byNamespace.get(entry.namespace)!.set(entry.locale, entry.keys);
  }

  const reports: MissingReport[] = [];

  for (const [namespace, localeMap] of byNamespace) {
    // Compute union of all keys for this namespace
    const union = new Set<string>();
    for (const keys of localeMap.values()) {
      for (const k of keys) union.add(k);
    }

    // Check each locale against the union
    for (const locale of LOCALE_DIRS) {
      const keys = localeMap.get(locale);
      if (!keys) {
        // Entire namespace missing for this locale
        reports.push({
          locale,
          namespace,
          missingKeys: [...union].sort(),
        });
        continue;
      }

      const missing = [...union].filter((k) => !keys.has(k)).sort();
      if (missing.length > 0) {
        reports.push({ locale, namespace, missingKeys: missing });
      }
    }
  }

  return reports;
}

// ---------------------------------------------------------------------------
// 3. Scan source for t('key') patterns
// ---------------------------------------------------------------------------

function extractUsedKeys(): Set<string> {
  const sourceFiles = getAllFiles(SRC_DIR, [".tsx", ".ts"])
    .filter((f) => !f.includes("locales/") && !f.includes(".test.") && !f.includes(".spec."));

  const keys = new Set<string>();

  // Patterns: t('key'), t("key"), t('ns:key'), t("ns:key")
  // Also: t('key', 'fallback'), t('key', { ...})
  const tCallRe = /\bt\(\s*['"]([^'"]+)['"]/g;

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = tCallRe.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function checkUsedKeysExist(
  usedKeys: Set<string>,
  data: LocaleData[],
): string[] {
  // Build lookup structures
  // namespace:key format (e.g. "common:error.boundary.title")
  const nsQualified = new Set<string>();
  // flat keys (e.g. "error.boundary.title")
  const allFlat = new Set<string>();
  // namespace-prefixed flat keys (e.g. "dashboard.itemsSold" where
  // namespace="dashboard" and key="itemsSold" should match "dashboard.itemsSold")
  const nsPrefixedFlat = new Set<string>();

  for (const entry of data) {
    for (const key of entry.keys) {
      nsQualified.add(`${entry.namespace}:${key}`);
      allFlat.add(key);
      // Also register namespace.key so that t('dashboard.itemsSold') matches
      // namespace=dashboard key=itemsSold
      nsPrefixedFlat.add(`${entry.namespace}.${key}`);
    }
  }

  const missingFromAll: string[] = [];

  for (const usedKey of usedKeys) {
    // Skip dynamic keys (containing template literals, variables, etc.)
    if (usedKey.includes("${") || usedKey.includes("{{") || usedKey.endsWith(".")) continue;

    // 1. Direct namespace:key match (e.g. "common:loading")
    if (nsQualified.has(usedKey)) continue;

    // 2. Flat key match (e.g. "loading" exists in common namespace)
    if (allFlat.has(usedKey)) continue;

    // 3. Namespace-prefixed flat match (e.g. "dashboard.itemsSold"
    //    matches namespace=dashboard, key=itemsSold)
    if (nsPrefixedFlat.has(usedKey)) continue;

    // 4. For keys like "common:fiscal.pendingBadge", strip namespace prefix
    if (usedKey.includes(":")) {
      const afterColon = usedKey.split(":")[1];
      if (allFlat.has(afterColon)) continue;
    }

    // 5. Check if the key is a prefix of any known key (pluralization: _one, _other)
    const isPrefix = [...allFlat].some((k) =>
      k.startsWith(usedKey + "_") || k.startsWith(usedKey + ".")
    ) || [...nsPrefixedFlat].some((k) =>
      k.startsWith(usedKey + "_") || k.startsWith(usedKey + ".")
    );
    if (isPrefix) continue;

    missingFromAll.push(usedKey);
  }

  return missingFromAll.sort();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("i18n Completeness Check");
  console.log("=".repeat(60));

  // Load locale data
  const data = loadLocaleData();
  const namespaces = new Set(data.map((d) => d.namespace));
  console.log(`\nLocales: ${LOCALE_DIRS.join(", ")}`);
  console.log(`Namespaces: ${[...namespaces].sort().join(", ")}`);
  console.log(`Total locale files loaded: ${data.length}`);

  // Compare keys across locales
  console.log("\n--- Key Comparison ---\n");
  const reports = compareKeys(data);

  let totalMissing = 0;
  if (reports.length > 0) {
    for (const report of reports) {
      console.log(`  [${report.locale}] ${report.namespace}: ${report.missingKeys.length} missing`);
      for (const key of report.missingKeys.slice(0, 10)) {
        console.log(`    - ${key}`);
      }
      if (report.missingKeys.length > 10) {
        console.log(`    ... and ${report.missingKeys.length - 10} more`);
      }
      totalMissing += report.missingKeys.length;
    }
  } else {
    console.log("  All locales have matching key sets.");
  }

  // Scan source for used keys
  console.log("\n--- Source Code Key Usage ---\n");
  const usedKeys = extractUsedKeys();
  console.log(`  Keys found in source: ${usedKeys.size}`);

  const missingFromAll = checkUsedKeysExist(usedKeys, data);
  if (missingFromAll.length > 0) {
    console.log(`\n  Keys used in code but missing from ALL locales (${missingFromAll.length}):`);
    for (const key of missingFromAll.slice(0, 20)) {
      console.log(`    - ${key}`);
    }
    if (missingFromAll.length > 20) {
      console.log(`    ... and ${missingFromAll.length - 20} more`);
    }
  } else {
    console.log("  All keys used in code exist in at least one locale.");
  }

  // Summary
  console.log("\n--- Summary ---\n");
  console.log(`  Locales checked:           ${LOCALE_DIRS.length}`);
  console.log(`  Namespaces:                ${namespaces.size}`);
  console.log(`  Total missing keys:        ${totalMissing}`);
  console.log(`  Keys missing from all:     ${missingFromAll.length}`);
  console.log("");

  if (missingFromAll.length > 0) {
    console.log("FAIL: Found keys used in code that are missing from ALL locales.");
    process.exit(1);
  }

  if (totalMissing > 0) {
    console.log("WARN: Some locales have missing keys (cross-locale gaps).");
    console.log("      These will fall back via i18next fallbackLng chain.");
  }

  console.log("PASS: No critical i18n issues found.");
  process.exit(0);
}

main();
