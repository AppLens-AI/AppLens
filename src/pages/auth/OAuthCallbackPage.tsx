import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api";

/**
 * OAuth Callback Page
 * 
 * This page handles the redirect from OAuth providers.
 * The backend sets a short-lived cookie with the JWT token,
 * which this page reads to complete the authentication.
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = getCookie("auth_token");
        
        if (!token) {
          throw new Error("No authentication token received");
        }

        deleteCookie("auth_token");

        useAuthStore.setState({ token });

        const response = await authApi.getMe();
        const user = response.data.data;

        setAuth(user, token);

        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication failed. Please try again.");
        
        setTimeout(() => {
          navigate("/login?error=Authentication failed", { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, setAuth]);

  function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  }

  function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Authentication Failed
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return null
}
