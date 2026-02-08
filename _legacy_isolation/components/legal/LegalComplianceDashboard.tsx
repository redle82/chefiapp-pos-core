import React from "react";
import MCP_LEGAL from "../../src/lib/mcp-legal";

interface Props {
  companyId: string;
  countryCode: string;
}

export const LegalComplianceDashboard: React.FC<Props> = ({ companyId, countryCode }) => {
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [actions, setActions] = React.useState<string[]>([]);
  const [score, setScore] = React.useState<number>(0);

  React.useEffect(() => {
    (async () => {
      const w = await MCP_LEGAL.getComplianceWarnings(companyId, countryCode);
      const a = await MCP_LEGAL.getRequiredActions(companyId, countryCode);
      const s = await MCP_LEGAL.calculateComplianceScore(companyId, countryCode);
      setWarnings(w);
      setActions(a);
      setScore(s.score);
    })();
  }, [companyId, countryCode]);

  return (
    <div>
      <h2>Compliance Dashboard</h2>
      <p>Country: {countryCode}</p>
      <p>Compliance Score: {score}%</p>
      <h3>Warnings</h3>
      <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
      <h3>Required Actions</h3>
      <ul>{actions.map((a) => <li key={a}>{a}</li>)}</ul>
    </div>
  );
};

export default LegalComplianceDashboard;
