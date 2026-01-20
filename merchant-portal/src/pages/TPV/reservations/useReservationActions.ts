import { supabase } from '../../../core/supabase';
import { useTables } from '../context/TableContext';
import { useOrders } from '../context/OrderContextReal';

export const useReservationActions = (restaurantId: string) => {
    const { updateTableStatus } = useTables();
    const { createOrder } = useOrders();

    const assignTable = async (reservationId: string, tableId: string) => {
        const { error } = await supabase
            .from('gm_reservations')
            .update({ table_id: tableId })
            .eq('id', reservationId);

        if (error) throw error;
    };

    const seatReservation = async (reservationId: string, tableId: string, partySize: number, customerName: string) => {
        // 1. Update Reservation Status
        const { error: resError } = await supabase
            .from('gm_reservations')
            .update({ status: 'SEATED' })
            .eq('id', reservationId);

        if (resError) throw resError;

        // 2. Occupy Table
        await updateTableStatus(tableId, 'occupied');

        // 3. Create Order
        try {
            await createOrder({
                tableId,
                items: [], // Start empty
                // We could pass customer info as metadata if Order Schema supports it
            });
        } catch (err) {
            console.error('Failed to auto-create order for reservation:', err);
            // Don't fail the whole flow, manual creation is possible
        }
    };

    return { assignTable, seatReservation };
};
