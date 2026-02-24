import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SettingsSidebar, SettingsCategory } from "./SettingsSidebar";
import { AccountSettings } from "./sections/AccountSettings";
import { NotificationSettings } from "./sections/NotificationSettings";
import { HelpSettings } from "./sections/HelpSettings";
import { AISettings } from "./sections/AISettings";

export function SettingsLayout() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") as SettingsCategory | null;
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>(initialTab || "account");

  const renderContent = () => {
    switch (activeCategory) {
      case "account":
        return <AccountSettings />;
      case "ai":
        return <AISettings />;
      case "notifications":
        return <NotificationSettings />;
      case "help":
        return <HelpSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SettingsSidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{renderContent()}</div>
      </main>
    </div>
  );
}
