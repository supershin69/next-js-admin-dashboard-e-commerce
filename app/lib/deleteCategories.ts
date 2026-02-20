import client from "@/app/api/client";

export const deleteCategories = async (ids: string[]) => {
  const { error } = await client.from("categories").delete().in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
