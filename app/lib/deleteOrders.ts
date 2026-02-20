import client from "@/app/api/client";

export const deleteOrders = async (ids: string[]) => {
  const { error } = await client.from("orders").delete().in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
