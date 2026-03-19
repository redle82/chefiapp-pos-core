import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { isDebugMode } from "../../core/debugMode";
import { RUNTIME } from "../../core/runtime/RuntimeContext";
import {
  readRestaurantPeople,
  type CoreRestaurantPerson,
} from "../../infra/readers/RestaurantPeopleReader";
import { Button } from "../../ui/design-system/Button";
import { Card } from "../../ui/design-system/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import styles from "./AppStaffLanding.module.css";
import { useStaff } from "./context/StaffContext";
import type { BusinessType, StaffRole } from "./context/StaffCoreTypes";
import { TRIAL_GUIDE_CODES } from "./data/operatorProfiles";
import { STAFF_LAUNCHER_PATH } from "./routing/staffModeConfig";

/* ── Distribution section (mock placeholders) ── */
const DistributionSection: React.FC = () => {
  const { t } = useTranslation("common");
  const [showQR, setShowQR] = useState(false);
  return (
    <div className={styles.distributionSection}>
      <Text size="xs" color="tertiary" className={styles.distributionTitle}>
        {t("staffLanding.availableForTeam")}
      </Text>
      <div className={styles.storeButtons}>
        <button className={styles.storeButton} disabled>
          <span className={styles.storeIcon}>▶</span>
          <span className={styles.storeLabel}>Google Play</span>
          <span className={styles.storeBadge}>{t("staffLanding.comingSoon")}</span>
        </button>
        <button className={styles.storeButton} disabled>
          <span className={styles.storeIcon}></span>
          <span className={styles.storeLabel}>App Store</span>
          <span className={styles.storeBadge}>{t("staffLanding.comingSoon")}</span>
        </button>
      </div>
      <button className={styles.qrButton} onClick={() => setShowQR((v) => !v)}>
        {t("staffLanding.installViaQR")}
      </button>
      {showQR && (
        <div className={styles.qrPanel}>
          <Text size="xs" color="tertiary" className={styles.qrText}>
            {t("staffLanding.qrInstructions")}
          </Text>
        </div>
      )}
    </div>
  );
};

const DEV_QUICK_ROLE_KEYS: { labelKey: string; role: StaffRole; emoji: string }[] = [
  { labelKey: "staffLanding.roles.owner", role: "owner", emoji: "👑" },
  { labelKey: "staffLanding.roles.manager", role: "manager", emoji: "🧠" },
  { labelKey: "staffLanding.roles.waiter", role: "waiter", emoji: "🍽️" },
  { labelKey: "staffLanding.roles.kitchen", role: "kitchen", emoji: "🔥" },
  { labelKey: "staffLanding.roles.cleaning", role: "cleaning", emoji: "🧹" },
];

export const AppStaffLanding: React.FC = () => {
  const { t } = useTranslation("common");
  const {
    createLocalContract,
    restaurantId,
    joinRemoteOperation,
    devQuickCheckIn,
  } = useStaff();
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "initial" | "select_type" | "connect_code" | "select_person"
  >("initial");

  // WRAPPER — app-like: padding compacto, sem centralização tipo landing
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={styles.wrapper}>
      <div className={styles.wrapperInner}>{children}</div>
    </div>
  );

  // STEP 1: THE DOOR
  if (step === "initial") {
    return (
      <Wrapper>
        <div className={styles.sectionHeader}>
          {/* Logo canónico — chapéu geométrico dourado. Ver LOGO_IDENTITY_CONTRACT.md */}
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className={styles.logoImage}
          />
          <div className={styles.brandRow}>
            <span className={styles.brandGold}>CHEFIAPP™</span>
            <span className={styles.brandRed}>OS</span>
          </div>
          <Text size="xs" color="tertiary" className={styles.tagline}>
            {t("staffLanding.tagline")}
          </Text>
        </div>

        <div className={styles.optionsList}>
          {/* MODE B: EXISTING (THE BRIDGE) */}
          <Card surface="layer1" padding="lg" className={styles.clickableCard}>
            <div
              onClick={() => setStep("connect_code")}
              className={styles.cardFill}
            >
              <Text size="lg" weight="bold" color="primary">
                {t("staffLanding.enterWithCode")}
              </Text>
              <Text size="xs" color="tertiary" className={styles.subtitle}>
                {t("staffLanding.enterWithCodeDesc")}
              </Text>
            </div>
          </Card>

          {/* TRIAL GUIDE: Entrar como funcionário (lista de pessoas → connectByCode) */}
          {RUNTIME.isTrial && restaurantId && (
            <Card
              surface="layer1"
              padding="lg"
              className={styles.clickableCard}
            >
              <div
                onClick={() => setStep("select_person")}
                className={styles.cardFill}
              >
                <Text size="lg" weight="bold" color="primary">
                  {t("staffLanding.enterAsEmployee")}
                </Text>
                <Text size="xs" color="tertiary" className={styles.subtitle}>
                  {t("staffLanding.enterAsEmployeeDesc")}
                </Text>
              </div>
            </Card>
          )}

          {/* MODE A: STANDALONE */}
          <Button
            tone="neutral"
            variant="ghost"
            fullWidth
            size="sm"
            onClick={() => setStep("select_type")}
            className={styles.centerButton}
          >
            {t("staffLanding.localOperation")}
          </Button>

          {/* DEV/TRIAL: Staff Switcher — entrada rápida por perfil (instrumento de validação) */}
          {/* ── App distribution (mock placeholders) ── */}
          <DistributionSection />

          {isDebugMode() && (
            <div className={styles.devSection}>
              <Text
                size="sm"
                weight="bold"
                color="primary"
                className={styles.devLabel}
              >
                {t("staffLanding.enterAs")}
              </Text>
              <div className={styles.devRoles}>
                {DEV_QUICK_ROLE_KEYS.map(({ labelKey, role, emoji }) => (
                  <Button
                    key={role}
                    tone="secondary"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      devQuickCheckIn(role);
                      navigate(STAFF_LAUNCHER_PATH);
                    }}
                  >
                    {emoji} {t(labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Wrapper>
    );
  }

  // STEP 1.5: CONNECT CODE INPUT
  if (step === "connect_code") {
    return (
      <Wrapper>
        <ConnectCodeView onBack={() => setStep("initial")} />
      </Wrapper>
    );
  }

  // STEP: SELECT PERSON (TRIAL GUIDE — Entrar como funcionário via connectByCode)
  if (step === "select_person" && restaurantId) {
    return (
      <Wrapper>
        <SelectPersonView
          restaurantId={restaurantId}
          onSelect={async (person) => {
            const result = await joinRemoteOperation(person.staff_code);
            if (result.success) navigate(STAFF_LAUNCHER_PATH);
            return result;
          }}
          onBack={() => setStep("initial")}
        />
      </Wrapper>
    );
  }

  // STEP 2: BUSINESS SELECTOR (CORE 1 MINI)
  return (
    <Wrapper>
      <div className={styles.sectionHeader}>
        <Text size="lg" weight="bold" color="primary">
          {t("staffLanding.whatToOperate")}
        </Text>
      </div>

      <div className={styles.optionsList}>
        {(["cafe", "restaurant", "bar"] as BusinessType[]).map((type) => (
          <Card
            key={type}
            surface="layer1"
            padding="lg"
            className={styles.clickableCard}
          >
            <div
              onClick={() => createLocalContract(type)}
              className={styles.businessRow}
            >
              <Text size="lg" weight="bold" color="primary">
                {type === "cafe"
                  ? `☕ ${t("bootstrap.restaurantTypes.cafe")}`
                  : type === "bar"
                  ? `🍸 ${t("bootstrap.restaurantTypes.bar")}`
                  : `🍽️ ${t("bootstrap.restaurantTypes.restaurant")}`}
              </Text>
              <Text size="lg" color="tertiary">
                →
              </Text>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.backSection}>
        <Button
          tone="neutral"
          variant="ghost"
          fullWidth
          size="sm"
          onClick={() => setStep("initial")}
        >
          {t("back")}
        </Button>
      </div>
    </Wrapper>
  );
};

// 🔌 THE BRIDGE UI
const ConnectCodeView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation("common");
  const { joinRemoteOperation } = useStaff();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await joinRemoteOperation(code);
    if (!result.success) {
      setError(result.message || t("staffLanding.unknownError"));
      setLoading(false);
    }
  };

  return (
    <div className={styles.connectFullWidth}>
      <div className={styles.sectionHeader}>
        <Text size="lg" weight="bold" color="primary">
          {t("staffLanding.insertCode")}
        </Text>
        <Text size="xs" color="tertiary" className={styles.subtitle}>
          {t("staffLanding.panelCode")}
        </Text>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CHEF-XXXX-XX"
          className={styles.codeInput}
          autoFocus
        />

        {error && (
          <div className={styles.errorBlock}>
            <Text size="sm" color="destructive">
              {error}
            </Text>
          </div>
        )}

        <Button
          type="submit"
          tone="action"
          fullWidth
          disabled={loading || code.length < 5}
          className={styles.centerButton}
        >
          {loading ? t("staffLanding.verifying") : t("staffLanding.connect")}
        </Button>
      </form>

      {isDebugMode() && (
        <div className={styles.debugCodesSection}>
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            className={styles.debugLabel}
          >
            {t("staffLanding.demoGuideCodesLabel")}
          </Text>
          <ul className={styles.debugList}>
            <li>
              {t("staffLanding.roles.owner")}:{" "}
              <code className={styles.codeText}>{TRIAL_GUIDE_CODES.owner}</code>
            </li>
            <li>
              {t("staffLanding.roles.manager")}:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.manager}
              </code>
            </li>
            <li>
              {t("staffLanding.roles.waiter")}:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.waiter}
              </code>
            </li>
            <li>
              {t("staffLanding.roles.cook")}:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.kitchen}
              </code>
            </li>
            <li>
              {t("staffLanding.roles.cleaning")}:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.cleaning}
              </code>
            </li>
            <li>
              {t("staffLanding.roles.staff")}:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.worker}
              </code>
            </li>
          </ul>
        </div>
      )}

      <div className={styles.backSection}>
        <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
          {t("back")}
        </Button>
      </div>
    </div>
  );
};

// TRIAL GUIDE: lista de pessoas — Entrar como funcionário (connectByCode por pessoa)
const SelectPersonView: React.FC<{
  restaurantId: string;
  onSelect: (
    person: CoreRestaurantPerson,
  ) => Promise<{ success: boolean; message?: string }>;
  onBack: () => void;
}> = ({ restaurantId, onSelect, onBack }) => {
  const { t } = useTranslation("common");
  const [people, setPeople] = React.useState<CoreRestaurantPerson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    readRestaurantPeople(restaurantId)
      .then((list) => {
        if (!cancelled) setPeople(list);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : t("staffLanding.errorLoadPeople"),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleSelect = async (person: CoreRestaurantPerson) => {
    setJoiningId(person.id);
    setError(null);
    try {
      const result = await onSelect(person);
      if (!result.success) setError(result.message ?? t("staffLanding.errorJoining"));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className={styles.connectFullWidth}>
      <div className={styles.selectHeader}>
        <Text size="xl" weight="bold" color="primary">
          {t("staffLanding.enterAsEmployee")}
        </Text>
        <Text size="sm" color="tertiary" className={styles.selectSubtitle}>
          {t("staffLanding.choosePersonDesc")}
        </Text>
      </div>

      {loading && (
        <Text size="sm" color="tertiary" className={styles.loadingText}>
          {t("staffLanding.loadingPeople")}
        </Text>
      )}
      {error && (
        <div className={styles.errorBlock}>
          <Text size="sm" color="destructive">
            {error}
          </Text>
        </div>
      )}
      {!loading && people.length === 0 && (
        <Text size="sm" color="tertiary" className={styles.loadingText}>
          {t("staffLanding.noPeopleConfigured")}
        </Text>
      )}
      {!loading && people.length > 0 && (
        <div className={styles.personList}>
          {people.map((person) => (
            <Card
              key={person.id}
              surface="layer1"
              padding="lg"
              className={styles.clickableCard}
              style={{
                cursor: joiningId === person.id ? "wait" : "pointer",
                opacity: joiningId === person.id ? 0.7 : 1,
              }}
            >
              <div
                onClick={() =>
                  joiningId === null ? handleSelect(person) : undefined
                }
                className={styles.personRow}
              >
                <div>
                  <Text size="lg" weight="bold" color="primary">
                    {person.name}
                  </Text>
                  <Text
                    size="sm"
                    color="tertiary"
                    className={styles.personRole}
                  >
                    {person.role === "manager" ? t("staffLanding.roles.manager") : t("staffLanding.roles.employee")}
                  </Text>
                </div>
                <Text size="sm" color="action">
                  {joiningId === person.id ? t("staffLanding.joining") : t("staffLanding.enterAs")}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
        {t("back")}
      </Button>
    </div>
  );
};
