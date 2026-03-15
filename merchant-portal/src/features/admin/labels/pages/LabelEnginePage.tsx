import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { setPrintJobStatus } from "../../../../core/print/CorePrintApi";
import {
  createLabelJob,
  listLabelProfiles,
  saveLabelProfile,
  type LabelCodeMode,
  type LabelPackageMode,
  type LabelProfileInput,
  type LabelQrMode,
  type LabelScope,
  type LabelStorageType,
} from "../../../../core/print/LabelEngineApi";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import styles from "./LabelEnginePage.module.css";

const LABEL_SIZES = [
  { id: "60x40", widthMm: 60, heightMm: 40, templateId: "short-60x40" },
  { id: "100x50", widthMm: 100, heightMm: 50, templateId: "full-100x50" },
  { id: "100x150", widthMm: 100, heightMm: 150, templateId: "full-100x150" },
] as const;

const LANG_OPTIONS = ["ca", "es", "en", "de", "it", "fr", "pt-PT", "pt-BR"];

function getExpiryDate(producedIso: string, storageType: LabelStorageType) {
  const produced = new Date(producedIso);
  if (Number.isNaN(produced.getTime())) return producedIso;
  const expires = new Date(produced);
  expires.setDate(expires.getDate() + (storageType === "frozen" ? 180 : 7));
  return expires.toISOString();
}

