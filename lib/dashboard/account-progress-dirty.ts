/** Lightweight bus so storage writes can notify cloud/local account sync. */

export const ACCOUNT_PROGRESS_DIRTY_EVENT = "nga:account-progress-dirty";
export const ACCOUNT_PROGRESS_RESTORED_EVENT = "nga:account-progress-restored";

let suppressDirty = 0;
let restoreSettled = false;

/** True after this page has merged cloud progress, including seen page intros. */
export function isAccountProgressRestoreSettled(): boolean {
  return restoreSettled;
}

export function beginAccountProgressApply(): void {
  suppressDirty += 1;
}

export function endAccountProgressApply(): void {
  suppressDirty = Math.max(0, suppressDirty - 1);
}

export function markAccountProgressDirty(): void {
  if (typeof window === "undefined" || suppressDirty > 0) return;
  if (typeof window.dispatchEvent !== "function") return;
  if (typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_PROGRESS_DIRTY_EVENT));
}

export function dispatchAccountProgressRestored(): void {
  restoreSettled = true;
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;
  if (typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_PROGRESS_RESTORED_EVENT));
}
