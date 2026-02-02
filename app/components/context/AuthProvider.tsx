"use client";
import React, { createContext, useState, useEffect } from "react";
import client from "@/app/api/client";
import { AuthProdiverInterface, AuthContextInterface } from "@/app/interfaces/authProviderInterface";
import { User } from "@supabase/supabase-js";


const AuthContext = createContext<AuthContextInterface | null>(null);

const AuthProvider = ({children}: AuthProdiverInterface) => {
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading, setLoading ] = useState(true);

  useEffect(()=> {
    client.auth.getSession().then(({data}) => {
      setUser(data?.session?.user || null);
      setLoading(false);
    });

    const {data: listener} = client.auth.onAuthStateChange((e, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    }
  }, []);

  return (
    <AuthContext.Provider value={{user, loading}}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider };