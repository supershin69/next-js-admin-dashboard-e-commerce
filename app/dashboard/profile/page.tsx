"use client";

import { useEffect, useState } from "react";
import client from "@/app/api/client";
import { Button } from "@/app/components/ui/button";
import { UserModel } from "@/app/interfaces/userModel";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserModel["role"] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: profile } = await client
          .from("profiles")
          .select("role, name")
          .eq("user_id", user.id)
          .single<{ role: UserModel["role"]; name: string }>();
        if (profile) {
          setRole(profile.role);
          setName(profile.name ?? "");
        }
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleUpdateProfile = async () => {
    if (!userId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setProfileError("Name is required.");
      setProfileMessage("");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    const { data, error } = await client
      .from("profiles")
      .update({ name: trimmedName })
      .eq("user_id", userId)
      .select("name")
      .single<{ name: string }>();

    if (error) {
      setProfileError(error.message);
    } else {
      setProfileMessage("Name updated successfully.");
      if (data?.name) setName(data.name);
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    const trimmedCurrent = currentPassword.trim();
    if (!trimmedCurrent) {
      setPasswordError("Current password is required.");
      setPasswordMessage("");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      setPasswordMessage("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordMessage("");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    const email = user?.email;
    if (userError || !email) {
      setPasswordError("Unable to verify current user email.");
      setSavingPassword(false);
      return;
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password: trimmedCurrent,
    });

    if (signInError) {
      setPasswordError("Current password is incorrect.");
      setSavingPassword(false);
      return;
    }

    const { error: updateError } = await client.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError(updateError.message);
    } else {
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="min-h-screen p-6">
      <section className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-gray-600">Role: {role ?? "unknown"}</p>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <h2 className="text-sm font-semibold text-gray-700">Profile Info</h2>
          <label className="block space-y-1 text-sm">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
            />
          </label>
          <Button
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={handleUpdateProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Update Name"}
          </Button>
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <h2 className="text-sm font-semibold text-gray-700">Change Password</h2>
          <label className="block space-y-1 text-sm">
            <span>Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
            />
          </label>
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
            disabled={savingPassword}
          >
            {savingPassword ? "Updating..." : "Change Password"}
          </Button>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-emerald-700">{passwordMessage}</p>}
        </div>
      </section>
    </div>
  );
};

export default Profile;
