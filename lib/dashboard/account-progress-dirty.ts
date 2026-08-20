/** Lightweight bus so storage writes can notify cloud/local account sync. */

export const ACCOUNT_PROGRESS_DIRTY_EVENT = "nga:account-progress-dirty";
export const ACCOUNT_PROGRESS_RESTORED_EVENT = "nga:account-progress-restored";

let suppressDirty = 0;

export function beginAccountProgressApply(): void {
  suppressDirty += 1;
}

export function endAccountProgressApply(): void {
  suppressDirty = Math.max(0, suppressDirty - 1);
}

export function markAccountProgressDirty(): void {
  if (typeof window === "undefined" || suppressDirty > 0) return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_PROGRESS_DIRTY_EVENT));
}

export function dispatchAccountProgressRestored(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_PROGRESS_RESTORED_EVENT));
}
