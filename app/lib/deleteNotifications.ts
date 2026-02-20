import client from "@/app/api/client";

export const deleteNotifications = async (ids: string[]) => {
  const { error } = await client.from("notifications").delete().in("id", ids);

  if (error) {
    throw new Error(error.message);
  }
};
