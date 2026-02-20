import client from "@/app/api/client";

export const deleteProductVariants = async (ids: string[]) => {
  const { error } = await client.from("product_variants").delete().in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
