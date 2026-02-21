// @ts-nocheck
interface GroupSelectorProps {
  groups: Array<{ id: string; label?: string; name?: string }>;
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
  onCreateNew: () => void;
}

export const GroupSelector = ({
  groups,
  selectedGroupId,
  onSelect,
  onCreateNew,
}: GroupSelectorProps) => (
  <div className="flex flex-col gap-2">
    {groups.map((group) => (
      <button
        key={group.id}
        type="button"
        onClick={() => onSelect(group.id)}
        className={`rounded-md px-3 py-2 text-left text-sm ${
          selectedGroupId === group.id
            ? "bg-emerald-600 text-white"
            : "bg-zinc-900/60 text-zinc-200"
        }`}
      >
        {group.label || group.name || "Grupo"}
      </button>
    ))}
    <button
      type="button"
      onClick={onCreateNew}
      className="rounded-md px-3 py-2 text-left text-sm text-emerald-200 bg-emerald-900/40"
    >
      + Criar novo grupo
    </button>
  </div>
);
