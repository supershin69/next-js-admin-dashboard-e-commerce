import client from "@/app/api/client";

export const deleteProducts = async (ids: string[]) => {
  const { error } = await client.from("products").delete().in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
