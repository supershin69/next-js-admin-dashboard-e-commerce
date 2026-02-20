export interface NotificationModel {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  sent: boolean;
  created_at: string;
}
