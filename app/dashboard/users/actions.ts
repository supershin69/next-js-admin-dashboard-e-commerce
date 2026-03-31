"use server";

import { createClient } from "@supabase/supabase-js";
import { UserModel } from "@/app/interfaces/userModel";

type CreateUserInput = {
  accessToken: string;
  email: string;
  password: string;
  role: Extract<UserModel["role"], "staff" | "admin">;
};

type CreateUserResult = {
  user?: UserModel;
  error?: string;
};

export const createUserBySuperadmin = async (
  input: CreateUserInput
): Promise<CreateUserResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const nextSecretKey = process.env.NEXT_SECRET_KEY;

  if (!supabaseUrl || !publishableKey) {
    return { error: "Supabase env missing" };
  }

  if (!nextSecretKey) {
    return { error: "NEXT_SECRET_KEY is required for server-side user creation" };
  }

  if (!input.accessToken) {
    return { error: "Missing session token" };
  }

  const requesterClient = createClient(supabaseUrl, publishableKey);
  const adminClient = createClient(supabaseUrl, nextSecretKey);

  const {
    data: { user: requester },
    error: requesterError,
  } = await requesterClient.auth.getUser(input.accessToken);

  if (requesterError || !requester) {
    return { error: "Unauthorized" };
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("user_id", requester.id)
    .single<{ role: UserModel["role"] }>();

  if (requesterProfileError || requesterProfile?.role !== "superadmin") {
    return { error: "Only superadmin can create users" };
  }

  if (!["staff", "admin"].includes(input.role)) {
    return { error: "Invalid role. Allowed: staff, admin" };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { data: createdAuthUser, error: createAuthError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: email.split("@")[0] || "new-user",
        role: input.role,
      },
    });

  if (createAuthError || !createdAuthUser.user) {
    return { error: createAuthError?.message ?? "Failed to create auth user" };
  }

  const defaultName = email.split("@")[0] || "new-user";
  const { data: createdProfile, error: createProfileError } = await adminClient
    .from("profiles")
    .update({
      name: defaultName,
      role: input.role,
    })
    .eq("user_id", createdAuthUser.user.id)
    .select("user_id, name, role, created_at, updated_at")
    .single<UserModel>();

  if (createProfileError || !createdProfile) {
    await adminClient.auth.admin.deleteUser(createdAuthUser.user.id);
    return { error: createProfileError?.message ?? "Failed to create profile" };
  }

  return { user: createdProfile };
};
