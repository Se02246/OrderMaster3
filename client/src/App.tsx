import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pagine
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import CalendarDay from "@/pages/calendar-day";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Statistics from "@/pages/statistics";
import LoginPage from "@/pages/login";

// Layout
import Sidebar from "@/components/ui/layout/Sidebar";
import Header from "@/components/ui/layout/Header";

function AppRouter() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const storedColor = localStorage.getItem("themeColor");
    if (storedColor) {
      document.documentElement.style.setProperty("--primary", storedColor);
    }
  }, []);

  // Finché non sappiamo se l'utente è loggato, non mostriamo nulla (o un caricamento)
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se non c'è utente E non siamo sulla pagina di login, reindirizza al login
  if (!user && location !== "/login") {
    return <Redirect to="/login" />;
  }
  
  // Se c'è un utente E siamo sulla pagina di login, reindirizza alla home
  if (user && location === "/login") {
     return <Redirect to="/" />;
  }

  // Se non c'è utente, mostra solo la pagina di login
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        {/* Qualsiasi altra route reindirizza al login */}
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // L'utente è loggato, mostra l'app principale
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-100">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/calendar/:year/:month/:day" component={CalendarDay} />
            <Route path="/employees" component={Employees} />
            <Route path="/employees/:id" component={EmployeeDetail} />
            <Route path="/statistics" component={Statistics} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
