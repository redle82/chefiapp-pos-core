// server/amazon/pa-api-client.ts
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";

export type AmazonMarket = {
  host: string;     // ex: webservices.amazon.es
  region: string;   // ex: eu-west-1
  marketplace: string; // ex: www.amazon.es
};

export type PaApiConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  partnerTag: string;     // ex: goldmonkey-21
  partnerType?: "Associates";
};

type PaApiResponse<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  status: number;
  error: any;
  raw?: string;
};

const SERVICE = "ProductAdvertisingAPI";
const CONTENT_TYPE = "application/json; charset=utf-8";

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

  private endpoint(): string {
    return `https://${this.market.host}/paapi5`;
  }

  private async signedRequest(path: string, body: any): Promise<Response> {
    const url = new URL(this.endpoint() + path);

    const request = new HttpRequest({
      method: "POST",
      protocol: url.protocol,
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        "content-type": CONTENT_TYPE,
        "host": url.hostname,
        "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems", // default; override when needed
      },
      body: JSON.stringify(body),
    });

    const signed = await this.signer.sign(request);

    return fetch(url.toString(), {
      method: "POST",
      headers: signed.headers as Record<string, string>,
      body: signed.body as string,
    });
  }

  private async call<T>(target: string, path: string, payload: any): Promise<PaApiResponse<T>> {
    // override x-amz-target per operation
    const url = new URL(this.endpoint() + path);

    const request = new HttpRequest({
      method: "POST",
      protocol: url.protocol,
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        "content-type": CONTENT_TYPE,
        "host": url.hostname,
        "x-amz-target": target,
      },
      body: JSON.stringify(payload),
    });

    const signed = await this.signer.sign(request);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: signed.headers as Record<string, string>,
      body: signed.body as string,
    });

    const raw = await res.text();

    if (!res.ok) {
      let err: any = raw;
      try { err = JSON.parse(raw); } catch {}
      return { ok: false, status: res.status, error: err, raw };
    }

    try {
      const data = JSON.parse(raw) as T;
      return { ok: true, data };
    } catch (e) {
      return { ok: false, status: 500, error: { message: "Invalid JSON from Amazon" }, raw };
    }
  }

  // --------- PUBLIC OPS ---------

  async searchItems(params: {
    keywords: string;
    browseNodeId?: string;
    itemCount?: number; // max 10
    resources?: string[];
    sortBy?: "Relevance" | "Price:LowToHigh" | "Price:HighToLow";
  }) {
    const payload = {
      Keywords: params.keywords,
      BrowseNodeId: params.browseNodeId,
      ItemCount: Math.min(params.itemCount ?? 10, 10),
      PartnerTag: this.cfg.partnerTag,
      PartnerType: this.cfg.partnerType ?? "Associates",
      Marketplace: `https://${this.market.marketplace}`,
      Resources: params.resources ?? [
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Offers.Listings.Availability.Message",
      ],
      SortBy: params.sortBy ?? "Relevance",
    };

    return this.call<any>(
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      "/searchitems",
      payload
    );
  }

  async getItems(params: {
    itemIds: string[];
    resources?: string[];
  }) {
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

/**
 * Factory: Create client from country code
 */
export function createPaApiClient(countryCode: string): PaApiClient | null {
  const accessKeyId = process.env.AMAZON_PA_API_ACCESS_KEY;
  const secretAccessKey = process.env.AMAZON_PA_API_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PA_API_PARTNER_TAG;

  if (!accessKeyId || !secretAccessKey || !partnerTag) {
    console.warn('[PA API] Missing credentials. Set AMAZON_PA_API_ACCESS_KEY, AMAZON_PA_API_SECRET_KEY, AMAZON_PA_API_PARTNER_TAG');
    return null;
  }

  // Map country code to Amazon market
  const marketMap: Record<string, AmazonMarket> = {
    US: { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com' },
    ES: { host: 'webservices.amazon.es', region: 'eu-west-1', marketplace: 'www.amazon.es' },
    PT: { host: 'webservices.amazon.es', region: 'eu-west-1', marketplace: 'www.amazon.es' },
    FR: { host: 'webservices.amazon.fr', region: 'eu-west-1', marketplace: 'www.amazon.fr' },
    DE: { host: 'webservices.amazon.de', region: 'eu-west-1', marketplace: 'www.amazon.de' },
    IT: { host: 'webservices.amazon.it', region: 'eu-west-1', marketplace: 'www.amazon.it' },
    UK: { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk' },
  };

  const market = marketMap[countryCode];
  if (!market) {
    console.warn(`[PA API] Unknown country code: ${countryCode}`);
    return null;
  }

  return new PaApiClient(market, {
    accessKeyId,
    secretAccessKey,
    partnerTag,
    partnerType: 'Associates',
  });
}

/**
 * Parse price from PA API response
 */
export function parsePrice(displayAmount: string): number | null {
  // e.g., "€129.99" -> 12999 (cents)
  const match = displayAmount.match(/[\d,]+\.?\d*/);
  if (!match) return null;
  const value = parseFloat(match[0].replace(',', ''));
  return Math.round(value * 100);
}

/**
 * Calculate product score
 * Formula: (rating * reviews_weight) + prime_bonus
 */
export function calculateScore(
  rating: number | undefined,
  reviewsCount: number | undefined,
  isPrime: boolean
): number {
  const ratingValue = rating || 0;
  const reviewsWeight = Math.min(Math.log10((reviewsCount || 0) + 1) * 10, 50); // Max 50 points
  const primeBonus = isPrime ? 10 : 0;
  return Math.round(ratingValue * reviewsWeight + primeBonus);
}
