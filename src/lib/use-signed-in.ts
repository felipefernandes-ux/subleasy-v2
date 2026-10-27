"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Se há sessão, lida no navegador (as páginas públicas ficam em cache no servidor, então o
 * servidor não sabe quem está vendo). undefined enquanto confere; true ou false depois.
 * É só para decidir o que mostrar: a proteção real das rotas continua no servidor.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    // getSession lê a sessão guardada no navegador, sem ida ao servidor: resolve na hora.
    supabase.auth.getSession().then(({ data }) => active && setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}
