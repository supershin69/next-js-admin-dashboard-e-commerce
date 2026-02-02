import { User } from "@supabase/supabase-js";
import React from "react";

export interface AuthProdiverInterface {
    children: React.ReactNode;
}

export interface AuthContextInterface {
    user: User | null;
    loading: boolean;
}