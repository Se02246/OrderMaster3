import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  login: (user: SafeUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// === INIZIO MODIFICA ===
// Questa funzione ora usa un 'fetch' standard per gestire
// l'errore 401 in modo specifico, senza far scattare il
// gestore di errori globale in queryClient.ts.
async function fetchUser(): Promise<SafeUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include", // Non dimenticare i cookie!
  });

  if (res.status === 401) {
    // Questo è un caso NORMALE. Significa solo che l'utente non è loggato.
    // Restituiamo null per farlo sapere a useQuery.
    return null;
  }

  if (!res.ok) {
    // Questo è un VERO errore (es. 500)
    throw new Error("Errore del server durante la verifica dell'autenticazione");
  }

  // L'utente è loggato, restituiamo i dati
  return await res.json();
}
// === FINE MODIFICA ===

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser, // Usa la nostra funzione modificata
    staleTime: Infinity, 
    retry: false, 
    refetchOnWindowFocus: true,
  });

  const login = (loggedInUser: SafeUser) => {
    queryClient.setQueryData(["/api/auth/me"], loggedInUser);
    setLocation("/"); 
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Errore during logout:", error);
    } finally {
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/login"); 
    }
  };

  const value = {
    user: user || null,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
