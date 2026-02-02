"use client"
import useAuth from "../hooks/useAuth"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import client from "../api/client";

 const ALLOWED_ROLES = ["staff", "admin", "superadmin"] as const;
 const AllowedRole = (typeof ALLOWED_ROLES)

const Dashboard = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
      return <p className="text-2xl">Loading...</p>
    }
  return (
    <div className="text-2xl text-bold">Welcome {user?.email}</div>
  )
}
export default Dashboard