import { createBrowserClient } from "@supabase/ssr";

const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
);

// @supabase/ssr forces autoRefreshToken=true in the browser; disable it to prevent UI churn.
if (typeof window !== "undefined") {
  const authAny = client.auth as unknown as { autoRefreshToken?: boolean };
  if (typeof authAny.autoRefreshToken === "boolean") {
    authAny.autoRefreshToken = false;
  }
  client.auth.stopAutoRefresh().catch(() => {});
}

export default client;
