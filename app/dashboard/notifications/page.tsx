"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { NotificationModel } from "@/app/interfaces/notificationModel";
import { fetchNotificationList } from "@/app/lib/fetchNotificationList";
import { deleteNotifications } from "@/app/lib/deleteNotifications";

const columns: ShadcnColumn<NotificationModel>[] = [
  {
    key: "id",
    header: "Notification ID",
    cell: (notification) => (
      <span className="font-mono text-xs">{notification.id}</span>
    ),
  },
  {
    key: "title",
    header: "Title",
    cell: (notification) => notification.title,
  },
  {
    key: "user_id",
    header: "User ID",
    cell: (notification) => (
      <span className="font-mono text-xs">{notification.user_id}</span>
    ),
  },
  {
    key: "status",
    header: "State",
    cell: (notification) => (
      <div className="flex gap-1">
        <Badge variant={notification.sent ? "success" : "warning"}>
          {notification.sent ? "sent" : "queued"}
        </Badge>
        <Badge variant={notification.read ? "default" : "secondary"}>
          {notification.read ? "read" : "unread"}
        </Badge>
      </div>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    cell: (notification) => new Date(notification.created_at).toLocaleDateString(),
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchNotificationList();
      setNotifications(data);
      setLoading(false);
    };
    load();
  }, []);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [notifications]
  );

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      await deleteNotifications(ids);
      setNotifications((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ShadcnDataTable
        title="Notifications"
        data={sortedNotifications}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.title}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={(row) => (row.read ? "read" : "unread")}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No notifications found."
        categoryLabel="Read State"
        itemsPerPage={8}
        exportFileName="notifications"
        getExportRow={(row) => ({
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          body: row.body,
          sent: row.sent,
          read: row.read,
          created_at: row.created_at,
        })}
      />
    </div>
  );
};

export default Notifications;
