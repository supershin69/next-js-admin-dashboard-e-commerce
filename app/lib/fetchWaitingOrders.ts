import client from "../api/client";
import { OrderWithProfile } from "../interfaces/orderWithProfileModel";
import PendingOrderModel from "../interfaces/pendingOrderModel";

export const fetchWaitingOrders = async (): Promise<PendingOrderModel[]> => {
    const { data, error } = await client
                                .from('orders')
                                .select(`id, status, payment_status, total_amount, street: shipping_address->>street, city: shipping_address->>city, created_at, updated_at, profiles(user_id, name)`)
                                .eq('status', 'pending');

    if (error) {
        console.log('Error fetching waiting items: ', error);
        return [];
    }

    console.log('Raw data: ', data);

    const rows: PendingOrderModel[] = (data as OrderWithProfile[] ?? []).map((order) => {
        let customerName = '—';

        if (Array.isArray(order.profiles)) {
            customerName = order.profiles[0].name ?? '—';
        } else if (order.profiles) {
            customerName = order.profiles.name ?? '—';
        }

        return {
            id: order.id,
            name: customerName,
            status: order.status,
            payment_status: order.payment_status,
            total_amount: order.total_amount,
            street: order.street ?? '—',
            city: order.city ?? '—',
            created_at: order.created_at,
            updated_at: order.updated_at
        };
    });

    console.log('Mapped Rows: ', rows);

    return rows || [];


}