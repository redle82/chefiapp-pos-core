import { useUser } from "@insforge/react";
import { useEffect, useState } from "react";
import DealDetail from "../components/DealDetail";
import {
  Deal,
  fetchDeals,
  logDealActivity,
  updateDealStage,
} from "../services/database";

const STAGES = ["lead", "prospect", "proposal", "negotiation", "won", "lost"];

export default function DealsPage() {
  const { user } = useUser();
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDeals();
  }, [user]);

  async function loadDeals() {
    if (!user) return;
    try {
      const { data, error } = await fetchDeals(user.id);
      if (error) throw error;

      const grouped: Record<string, Deal[]> = {};
      STAGES.forEach((stage) => (grouped[stage] = []));
      data?.forEach((deal) => {
        if (grouped[deal.stage]) grouped[deal.stage].push(deal);
      });
      setDeals(grouped);
    } catch (err) {
      console.error("Failed to load deals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetStage: string,
  ) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const currentStage = e.dataTransfer.getData("currentStage");

    if (currentStage === targetStage) return;

    try {
      await updateDealStage(dealId, targetStage);
      await logDealActivity(dealId, currentStage, targetStage);
      await loadDeals();
    } catch (err) {
      console.error("Failed to update deal stage:", err);
    }
  }

  if (loading) return <div className="text-center py-12">Loading deals...</div>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div
          key={stage}
          className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDragDrop(e, stage)}
        >
          <h3 className="font-semibold text-gray-700 mb-4 capitalize">
            {stage} ({deals[stage]?.length || 0})
          </h3>
          <div className="space-y-3">
            {deals[stage]?.map((deal) => (
              <div
                key={deal.id}
                draggable
                onClick={() => setSelectedDeal(deal)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("dealId", deal.id);
                  e.dataTransfer.setData("currentStage", stage);
                }}
                className="bg-white p-4 rounded shadow cursor-move hover:shadow-md transition"
              >
                <p className="font-semibold text-gray-800">{deal.title}</p>
                {deal.amount && (
                  <p className="text-sm text-gray-600">
                    ${deal.amount.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Updated: {new Date(deal.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedDeal && (
        <DealDetail deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  );
}
