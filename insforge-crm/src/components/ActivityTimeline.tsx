import { DealActivity } from "../services/database";

export default function ActivityTimeline({
  activities,
}: {
  activities: DealActivity[];
}) {
  if (activities.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-blue-50 rounded"
          >
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-gray-800">
                Stage changed from{" "}
                <span className="font-semibold capitalize">
                  {activity.old_stage || "new"}
                </span>{" "}
                to{" "}
                <span className="font-semibold capitalize">
                  {activity.new_stage}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
