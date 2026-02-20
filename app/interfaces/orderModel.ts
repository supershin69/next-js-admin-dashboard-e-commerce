export interface OrderModel {
  id: string;
  customer_name: string | null;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}
