import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";

export type CountryCode = "US" | "ES" | "PT" | "FR" | "DE" | "IT" | "UK";

export type AmazonMarket = {
  code: CountryCode;
  currency: "USD" | "EUR" | "GBP";
  domain: string;
  host: string; // PA API host, e.g. webservices.amazon.es
  region: string; // AWS region, e.g. eu-west-1
  marketplace: string; // marketplace domain, e.g. www.amazon.es
};

export type PaApiConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  partnerTag: string;
  partnerType?: "Associates";
};

const SERVICE = "ProductAdvertisingAPI";
const CONTENT_TYPE = "application/json; charset=utf-8";

// Must match `supabase/migrations/050_amazon_tpv_store.sql` seed values
export const COUNTRY_MARKETS: Record<CountryCode, AmazonMarket> = {
  US: { code: "US", currency: "USD", domain: "amazon.com", host: "webservices.amazon.com", region: "us-east-1", marketplace: "www.amazon.com" },
  ES: { code: "ES", currency: "EUR", domain: "amazon.es", host: "webservices.amazon.es", region: "eu-west-1", marketplace: "www.amazon.es" },
  PT: { code: "PT", currency: "EUR", domain: "amazon.es", host: "webservices.amazon.es", region: "eu-west-1", marketplace: "www.amazon.es" },
  FR: { code: "FR", currency: "EUR", domain: "amazon.fr", host: "webservices.amazon.fr", region: "eu-west-1", marketplace: "www.amazon.fr" },
  DE: { code: "DE", currency: "EUR", domain: "amazon.de", host: "webservices.amazon.de", region: "eu-west-1", marketplace: "www.amazon.de" },
  IT: { code: "IT", currency: "EUR", domain: "amazon.it", host: "webservices.amazon.it", region: "eu-west-1", marketplace: "www.amazon.it" },
  UK: { code: "UK", currency: "GBP", domain: "amazon.co.uk", host: "webservices.amazon.co.uk", region: "eu-west-1", marketplace: "www.amazon.co.uk" },
};

export type PaApiResult<T> =
  | { ok: true; data: T; raw: string }
  | { ok: false; status: number; error: any; raw: string };

export class PaApiClient {
  private signer: SignatureV4;

  constructor(
    private market: AmazonMarket,
    private cfg: PaApiConfig
  ) {
    this.signer = new SignatureV4({
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      region: market.region,
      service: SERVICE,
      sha256: Sha256,
    });
  }

  private endpoint(): URL {
    return new URL(`https://${this.market.host}/paapi5`);
  }

  private async call<T>(target: string, path: string, payload: any): Promise<PaApiResult<T>> {
    const base = this.endpoint();

    const req = new HttpRequest({
      method: "POST",
      protocol: base.protocol,
      hostname: base.hostname,
      path: base.pathname + path,
      headers: {
        host: base.hostname,
        "content-type": CONTENT_TYPE,
        "x-amz-target": target,
      },
      body: JSON.stringify(payload),
    });

    const signed = await this.signer.sign(req);

    // Node 18+ has global fetch. If your runtime is older, add node-fetch.
    const res = await fetch(base.toString() + path, {
      method: "POST",
      headers: signed.headers as Record<string, string>,
      body: signed.body as string,
    });

    const raw = await res.text();

    if (!res.ok) {
      let parsed: any = raw;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // keep string
      }
      return { ok: false, status: res.status, error: parsed, raw };
    }

    try {
      const data = JSON.parse(raw) as T;
      return { ok: true, data, raw };
    } catch {
      return { ok: false, status: 500, error: { message: "Invalid JSON from Amazon" }, raw };
    }
  }

  async searchItems(params: {
    keywords: string;
    itemCount?: number; // max 10
    sortBy?: "Relevance" | "Price:LowToHigh" | "Price:HighToLow";
    resources?: string[];
  }) {
    const payload = {
      Keywords: params.keywords,
      ItemCount: Math.min(params.itemCount ?? 10, 10),
      PartnerTag: this.cfg.partnerTag,
      PartnerType: this.cfg.partnerType ?? "Associates",
      Marketplace: `https://${this.market.marketplace}`,
      SortBy: params.sortBy ?? "Relevance",
      Resources: params.resources ?? [
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Offers.Listings.DeliveryInfo.IsPrimeEligible",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating",
      ],
    };

    return this.call<any>(
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      "/searchitems",
      payload
    );
  }

  async getItems(params: { itemIds: string[]; resources?: string[] }) {
    const payload = {
      ItemIds: params.itemIds,
      PartnerTag: this.cfg.partnerTag,
      PartnerType: this.cfg.partnerType ?? "Associates",
      Marketplace: `https://${this.market.marketplace}`,
      Resources: params.resources ?? [
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "Offers.Listings.Price",
      ],
    };

    return this.call<any>(
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      "/getitems",
      payload
    );
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[amazon-pa-api] Missing env var: ${name}`);
  return v;
}

export function createPaApiClient(countryCode: CountryCode): PaApiClient {
  const accessKeyId = requireEnv("AMAZON_PA_API_ACCESS_KEY");
  const secretAccessKey = requireEnv("AMAZON_PA_API_SECRET_KEY");
  const partnerTag = requireEnv("AMAZON_PA_API_PARTNER_TAG");

  const market = COUNTRY_MARKETS[countryCode];
  if (!market) throw new Error(`[amazon-pa-api] Unsupported countryCode: ${countryCode}`);

  return new PaApiClient(market, {
    accessKeyId,
    secretAccessKey,
    partnerTag,
    partnerType: "Associates",
  });
}
