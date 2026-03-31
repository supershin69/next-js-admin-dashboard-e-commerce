"use client"
import React from "react";
import { AuthProvider } from "../components/context/AuthProvider";
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Sidebar = dynamic(() => import('../components/Sidebar'), { ssr: false });

export default function DashboardLayout({children}: { children: React.ReactNode}) {
    
    return (
        <AuthProvider>
            <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
                <Navbar/>
                <div className="flex flex-1 overflow-hidden">
                    <aside className="hidden h-full w-72 overflow-y-auto border-r border-gray-200 no-scrollbar sm:block">
                        <Sidebar/>
                    </aside>
                    <main className="flex-1 overflow-y-auto px-4 md:px-6">
                        {children}
                    </main>
                    
                </div>
                
            </div>
            
        </AuthProvider>
    )
}
