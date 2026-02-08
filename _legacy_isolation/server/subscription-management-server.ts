// subscription-management-server.ts
// Servidor simples para UI de gestão de assinatura do merchant

import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import path from "path";
import { Client } from "pg";
import Stripe from "stripe";
import { URL } from "url";
import { FeatureGateService } from "../billing-core/FeatureGateService";
import { AddOnType, PlanTier, SubscriptionStatus } from "../billing-core/types";

dotenv.config({ override: true });

const PORT = Number(process.env.SUBSCRIPTION_UI_PORT || 4310);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "test_user"}:${
    process.env.POSTGRES_PASSWORD || "test_password"
  }@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${
    process.env.POSTGRES_DB || "chefiapp_core_test"
  }`;

let dbClient: Client | null = null;

async function getDb(): Promise<Client> {
  if (!dbClient) {
    dbClient = new Client({ connectionString: DATABASE_URL });
    await dbClient.connect();
  }
  return dbClient;
}

// Price IDs (mensal) - alinhados com setup Stripe
const PRICE_IDS: Record<string, string> = {
  STARTER: "price_1ShJyWEOB1Od9eibIbtqt4s4",
  PROFESSIONAL: "price_1ShJyYEOB1Od9eibqt09Biqr",
  ENTERPRISE: "price_1ShJyaEOB1Od9eibKFlO21AT",
  HOTEL_PRO: "price_1ShJybEOB1Od9eibz4LhtW2Z",
  HOTEL_ENTERPRISE: "price_1ShJydEOB1Od9eibqsEMNnu7",
  RESERVATIONS: "price_1ShJyfEOB1Od9eibm3s5IvSx",
  WEB_PAGE: "price_1ShJygEOB1Od9eib888oXezx",
  MULTI_LOCATION: "price_1ShJyiEOB1Od9eibfseGOu3s",
  WHITE_LABEL: "price_1ShJyjEOB1Od9eibztnrCUvT",
  ANALYTICS_PRO: "price_1ShJylEOB1Od9eibvGsEFk8z",
  EXTRA_TERMINAL: "price_1ShJyhEOB1Od9eibHlTNcUez",
};

// Mapeia status do Stripe para nosso status interno
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  trialing: "TRIAL",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
  unpaid: "SUSPENDED",
  incomplete: "SUSPENDED",
  incomplete_expired: "CANCELLED",
  paused: "SUSPENDED",
};

function readMerchantRecord() {
  // Try DB first, fall back to JSON file for backward compatibility
  return readMerchantRecordFromDb();
}

async function readMerchantRecordFromDb() {
  const db = await getDb();
  const { rows } = await db.query(
    "SELECT merchant_id, business_name, stripe_customer_id, stripe_subscription_id FROM merchant_subscriptions LIMIT 1",
  );
  if (rows.length > 0) return rows[0];

  throw new Error(
    "No merchant record found. Run migration 20260207_01_merchant_subscriptions.sql and seed a merchant.",
  );
}

function detectTier(productName: string, amount: number): PlanTier | null {
  const name = (productName || "").toLowerCase();
  if (name.includes("starter")) return "STARTER";
  if (name.includes("professional")) return "PROFESSIONAL";
  if (name.includes("enterprise")) return "ENTERPRISE";
  if (name.includes("hotel pro")) return "STARTER"; // fallback para não quebrar
  if (name.includes("hotel enterprise")) return "ENTERPRISE";

  if (amount === 2900) return "STARTER";
  if (amount === 5900) return "PROFESSIONAL";
  if (amount === 14900) return "ENTERPRISE";
  return null;
}

function detectAddon(productName: string, amount: number): AddOnType | null {
  const name = (productName || "").toLowerCase();
  if (name.includes("reserva")) return "RESERVATIONS";
  if (name.includes("web page") || name.includes("webpage")) return "WEB_PAGE";
  if (
    name.includes("multi-venue") ||
    name.includes("multi venue") ||
    name.includes("multi-location")
  )
    return "MULTI_LOCATION";
  if (name.includes("white-label") || name.includes("white label"))
    return "WHITE_LABEL";
  if (name.includes("analytics")) return "ANALYTICS_PRO";
  if (name.includes("terminal")) return "EXTRA_TERMINAL";

  if (amount === 1900) return "RESERVATIONS";
  if (amount === 900) return "WEB_PAGE";
  if (amount === 4900) return "MULTI_LOCATION";
  if (amount === 9900) return "WHITE_LABEL";
  if (amount === 1500) return "EXTRA_TERMINAL";
  if (amount === 2900) return "ANALYTICS_PRO";
  return null;
}

async function getSubscriptionContext(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  // Tipagem do Stripe v20 retorna Response<Subscription>. Usamos any para acessar campos.
  const subscription: any = sub;

  let tier: PlanTier = "STARTER";
  let tierLocked = false;
  const addons: AddOnType[] = [];

  for (const item of sub.items.data) {
    const productName = (item.price.product as any)?.name || "";
    const amount = item.price.unit_amount || 0;

    if (!tierLocked) {
      const detectedTier = detectTier(productName, amount);
      if (detectedTier) {
        tier = detectedTier;
        tierLocked = true;
      }
    }

    const addon = detectAddon(productName, amount);
    if (addon) {
      addons.push(addon);
    }
  }

  const status = STATUS_MAP[subscription.status] || "SUSPENDED";

  return {
    subscription_id: subscription.id,
    status,
    raw_status: subscription.status,
    tier,
    addons,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };
}

async function upgradePlan(record: any, newTier: PlanTier) {
  const newPrice = PRICE_IDS[newTier];
  if (!newPrice) {
    throw new Error(`Price ID not found for tier ${newTier}`);
  }

  const sub = await stripe.subscriptions.retrieve(
    record.stripe_subscription_id,
    {
      expand: ["items.data.price.product"],
    },
  );

  const items: any[] = [];

  for (const item of sub.items.data) {
    const productName = (item.price.product as any)?.name || "";
    const amount = item.price.unit_amount || 0;
    const isPlanItem = !!detectTier(productName, amount);
    if (!isPlanItem) {
      items.push({ id: item.id, price: item.price.id });
    }
  }

  items.push({ price: newPrice });

  await stripe.subscriptions.update(sub.id, {
    items,
    metadata: { plan_tier: newTier },
  });

  return getSubscriptionContext(sub.id);
}

async function addAddon(record: any, addon: AddOnType) {
  const addonPrice = PRICE_IDS[addon];
  if (!addonPrice) {
    throw new Error(`Price ID not found for addon ${addon}`);
  }

  const sub = await stripe.subscriptions.retrieve(
    record.stripe_subscription_id,
    {
      expand: ["items.data.price.product"],
    },
  );

  const currentAddons = new Set<AddOnType>();
  for (const item of sub.items.data) {
    const productName = (item.price.product as any)?.name || "";
    const amount = item.price.unit_amount || 0;
    const detected = detectAddon(productName, amount);
    if (detected) currentAddons.add(detected);
  }

  if (currentAddons.has(addon)) {
    return getSubscriptionContext(sub.id);
  }

  const items: { id?: string; price: string }[] = sub.items.data.map((i) => ({
    id: i.id,
    price: i.price.id,
  }));
  items.push({ price: addonPrice });

  await stripe.subscriptions.update(sub.id, { items });
  return getSubscriptionContext(sub.id);
}

async function createBillingPortal(record: any) {
  const session = await stripe.billingPortal.sessions.create({
    customer: record.stripe_customer_id,
    return_url: `http://localhost:${PORT}/`,
  });
  return session.url;
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res: http.ServerResponse, code: number, payload: any) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}

