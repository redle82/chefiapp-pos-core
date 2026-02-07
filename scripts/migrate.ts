#!/usr/bin/env npx tsx
// =============================================================================
// CHEFIAPP MIGRATION RUNNER
// =============================================================================
// Sequential migration runner for PostgreSQL.
// Tracks applied migrations in `schema_migrations` table.
//
// Usage:
//   npx tsx scripts/migrate.ts                  # Apply pending migrations
//   npx tsx scripts/migrate.ts --status         # Show migration status
//   npx tsx scripts/migrate.ts --dry-run        # Show what would run
//   DATABASE_URL=... npx tsx scripts/migrate.ts # Custom DB
// =============================================================================

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "test_user"}:${
    process.env.POSTGRES_PASSWORD || "test_password"
  }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${
    process.env.POSTGRES_DB || "chefiapp_core_test"
  }`;

// ---------------------------------------------------------------------------
// Migration tracking table
// ---------------------------------------------------------------------------

const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id            SERIAL PRIMARY KEY,
    filename      TEXT NOT NULL UNIQUE,
    checksum      TEXT NOT NULL,
    applied_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_ms  INT
  );
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migration directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !f.startsWith("99999999")) // exclude seeds
    .sort(); // lexicographic = chronological with YYYYMMDD prefix
}

function simpleChecksum(content: string): string {
  // Simple hash for change detection (not cryptographic)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const statusOnly = args.includes("--status");
  const dryRun = args.includes("--dry-run");

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  CHEFIAPP MIGRATION RUNNER                      ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log(`Connected to: ${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
    console.log();

    // Ensure tracking table exists
    await client.query(ENSURE_TABLE);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      "SELECT filename, checksum, applied_at FROM schema_migrations ORDER BY filename",
    );
    const appliedMap = new Map(applied.map((r: any) => [r.filename, r]));

    // Get all migration files
    const files = getMigrationFiles();

    if (statusOnly) {
      console.log("Migration Status:");
      console.log("─".repeat(70));
      for (const file of files) {
        const record = appliedMap.get(file);
        const status = record
          ? `✓ Applied ${new Date(record.applied_at)
              .toISOString()
              .slice(0, 19)}`
          : "○ Pending";
        console.log(`  ${status}  ${file}`);
      }
      console.log("─".repeat(70));
      const pending = files.filter((f) => !appliedMap.has(f));
      console.log(
        `  Total: ${files.length} | Applied: ${applied.length} | Pending: ${pending.length}`,
      );
      return;
    }

    // Find pending migrations
    const pending = files.filter((f) => !appliedMap.has(f));

    if (pending.length === 0) {
      console.log("✓ All migrations are up to date.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    for (const f of pending) {
      console.log(`  → ${f}`);
    }
    console.log();

    if (dryRun) {
      console.log("(dry-run mode — no changes applied)");
      return;
    }

    // Apply each migration in a transaction
    let applied_count = 0;
    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf8");
      const checksum = simpleChecksum(sql);

      console.log(`▸ Applying: ${file}`);
      const start = Date.now();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum, execution_ms) VALUES ($1, $2, $3)",
          [file, checksum, Date.now() - start],
        );
        await client.query("COMMIT");

        const ms = Date.now() - start;
        console.log(`  ✓ Applied in ${ms}ms`);
        applied_count++;
      } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(`  ✗ FAILED: ${err.message}`);
        console.error(`  Migration stopped at: ${file}`);
        console.error(
          `  ${applied_count} migration(s) were applied before this failure.`,
        );
        process.exit(1);
      }
    }

    console.log();
    console.log(`✓ Successfully applied ${applied_count} migration(s).`);
  } catch (err: any) {
    console.error(`Connection error: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
