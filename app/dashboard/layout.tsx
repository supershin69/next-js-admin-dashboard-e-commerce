"use client"
import React from "react";
import { AuthProvider } from "../components/context/AuthProvider";
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Sidebar = dynamic(() => import('../components/Sidebar'), { ssr: false });

export default function DashboardLayout({children}: { children: React.ReactNode}) {
    
    return (
        <AuthProvider>
            <div className="flex flex-col overflow-hidden h-screen">
                <Navbar/>
                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-64 h-full overflow-y-auto sidebar-right-border">
                        <Sidebar/>
                    </aside>
                    <main className="flex-1 overflow-y-auto px-6">
                        {children}
                    </main>
                    
                </div>
                
            </div>
            
        </AuthProvider>
    )
}