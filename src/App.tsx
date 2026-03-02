import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./stores/authStore";
import AuthLayout from "./components/layouts/AuthLayout";
import MainLayout from "./components/layouts/MainLayout";
import NotificationProvider from "./components/NotificationProvider";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OAuthCallbackPage from "./pages/auth/OAuthCallbackPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TemplatesPage from "./pages/templates/TemplatesPage";
import { EditorPage } from "./pages/editor/EditorPage";
import ExportPage from "./pages/export/ExportPage";
import Settings from "./pages/setting/Settings";
import {
  AdminLayout,
  AdminDashboardPage,
  AdminUsersPage,
  AdminFeedbackPage,
  AdminNotificationsPage,
  AdminSettingsPage,
} from "./pages/admin";
import {
  GettingStartedPage,
  ScreenshotRequirementsPage,
  DocumentationPage,
} from "./pages/docs";
import { NotificationsPage } from "./pages/notifications";

const queryClient = new QueryClient();
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />

            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/editor/:projectId" element={<EditorPage />} />
              <Route path="/export/:projectId" element={<ExportPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              <Route
                path="/admin/notifications"
                element={<AdminNotificationsPage />}
              />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/docs" element={<DocumentationPage />} />
            <Route
              path="/docs/getting-started"
              element={<GettingStartedPage />}
            />
            <Route
              path="/docs/screenshot-requirements"
              element={<ScreenshotRequirementsPage />}
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
