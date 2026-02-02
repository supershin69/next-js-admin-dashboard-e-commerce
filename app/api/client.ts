import { createBrowserClient } from "@supabase/ssr";

const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default client;