function buildLabelPrintHtml(input: {
  productId: string;
  lotCode: string;
  producedAt: string;
  expiresAt: string;
  storageType: LabelStorageType;
  packageMode: LabelPackageMode;
  quantity: number;
  netWeightGrams: number;
  languagePrimary: string;
  languageSecondary: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 4mm; }
      body { font-family: Arial, sans-serif; margin: 0; }
      .label { border: 1px solid #111; padding: 6px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .title { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
      .meta { font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="label">
      <div class="title">${input.productId}</div>
      <div class="row meta"><span>LOT</span><span>${input.lotCode}</span></div>
      <div class="row meta"><span>PROD</span><span>${new Date(
        input.producedAt,
      ).toLocaleDateString()}</span></div>
      <div class="row meta"><span>EXP</span><span>${new Date(
        input.expiresAt,
      ).toLocaleDateString()}</span></div>
      <div class="row meta"><span>STORAGE</span><span>${
        input.storageType
      }</span></div>
      <div class="row meta"><span>PACK</span><span>${input.packageMode} x ${
    input.quantity
  }</span></div>
      <div class="row meta"><span>NET</span><span>${
        input.netWeightGrams
      }g</span></div>
      <div class="row meta"><span>LANG</span><span>${input.languagePrimary}${
    input.languageSecondary ? ` + ${input.languageSecondary}` : ""
  }</span></div>
    </div>
  </body>
</html>`;
}

export function LabelEnginePage() {
  const { t } = useTranslation("labels");
  const { identity } = useRestaurantIdentity();

  const [selectedSizeId, setSelectedSizeId] =
    useState<(typeof LABEL_SIZES)[number]["id"]>("60x40");
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileName, setProfileName] = useState("Default");
  const [printerTarget, setPrinterTarget] = useState("MUNBYN_LABEL_1");
  const [languagePrimary, setLanguagePrimary] = useState("es");
  const [languageSecondary, setLanguageSecondary] = useState("ca");
  const [barcode, setBarcode] = useState<LabelCodeMode>("code128");
  const [qr, setQr] = useState<LabelQrMode>("batch");
  const [defaultScope, setDefaultScope] = useState<LabelScope>("product");
  const [storageType, setStorageType] = useState<LabelStorageType>("frozen");
  const [packageMode, setPackageMode] = useState<LabelPackageMode>("unit");
  const [quantity, setQuantity] = useState(24);
  const [boxSize, setBoxSize] = useState<number | "">(12);
  const [productId, setProductId] = useState("sku-demo");
  const [lotCode, setLotCode] = useState("L240302A");
  const [producedAt, setProducedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [netWeightGrams, setNetWeightGrams] = useState(180);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

  const selectedSize = useMemo(
    () =>
      LABEL_SIZES.find((size) => size.id === selectedSizeId) ?? LABEL_SIZES[0],
    [selectedSizeId],
  );

  useEffect(() => {
    const restaurantId = identity.id;
    if (!restaurantId) return;

    let ignore = false;
    setLoadingProfiles(true);
    listLabelProfiles(restaurantId)
      .then((result) => {
        if (ignore) return;
        if (result.error) {
          window.alert(t("messages.loadError"));
          return;
        }
        setProfiles(
          (result.data ?? []).map((item) => ({ id: item.id, name: item.name })),
        );
        const firstProfile = (result.data ?? [])[0];
        if (firstProfile?.id) {
          setSelectedProfileId((current) => current || firstProfile.id);
        }
      })
      .finally(() => {
        if (!ignore) setLoadingProfiles(false);
      });

    return () => {
      ignore = true;
    };
  }, [identity.id, t]);

  const refreshProfiles = async () => {
    if (!identity.id) return;
    const result = await listLabelProfiles(identity.id);
    if (!result.error) {
      const nextProfiles = (result.data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      }));
      setProfiles(nextProfiles);
      if (nextProfiles.length > 0) {
        setSelectedProfileId((current) => {
          if (
            current &&
            nextProfiles.some((profile) => profile.id === current)
          ) {
            return current;
          }
          return nextProfiles[0].id;
        });
      }
    }
  };

  const buildProfileInput = (): LabelProfileInput => ({
    name: profileName,
    printerTarget,
    size: {
      widthMm: selectedSize.widthMm,
      heightMm: selectedSize.heightMm,
    },
    templateId: selectedSize.templateId,
    languagePrimary,
    languageSecondary: languageSecondary || null,
    barcode,
    qr,
    defaultScope,
    productId,
    operatorId: null,
  });

  const ensureProfileId = async (): Promise<string | null> => {
    if (selectedProfileId) return selectedProfileId;
    if (!identity.id) return null;

    const saveResult = await saveLabelProfile(identity.id, buildProfileInput());
    if (saveResult.error || !saveResult.data?.id) {
      window.alert(t("messages.profileRequired"));
      return null;
    }

    setSelectedProfileId(saveResult.data.id);
    await refreshProfiles();
    return saveResult.data.id;
  };

  const handleSavePreset = async () => {
    if (!identity.id) {
      window.alert(t("messages.missingRestaurant"));
      return;
    }

    setSaving(true);
    const result = await saveLabelProfile(identity.id, buildProfileInput());
    setSaving(false);

    if (result.error) {
      window.alert(t("messages.saveError"));
      return;
    }

    if (result.data?.id) {
      setSelectedProfileId(result.data.id);
    }
    await refreshProfiles();
    window.alert(t("messages.saved"));
  };

  const handlePrint = async () => {
    if (!identity.id) {
      window.alert(t("messages.missingRestaurant"));
      return;
    }

    const producedIso = new Date(producedAt).toISOString();

    const profileId = await ensureProfileId();
    if (!profileId) return;

    setPrinting(true);
    const expiresAt = getExpiryDate(producedIso, storageType);

    const printResult = await createLabelJob({
      restaurantId: identity.id,
      profileId,
      productId,
      storageType,
      packageMode,
      quantity,
      boxSize: packageMode === "box" ? Number(boxSize || 0) : null,
      lotCode,
      producedAt: producedIso,
      expiresAt,
      netWeightGrams,
      secondLanguageEnabled: Boolean(languageSecondary),
    });
    setPrinting(false);

    if (printResult.error) {
      window.alert(t("messages.printError"));
      return;
    }

    const jobId = printResult.data?.job_id;
    if (jobId && window.electronBridge?.printLabel) {
      const bridgeResult = await window.electronBridge.printLabel({
        html: buildLabelPrintHtml({
          productId,
          lotCode,
          producedAt: producedIso,
          expiresAt,
          storageType,
          packageMode,
          quantity,
          netWeightGrams,
          languagePrimary,
          languageSecondary,
        }),
        printerTarget,
      });

      if (bridgeResult.ok) {
        await setPrintJobStatus({ jobId, status: "sent" });
      } else {
        await setPrintJobStatus({
          jobId,
          status: "failed",
          errorMessage: bridgeResult.error ?? "PRINT_FAILED",
        });
        window.alert(t("messages.printError"));
        return;
      }
    }

    window.alert(t("messages.printRequested"));

    if (window.confirm(t("messages.confirmSaveAfterPrint"))) {
      await handleSavePreset();
    }
  };

  return (
    <div className={`${styles.container} page-enter admin-content-page`}>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className={styles.formCard}>
        <label>
          {t("fields.productId")}
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          {t("fields.storage")}
          <select
            value={storageType}
            onChange={(event) =>
              setStorageType(event.target.value as LabelStorageType)
            }
            className={styles.input}
          >
            <option value="frozen">{t("storage.frozen")}</option>
            <option value="refrigerated">{t("storage.refrigerated")}</option>
          </select>
        </label>
        <label>
          {t("fields.packageMode")}
          <select
            value={packageMode}
            onChange={(event) =>
              setPackageMode(event.target.value as LabelPackageMode)
            }
            className={styles.input}
          >
            <option value="unit">{t("package.unit")}</option>
            <option value="box">{t("package.box")}</option>
          </select>
        </label>
        <label>
          {t("fields.quantity")}
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value || 1))}
            className={styles.input}
          />
        </label>
        {packageMode === "box" && (
          <label>
            {t("fields.boxSize")}
            <input
              type="number"
              min={1}
              value={boxSize}
              onChange={(event) => setBoxSize(Number(event.target.value || 1))}
              className={styles.input}
            />
          </label>
        )}
        <label>
          {t("fields.producedAt")}
          <input
            type="datetime-local"
            value={producedAt}
            onChange={(event) => setProducedAt(event.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          {t("fields.lotCode")}
          <input
            value={lotCode}
            onChange={(event) => setLotCode(event.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          {t("fields.netWeight")}
          <input
            type="number"
            min={1}
            value={netWeightGrams}
            onChange={(event) =>
              setNetWeightGrams(Number(event.target.value || 1))
            }
            className={styles.input}
          />
        </label>
      </div>

      <div className={styles.formCard}>
        <label>
          {t("fields.profileName")}
          <input
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          {t("fields.savedProfile")}
          <select
            value={selectedProfileId}
            onChange={(event) => setSelectedProfileId(event.target.value)}
            className={styles.input}
          >
            <option value="">{t("savedProfiles.empty")}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("fields.printer")}
          <input
            value={printerTarget}
            onChange={(event) => setPrinterTarget(event.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          {t("fields.size")}
          <select
            value={selectedSizeId}
            onChange={(event) =>
              setSelectedSizeId(
                event.target.value as (typeof LABEL_SIZES)[number]["id"],
              )
            }
            className={styles.input}
          >
            {LABEL_SIZES.map((size) => (
              <option key={size.id} value={size.id}>
                {size.widthMm}×{size.heightMm}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("fields.languagePrimary")}
          <select
            value={languagePrimary}
            onChange={(event) => setLanguagePrimary(event.target.value)}
            className={styles.input}
          >
            {LANG_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("fields.languageSecondary")}
          <select
            value={languageSecondary}
            onChange={(event) => setLanguageSecondary(event.target.value)}
            className={styles.input}
          >
            {LANG_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("fields.barcode")}
          <select
            value={barcode}
            onChange={(event) =>
              setBarcode(event.target.value as LabelCodeMode)
            }
            className={styles.input}
          >
            <option value="none">{t("codes.none")}</option>
            <option value="ean13">EAN13</option>
            <option value="code128">Code128</option>
          </select>
        </label>
        <label>
          {t("fields.qr")}
          <select
            value={qr}
            onChange={(event) => setQr(event.target.value as LabelQrMode)}
            className={styles.input}
          >
            <option value="none">{t("codes.none")}</option>
            <option value="batch">{t("codes.batch")}</option>
            <option value="url">URL</option>
          </select>
        </label>
        <label>
          {t("fields.scope")}
          <select
            value={defaultScope}
            onChange={(event) =>
              setDefaultScope(event.target.value as LabelScope)
            }
            className={styles.input}
          >
            <option value="product">{t("scope.product")}</option>
            <option value="operator">{t("scope.operator")}</option>
            <option value="tenant">{t("scope.tenant")}</option>
          </select>
        </label>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" onClick={handlePrint} disabled={printing}>
          {printing ? t("buttons.printing") : t("buttons.print")}
        </button>
        <button type="button" onClick={handleSavePreset} disabled={saving}>
          {saving ? t("buttons.saving") : t("buttons.savePreset")}
        </button>
      </div>

      <div className={styles.listCard}>
        <h3 className={styles.listTitle}>{t("savedProfiles.title")}</h3>
        {loadingProfiles ? (
          <p>{t("savedProfiles.loading")}</p>
        ) : profiles.length === 0 ? (
          <p>{t("savedProfiles.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {profiles.map((profile) => (
              <li key={profile.id}>{profile.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
