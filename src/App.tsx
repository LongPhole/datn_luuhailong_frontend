import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { AppRouter } from "./router";
import { useAuthStore } from "./stores/authStore";

function App() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    // Listen for token expiration events from API client
    const handleTokenExpired = () => {
      console.warn('Token expired - logging out user');
      logout();
      window.location.href = '/login';
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [logout]);

  return (
    <ToastProvider>
      <Router>
        <AppRouter />
      </Router>
      <ToastViewport />
    </ToastProvider>
  );
}

export default App;
