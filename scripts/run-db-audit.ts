#!/usr/bin/env tsx
// ==============================================================================
// CHEFIAPP DATABASE INTEGRITY AUDIT - TypeScript Runner
// ==============================================================================
// Purpose: Execute comprehensive database integrity audit and generate JSON report
// Date: 2025-12-25
// ==============================================================================

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

interface AuditIssue {
  type: 'orphan' | 'missing_fk' | 'duplicate' | 'invalid_hash' | 'null_violation' | 'data_inconsistency';
  description: string;
  severity: 'P0' | 'P1' | 'P2';
  affected_records: number;
}

interface TableAuditReport {
  table: string;
  total_records: number;
  issues: AuditIssue[];
  integrity_score: number;
}

async function runAudit(): Promise<TableAuditReport[]> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const reports: TableAuditReport[] = [];

  try {
    // ========================================================================
    // 1. EVENT STORE AUDIT
    // ========================================================================
    console.error('🔍 Auditing event_store...');

    const eventStoreReport: TableAuditReport = {
      table: 'event_store',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    // Count total records
    const countResult = await pool.query('SELECT COUNT(*) as count FROM event_store');
    eventStoreReport.total_records = parseInt(countResult.rows[0].count);

    // Check for NULL violations
    const nullCheckResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN event_id IS NULL THEN 1 ELSE 0 END), 0) as null_event_id,
        COALESCE(SUM(CASE WHEN stream_id IS NULL THEN 1 ELSE 0 END), 0) as null_stream_id,
        COALESCE(SUM(CASE WHEN stream_version IS NULL THEN 1 ELSE 0 END), 0) as null_stream_version,
        COALESCE(SUM(CASE WHEN type IS NULL THEN 1 ELSE 0 END), 0) as null_type,
        COALESCE(SUM(CASE WHEN payload IS NULL THEN 1 ELSE 0 END), 0) as null_payload,
        COALESCE(SUM(CASE WHEN hash IS NULL THEN 1 ELSE 0 END), 0) as null_hash
      FROM event_store
    `);

    const nullChecks = nullCheckResult.rows[0];
    Object.entries(nullChecks).forEach(([field, count]) => {
      if (parseInt(count as string) > 0) {
        eventStoreReport.issues.push({
          type: 'null_violation',
          description: `Found ${count} NULL values in ${field.replace('null_', '')}`,
          severity: 'P0',
          affected_records: parseInt(count as string),
        });
      }
    });

    // Check hash chain integrity
    const hashChainResult = await pool.query(`
      WITH event_chain AS (
        SELECT
          event_id,
          stream_id,
          stream_version,
          hash_prev,
          hash,
          LAG(hash) OVER (PARTITION BY stream_id ORDER BY stream_version) as expected_prev_hash
        FROM event_store
      ),
      broken_chains AS (
        SELECT stream_id, stream_version, hash_prev, expected_prev_hash
        FROM event_chain
        WHERE stream_version > 1
          AND (
            (hash_prev IS NULL AND expected_prev_hash IS NOT NULL) OR
            (hash_prev IS NOT NULL AND hash_prev != expected_prev_hash)
          )
      )
      SELECT COUNT(*) as broken_count FROM broken_chains
    `);

    const brokenChainCount = parseInt(hashChainResult.rows[0].broken_count);
    if (brokenChainCount > 0) {
      eventStoreReport.issues.push({
        type: 'invalid_hash',
        description: `Hash chain broken in ${brokenChainCount} events`,
        severity: 'P0',
        affected_records: brokenChainCount,
      });
    }

    // Check for version gaps
    const versionGapsResult = await pool.query(`
      WITH version_gaps AS (
        SELECT
          stream_id,
          stream_version,
          stream_version - LAG(stream_version) OVER (PARTITION BY stream_id ORDER BY stream_version) as gap
        FROM event_store
      )
      SELECT COUNT(*) as gap_count FROM version_gaps WHERE gap > 1
    `);

    const gapCount = parseInt(versionGapsResult.rows[0].gap_count);
    if (gapCount > 0) {
      eventStoreReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${gapCount} stream version gaps`,
        severity: 'P1',
        affected_records: gapCount,
      });
    }

    // Calculate integrity score
    eventStoreReport.integrity_score = calculateIntegrityScore(
      eventStoreReport.total_records,
      eventStoreReport.issues
    );

    reports.push(eventStoreReport);

    // ========================================================================
    // 2. LEGAL SEALS AUDIT
    // ========================================================================
    console.error('🔍 Auditing legal_seals...');

    const legalSealsReport: TableAuditReport = {
      table: 'legal_seals',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const legalSealsCount = await pool.query('SELECT COUNT(*) as count FROM legal_seals');
    legalSealsReport.total_records = parseInt(legalSealsCount.rows[0].count);

    // Check FK integrity to event_store
    const fkCheckResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM legal_seals ls
      LEFT JOIN event_store es ON ls.seal_event_id = es.event_id
      WHERE es.event_id IS NULL
    `);

    const orphanCount = parseInt(fkCheckResult.rows[0].orphan_count);
    if (orphanCount > 0) {
      legalSealsReport.issues.push({
        type: 'missing_fk',
        description: `Found ${orphanCount} legal seals with invalid seal_event_id`,
        severity: 'P0',
        affected_records: orphanCount,
      });
    }

    // Check sequence monotonicity
    const sequenceCheckResult = await pool.query(`
      WITH sequence_check AS (
        SELECT
          sequence,
          LAG(sequence) OVER (ORDER BY sequence) as prev_sequence
        FROM legal_seals
      )
      SELECT COUNT(*) as non_monotonic_count
      FROM sequence_check
      WHERE sequence <= prev_sequence
    `);

    const nonMonotonicCount = parseInt(sequenceCheckResult.rows[0].non_monotonic_count);
    if (nonMonotonicCount > 0) {
      legalSealsReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${nonMonotonicCount} non-monotonic sequence violations`,
        severity: 'P0',
        affected_records: nonMonotonicCount,
      });
    }

    legalSealsReport.integrity_score = calculateIntegrityScore(
      legalSealsReport.total_records,
      legalSealsReport.issues
    );

    reports.push(legalSealsReport);

    // ========================================================================
    // 3. RESTAURANT WEB PROFILES AUDIT
    // ========================================================================
    console.error('🔍 Auditing restaurant_web_profiles...');

    const restaurantProfilesReport: TableAuditReport = {
      table: 'restaurant_web_profiles',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const restaurantCount = await pool.query('SELECT COUNT(*) as count FROM restaurant_web_profiles');
    restaurantProfilesReport.total_records = parseInt(restaurantCount.rows[0].count);

    // Check for duplicate slugs
    const duplicateSlugsResult = await pool.query(`
      SELECT COUNT(*) as duplicate_count
      FROM (
        SELECT slug, COUNT(*) as cnt
        FROM restaurant_web_profiles
        GROUP BY slug
        HAVING COUNT(*) > 1
      ) duplicates
    `);

    const duplicateSlugs = parseInt(duplicateSlugsResult.rows[0].duplicate_count);
    if (duplicateSlugs > 0) {
      restaurantProfilesReport.issues.push({
        type: 'duplicate',
        description: `Found ${duplicateSlugs} duplicate slugs`,
        severity: 'P0',
        affected_records: duplicateSlugs,
      });
    }

    restaurantProfilesReport.integrity_score = calculateIntegrityScore(
      restaurantProfilesReport.total_records,
      restaurantProfilesReport.issues
    );

    reports.push(restaurantProfilesReport);

    // ========================================================================
    // 4. MENU CATEGORIES AUDIT
    // ========================================================================
    console.error('🔍 Auditing menu_categories...');

    const menuCategoriesReport: TableAuditReport = {
      table: 'menu_categories',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const categoriesCount = await pool.query('SELECT COUNT(*) as count FROM menu_categories');
    menuCategoriesReport.total_records = parseInt(categoriesCount.rows[0].count);

    // Check for orphan categories
    const orphanCategoriesResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM menu_categories mc
      LEFT JOIN restaurant_web_profiles rwp ON mc.restaurant_id = rwp.restaurant_id
      WHERE rwp.restaurant_id IS NULL
    `);

    const orphanCategories = parseInt(orphanCategoriesResult.rows[0].orphan_count);
    if (orphanCategories > 0) {
      menuCategoriesReport.issues.push({
        type: 'orphan',
        description: `Found ${orphanCategories} categories with invalid restaurant_id`,
        severity: 'P1',
        affected_records: orphanCategories,
      });
    }

    menuCategoriesReport.integrity_score = calculateIntegrityScore(
      menuCategoriesReport.total_records,
      menuCategoriesReport.issues
    );

    reports.push(menuCategoriesReport);

    // ========================================================================
    // 5. MENU ITEMS AUDIT
    // ========================================================================
    console.error('🔍 Auditing menu_items...');

    const menuItemsReport: TableAuditReport = {
      table: 'menu_items',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const itemsCount = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    menuItemsReport.total_records = parseInt(itemsCount.rows[0].count);

    // Check for orphan items
    const orphanItemsResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mc.id IS NULL
    `);

    const orphanItems = parseInt(orphanItemsResult.rows[0].orphan_count);
    if (orphanItems > 0) {
      menuItemsReport.issues.push({
        type: 'orphan',
        description: `Found ${orphanItems} menu items with invalid category_id`,
        severity: 'P1',
        affected_records: orphanItems,
      });
    }

    // Check restaurant_id consistency
    const restaurantMismatchResult = await pool.query(`
      SELECT COUNT(*) as mismatch_count
      FROM menu_items mi
      INNER JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.restaurant_id != mc.restaurant_id
    `);

    const mismatchCount = parseInt(restaurantMismatchResult.rows[0].mismatch_count);
    if (mismatchCount > 0) {
      menuItemsReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${mismatchCount} menu items with mismatched restaurant_id`,
        severity: 'P1',
        affected_records: mismatchCount,
      });
    }

    menuItemsReport.integrity_score = calculateIntegrityScore(
      menuItemsReport.total_records,
      menuItemsReport.issues
    );

    reports.push(menuItemsReport);

    // ========================================================================
    // 6. MERCHANT GATEWAY CREDENTIALS AUDIT
    // ========================================================================
    console.error('🔍 Auditing merchant_gateway_credentials...');

    const gatewayCredsReport: TableAuditReport = {
      table: 'merchant_gateway_credentials',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const credsCount = await pool.query('SELECT COUNT(*) as count FROM merchant_gateway_credentials');
    gatewayCredsReport.total_records = parseInt(credsCount.rows[0].count);

    // Check for empty secret_key_enc
    const emptySecretsResult = await pool.query(`
      SELECT COUNT(*) as empty_count
      FROM merchant_gateway_credentials
      WHERE secret_key_enc IS NULL OR length(secret_key_enc) = 0
    `);

    const emptySecrets = parseInt(emptySecretsResult.rows[0].empty_count);
    if (emptySecrets > 0) {
      gatewayCredsReport.issues.push({
        type: 'null_violation',
        description: `Found ${emptySecrets} credentials with empty secret_key_enc`,
        severity: 'P0',
        affected_records: emptySecrets,
      });
    }

    // Check for orphan credentials
    const orphanCredsResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM merchant_gateway_credentials mgc
      LEFT JOIN restaurant_web_profiles rwp ON mgc.restaurant_id = rwp.restaurant_id
      WHERE rwp.restaurant_id IS NULL
    `);

    const orphanCreds = parseInt(orphanCredsResult.rows[0].orphan_count);
    if (orphanCreds > 0) {
      gatewayCredsReport.issues.push({
        type: 'orphan',
        description: `Found ${orphanCreds} credentials with invalid restaurant_id`,
        severity: 'P1',
        affected_records: orphanCreds,
      });
    }

    gatewayCredsReport.integrity_score = calculateIntegrityScore(
      gatewayCredsReport.total_records,
      gatewayCredsReport.issues
    );

    reports.push(gatewayCredsReport);

    // ========================================================================
    // 7. STAFF TASKS AUDIT
    // ========================================================================
    console.error('🔍 Auditing staff_tasks...');

    const staffTasksReport: TableAuditReport = {
      table: 'staff_tasks',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const tasksCount = await pool.query('SELECT COUNT(*) as count FROM staff_tasks');
    staffTasksReport.total_records = parseInt(tasksCount.rows[0].count);

    // Check status consistency
    const statusInconsistencyResult = await pool.query(`
      SELECT COUNT(*) as inconsistent_count
      FROM staff_tasks
      WHERE status = 'overdue' AND (due_at IS NULL OR due_at > NOW())
    `);

    const statusInconsistent = parseInt(statusInconsistencyResult.rows[0].inconsistent_count);
    if (statusInconsistent > 0) {
      staffTasksReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${statusInconsistent} tasks marked overdue but not past due_at`,
        severity: 'P2',
        affected_records: statusInconsistent,
      });
    }

    // Check validation missing
    const validationMissingResult = await pool.query(`
      SELECT COUNT(*) as missing_count
      FROM staff_tasks
      WHERE status = 'completed'
        AND requires_validation = true
        AND validated_by IS NULL
    `);

    const validationMissing = parseInt(validationMissingResult.rows[0].missing_count);
    if (validationMissing > 0) {
      staffTasksReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${validationMissing} completed tasks requiring validation but missing validator`,
        severity: 'P2',
        affected_records: validationMissing,
      });
    }

    staffTasksReport.integrity_score = calculateIntegrityScore(
      staffTasksReport.total_records,
      staffTasksReport.issues
    );

    reports.push(staffTasksReport);

    // ========================================================================
    // 8. WEB ORDERS AUDIT
    // ========================================================================
    console.error('🔍 Auditing web_orders...');

    const webOrdersReport: TableAuditReport = {
      table: 'web_orders',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const ordersCount = await pool.query('SELECT COUNT(*) as count FROM web_orders');
    webOrdersReport.total_records = parseInt(ordersCount.rows[0].count);

    // Check payment status consistency
    const paymentStatusResult = await pool.query(`
      SELECT COUNT(*) as inconsistent_count
      FROM web_orders
      WHERE status IN ('COMPLETED', 'READY', 'IN_PREP')
        AND payment_status != 'PAID'
    `);

    const paymentInconsistent = parseInt(paymentStatusResult.rows[0].inconsistent_count);
    if (paymentInconsistent > 0) {
      webOrdersReport.issues.push({
        type: 'data_inconsistency',
        description: `Found ${paymentInconsistent} advanced orders without PAID status`,
        severity: 'P1',
        affected_records: paymentInconsistent,
      });
    }

    webOrdersReport.integrity_score = calculateIntegrityScore(
      webOrdersReport.total_records,
      webOrdersReport.issues
    );

    reports.push(webOrdersReport);

    // ========================================================================
    // 9. WEB ORDER ITEMS AUDIT
    // ========================================================================
    console.error('🔍 Auditing web_order_items...');

    const orderItemsReport: TableAuditReport = {
      table: 'web_order_items',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const orderItemsCount = await pool.query('SELECT COUNT(*) as count FROM web_order_items');
    orderItemsReport.total_records = parseInt(orderItemsCount.rows[0].count);

    // Check for orphan order items
    const orphanOrderItemsResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM web_order_items woi
      LEFT JOIN web_orders wo ON woi.order_id = wo.id
      WHERE wo.id IS NULL
    `);

    const orphanOrderItems = parseInt(orphanOrderItemsResult.rows[0].orphan_count);
    if (orphanOrderItems > 0) {
      orderItemsReport.issues.push({
        type: 'orphan',
        description: `Found ${orphanOrderItems} order items with invalid order_id`,
        severity: 'P1',
        affected_records: orphanOrderItems,
      });
    }

    orderItemsReport.integrity_score = calculateIntegrityScore(
      orderItemsReport.total_records,
      orderItemsReport.issues
    );

    reports.push(orderItemsReport);

    // ========================================================================
    // 10. PAYMENT INTENT REFS AUDIT
    // ========================================================================
    console.error('🔍 Auditing payment_intent_refs...');

    const paymentIntentsReport: TableAuditReport = {
      table: 'payment_intent_refs',
      total_records: 0,
      issues: [],
      integrity_score: 100,
    };

    const paymentIntentsCount = await pool.query('SELECT COUNT(*) as count FROM payment_intent_refs');
    paymentIntentsReport.total_records = parseInt(paymentIntentsCount.rows[0].count);

    // Check for orphan payment intents
    const orphanIntentsResult = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM payment_intent_refs pir
      LEFT JOIN web_orders wo ON pir.order_id = wo.id
      WHERE wo.id IS NULL
    `);

    const orphanIntents = parseInt(orphanIntentsResult.rows[0].orphan_count);
    if (orphanIntents > 0) {
      paymentIntentsReport.issues.push({
        type: 'orphan',
        description: `Found ${orphanIntents} payment intents with invalid order_id`,
        severity: 'P1',
        affected_records: orphanIntents,
      });
    }

    paymentIntentsReport.integrity_score = calculateIntegrityScore(
      paymentIntentsReport.total_records,
      paymentIntentsReport.issues
    );

    reports.push(paymentIntentsReport);

  } finally {
    await pool.end();
  }

  return reports;
}

