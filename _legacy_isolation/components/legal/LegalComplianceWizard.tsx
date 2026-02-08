import React from "react";
import MCP_LEGAL from "../../src/lib/mcp-legal";

interface Props {
  companyId: string;
  countryCode?: string;
  onComplete?: () => void;
}

export const LegalComplianceWizard: React.FC<Props> = ({ companyId, countryCode, onComplete }) => {
  const [step, setStep] = React.useState(1);
  const [iso, setIso] = React.useState<string>(countryCode ?? "US");
  const [profile, setProfile] = React.useState<any>(null);
  const [config, setConfig] = React.useState<any>(null);

  async function start() {
    const { iso, profile, config } = await MCP_LEGAL.autoDetectAndConfigure(companyId);
    setIso(iso);
    setProfile(profile);
    setConfig(config);
    setStep(2);
  }

  async function finalize() {
    // TODO: Persist compliance setup for company
    onComplete?.();
  }

  return (
    <div>
      <h2>Legal Compliance Wizard</h2>
      {step === 1 && (
        <div>
          <p>Detecting country and loading legal profile…</p>
          <button onClick={start}>Start</button>
        </div>
      )}
      {step === 2 && profile && config && (
        <div>
          <h3>Detected Country: {iso}</h3>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
          <h4>Adapted Config</h4>
          <pre>{JSON.stringify(config, null, 2)}</pre>
          <button onClick={finalize}>Finish</button>
        </div>
      )}
    </div>
  );
};

export default LegalComplianceWizard;
