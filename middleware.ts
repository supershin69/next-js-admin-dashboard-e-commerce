import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    req.cookies.set({ name, value, ...options});
                    res.cookies.set({name, value, ...options});
                },
                remove(name, options) {
                    req.cookies.set({ name, value: '', ...options});
                    res.cookies.set({name, value: '', ...options});
                }

            }
        }
    );

    console.log("Incoming cookies:", req.cookies.getAll());

    const { data: { user } } = await supabase.auth.getUser();

    console.log("Session from middleware:", user);

    if(!user) {
        const redirectResponse = NextResponse.redirect(new URL('/login', req.url))
        // Manually copy the cookies from your 'res' (where supabase-ssr put them)
        res.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('user_id', user.id)
                                    .single()
    
    console.log("Role found:", profile);

    const allowedProfileRoles = ['staff', 'admin', 'superadmin']

    if (!profile || !allowedProfileRoles.includes(profile.role)) {
        const redirectResponse = NextResponse.redirect(new URL('/not-allowed', req.url))
        // Manually copy the cookies from your 'res' (where supabase-ssr put them)
        res.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*']
}