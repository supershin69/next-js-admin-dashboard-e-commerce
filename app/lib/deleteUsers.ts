import client from "@/app/api/client";

export const deleteUsers = async (ids: string[]) => {
  const { error } = await client.from("profiles").delete().in("user_id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
