import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsHeader } from "../SettingsHeader";
import { 
  Mail, 
  Bell, 
  Megaphone, 
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";
import type { NotificationPreferences } from "@/types";

interface NotificationCategoryProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function NotificationCategory({ icon, iconBgColor, title, description, children }: NotificationCategoryProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-4 p-4 border-b border-border bg-secondary/30">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({ label, description, checked, onCheckedChange, disabled }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 hover:bg-secondary/20 transition-colors">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, isError } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationsApi.getPreferences(),
    select: (res) => res.data.data as NotificationPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) => 
      notificationsApi.updatePreferences(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] });
      const previousPreferences = queryClient.getQueryData(["notification-preferences"]);
      queryClient.setQueryData(["notification-preferences"], (old: any) => ({
        ...old,
        data: { ...old?.data, data: { ...old?.data?.data, ...updates } }
      }));
      return { previousPreferences };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(["notification-preferences"], context.previousPreferences);
      }
      toast.error("Failed to update preference");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load preferences</h3>
        <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader 
        title="Notifications" 
        description="Control how and when you receive notifications"
      />

      <div className="space-y-4">
        <NotificationCategory
          icon={<Mail className="h-5 w-5 text-blue-500" />}
          iconBgColor="bg-blue-500/10"
          title="Email Notifications"
          description="Notifications sent to your inbox"
        >
          <NotificationToggle
            label="Export Completed"
            description="Get notified when large exports finish processing"
            checked={preferences?.emailExportComplete ?? false}
            onCheckedChange={(v) => handleToggle("emailExportComplete", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="Weekly Digest"
            description="Summary of your project activity"
            checked={preferences?.emailWeeklyDigest ?? false}
            onCheckedChange={(v) => handleToggle("emailWeeklyDigest", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="New Templates"
            description="Get notified when new templates are added"
            checked={preferences?.emailNewTemplates ?? false}
            onCheckedChange={(v) => handleToggle("emailNewTemplates", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="Feature Updates"
            description="Updates about new features and improvements"
            checked={preferences?.emailFeatureUpdates ?? false}
            onCheckedChange={(v) => handleToggle("emailFeatureUpdates", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="System Announcements"
            description="Important system-wide announcements"
            checked={preferences?.emailSystemAnnouncements ?? false}
            onCheckedChange={(v) => handleToggle("emailSystemAnnouncements", v)}
            disabled={updateMutation.isPending}
          />
        </NotificationCategory>

        <NotificationCategory
          icon={<Bell className="h-5 w-5 text-emerald-500" />}
          iconBgColor="bg-emerald-500/10"
          title="In-App Notifications"
          description="Notifications shown inside the app"
        >
          <NotificationToggle
            label="Export Completed"
            description="Show notification when exports finish"
            checked={preferences?.inAppExportComplete ?? false}
            onCheckedChange={(v) => handleToggle("inAppExportComplete", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="New Templates"
            description="Show notification when new templates are added"
            checked={preferences?.inAppNewTemplates ?? false}
            onCheckedChange={(v) => handleToggle("inAppNewTemplates", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="Feature Updates"
            description="Show notification about new features"
            checked={preferences?.inAppFeatureUpdates ?? false}
            onCheckedChange={(v) => handleToggle("inAppFeatureUpdates", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="System Announcements"
            description="Show important system announcements"
            checked={preferences?.inAppSystemAnnouncements ?? false}
            onCheckedChange={(v) => handleToggle("inAppSystemAnnouncements", v)}
            disabled={updateMutation.isPending}
          />
        </NotificationCategory>

        <NotificationCategory
          icon={<Megaphone className="h-5 w-5 text-purple-500" />}
          iconBgColor="bg-purple-500/10"
          title="Product Updates"
          description="Stay informed about our latest news"
        >
          <NotificationToggle
            label="Product Alerts"
            description="Get notified about important product updates"
            checked={preferences?.productAlerts ?? false}
            onCheckedChange={(v) => handleToggle("productAlerts", v)}
            disabled={updateMutation.isPending}
          />
          <NotificationToggle
            label="Marketing Emails"
            description="Receive occasional promotional content"
            checked={preferences?.marketingEmails ?? false}
            onCheckedChange={(v) => handleToggle("marketingEmails", v)}
            disabled={updateMutation.isPending}
          />
        </NotificationCategory>
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-emerald-600/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 shadow-lg shadow-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Stay in the loop</h4>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              We'll only send you important updates about your projects and new features. 
              No spam, ever. Your preferences are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
