import { useEffect, useState } from "react";
import {
  getCampaigns,
  createCampaign,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
  getCampaignStats,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
} from "../../../../core/marketing/CampaignService";
import { useRestaurantRuntime } from "../../../../core/runtime/useRestaurantRuntime";

const STATUS_COLORS: Record<CampaignStatus, string> = {
  active: "#22c55e",
  paused: "#f59e0b",
  draft: "#525252",
  completed: "#3b82f6",
};

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: "welcome", label: "Welcome" },
  { value: "win_back", label: "Win Back" },
  { value: "birthday", label: "Birthday" },
  { value: "promotion", label: "Promotion" },
  { value: "feedback", label: "Feedback" },
  { value: "loyalty_milestone", label: "Loyalty Milestone" },
];

export default function CampaignDashboardPage() {
  const { restaurantId } = useRestaurantRuntime();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "promotion" as CampaignType,
    audience_segment: "all",
    subject: "",
    content: "",
    discount_code: "",
  });

  useEffect(() => {
    if (restaurantId) {
      getCampaigns(restaurantId).then(setCampaigns);
    }
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!restaurantId || !form.name || !form.subject) return;
    const campaign = await createCampaign({
      restaurant_id: restaurantId,
      ...form,
    });
    if (campaign) {
      setCampaigns((prev) => [campaign, ...prev]);
      setShowCreate(false);
      setForm({ name: "", type: "promotion", audience_segment: "all", subject: "", content: "", discount_code: "" });
    }
  };

  const handleToggle = async (c: Campaign) => {
    const success = c.status === "active" ? await pauseCampaign(c.id) : await resumeCampaign(c.id);
    if (success) {
      setCampaigns((prev) =>
        prev.map((x) =>
          x.id === c.id ? { ...x, status: c.status === "active" ? "paused" as const : "active" as const } : x
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (await deleteCampaign(id)) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const inputStyle = {
    background: "#0a0a0a",
    border: "1px solid #262626",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fafafa",
    fontSize: 14,
    width: "100%",
  } as const;

  return (
    <div className="page-enter admin-content-page" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#fafafa", fontSize: 24, fontWeight: 700, margin: 0 }}>Marketing Campaigns</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ background: "#f59e0b", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}
        >
          {showCreate ? "Cancel" : "+ New Campaign"}
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#171717", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #262626" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4 }}>Name</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" />
            </div>
            <div>
              <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4 }}>Type</label>
              <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CampaignType })}>
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4 }}>Subject</label>
              <input style={inputStyle} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" />
            </div>
            <div>
              <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4 }}>Discount Code</label>
              <input style={inputStyle} value={form.discount_code} onChange={(e) => setForm({ ...form, discount_code: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4 }}>Content</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Campaign message..." />
          </div>
          <button onClick={handleCreate} style={{ background: "#f59e0b", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "8px 24px", fontWeight: 600, cursor: "pointer" }}>
            Create Campaign
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campaigns.length === 0 && (
          <div style={{ color: "#525252", textAlign: "center", padding: 48 }}>No campaigns yet. Create your first one!</div>
        )}
        {campaigns.map((c) => {
          const stats = getCampaignStats(c);
          return (
            <div key={c.id} style={{ background: "#171717", borderRadius: 12, padding: 20, border: "1px solid #262626" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ background: STATUS_COLORS[c.status] + "22", color: STATUS_COLORS[c.status], padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    {c.status}
                  </span>
                  <span style={{ color: "#fafafa", fontSize: 16, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: "#525252", fontSize: 12 }}>{c.type}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleToggle(c)} style={{ background: "transparent", border: "1px solid #262626", borderRadius: 6, padding: "4px 12px", color: "#a3a3a3", cursor: "pointer", fontSize: 12 }}>
                    {c.status === "active" ? "Pause" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(c.id)} style={{ background: "transparent", border: "1px solid #262626", borderRadius: 6, padding: "4px 12px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                <span style={{ color: "#a3a3a3" }}>Sent: <strong style={{ color: "#fafafa" }}>{stats.sent}</strong></span>
                <span style={{ color: "#a3a3a3" }}>Opens: <strong style={{ color: "#fafafa" }}>{stats.openRate}%</strong></span>
                <span style={{ color: "#a3a3a3" }}>Clicks: <strong style={{ color: "#fafafa" }}>{stats.clickRate}%</strong></span>
                <span style={{ color: "#a3a3a3" }}>Converted: <strong style={{ color: "#fafafa" }}>{stats.converted}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
