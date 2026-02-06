import { cn } from "@/lib/utils";
import { User, Bell, HelpCircle } from "lucide-react";

export type SettingsCategory =
  | "account"
  | "editor"
  | "projects"
  | "export"
  | "appearance"
  | "notifications"
  | "storage"
  | "advanced"
  | "help";

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

const categories = [
  { id: "account" as const, label: "Account & Profile", icon: User },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "help" as const, label: "Help & About", icon: HelpCircle },
];

export function SettingsSidebar({
  activeCategory,
  onCategoryChange,
}: SettingsSidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar p-4">
      <div className="mb-6 flex items-center gap-3 px-3">
        <h1 className="font-semibold text-foreground text-xl">Settings</h1>
      </div>

      <nav className="space-y-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
