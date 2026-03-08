import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { createImportJob } from "../../../../core/catalog/catalogApi";
import { isMenuV2QuickBuildEnabled } from "../../../../core/catalog/catalogFeatureFlags";
import {
  clearCatalogSetupDraft,
  getDefaultCatalogSetupDraft,
  loadCatalogSetupDraft,
  saveCatalogSetupDraft,
  type CatalogSetupDraft,
} from "../../../../core/catalog/catalogSetupDraft";
import { CatalogLayout } from "../components/CatalogLayout";

const TOTAL_STEPS = 4;

function parseBrandsInput(value: string): string[] {
  const brands = value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return brands.length > 0 ? brands : ["Marca principal"];
}

function toBrandsInput(value: string[]): string {
  return value.join("\n");
}

export function CatalogSetupPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? "default";

  const quickBuildEnabled = isMenuV2QuickBuildEnabled();

  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<CatalogSetupDraft>(() =>
    loadCatalogSetupDraft(restaurantId),
  );
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(1);
    setDraft(loadCatalogSetupDraft(restaurantId));
  }, [restaurantId]);

  const brandsInput = useMemo(
    () => toBrandsInput(draft.brands),
    [draft.brands],
  );

  const updateDraft = (partial: Partial<CatalogSetupDraft>) => {
    setDraft((prev) =>
      saveCatalogSetupDraft(restaurantId, {
        ...prev,
        ...partial,
      }),
    );
  };

  const resetDraft = () => {
    clearCatalogSetupDraft(restaurantId);
    setDraft(getDefaultCatalogSetupDraft());
    setCurrentStep(1);
    setImportMessage(null);
  };

  const goNext = () =>
    setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  const goBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const createImportDraft = async () => {
    if (draft.importMode === "none") {
      setImportMessage(
        "Seleciona um modo de importacao antes de criar rascunho.",
      );
      return;
    }

    const job = await createImportJob(
      {
        sourceType: draft.importMode,
        sourceLabel: `${draft.initialTemplateId}-${restaurantId}`,
        createdBy: "admin-setup",
      },
      restaurantId,
    );

    setImportMessage(`Rascunho de importacao criado: ${job.id}`);
  };

  if (!quickBuildEnabled) {
    return (
      <CatalogLayout
        title="Setup de menu"
        description="Assistente para colocar restaurante no ar rapidamente sem perder controlo operacional."
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Quick Build desativado por feature flag.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Usa os fluxos legados para preparar o cardapio:{" "}
            <Link
              className="font-semibold underline"
              to="/admin/catalog/products"
            >
              Ir para produtos
            </Link>
            {" · "}
            <Link
              className="font-semibold underline"
              to="/admin/catalog/modifiers"
            >
              Modificadores
            </Link>
            {" · "}
            <Link
              className="font-semibold underline"
              to="/admin/catalog/combos"
            >
              Combos
            </Link>
          </div>
        </div>
      </CatalogLayout>
    );
  }

  return (
    <CatalogLayout
      title="Setup de menu"
      description="Assistente para colocar restaurante no ar rapidamente sem perder controlo operacional."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-gray-900">
            Passo {currentStep} de {TOTAL_STEPS}
          </div>

          {currentStep === 1 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-700" htmlFor="setup-country">
                Pais
                <input
                  id="setup-country"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.country}
                  onChange={(event) =>
                    updateDraft({ country: event.target.value })
                  }
                />
              </label>
              <label className="text-sm text-gray-700" htmlFor="setup-currency">
                Moeda
                <input
                  id="setup-currency"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.currency}
                  onChange={(event) =>
                    updateDraft({ currency: event.target.value })
                  }
                />
              </label>
              <label className="text-sm text-gray-700" htmlFor="setup-locale">
                Idioma base
                <input
                  id="setup-locale"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.primaryLanguage}
                  onChange={(event) =>
                    updateDraft({
                      primaryLanguage: event.target.value,
                      locale: event.target.value,
                    })
                  }
                />
              </label>
              <label
                className="text-sm text-gray-700"
                htmlFor="setup-business-type"
              >
                Tipo de negocio
                <select
                  id="setup-business-type"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.businessType}
                  onChange={(event) =>
                    updateDraft({
                      businessType: event.target
                        .value as CatalogSetupDraft["businessType"],
                    })
                  }
                >
                  <option value="RESTAURANT">Restaurante</option>
                  <option value="BAR">Bar</option>
                  <option value="CAFE">Cafe</option>
                  <option value="FAST_CASUAL">Fast casual</option>
                  <option value="OTHER">Outro</option>
                </select>
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-3">
              <label className="text-sm text-gray-700" htmlFor="setup-brands">
                Marcas (uma por linha)
                <textarea
                  id="setup-brands"
                  className="mt-1 min-h-24 w-full rounded border border-gray-300 px-2 py-1"
                  value={brandsInput}
                  onChange={(event) =>
                    updateDraft({
                      brands: parseBrandsInput(event.target.value),
                    })
                  }
                />
              </label>

              <fieldset className="text-sm text-gray-700">
                <legend className="mb-1 font-medium">Canais ativos</legend>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "LOCAL", label: "Local" },
                    { value: "TAKEAWAY", label: "Takeaway" },
                    { value: "DELIVERY", label: "Delivery" },
                  ].map((channel) => {
                    const isChecked = draft.channels.includes(
                      channel.value as CatalogSetupDraft["channels"][number],
                    );

                    return (
                      <label
                        key={channel.value}
                        className="inline-flex items-center gap-1"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            const nextChannels = event.target.checked
                              ? [
                                  ...draft.channels,
                                  channel.value as CatalogSetupDraft["channels"][number],
                                ]
                              : draft.channels.filter(
                                  (item) => item !== channel.value,
                                );
                            updateDraft({
                              channels:
                                nextChannels.length > 0
                                  ? nextChannels
                                  : draft.channels,
                            });
                          }}
                        />
                        {channel.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-700" htmlFor="setup-template">
                Template inicial
                <select
                  id="setup-template"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.initialTemplateId}
                  onChange={(event) =>
                    updateDraft({ initialTemplateId: event.target.value })
                  }
                >
                  <option value="classic-restaurant">Classic restaurant</option>
                  <option value="bar-snacks">Bar + snacks</option>
                  <option value="delivery-focused">Delivery focused</option>
                </select>
              </label>

              <label
                className="text-sm text-gray-700"
                htmlFor="setup-import-mode"
              >
                Modo de importacao
                <select
                  id="setup-import-mode"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                  value={draft.importMode}
                  onChange={(event) =>
                    updateDraft({
                      importMode: event.target
                        .value as CatalogSetupDraft["importMode"],
                    })
                  }
                >
                  <option value="none">Sem importacao</option>
                  <option value="photo">Foto</option>
                  <option value="pdf">PDF</option>
                  <option value="text">Texto</option>
                  <option value="csv">CSV</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <button
                  type="button"
                  className="rounded border border-violet-300 px-3 py-1 text-sm font-semibold text-violet-800"
                  onClick={createImportDraft}
                >
                  Criar rascunho de importacao
                </button>

                {importMessage ? (
                  <p className="mt-2 text-sm text-gray-700">{importMessage}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Pais:</strong> {draft.country}
              </p>
              <p>
                <strong>Moeda:</strong> {draft.currency}
              </p>
              <p>
                <strong>Idioma:</strong> {draft.primaryLanguage}
              </p>
              <p>
                <strong>Marcas:</strong> {draft.brands.join(", ")}
              </p>
              <p>
                <strong>Canais:</strong> {draft.channels.join(", ")}
              </p>
              <p>
                <strong>Template:</strong> {draft.initialTemplateId}
              </p>
              <p>
                <strong>Importacao:</strong> {draft.importMode}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-1 text-sm"
              onClick={goBack}
              disabled={currentStep === 1}
            >
              Voltar
            </button>
            <button
              type="button"
              className="rounded bg-violet-600 px-3 py-1 text-sm font-medium text-white"
              onClick={goNext}
              disabled={currentStep === TOTAL_STEPS}
            >
              Continuar
            </button>
            <button
              type="button"
              className="rounded border border-amber-300 px-3 py-1 text-sm text-amber-900"
              onClick={resetDraft}
            >
              Resetar rascunho
            </button>
            <Link
              className="text-sm font-semibold underline"
              to="/admin/catalog/library"
            >
              Ir para biblioteca
            </Link>
          </div>
        </div>
      </div>
    </CatalogLayout>
  );
}
