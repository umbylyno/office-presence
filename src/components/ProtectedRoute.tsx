import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function ProtectedRoute() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // 1. Controlla lo stato iniziale
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // 2. Ascolta i cambiamenti di login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Finché non sappiamo se c'è la sessione, mostra caricamento
  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center">Caricamento...</div>;
  }

  // Se non c'è sessione, redirect al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se c'è la sessione, renderizza le rotte figlie
  return <Outlet />;
}
