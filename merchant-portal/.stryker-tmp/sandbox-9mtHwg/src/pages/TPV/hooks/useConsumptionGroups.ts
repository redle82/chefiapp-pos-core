interface ConsumptionGroup {
  id: string;
  label: string;
  color?: string;
}

interface CreateGroupInput {
  order_id: string;
  label: string;
  color: string;
}

export const useConsumptionGroups = (_orderId?: string | null) => ({
  groups: [] as ConsumptionGroup[],
  fetchGroups: async () => {},
  createGroup: async (_input: CreateGroupInput) => {},
});
