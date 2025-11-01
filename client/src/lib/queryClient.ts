import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message = data.message || res.statusText;
    
    // Se l'API restituisce 401, ricarica la pagina.
    // Il router in App.tsx intercetterà la mancanza di utente e reindirizzerà al login.
    if (res.status === 401) {
      // Pulisci la cache per sicurezza e ricarica
      queryClient.clear();
      // Usiamo il reindirizzamento di wouter se possibile, altrimenti un hard refresh
      window.location.href = '/login'; 
      throw new Error("Sessione scaduta. Reindirizzamento al login...");
    }
    
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Fondamentale per inviare/ricevere cookie di sessione
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Fondamentale per inviare/ricevere cookie di sessione
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Altrimenti, lascia che throwIfResNotOk gestisca il reindirizzamento
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minuti di cache
      retry: (failureCount, error: any) => {
        // Non ritentare su errori 401 o 404
        if (error.message.startsWith('401') || error.message.startsWith('404')) {
          return false;
        }
        return failureCount < 2; // Riprova max 2 volte
      },
    },
    mutations: {
      retry: false,
    },
  },
});
