import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { Notification, NotificationType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  Sparkles,
  Megaphone,
  CheckCircle,
  Loader2,
  InboxIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const notificationTypeConfig: Record<
  NotificationType,
  { label: string; icon: React.ElementType; color: string }
> = {
  new_template: {
    label: "New Template",
    icon: Sparkles,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  feature_update: {
    label: "Feature Update",
    icon: Info,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  system_announcement: {
    label: "Announcement",
    icon: Megaphone,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  export_complete: {
    label: "Export Complete",
    icon: CheckCircle,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationsApi.getAll(page, pageSize),
    select: (res) => res.data.data,
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    select: (res) => res.data.data.count,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("Notification deleted");
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const notifications = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Bell className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Notifications
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {unreadCountData && unreadCountData > 0
                    ? `${unreadCountData} unread notification${unreadCountData > 1 ? "s" : ""}`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {unreadCountData && unreadCountData > 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="gap-2 rounded-xl h-11 px-5 shadow-sm hover:shadow"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 sm:py-24">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center px-4">
              <div className="p-6 rounded-3xl bg-muted/50 mb-6 ring-1 ring-border/50">
                <InboxIcon className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                No notifications yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
                When you receive notifications about templates, updates, or
                system announcements, they'll appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const config = notificationTypeConfig[notification.type] || {
                label: notification.type,
                icon: Bell,
                color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
              };
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                    notification.isRead
                      ? "bg-card/50 border-border/50 hover:border-border hover:shadow-sm"
                      : "bg-card border-primary/20 hover:border-primary/30 shadow-md hover:shadow-lg",
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                  )}

                  <div
                    className={cn(
                      "flex gap-5 sm:gap-6",
                      notification.isRead
                        ? "p-5 sm:p-6"
                        : "p-5 sm:p-6 pl-6 sm:pl-7",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 flex items-center justify-center shrink-0 p-3 rounded-xl border shadow-sm",
                        config.color,
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3
                            className={cn(
                              "font-semibold text-base sm:text-lg",
                              notification.isRead
                                ? "text-foreground/70"
                                : "text-foreground",
                            )}
                          >
                            {notification.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium px-2.5 py-0.5 rounded-md",
                              config.color,
                            )}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap font-medium">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "text-sm sm:text-base mb-4 leading-relaxed",
                          notification.isRead
                            ? "text-muted-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {notification.link && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 rounded-lg px-4 shadow-sm hover:shadow"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="font-medium">View</span>
                          </Button>
                        )}

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-2 rounded-lg px-4"
                            onClick={() =>
                              markAsReadMutation.mutate(notification.id)
                            }
                            disabled={markAsReadMutation.isPending}
                          >
                            <CheckCheck className="h-4 w-4" />
                            <span className="font-medium">Mark as read</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-2 rounded-lg px-4 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          onClick={() => deleteMutation.mutate(notification.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="font-medium">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10 sm:mt-12">
            <Button
              variant="outline"
              size="default"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl h-10 px-5 shadow-sm hover:shadow font-medium"
            >
              Previous
            </Button>
            <span className="text-sm sm:text-base text-muted-foreground px-4 font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="default"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl h-10 px-5 shadow-sm hover:shadow font-medium"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
