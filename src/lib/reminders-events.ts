/** Event name for when reminders/scheduled count may have changed (e.g. after scheduling or sending). */
export const REMINDERS_UPDATED_EVENT = "rippl-reminders-updated";

/** Call after scheduling an email or when reminders list changes so the sidebar badge updates. */
export function triggerRemindersRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REMINDERS_UPDATED_EVENT));
  }
}
