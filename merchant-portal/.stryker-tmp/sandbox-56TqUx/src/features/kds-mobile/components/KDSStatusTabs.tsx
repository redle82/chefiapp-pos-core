/**
 * KDSStatusTabs — Status filter tabs with counts
 */
// @ts-nocheck


interface StatusCount {
  pending: number;
  preparing: number;
  ready: number;
}

interface KDSStatusTabsProps {
  activeTab: "pending" | "preparing" | "ready";
  counts: StatusCount;
  onTabChange: (tab: "pending" | "preparing" | "ready") => void;
}

export function KDSStatusTabs({
  activeTab,
  counts,
  onTabChange,
}: KDSStatusTabsProps) {
  const tabs: Array<{
    key: "pending" | "preparing" | "ready";
    label: string;
    emoji: string;
  }> = [
    { key: "pending", label: "Pendentes", emoji: "⏳" },
    { key: "preparing", label: "A Preparar", emoji: "🔥" },
    { key: "ready", label: "Prontos", emoji: "✅" },
  ];

  return (
    <div className="kdsm-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`kdsm-tabs__item ${
            activeTab === tab.key ? "kdsm-tabs__item--active" : ""
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="kdsm-tabs__icon">{tab.emoji}</span>
          <span className="kdsm-tabs__label">{tab.label}</span>
          <span className="kdsm-tabs__count">{counts[tab.key]}</span>
        </button>
      ))}
    </div>
  );
}
