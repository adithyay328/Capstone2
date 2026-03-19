"use client";

import React from "react";
import Sidebar from "../../components/sidebar";
import {
  getUserSettings,
  saveUserSettings,
} from "@/app/api/user_settings/frontend";
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from "@/app/api/user_settings/types";

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [saveState, setSaveState] = React.useState<SaveState>("loading");
  const [message, setMessage] = React.useState("Loading your account settings...");

  React.useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const response = await getUserSettings();
      if (cancelled) return;

      if (response.success && response.settings) {
        setSettings(response.settings);
        setSaveState("idle");
        setMessage("These preferences are saved to your account.");
        return;
      }

      setSettings(DEFAULT_USER_SETTINGS);
      setSaveState("error");
      setMessage(response.message ?? "Failed to load saved settings. Showing defaults.");
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveState("idle");
    setMessage("You have unsaved changes.");
  };

  const handleSave = async () => {
    setSaveState("saving");
    setMessage("Saving your settings...");

    const response = await saveUserSettings(settings);
    if (!response.success || !response.settings) {
      setSaveState("error");
      setMessage(response.message ?? "Failed to save settings.");
      return;
    }

    setSettings(response.settings);
    setSaveState("saved");
    setMessage("Settings saved for your account.");
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_USER_SETTINGS);
    setSaveState("idle");
    setMessage("Defaults restored locally. Save to apply them to your account.");
  };

  const statusClassName =
    saveState === "error"
      ? "border-red-500/40 bg-red-950/30 text-red-100"
      : saveState === "saved"
        ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
        : "border-zinc-700 bg-zinc-900/50 text-zinc-200";

  return (
    <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
      <Sidebar initialOpen={false} />
      <main className="flex-1 relative pl-16">
        <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Basic account preferences for the student lab experience.
            </p>
          </div>

          <div className={`mt-5 rounded-xl border p-4 text-sm ${statusClassName}`}>
            {message}
          </div>

          <section className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/40 p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium">Editor</h2>
              <p className="text-sm text-zinc-400">
                Preferences here apply to your account and follow you across devices.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Editor Font Size</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Controls the code editor text size on lab pages.
                    </p>
                  </div>
                  <span className="rounded-md border border-zinc-600 px-3 py-1 text-sm text-zinc-200">
                    {settings.editorFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={24}
                  step={1}
                  value={settings.editorFontSize}
                  onChange={(event) =>
                    updateSetting("editorFontSize", Number(event.target.value))
                  }
                  className="mt-4 w-full accent-blue-500"
                />
              </div>

              <SettingToggle
                title="Show Help Bubble"
                description="Display the help button in the lower-right corner of lab pages."
                checked={settings.showHelpBubble}
                onChange={(checked) => updateSetting("showHelpBubble", checked)}
              />

              <SettingToggle
                title="Open Lab Instructions By Default"
                description="Keep the yellow instructions panel open when a lab first loads."
                checked={settings.openInstructionsByDefault}
                onChange={(checked) =>
                  updateSetting("openInstructionsByDefault", checked)
                }
              />

              <SettingToggle
                title="Warn Before Reinstating Submission Code"
                description="Require a confirmation before replacing the current editor contents from past submissions."
                checked={settings.warnBeforeReinstate}
                onChange={(checked) =>
                  updateSetting("warnBeforeReinstate", checked)
                }
              />
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving" || saveState === "loading"}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {saveState === "saving" ? "Saving..." : "Save Settings"}
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={saveState === "saving"}
              className="rounded-md border border-zinc-500 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset To Defaults
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

type SettingToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-950/30 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-100">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-zinc-500 bg-zinc-900 accent-blue-500"
      />
    </label>
  );
}
