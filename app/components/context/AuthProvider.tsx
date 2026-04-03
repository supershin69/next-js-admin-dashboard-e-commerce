"use client";
import React, { createContext, useState } from "react";
import { AuthProdiverInterface, AuthContextInterface } from "@/app/interfaces/authProviderInterface";
import { User } from "@supabase/supabase-js";


const AuthContext = createContext<AuthContextInterface | null>(null);

const AuthProvider = ({children}: AuthProdiverInterface) => {
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading ] = useState(false);

  return (
    <AuthContext.Provider value={{user, loading}}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider };
