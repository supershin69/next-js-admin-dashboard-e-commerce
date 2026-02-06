export default interface PendingOrderModel {
    id: string;
    name: string;
    status: string;
    payment_status: string;
    total_amount: number;
    shipping_address: string;
    created_at: string;
    updated_at: string;
}