export type OrderWithProfile = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  street: string;
  city: string;
  shipping_method: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  profiles: { user_id: string; name: string }[] | { user_id: string; name: string } | null;
};