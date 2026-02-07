import { redirect } from "next/navigation";
import client from "../api/client";

export const logout = async () => {
    await client.auth.signOut();
    redirect('/login');
}