export interface OrderModel {
  id: string;
  customer_name: string | null;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_fee_status: string;
  delivery_fee: number | null;
  cod_allowed: boolean;
  created_at: string;
}
