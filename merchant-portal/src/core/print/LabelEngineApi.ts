import { invokeRpc } from "../infra/coreRpc";
import { requestPrint, type RequestPrintResult } from "./CorePrintApi";

export type LabelStorageType = "frozen" | "refrigerated";
export type LabelPackageMode = "unit" | "box";
export type LabelCodeMode = "none" | "ean13" | "code128";
export type LabelQrMode = "none" | "batch" | "url";
export type LabelScope = "product" | "operator" | "tenant";

export type LabelProfileInput = {
  name: string;
  printerTarget: string;
  size: {
    widthMm: number;
    heightMm: number;
  };
  templateId: string;
  languagePrimary: string;
  languageSecondary?: string | null;
  barcode: LabelCodeMode;
  qr: LabelQrMode;
  defaultScope: LabelScope;
  productId?: string | null;
  operatorId?: string | null;
};

export type LabelProfileRecord = {
  id: string;
  name: string;
  printer_target: string;
  size_w_mm: number;
  size_h_mm: number;
  template_id: string;
  language_primary: string;
  language_secondary?: string | null;
  barcode_type: LabelCodeMode;
  qr_type: LabelQrMode;
  default_scope: LabelScope;
  product_id?: string | null;
  operator_id?: string | null;
};

export type LabelJobInput = {
  restaurantId: string;
  profileId: string;
  productId: string;
  storageType: LabelStorageType;
  packageMode: LabelPackageMode;
  quantity: number;
  boxSize?: number | null;
  lotCode: string;
  producedAt: string;
  expiresAt: string;
  netWeightGrams: number;
  secondLanguageEnabled: boolean;
};

export async function listLabelProfiles(
  restaurantId: string,
): Promise<{ data: LabelProfileRecord[]; error: { message: string } | null }> {
  const { data, error } = await invokeRpc<LabelProfileRecord[]>(
    "list_label_profiles",
    {
      p_restaurant_id: restaurantId,
    },
  );

  return {
    data: data ?? [],
    error,
  };
}

export async function saveLabelProfile(
  restaurantId: string,
  profile: LabelProfileInput,
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const { data, error } = await invokeRpc<{ id: string }>(
    "upsert_label_profile",
    {
      p_restaurant_id: restaurantId,
      p_profile: profile,
    },
  );

  return {
    data: data ?? null,
    error,
  };
}

export async function createLabelJob(input: LabelJobInput): Promise<{
  data: RequestPrintResult | null;
  error: { message: string } | null;
}> {
  return requestPrint({
    restaurantId: input.restaurantId,
    type: "label",
    orderId: null,
    payload: {
      profile_id: input.profileId,
      product_id: input.productId,
      storage_type: input.storageType,
      package_mode: input.packageMode,
      quantity: input.quantity,
      box_size: input.boxSize ?? null,
      lot_code: input.lotCode,
      produced_at: input.producedAt,
      expires_at: input.expiresAt,
      net_weight_grams: input.netWeightGrams,
      second_language_enabled: input.secondLanguageEnabled,
    },
  });
}
