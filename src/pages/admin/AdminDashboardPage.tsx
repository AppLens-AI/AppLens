import { useState, useEffect } from "react";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { DashboardStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboardStats();
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setError(response.data?.message || "Failed to load dashboard stats");
      }
    } catch (err) {
      setError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <button 
          onClick={fetchStats}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "Total Users",
      value: stats?.totalUsers || 0,
      change: "+12%",
      changeType: "positive" as const,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Activity,
      label: "Active Users",
      value: stats?.activeUsers || 0,
      change: "+5%",
      changeType: "positive" as const,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: MessageSquare,
      label: "Total Feedback",
      value: stats?.totalFeedback || 0,
      change: "+8%",
      changeType: "positive" as const,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: TrendingUp,
      label: "Pending Feedback",
      value: stats?.pendingFeedback || 0,
      change: stats?.pendingFeedback && stats.pendingFeedback > 5 ? "Needs attention" : "On track",
      changeType: stats?.pendingFeedback && stats.pendingFeedback > 5 ? "negative" as const : "positive" as const,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your application's statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div 
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className={`text-xs font-medium ${
                stat.changeType === "positive" ? "text-green-500" : "text-red-500"
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a 
              href="/admin/users" 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span>Manage Users</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </a>
            <a 
              href="/admin/feedback" 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span>Review Feedback</span>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </a>
            <a 
              href="/admin/notifications" 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span>Send Notification</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">System running normally</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                {stats?.totalUsers || 0} users registered
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">
                {stats?.pendingFeedback || 0} feedback items pending review
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
