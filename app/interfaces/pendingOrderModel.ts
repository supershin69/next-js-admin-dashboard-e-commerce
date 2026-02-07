export default interface PendingOrderModel {
    id: string;
    name: string;
    status: string;
    payment_status: string;
    total_amount: number;
    street: string;
    city: string;
    shipping_method: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
}