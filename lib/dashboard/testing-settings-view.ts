import { useEffect, useState } from "react";
import { readPersisted, writePersisted } from "@/lib/dev/client-persist";
import { useUserSession } from "@/lib/dashboard/use-user-session";

export type TestingSettingsView = "child" | "parent";

/** Testing-only Settings role override so parent controls can be inspected. */
export const TESTING_SETTINGS_VIEW_STORAGE_KEY = "nga_testing_settings_view";
export const TESTING_SETTINGS_VIEW_UPDATED_EVENT =
  "nga:testing-settings-view-updated";

function isTestingSettingsView(value: string | null): value is TestingSettingsView {
  return value === "child" || value === "parent";
}

export function readTestingSettingsView(): TestingSettingsView | null {
  const raw = readPersisted(TESTING_SETTINGS_VIEW_STORAGE_KEY);
  return isTestingSettingsView(raw) ? raw : null;
}

export function saveTestingSettingsView(view: TestingSettingsView): void {
  writePersisted(TESTING_SETTINGS_VIEW_STORAGE_KEY, view);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TESTING_SETTINGS_VIEW_UPDATED_EVENT));
}

export function useTestingSettingsView(): TestingSettingsView | null {
  const [view, setView] = useState<TestingSettingsView | null>(null);

  useEffect(() => {
    const sync = () => setView(readTestingSettingsView());
    sync();
    window.addEventListener(TESTING_SETTINGS_VIEW_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(TESTING_SETTINGS_VIEW_UPDATED_EVENT, sync);
    };
  }, []);

  return view;
}

/** Settings parent-only controls: testing override, else the real account role. */
export function useSettingsParentView(): boolean {
  const session = useUserSession();
  const override = useTestingSettingsView();

  if (override) return override === "parent";
  return session?.accountRole === "parent_master";
}
