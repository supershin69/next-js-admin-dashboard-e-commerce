"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { UserModel } from "@/app/interfaces/userModel";
import { fetchUserList } from "@/app/lib/fetchUserList";
import { deleteUsers } from "@/app/lib/deleteUsers";

const columns: ShadcnColumn<UserModel>[] = [
  {
    key: "id",
    header: "ID",
    cell: (user) => <span className="font-mono text-xs">{user.user_id}</span>,
  },
  {
    key: "name",
    header: "Name",
    cell: (user) => user.name,
  },
  {
    key: "role",
    header: "Role",
    cell: (user) => (
      <Badge variant={user.role === "user" ? "secondary" : "default"}>
        {user.role}
      </Badge>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    cell: (user) => new Date(user.created_at).toLocaleDateString(),
  },
];

const Users = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchUserList();
      setUsers(data);
      setLoading(false);
    };
    load();
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [users]
  );

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      await deleteUsers(ids);
      setUsers((prev) => prev.filter((user) => !ids.includes(user.user_id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ShadcnDataTable
        title="Users"
        data={sortedUsers}
        columns={columns}
        getRowId={(user) => user.user_id}
        getRowName={(user) => user.name}
        getRowCreatedAt={(user) => user.created_at}
        getRowCategory={(user) => user.role}
        onDeleteRows={handleDelete}
        deleting={deleting}
        emptyText="No users found."
        categoryLabel="Role"
        itemsPerPage={8}
      />
    </div>
  );
};

export default Users;
