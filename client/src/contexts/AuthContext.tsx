import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
// === INIZIO MODIFICA ===
// Aggiungi useToast per i feedback
import { useToast } from "@/hooks/use-toast";
// === FINE MODIFICA ===

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  login: (user: SafeUser) => void;
  logout: () => void;
  // === INIZIO MODIFICA ===
  // Aggiungi la funzione per aggiornare il tema
  updateThemeColor: (newColor: string) => Promise<void>;
  // === FINE MODIFICA ===
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUser(): Promise<SafeUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include", 
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Errore del server durante la verifica dell'autenticazione");
  }

  return await res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  // === INIZIO MODIFICA ===
  const { toast } = useToast();
  // === FINE MODIFICA ===
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
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
  
  // === INIZIO MODIFICA ===
  // Funzione per aggiornare il colore del tema
  const updateThemeColor = async (newColor: string) => {
    // 1. Aggiornamento ottimistico
    await queryClient.cancelQueries({ queryKey: ['/api/auth/me'] });
    const previousUser = queryClient.getQueryData<SafeUser>(['/api/auth/me']);
    
    if (previousUser) {
      queryClient.setQueryData(['/api/auth/me'], {
        ...previousUser,
        theme_color: newColor,
      });
    }

    try {
      // 2. Chiamata API
      const res = await apiRequest('PUT', '/api/auth/theme', { theme_color: newColor });
      const updatedUser = await res.json();
      
      // 3. Sincronizza lo stato con la risposta (opzionale ma sicuro)
      queryClient.setQueryData(['/api/auth/me'], updatedUser);

    } catch (error: any) {
      // 4. Rollback in caso di errore
      queryClient.setQueryData(['/api/auth/me'], previousUser);
      toast({
        title: "Errore",
        description: `Impossibile salvare il colore: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // 5. Invalida per essere sicuri (opzionale se setQueryData è sufficiente)
      // queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  };
  // === FINE MODIFICA ===


  const value = {
    user: user || null,
    isLoading,
    login,
    logout,
    updateThemeColor, // Aggiungi la funzione al contesto
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
