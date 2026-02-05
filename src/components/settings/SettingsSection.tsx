import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <div className={cn("settings-card animate-fade-in", className)}>
      <h3 className="settings-section-title">{title}</h3>
      {description && <p className="settings-section-description">{description}</p>}
      {children}
    </div>
  );
}
