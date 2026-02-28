import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Layout,
  LogOut,
  User,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Projects", icon: LayoutDashboard },
    { path: "/templates", label: "Templates", icon: Layout },
  ];

  const isEditorPage = location.pathname.includes("/editor/");

  if (isEditorPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/60 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <img
                src="/logo.png"
                alt="AppLens"
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl bg-secondary/40 border border-border/40">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`
                  flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200
                  ${showUserMenu ? "bg-secondary" : "hover:bg-white/[0.04]"}
                `}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/20 ring-1 ring-white/10">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user?.name || "User"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-scale-in">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="px-4 py-3.5 border-b border-border/50 bg-secondary/30">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1.5 px-1.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-white/[0.04] rounded-xl transition-colors">
                      <div className="p-1.5 rounded-lg bg-secondary">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span>Profile</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-white/[0.04] rounded-xl transition-colors">
                      <div className="p-1.5 rounded-lg bg-secondary">
                        <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span>Settings</span>
                    </button>

                    <div className="my-1.5 h-px bg-border/40 mx-2" />

                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      onClick={handleLogout}
                    >
                      <div className="p-1.5 rounded-lg bg-red-500/10">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
