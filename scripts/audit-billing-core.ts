#!/usr/bin/env npx ts-node
/**
 * AUDIT: BILLING CORE CONSISTENCY
 *
 * Verifica a coerência entre:
 * - public.gm_restaurants.billing_status
 * - public.merchant_subscriptions.status
 *
 * Usa o mesmo mapa Stripe→Core que sync_stripe_subscription_from_event:
 *   trialing  -> trial
 *   active    -> active
 *   past_due  -> past_due
 *   canceled  -> canceled
 *   unpaid    -> canceled
 *   incomplete / incomplete_expired -> past_due
 *   paused    -> canceled (tratado como não-operacional)
 *
 * Saída:
 * - Lista de linhas com DRIFT ou valores inválidos
 * - Resumo agregado
 *
 * Exit code:
 * - 0 se não houver DRIFT nem valores inválidos
 * - 1 se existir qualquer DRIFT ou BAD_VALUE
 */

import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "test_user"}:${
    process.env.POSTGRES_PASSWORD || "test_password"
  }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${
    process.env.POSTGRES_DB || "chefiapp_core_test"
  }`;

type BillingStatus = "trial" | "active" | "past_due" | "canceled" | null;

type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | string
  | null;

interface Row {
  id: string;
  name: string | null;
  billing_status: BillingStatus;
  subscription_status: SubscriptionStatus;
}

type Classification =
  | "OK"
  | "DRIFT"
  | "BAD_VALUE"
  | "NO_SUBSCRIPTION";

interface AuditResult extends Row {
  expected_billing_status: BillingStatus;
  classification: Classification;
  reason: string;
}

const ALLOWED_BILLING: BillingStatus[] = [
  "trial",
  "active",
  "past_due",
  "canceled",
  null,
];

function mapSubscriptionToBilling(subStatus: SubscriptionStatus): BillingStatus {
  if (!subStatus) return null;
  const v = subStatus as string;
  switch (v) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "paused":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "past_due";
    default:
      return null;
  }
}

function classifyRow(row: Row): AuditResult {
  const expected = mapSubscriptionToBilling(row.subscription_status);

  if (!ALLOWED_BILLING.includes(row.billing_status)) {
    return {
      ...row,
      expected_billing_status: expected,
      classification: "BAD_VALUE",
      reason: `billing_status inválido: ${String(row.billing_status)}`,
    };
  }

  if (row.subscription_status == null) {
    return {
      ...row,
      expected_billing_status: expected,
      classification: "NO_SUBSCRIPTION",
      reason: "Sem merchant_subscriptions para este restaurante",
    };
  }

  if (expected === null) {
    return {
      ...row,
      expected_billing_status: expected,
      classification: "BAD_VALUE",
      reason: `merchant_subscriptions.status inesperado: ${String(
        row.subscription_status,
      )}`,
    };
  }

  if (row.billing_status !== expected) {
    return {
      ...row,
      expected_billing_status: expected,
      classification: "DRIFT",
      reason: `billing_status=${String(
        row.billing_status,
      )} mas esperado=${expected} para subscription_status=${String(
        row.subscription_status,
      )}`,
    };
  }

  return {
    ...row,
    expected_billing_status: expected,
    classification: "OK",
    reason: "Coerente",
  };
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  AUDIT: BILLING CORE CONSISTENCY                ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  try {
    await client.connect();
    console.log(
      `Connected to: ${DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`,
    );
    console.log();

    // Check merchant_subscriptions exists (full Core with billing migrations)
    const tableCheck = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions'
      ) AS has_subs,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status'
      ) AS has_billing`,
    );
    const hasSubs = (tableCheck.rows[0] as any)?.has_subs === true;
    const hasBilling = (tableCheck.rows[0] as any)?.has_billing === true;

    if (!hasBilling) {
      console.error(
        "audit-billing-core: gm_restaurants.billing_status não existe. Aplique as migrações de billing ao Core.",
      );
      process.exitCode = 1;
      return;
    }

    if (!hasSubs) {
      console.warn(
        "audit-billing-core: Tabela merchant_subscriptions não encontrada. Auditoria completa requer Core com migrações de billing (ex.: docker-core).",
      );
      console.warn(
        "Para auditoria completa, use DATABASE_URL apontando para uma instância com merchant_subscriptions.",
      );
      console.log("Audit skipped (missing table). Exit 0 — use full Core for full audit.");
      process.exitCode = 0;
      return;
    }

    const sql = `
      SELECT
        r.id,
        r.name,
        r.billing_status,
        ms.status AS subscription_status
      FROM public.gm_restaurants r
      LEFT JOIN public.merchant_subscriptions ms
        ON ms.restaurant_id = r.id
      ORDER BY r.id;
    `;

    const { rows } = await client.query(sql);
    const typedRows: Row[] = rows.map((r: any) => ({
      id: r.id,
      name: r.name ?? null,
      billing_status: (r.billing_status ?? null) as BillingStatus,
      subscription_status: (r.subscription_status ?? null) as SubscriptionStatus,
    }));

    const results: AuditResult[] = typedRows.map(classifyRow);

    const counts = results.reduce(
      (acc, r) => {
        acc[r.classification] = (acc[r.classification] || 0) + 1;
        return acc;
      },
      {} as Record<Classification, number>,
    );

    const drift = results.filter(
      (r) => r.classification === "DRIFT" || r.classification === "BAD_VALUE",
    );

    if (drift.length > 0) {
      console.log("⚠️  Registos com DRIFT ou valores inválidos:");
      for (const r of drift) {
        console.log(
          `- ${r.id} (${r.name ?? "sem_nome"}): billing_status=${
            r.billing_status
          }, expected=${r.expected_billing_status}, sub_status=${
            r.subscription_status
          } → ${r.classification} (${r.reason})`,
        );
      }
      console.log();
    }

    console.log("Resumo:");
    console.log(
      `  OK:             ${counts.OK ?? 0}`,
    );
    console.log(
      `  NO_SUBSCRIPTION:${counts.NO_SUBSCRIPTION ?? 0}`,
    );
    console.log(
      `  DRIFT:          ${counts.DRIFT ?? 0}`,
    );
    console.log(
      `  BAD_VALUE:      ${counts.BAD_VALUE ?? 0}`,
    );

    if ((counts.DRIFT ?? 0) > 0 || (counts.BAD_VALUE ?? 0) > 0) {
      console.error();
      console.error(
        "audit-billing-core: DRIFT ou valores inválidos detectados — ver lista acima.",
      );
      process.exitCode = 1;
    } else {
      console.log();
      console.log(
        "audit-billing-core: Nenhum DRIFT ou valor inválido detectado. ✅",
      );
      process.exitCode = 0;
    }
  } catch (err: any) {
    console.error("audit-billing-core: erro ao executar auditoria:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("audit-billing-core: erro inesperado:", err);
  process.exitCode = 1;
});

