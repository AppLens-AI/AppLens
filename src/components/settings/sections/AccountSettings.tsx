import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SettingsHeader } from "../SettingsHeader";
import { SettingsSection } from "../SettingsSection";
import { SettingsRow } from "../SettingsRow";
import {
  Camera,
  Github,
  Chrome,
  Smartphone,
  Trash2,
  Loader2,
  Apple,
  Monitor,
  LogOut,
  Key,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { userApi, sessionsApi, uploadApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { Session, AuthProvider } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

export function AccountSettings() {
  const queryClient = useQueryClient();
  const { user, setAuth, token, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || "");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete form
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Sessions Query
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await sessionsApi.getAll();
      return response.data.data || [];
    },
  });

  // Revoke Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.revoke(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.setQueryData<Session[]>(
        ["sessions"],
        (old) => old?.filter((s) => s.id !== sessionId) || [],
      );
      toast.success("Session revoked successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to revoke session");
    },
  });

  // Revoke All Sessions Mutation
  const revokeAllSessionsMutation = useMutation({
    mutationFn: () => sessionsApi.revokeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("All other sessions revoked successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to revoke sessions");
    },
  });

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsSaving(true);
      const response = await userApi.updateProfile({ name: name.trim() });
      if (token && response.data.data) {
        setAuth({ ...user!, name: response.data.data.name }, token);
      }
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setIsLoading(true);
      const uploadResponse = await uploadApi.uploadImage(file);
      const avatarUrl = uploadResponse.data.data.url;

      const response = await userApi.updateProfile({ avatar: avatarUrl });
      if (token && response.data.data) {
        setAuth({ ...user!, avatar: response.data.data.avatar }, token);
      }
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      if (user?.hasPassword) {
        await userApi.changePassword({ currentPassword, newPassword });
      } else {
        await userApi.setPassword({ password: newPassword });
      }
      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setIsLoading(true);
      await userApi.deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmation,
      });
      toast.success("Account deleted successfully");
      logout();
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    revokeSessionMutation.mutate(sessionId);
  };

  const handleRevokeAllSessions = () => {
    revokeAllSessionsMutation.mutate();
  };

  const handleUnlinkAccount = async (provider: AuthProvider) => {
    try {
      await userApi.unlinkAccount(provider);
      toast.success(`${provider} account unlinked successfully`);
      // Refresh user data
      const response = await userApi.getProfile();
      if (token && response.data.data) {
        setAuth(response.data.data, token);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to unlink account");
    }
  };

  const handleConnectAccount = (provider: string) => {
    window.location.href = `${API_BASE_URL}/api/auth/${provider}?mode=link`;
  };

  const isProviderLinked = (provider: AuthProvider) => {
    return (
      user?.provider === provider ||
      user?.linkedAccounts?.some((a) => a.provider === provider)
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Active now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Account & Profile"
        description="Manage your personal information, security, and connected accounts"
      />

      <SettingsSection title="Profile Information">
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                {getInitials(user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 cursor-pointer">
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Profile Photo</h4>
            <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB</p>
          </div>
        </div>

        <div className="grid gap-4 pt-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="flex items-center gap-3">
              <Input
                placeholder="email@example.com"
                value={user?.email || ""}
                disabled
                className="flex-1"
              />
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400"
              >
                Verified
              </Badge>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Connected Accounts"
        description="Link third-party accounts for faster login"
      >
        {isProviderLinked("google") && (
          <SettingsRow
            label="Google"
            description="Sign in with your Google account"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400"
              >
                Connected
              </Badge>
              {user?.provider !== "google" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkAccount("google")}
                  className="text-destructive hover:text-destructive"
                >
                  Unlink
                </Button>
              )}
            </div>
          </SettingsRow>
        )}

        {isProviderLinked("github") && (
          <SettingsRow
            label="GitHub"
            description="Sign in with your GitHub account"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400"
              >
                Connected
              </Badge>
              {user?.provider !== "github" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkAccount("github")}
                  className="text-destructive hover:text-destructive"
                >
                  Unlink
                </Button>
              )}
            </div>
          </SettingsRow>
        )}
      </SettingsSection>

      <SettingsSection
        title="Active Sessions"
        description="Manage your logged-in devices"
      >
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      session.isCurrentDevice ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {session.os.toLowerCase().includes("mac") ||
                    session.os.toLowerCase().includes("windows") ? (
                      <Monitor
                        className={`h-5 w-5 ${session.isCurrentDevice ? "text-primary" : "text-muted-foreground"}`}
                      />
                    ) : (
                      <Smartphone
                        className={`h-5 w-5 ${session.isCurrentDevice ? "text-primary" : "text-muted-foreground"}`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {session.deviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.location || "Unknown location"} ·{" "}
                      {formatDate(session.lastActiveAt)}
                    </p>
                  </div>
                </div>
                {session.isCurrentDevice ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    Current
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
            {sessions.length > 1 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleRevokeAllSessions}
              >
                <LogOut className="h-4 w-4" />
                Sign out of all other devices
              </Button>
            )}
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow
          label={user?.hasPassword ? "Change Password" : "Set Password"}
          description={
            user?.hasPassword
              ? "Update your password regularly for security"
              : "Set a password to enable email login"
          }
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordModal(true)}
          >
            <Key className="mr-2 h-4 w-4" />
            {user?.hasPassword ? "Update Password" : "Set Password"}
          </Button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <h4 className="font-medium text-foreground">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </SettingsSection>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              {user?.hasPassword ? "Change Password" : "Set Password"}
            </h3>
            <div className="space-y-4">
              {user?.hasPassword && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-destructive">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All your data will be permanently
              deleted.
            </p>
            <div className="space-y-4">
              {user?.hasPassword && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Type{" "}
                  <span className="font-bold text-destructive">DELETE</span> to
                  confirm
                </label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmation !== "DELETE"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete Account"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
