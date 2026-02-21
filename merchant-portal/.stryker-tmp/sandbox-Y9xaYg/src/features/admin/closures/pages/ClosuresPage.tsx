import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { ClosuresEmptyState } from "../components/ClosuresEmptyState";
import { ClosuresList } from "../components/ClosuresList";
import { CreateClosureModal } from "../components/CreateClosureModal";
import {
  createClosure,
  getClosures,
  cancelClosure as cancelClosureService,
} from "../services/closuresService";
import type { CierreTemporal } from "../types";

const DEFAULT_LOCATION_ID = "sofia-gastrobar-ibiza";

export function ClosuresPage() {
  const [closures, setClosures] = useState<CierreTemporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadClosures = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getClosures(DEFAULT_LOCATION_ID);
      setClosures(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClosures();
  }, [loadClosures]);

  const handleCreated = useCallback(
    (_closure: CierreTemporal) => {
      loadClosures();
    },
    [loadClosures]
  );

  const handleCancel = useCallback(
    async (id: string) => {
      if (!window.confirm("Cancelar este cierre temporal?")) return;
      await cancelClosureService(id, DEFAULT_LOCATION_ID);
      loadClosures();
    },
    [loadClosures]
  );

  const handleEdit = useCallback((_id: string) => {
    // TODO: abrir modal de edição com dados do cierre
  }, []);

  const handleDuplicate = useCallback(
    async (id: string) => {
      const c = closures.find((x) => x.id === id);
      if (!c) return;
      const start = new Date(c.startAt);
      const end = new Date(c.endAt);
      const diff = end.getTime() - start.getTime();
      start.setDate(start.getDate() + 1);
      end.setTime(start.getTime() + diff);
      await createClosure({
        type: c.type,
        scope: c.scope,
        startAt: start.toISOString().slice(0, 19),
        endAt: end.toISOString().slice(0, 19),
        locationId: c.locationId,
        reason: c.reason,
        notifyClients: c.notifyClients,
      });
      loadClosures();
    },
    [closures, loadClosures]
  );

  return (
    <section className="flex flex-col gap-6">
      <AdminPageHeader
        title="Cierres temporales"
        subtitle="Pausa los pedidos online, reservas o entregas para fechas específicas."
      />

      {closures.length === 0 && !loading ? (
        <ClosuresEmptyState onNewClosure={() => setModalOpen(true)} />
      ) : (
        <ClosuresList
          closures={closures}
          loading={loading}
          onNewClosure={() => setModalOpen(true)}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onCancel={handleCancel}
        />
      )}

      {modalOpen && (
        <CreateClosureModal
          locationId={DEFAULT_LOCATION_ID}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
          createClosure={createClosure}
        />
      )}
    </section>
  );
}
