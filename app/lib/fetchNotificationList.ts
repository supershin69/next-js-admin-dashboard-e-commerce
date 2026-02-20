import client from "@/app/api/client";
import { NotificationModel } from "@/app/interfaces/notificationModel";

export const fetchNotificationList = async (): Promise<NotificationModel[]> => {
  const { data, error } = await client
    .from("notifications")
    .select("id, user_id, title, body, read, sent, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data as NotificationModel[]) ?? [];
};
