import client from "@/app/api/client";
import { OrderModel } from "@/app/interfaces/orderModel";

export const fetchOrderList = async (): Promise<OrderModel[]> => {
  const { data, error } = await client
    .from("orders")
    .select("id, customer_name, status, payment_status, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data as OrderModel[]) ?? [];
};
