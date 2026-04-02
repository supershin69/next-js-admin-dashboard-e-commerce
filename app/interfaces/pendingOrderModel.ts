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
    delivery_fee_status: string;
    delivery_fee: number | null;
    cod_allowed: boolean;
    created_at: string;
    updated_at: string;
}
