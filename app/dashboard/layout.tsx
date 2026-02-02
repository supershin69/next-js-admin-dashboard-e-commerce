"use client"
import React from "react";
import { AuthProvider } from "../components/context/AuthProvider";
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false});

export default function DashboardLayout({children}: { children: React.ReactNode}) {
    return (
        <AuthProvider>
            <div className="flex flex-col overflow-hidden">
                <Navbar/>
                {children}
            </div>
            
        </AuthProvider>
    )
}