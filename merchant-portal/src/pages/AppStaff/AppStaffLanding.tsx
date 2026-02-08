import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  readRestaurantPeople,
  type CoreRestaurantPerson,
} from "../../core-boundary/readers/RestaurantPeopleReader";
import { isDebugMode } from "../../core/debugMode";
import { RUNTIME } from "../../core/runtime/RuntimeContext";
import { Button } from "../../ui/design-system/primitives/Button";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { useStaff } from "./context/StaffContext";
import type { BusinessType, StaffRole } from "./context/StaffCoreTypes";
import { DEMO_CODES } from "./data/operatorProfiles";
import { STAFF_LAUNCHER_PATH } from "./routing/staffModeConfig";

const DEV_QUICK_ROLES: { label: string; role: StaffRole; emoji: string }[] = [
  { label: "Dono", role: "owner", emoji: "👑" },
  { label: "Gerente", role: "manager", emoji: "🧠" },
  { label: "Garçom", role: "waiter", emoji: "🍽️" },
  { label: "Cozinha", role: "kitchen", emoji: "🔥" },
  { label: "Limpeza", role: "cleaning", emoji: "🧹" },
];

export const AppStaffLanding: React.FC = () => {
  const { createLocalContract, restaurantId, joinRemoteOperation, devQuickCheckIn } = useStaff();
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "initial" | "select_type" | "connect_code" | "select_person"
  >("initial");

  // WRAPPER — app-like: padding compacto, sem centralização tipo landing
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>{children}</div>
    </div>
  );

  // STEP 1: THE DOOR
  if (step === "initial") {
    return (
      <Wrapper>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Text size="3xl" weight="black" color="primary">
            ChefIApp
          </Text>
          <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
            Operação
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* MODE B: EXISTING (THE BRIDGE) */}
          <Card
            surface="layer1"
            padding="lg"
            style={{
              cursor: "pointer",
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            <div
              onClick={() => setStep("connect_code")}
              style={{ width: "100%", height: "100%" }}
            >
              <Text size="lg" weight="bold" color="primary">
                Entrar na Equipa
              </Text>
              <Text size="xs" color="tertiary" style={{ marginTop: 2 }}>
                Código ou QR
              </Text>
            </div>
          </Card>

          {/* DEMO: Entrar como funcionário (lista de pessoas → connectByCode) */}
          {RUNTIME.isDemo && restaurantId && (
            <Card
              surface="layer1"
              padding="lg"
              style={{
                cursor: "pointer",
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              <div
                onClick={() => setStep("select_person")}
                style={{ width: "100%", height: "100%" }}
              >
                <Text size="lg" weight="bold" color="primary">
                  Entrar como funcionário
                </Text>
                <Text size="xs" color="tertiary" style={{ marginTop: 2 }}>
                  Escolher pessoa (Demo)
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
            style={{ justifyContent: "center" }}
          >
            Operação local
          </Button>

          {/* DEV/DEMO: Staff Switcher — entrada rápida por perfil (instrumento de validação) */}
          {isDebugMode() && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${colors.border.subtle}`,
              }}
            >
              <Text size="sm" weight="bold" color="primary" style={{ marginBottom: 10 }}>
                Entrar como:
              </Text>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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

  // STEP: SELECT PERSON (DEMO — Entrar como funcionário via connectByCode)
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
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Text size="lg" weight="bold" color="primary">
          O que vamos operar?
        </Text>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(["cafe", "restaurant", "bar"] as BusinessType[]).map((type) => (
          <Card
            key={type}
            surface="layer1"
            padding="lg"
            style={{
              cursor: "pointer",
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            <div
              onClick={() => createLocalContract(type)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
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

      <div style={{ marginTop: 24 }}>
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
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Text size="lg" weight="bold" color="primary">
          Inserir Código
        </Text>
        <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
          Código do Painel
        </Text>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CHEF-XXXX-XX"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${colors.border.strong}`,
            fontSize: 32,
            color: colors.text.primary,
            marginBottom: 24,
            textAlign: "center",
            letterSpacing: 4,
            fontFamily: "monospace",
            outline: "none",
            padding: 8,
          }}
          autoFocus
        />

        {error && (
          <div style={{ marginBottom: 24, textAlign: "center" }}>
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
          style={{ justifyContent: "center" }}
        >
          {loading ? "A verificar..." : "Conectar"}
        </Button>
      </form>

      {isDebugMode() && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: colors.surface.layer2,
            borderRadius: 8,
          }}
        >
          <Text
            size="sm"
            weight="bold"
            color="secondary"
            style={{ marginBottom: 8, display: "block" }}
          >
            Códigos demo (com ?debug=1 na URL)
          </Text>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 13,
              color: colors.text.secondary,
              lineHeight: 1.8,
            }}
          >
            <li>
              Dono:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.owner}
              </code>
            </li>
            <li>
              Gerente:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.manager}
              </code>
            </li>
            <li>
              Garçom:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.waiter}
              </code>
            </li>
            <li>
              Cozinheiro:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.kitchen}
              </code>
            </li>
            <li>
              Limpeza:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.cleaning}
              </code>
            </li>
            <li>
              Staff:{" "}
              <code style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                {DEMO_CODES.worker}
              </code>
            </li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  );
};

// DEMO: lista de pessoas — Entrar como funcionário (connectByCode por pessoa)
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
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Text size="xl" weight="bold" color="primary">
          Entrar como funcionário
        </Text>
        <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>
          Escolha a pessoa para entrar no AppStaff com o papel dela.
        </Text>
      </div>

      {loading && (
        <Text
          size="sm"
          color="tertiary"
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          A carregar pessoas…
        </Text>
      )}
      {error && (
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <Text size="sm" color="destructive">
            {error}
          </Text>
        </div>
      )}
      {!loading && people.length === 0 && (
        <Text
          size="sm"
          color="tertiary"
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          Nenhuma pessoa configurada. Crie pessoas em Configuração → Empleados.
        </Text>
      )}
      {!loading && people.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {people.map((person) => (
            <Card
              key={person.id}
              surface="layer1"
              padding="lg"
              style={{
                cursor: joiningId === person.id ? "wait" : "pointer",
                border: `1px solid ${colors.border.subtle}`,
                opacity: joiningId === person.id ? 0.7 : 1,
              }}
            >
              <div
                onClick={() =>
                  joiningId === null ? handleSelect(person) : undefined
                }
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Text size="lg" weight="bold" color="primary">
                    {person.name}
                  </Text>
                  <Text size="sm" color="tertiary" style={{ marginTop: 2 }}>
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
