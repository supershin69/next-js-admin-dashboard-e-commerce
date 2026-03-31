"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ShadcnDataTable, ShadcnColumn } from "@/app/components/ShadcnDataTable";
import { UserModel } from "@/app/interfaces/userModel";
import { fetchUserList } from "@/app/lib/fetchUserList";
import { deleteUsers } from "@/app/lib/deleteUsers";
import client from "@/app/api/client";
import { createUserBySuperadmin } from "./actions";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentRole, setCurrentRole] = useState<UserModel["role"]>("staff");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserModel["role"]>("user");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Extract<UserModel["role"], "staff" | "admin">>(
    "staff"
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, currentUserResult] = await Promise.all([
        fetchUserList(),
        client.auth.getUser(),
      ]);

      setUsers(data);

      const authUser = currentUserResult.data.user;
      if (authUser) {
        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("role")
          .eq("user_id", authUser.id)
          .single<{ role: UserModel["role"] }>();

        if (!profileError && profile) {
          setCurrentRole(profile.role);
        }
      }
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

  const canManageUser = (target: UserModel) => {
    if (currentRole === "superadmin") return true;
    if (currentRole === "admin") return target.role === "staff";
    return false;
  };

  const handleDelete = async (ids: string[]) => {
    const allowedIds = users
      .filter((user) => ids.includes(user.user_id) && canManageUser(user))
      .map((user) => user.user_id);

    if (allowedIds.length === 0) return;

    setDeleting(true);
    setError("");
    try {
      await deleteUsers(allowedIds);
      setUsers((prev) => prev.filter((user) => !allowedIds.includes(user.user_id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user: UserModel) => {
    if (!canManageUser(user)) return;
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !canManageUser(selectedUser)) return;
    if (!editName.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const roleToSave =
        currentRole === "admin"
          ? "staff"
          : editRole;

      const { data, error: updateError } = await client
        .from("profiles")
        .update({
          name: editName.trim(),
          role: roleToSave,
        })
        .eq("user_id", selectedUser.user_id)
        .select("user_id, name, role, created_at, updated_at")
        .single<UserModel>();

      if (updateError || !data) {
        throw new Error(updateError?.message ?? "Failed to update user");
      }

      setUsers((prev) =>
        prev.map((user) => (user.user_id === data.user_id ? data : user))
      );
      setEditOpen(false);
      setSelectedUser(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (currentRole !== "superadmin") return;
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setError("Email, password and role are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Session missing. Please login again.");
      }

      const result = await createUserBySuperadmin({
        accessToken: session.access_token,
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });

      if (result.error || !result.user) {
        throw new Error(result.error ?? "Failed to create user");
      }

      setUsers((prev) => [result.user!, ...prev]);
      setCreateOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");
    } catch (createUserError) {
      setError(createUserError instanceof Error ? createUserError.message : "Create failed");
    } finally {
      setSaving(false);
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
        canDelete={currentRole === "admin" || currentRole === "superadmin"}
        canDeleteRow={canManageUser}
        rowActions={(user) =>
          canManageUser(user) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(user)}
              className="gap-1 text-blue-600 hover:text-blue-700"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </Button>
          ) : null
        }
        emptyText="No users found."
        categoryLabel="Role"
        itemsPerPage={8}
        exportFileName="users"
        getExportRow={(user) => ({
          user_id: user.user_id,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        })}
        toolbarActions={
          currentRole === "superadmin" ? (
            <Button
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => setCreateOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              Create New
            </Button>
          ) : null
        }
      />

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Edit User</h3>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Name</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Role</span>
                <select
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value as UserModel["role"])}
                  disabled={currentRole === "admin"}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3 disabled:opacity-60"
                >
                  {currentRole === "admin" ? (
                    <option value="staff">staff</option>
                  ) : (
                    <>
                      <option value="user">user</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </>
                  )}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleSaveUser}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {createOpen && currentRole === "superadmin" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Create User</h3>
            <p className="mt-1 text-sm text-gray-600">
              Required: email, password, role (staff/admin).
            </p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Email</span>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Password</span>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Role</span>
                <select
                  value={newUserRole}
                  onChange={(event) =>
                    setNewUserRole(event.target.value as Extract<UserModel["role"], "staff" | "admin">)
                  }
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={handleCreateUser}
                disabled={saving}
              >
                {saving ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
