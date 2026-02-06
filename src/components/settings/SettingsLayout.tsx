import { useState } from "react";
import { SettingsSidebar, SettingsCategory } from "./SettingsSidebar";
import { AccountSettings } from "./sections/AccountSettings";
import { NotificationSettings } from "./sections/NotificationSettings";
import { HelpSettings } from "./sections/HelpSettings";

export function SettingsLayout() {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("account");

  const renderContent = () => {
    switch (activeCategory) {
      case "account":
        return <AccountSettings />;
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
