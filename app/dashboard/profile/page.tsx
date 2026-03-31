"use client";

import { useEffect, useState } from "react";
import client from "@/app/api/client";
import { Button } from "@/app/components/ui/button";
import { UserModel } from "@/app/interfaces/userModel";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserModel["role"] | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single<{ role: UserModel["role"] }>();
        if (profile) setRole(profile.role);
      }
      setLoading(false);
    };

    load();
  }, []);

  const canChangePassword = role === "staff" || role === "admin";

  const handleChangePassword = async () => {
    if (!canChangePassword) return;
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setMessage("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    const { error: updateError } = await client.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="min-h-screen p-6">
      <section className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-gray-600">Role: {role ?? "unknown"}</p>

        {canChangePassword ? (
          <>
            <label className="block space-y-1 text-sm">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
              />
            </label>

            <Button
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={handleChangePassword}
              disabled={saving}
            >
              {saving ? "Updating..." : "Change Password"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Password change is enabled for staff and admin users.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </section>
    </div>
  );
};

export default Profile;
