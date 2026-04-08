import { headers } from "next/headers";
import { redirect } from "next/navigation";
import StudentSettingsPanel from "@/components/student-settings-panel";
import { loadUserSettingsForCookie } from "@/app/api/user_settings/internal";

export default async function StudentSettingsPage() {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";
  const result = await loadUserSettingsForCookie(cookieHeader);

  if (!result.authenticated) {
    redirect("/login");
  }

  return (
    <StudentSettingsPanel
      initialSettings={result.settings}
      initialSaveState={result.success ? "idle" : "error"}
      initialMessage={
        result.success
          ? "These preferences are saved to your account."
          : result.message ?? "Failed to load saved settings. Showing defaults."
      }
    />
  );
}
