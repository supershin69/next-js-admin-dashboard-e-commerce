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
    let lastUserId: string | null = null;

    client.auth.getSession().then(({data}) => {
      const user = data?.session?.user || null;
      lastUserId = user?.id ?? null;
      setUser(user);
      setLoading(false);
    });

    const {data: listener} = client.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;
      const nextUserId = nextUser?.id ?? null;

      // Ignore repeated same-user notifications (like token refresh) to avoid app rerender loops
      if (nextUserId === lastUserId) return;

      lastUserId = nextUserId;
      setUser(nextUser);
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