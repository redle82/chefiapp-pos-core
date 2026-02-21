import React, { useState } from "react";
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
  const [showQR, setShowQR] = useState(false);
  return (
    <div className={styles.distributionSection}>
      <Text size="xs" color="tertiary" className={styles.distributionTitle}>
        Disponível para sua equipe
      </Text>
      <div className={styles.storeButtons}>
        <button className={styles.storeButton} disabled>
          <span className={styles.storeIcon}>▶</span>
          <span className={styles.storeLabel}>Google Play</span>
          <span className={styles.storeBadge}>Em breve</span>
        </button>
        <button className={styles.storeButton} disabled>
          <span className={styles.storeIcon}></span>
          <span className={styles.storeLabel}>App Store</span>
          <span className={styles.storeBadge}>Em breve</span>
        </button>
      </div>
      <button className={styles.qrButton} onClick={() => setShowQR((v) => !v)}>
        📲 Instalar via QR Direto
      </button>
      {showQR && (
        <div className={styles.qrPanel}>
          <Text size="xs" color="tertiary" className={styles.qrText}>
            Abra a câmara do telemóvel e aponte para o QR gerado em Admin →
            Sistema → Dispositivos.
          </Text>
        </div>
      )}
    </div>
  );
};

const DEV_QUICK_ROLES: { label: string; role: StaffRole; emoji: string }[] = [
  { label: "Dono", role: "owner", emoji: "👑" },
  { label: "Gerente", role: "manager", emoji: "🧠" },
  { label: "Garçom", role: "waiter", emoji: "🍽️" },
  { label: "Cozinha", role: "kitchen", emoji: "🔥" },
  { label: "Limpeza", role: "cleaning", emoji: "🧹" },
];

export const AppStaffLanding: React.FC = () => {
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
            Seu Sistema Operacional
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
                Entrar com Código da Equipe
              </Text>
              <Text size="xs" color="tertiary" className={styles.subtitle}>
                Usar código ou escanear QR do restaurante
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
                  Entrar como Funcionário
                </Text>
                <Text size="xs" color="tertiary" className={styles.subtitle}>
                  Selecionar perfil individual (modo teste)
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
            Operação local
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
                Entrar como:
              </Text>
              <div className={styles.devRoles}>
                {DEV_QUICK_ROLES.map(({ label, role, emoji }) => (
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
                    {emoji} {label}
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
          O que vamos operar?
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
                  ? "☕ Café"
                  : type === "bar"
                  ? "🍸 Bar"
                  : "🍽️ Restaurante"}
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
          Voltar
        </Button>
      </div>
    </Wrapper>
  );
};

// 🔌 THE BRIDGE UI
const ConnectCodeView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
      setError(result.message || "Erro desconhecido");
      setLoading(false);
    }
  };

  return (
    <div className={styles.connectFullWidth}>
      <div className={styles.sectionHeader}>
        <Text size="lg" weight="bold" color="primary">
          Inserir Código
        </Text>
        <Text size="xs" color="tertiary" className={styles.subtitle}>
          Código do Painel
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
          {loading ? "A verificar..." : "Conectar"}
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
            Códigos Demo Guide (com ?debug=1 na URL)
          </Text>
          <ul className={styles.debugList}>
            <li>
              Dono:{" "}
              <code className={styles.codeText}>{TRIAL_GUIDE_CODES.owner}</code>
            </li>
            <li>
              Gerente:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.manager}
              </code>
            </li>
            <li>
              Garçom:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.waiter}
              </code>
            </li>
            <li>
              Cozinheiro:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.kitchen}
              </code>
            </li>
            <li>
              Limpeza:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.cleaning}
              </code>
            </li>
            <li>
              Staff:{" "}
              <code className={styles.codeText}>
                {TRIAL_GUIDE_CODES.worker}
              </code>
            </li>
          </ul>
        </div>
      )}

      <div className={styles.backSection}>
        <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
          Voltar
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
            e instanceof Error ? e.message : "Erro ao carregar pessoas.",
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
      if (!result.success) setError(result.message ?? "Erro ao entrar.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className={styles.connectFullWidth}>
      <div className={styles.selectHeader}>
        <Text size="xl" weight="bold" color="primary">
          Entrar como funcionário
        </Text>
        <Text size="sm" color="tertiary" className={styles.selectSubtitle}>
          Escolha a pessoa para entrar no AppStaff com o papel dela.
        </Text>
      </div>

      {loading && (
        <Text size="sm" color="tertiary" className={styles.loadingText}>
          A carregar pessoas…
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
          Nenhuma pessoa configurada. Crie pessoas em Configuração → Empleados.
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
                    {person.role === "manager" ? "Gerente" : "Funcionário"}
                  </Text>
                </div>
                <Text size="sm" color="action">
                  {joiningId === person.id ? "A entrar…" : "Entrar como →"}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
        Voltar
      </Button>
    </div>
  );
};
