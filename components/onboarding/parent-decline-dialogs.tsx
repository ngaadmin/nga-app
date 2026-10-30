"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { copyMatrix } from "@/constants/copyMatrix";
import type { ParentDeclineFlow } from "@/lib/onboarding/use-parent-decline-flow";

const copy = copyMatrix.onboarding.parentDecline;

/** "Are you sure?" before any parent decline. Shared by every entry point. */
export function ParentDeclineConfirmDialog<T>({
  flow,
}: {
  flow: ParentDeclineFlow<T>;
}) {
  return (
    <ConfirmDialog
      isOpen={flow.isConfirmOpen}
      title={copy.confirmTitle}
      body={copy.confirmBody}
      confirmLabel={copy.confirmAction}
      busyLabel={copy.confirmBusy}
      confirmTone="destructive"
      cancelLabel={copy.cancelAction}
      busy={flow.busy}
      error={flow.error}
      onConfirm={() => void flow.confirm()}
      onCancel={flow.cancel}
      testId="parent-decline-confirm"
    />
  );
}

/**
 * "Request declined" notice with a working Close button.
 * Shown to the parent after a decline and to a declined learner.
 */
export function DeclinedNoticeDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={copy.declinedTitle}
      body={copy.declinedBody}
      confirmLabel={copy.declinedClose}
      confirmTone="primary"
      onConfirm={onClose}
      onCancel={onClose}
      testId="declined-notice"
    />
  );
}