function calculateIntegrityScore(totalRecords: number, issues: AuditIssue[]): number {
  if (totalRecords === 0) return 100;

  let deductions = 0;
  for (const issue of issues) {
    const affectedRatio = issue.affected_records / totalRecords;
    const severityMultiplier = issue.severity === 'P0' ? 3 : issue.severity === 'P1' ? 2 : 1;
    deductions += affectedRatio * severityMultiplier * 100;
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

// Main execution
(async () => {
  try {
    console.error('🚀 Starting ChefIApp Database Integrity Audit...\n');

    const reports = await runAudit();

    console.error('\n✅ Audit completed!\n');
    console.error('📊 Summary:');

    let totalIssues = 0;
    let p0Issues = 0;
    let p1Issues = 0;
    let p2Issues = 0;

    reports.forEach(report => {
      const issueCount = report.issues.length;
      totalIssues += issueCount;

      report.issues.forEach(issue => {
        if (issue.severity === 'P0') p0Issues++;
        else if (issue.severity === 'P1') p1Issues++;
        else p2Issues++;
      });

      const status = report.integrity_score === 100 ? '✅' : report.integrity_score >= 90 ? '⚠️' : '❌';
      console.error(`  ${status} ${report.table}: ${report.total_records} records, score: ${report.integrity_score.toFixed(1)}, issues: ${issueCount}`);
    });

    console.error(`\n📈 Total Issues: ${totalIssues} (P0: ${p0Issues}, P1: ${p1Issues}, P2: ${p2Issues})`);

    // Output JSON to stdout for consumption
    console.log(JSON.stringify(reports, null, 2));

    process.exit(totalIssues === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
})();