function serveHtml(res: http.ServerResponse) {
  const htmlPath = path.join(__dirname, "subscription-management.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJSON(res, 200, { status: "ok", service: "subscription-ui" });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return serveHtml(res);
    }

    if (req.method === "GET" && url.pathname === "/api/subscription") {
      const record = readMerchantRecord();
      const data = await getSubscriptionContext(record.stripe_subscription_id);
      const context = {
        status: data.status,
        tier: data.tier,
        addons: data.addons,
      } as any;
      const features = FeatureGateService.getAvailableFeatures(context);
      return sendJSON(res, 200, {
        merchant: record.business_name,
        subscription: data,
        features,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/subscription/upgrade") {
      const body = await readBody(req);
      const newTier = (body.tier || "").toUpperCase() as PlanTier;
      if (!["STARTER", "PROFESSIONAL", "ENTERPRISE"].includes(newTier)) {
        return sendJSON(res, 400, { error: "INVALID_TIER" });
      }
      const record = readMerchantRecord();
      const data = await upgradePlan(record, newTier);
      const context = {
        status: data.status,
        tier: data.tier,
        addons: data.addons,
      } as any;
      const features = FeatureGateService.getAvailableFeatures(context);
      return sendJSON(res, 200, { subscription: data, features });
    }

    if (req.method === "POST" && url.pathname === "/api/subscription/addon") {
      const body = await readBody(req);
      const addon = (body.addon || "").toUpperCase() as AddOnType;
      if (
        ![
          "RESERVATIONS",
          "WEB_PAGE",
          "MULTI_LOCATION",
          "WHITE_LABEL",
          "ANALYTICS_PRO",
          "EXTRA_TERMINAL",
        ].includes(addon)
      ) {
        return sendJSON(res, 400, { error: "INVALID_ADDON" });
      }
      const record = readMerchantRecord();
      const data = await addAddon(record, addon);
      const context = {
        status: data.status,
        tier: data.tier,
        addons: data.addons,
      } as any;
      const features = FeatureGateService.getAvailableFeatures(context);
      return sendJSON(res, 200, { subscription: data, features });
    }

    if (req.method === "POST" && url.pathname === "/api/subscription/payment") {
      const record = readMerchantRecord();
      const urlPortal = await createBillingPortal(record);
      return sendJSON(res, 200, { url: urlPortal });
    }

    res.statusCode = 404;
    res.end("Not found");
  } catch (err: any) {
    sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`  SUBSCRIPTION UI SERVER ON http://localhost:${PORT}`);
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("");
});
