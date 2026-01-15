"use client";
import Sidebar from "../../components/sidebar";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
      <Sidebar initialOpen={false} />
      <main className="flex-1 relative pl-16">
        <div className="px-4 mt-4 md:px-6">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-zinc-300">
            App preferences and configuration will live here.
          </p>
        </div>
      </main>
    </div>
  );
}
