import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(oauthError);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      const { token, user } = response.data.data;
      setAuth(user, token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  const features = [
    "Unlimited screenshot editing",
    "Professional export options",
    "Cloud storage included",
  ];

  return (
    <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-16 items-center animate-blur-in px-4">
      <div className="flex-1 max-w-lg lg:max-w-none">
        <div
          className="flex items-center gap-3 animate-slide-up opacity-0 stagger-1"
          style={{ animationFillMode: "forwards" }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 hidden sm:block"
            style={{ marginLeft: -20, marginRight: -14 }}
          />
          <span className="text-3xl font-bold text-foreground">Shotify</span>
        </div>

        <div
          className="animate-slide-up opacity-0 stagger-2"
          style={{ animationFillMode: "forwards" }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
            Transform your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              screenshots
            </span>
            <br />
            into art
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Join thousands of creators who use Shotify to create beautiful,
            share-ready images in seconds.
          </p>
        </div>

        <div
          className="space-y-3 animate-slide-up opacity-0 stagger-3"
          style={{ animationFillMode: "forwards" }}
        >
          {features.map((feature, index) => (
            <div
              key={feature}
              className="flex items-center gap-3 text-foreground group"
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="glass-card p-8 lg:p-10 hover:shadow-xl transition-shadow duration-300">
          <div
            className="text-center mb-8 animate-slide-up opacity-0 stagger-1"
            style={{ animationFillMode: "forwards" }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl animate-scale-in">
              <p className="text-sm text-destructive flex items-center gap-2">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                {error}
              </p>
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-3 mb-6 animate-slide-up opacity-0 stagger-2"
            style={{ animationFillMode: "forwards" }}
          >
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card
                         hover:bg-secondary hover:border-primary/30 transition-all duration-200 group shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                Google
              </span>
            </button>
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card
                         hover:bg-secondary hover:border-primary/30 transition-all duration-200 group shadow-sm"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                GitHub
              </span>
            </button>
          </div>

          <div
            className="flex items-center gap-4 mb-6 animate-slide-up opacity-0 stagger-2"
            style={{ animationFillMode: "forwards" }}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              className="animate-slide-up opacity-0 stagger-3"
              style={{ animationFillMode: "forwards" }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-all duration-200 shadow-sm"
                placeholder="you@example.com"
              />
            </div>

            <div
              className="animate-slide-up opacity-0 stagger-3"
              style={{ animationFillMode: "forwards" }}
            >
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                             transition-all duration-200 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl
                         hover:bg-primary/90 active:scale-[0.98]
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 group shadow-lg shadow-primary/25
                         animate-slide-up opacity-0 stagger-4"
              style={{ animationFillMode: "forwards" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm text-muted-foreground animate-slide-up opacity-0 stagger-5"
            style={{ animationFillMode: "forwards" }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        <div
          className="mt-6 flex items-center justify-center gap-6 text-muted-foreground text-xs animate-slide-up opacity-0 stagger-5"
          style={{ animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
