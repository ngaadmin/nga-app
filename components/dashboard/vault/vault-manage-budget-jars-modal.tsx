"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BucketEmojiIcon,
  bucketTheme,
} from "@/components/dashboard/vault/vault-visuals";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { PencilIcon, TrashIcon } from "@/lib/dashboard/icons";
import {
  canAddVaultBucket,
  isCustomBucketId,
  maxVaultBuckets,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { cn } from "@/lib/utils/cn";

const JAR_EMOJI_PRESETS = [
  "🏦",
  "🛒",
  "🎁",
  "💰",
  "🎯",
  "💵",
  "🎮",
  "📚",
  "🍕",
  "✈️",
  "🎸",
  "👕",
  "🐷",
  "⭐",
  "🔥",
] as const;

const manageModalPrimaryBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const manageModalSecondaryBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF] disabled:cursor-not-allowed disabled:opacity-40";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const manageModalFieldLabelClass =
  "font-heading text-xs font-bold text-[#031F82]";

type JarDraft = {
  name: string;
  emoji: string;
};

type PendingAdd = {
  tempId: string;
  name: string;
  emoji: string;
};

type PendingDelete = {
  bucketId: VaultBucketId;
  fallbackBucketId?: VaultBucketId;
};

type ManageRow =
  | { kind: "existing"; bucket: VaultBucket }
  | { kind: "pending"; pending: PendingAdd };

function EmojiPickerGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="listbox">
      {JAR_EMOJI_PRESETS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="option"
          aria-selected={selected === emoji}
          onClick={() => onSelect(emoji)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-lg leading-none transition-colors",
            selected === emoji
              ? "border-[#0CC1E0] bg-[#BDE9FB]/40"
              : "border-[#BDE9FB]/60 bg-white hover:border-[#0CC1E0]/60",
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

type VaultManageBudgetJarsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buckets: VaultBucket[];
  isPremium: boolean;
  onRenameBucket: (bucketId: VaultBucketId, name: string, emoji?: string) => void;
  onAddCustomBucket: (name: string, emoji: string) => void;
  onDeleteCustomBucket: (
    bucketId: VaultBucketId,
    fallbackBucketId?: VaultBucketId,
  ) => void;
  onBucketDeleted?: (bucketId: VaultBucketId) => void;
};

export function VaultManageBudgetJarsModal({
  isOpen,
  onClose,
  buckets,
  isPremium,
  onRenameBucket,
  onAddCustomBucket,
  onDeleteCustomBucket,
  onBucketDeleted,
}: VaultManageBudgetJarsModalProps) {
  const budgetCopy = copyMatrix.dashboard.vault.budget;

  const [drafts, setDrafts] = useState<Record<string, JarDraft>>({});
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<PendingDelete[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newJarName, setNewJarName] = useState("");
  const [newJarEmoji, setNewJarEmoji] = useState("💰");
  const [deleteTarget, setDeleteTarget] = useState<VaultBucket | null>(null);
  const [deleteFallbackId, setDeleteFallbackId] = useState<VaultBucketId | "">("");

  const bucketLimit = maxVaultBuckets(isPremium);
  const pendingDeleteIds = useMemo(
    () => new Set(pendingDeletes.map((entry) => entry.bucketId)),
    [pendingDeletes],
  );

  const visibleBuckets = useMemo(
    () => buckets.filter((bucket) => !pendingDeleteIds.has(bucket.id)),
    [buckets, pendingDeleteIds],
  );

  const displayRows = useMemo((): ManageRow[] => {
    const existing: ManageRow[] = visibleBuckets.map((bucket) => ({
      kind: "existing",
      bucket,
    }));
    const pending: ManageRow[] = pendingAdds.map((entry) => ({
      kind: "pending",
      pending: entry,
    }));
    return [...existing, ...pending];
  }, [pendingAdds, visibleBuckets]);

  const totalJarCount = visibleBuckets.length + pendingAdds.length;
  const canAddMore = canAddVaultBucket(
    buckets.length - pendingDeletes.length + pendingAdds.length,
    isPremium,
  );

  const fallbackOptions = useMemo(
    () =>
      deleteTarget
        ? visibleBuckets.filter((bucket) => bucket.id !== deleteTarget.id)
        : [],
    [deleteTarget, visibleBuckets],
  );

  const resetLocalState = useCallback(() => {
    setDrafts({});
    setPendingAdds([]);
    setPendingDeletes([]);
    setEditingRowId(null);
    setAddFormOpen(false);
    setNewJarName("");
    setNewJarEmoji("💰");
    setDeleteTarget(null);
    setDeleteFallbackId("");
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetLocalState();
      return;
    }

    const nextDrafts: Record<string, JarDraft> = {};
    for (const bucket of buckets) {
      nextDrafts[bucket.id] = {
        name: bucket.name,
        emoji: bucket.emoji,
      };
    }
    setDrafts(nextDrafts);
  }, [buckets, isOpen, resetLocalState]);

  useEffect(() => {
    if (!deleteTarget) return;
    setDeleteFallbackId(fallbackOptions[0]?.id ?? "");
  }, [deleteTarget, fallbackOptions]);

  const hasChanges = useMemo(() => {
    if (pendingAdds.length > 0 || pendingDeletes.length > 0) return true;

    for (const bucket of buckets) {
      if (pendingDeleteIds.has(bucket.id)) continue;
      const draft = drafts[bucket.id];
      if (!draft) continue;
      if (draft.name.trim() !== bucket.name || draft.emoji !== bucket.emoji) {
        return true;
      }
    }

    return false;
  }, [buckets, drafts, pendingAdds.length, pendingDeletes.length, pendingDeleteIds]);

  function getRowDraft(rowId: string, fallback: JarDraft): JarDraft {
    return drafts[rowId] ?? fallback;
  }

  function updateRowDraft(rowId: string, patch: Partial<JarDraft>, fallback: JarDraft) {
    setDrafts((current) => ({
      ...current,
      [rowId]: { ...getRowDraft(rowId, fallback), ...patch },
    }));
  }

  function handleAddToList() {
    const trimmed = newJarName.trim();
    if (!trimmed || !canAddMore) return;

    const tempId = `pending-add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPendingAdds((current) => [
      ...current,
      { tempId, name: trimmed, emoji: newJarEmoji },
    ]);
    setDrafts((current) => ({
      ...current,
      [tempId]: { name: trimmed, emoji: newJarEmoji },
    }));
    setNewJarName("");
    setNewJarEmoji("💰");
    setAddFormOpen(false);
  }

  function queueDelete() {
    if (!deleteTarget || !isCustomBucketId(deleteTarget.id)) return;

    const entry: PendingDelete = { bucketId: deleteTarget.id };
    if (deleteTarget.balance > 0) {
      if (!deleteFallbackId || deleteFallbackId === deleteTarget.id) return;
      entry.fallbackBucketId = deleteFallbackId;
    }

    setPendingDeletes((current) => [...current, entry]);
    setEditingRowId((current) => (current === deleteTarget.id ? null : current));
    setDeleteTarget(null);
    setDeleteFallbackId("");
  }

  function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }

    for (const bucket of buckets) {
      if (pendingDeleteIds.has(bucket.id)) continue;
      const draft = drafts[bucket.id];
      if (!draft) continue;
      const trimmed = draft.name.trim();
      if (!trimmed) continue;
      if (trimmed !== bucket.name || draft.emoji !== bucket.emoji) {
        onRenameBucket(bucket.id, trimmed, draft.emoji);
      }
    }

    for (const add of pendingAdds) {
      const draft = drafts[add.tempId] ?? add;
      onAddCustomBucket(draft.name.trim() || add.name, draft.emoji);
    }

    for (const del of pendingDeletes) {
      onDeleteCustomBucket(del.bucketId, del.fallbackBucketId);
      onBucketDeleted?.(del.bucketId);
    }

    resetLocalState();
    onClose();
  }

  function handleCancel() {
    resetLocalState();
    onClose();
  }

  function toggleEdit(rowId: string) {
    setEditingRowId((current) => (current === rowId ? null : rowId));
  }

  const deleteNeedsFallback = (deleteTarget?.balance ?? 0) > 0;
  const canConfirmDelete =
    deleteTarget !== null &&
    (!deleteNeedsFallback ||
      (deleteFallbackId !== "" && deleteFallbackId !== deleteTarget.id));

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={handleCancel}
        align="center"
        labelledBy="vault-manage-jars-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,36rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-manage-jars-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {vaultCopy.manageBudgetJarsTitle}
              </h2>
              <p className="mt-1 font-sans text-xs leading-snug text-[#1E3A5F]/70">
                {vaultCopy.manageBudgetJarsBody}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              aria-label={vaultCopy.closeModalLabel}
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddFormOpen((open) => !open)}
            disabled={!canAddMore}
            className={cn(
              "mt-4 h-touch w-full",
              manageModalSecondaryBtnClass,
              !canAddMore && "opacity-40",
            )}
          >
            {vaultCopy.addBudgetJar}
          </button>

          {addFormOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-[#BDE9FB] bg-[#FAFDFF]/80 p-3">
              <label className="block">
                <span className={manageModalFieldLabelClass}>
                  {vaultCopy.jarNameLabel}
                </span>
                <input
                  type="text"
                  value={newJarName}
                  onChange={(event) => setNewJarName(event.target.value)}
                  placeholder={vaultCopy.jarNamePlaceholder}
                  className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
                />
              </label>
              <div>
                <p className={manageModalFieldLabelClass}>{vaultCopy.jarIconLabel}</p>
                <div className="mt-1">
                  <EmojiPickerGrid selected={newJarEmoji} onSelect={setNewJarEmoji} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddToList}
                disabled={!newJarName.trim()}
                className={cn("h-touch w-full", manageModalPrimaryBtnClass)}
              >
                {vaultCopy.addJarToList}
              </button>
            </div>
          ) : null}

          <p className="mt-3 text-center font-heading text-xs font-bold text-[#1E3A5F]/60">
            {vaultCopy.bucketLimitTemplate
              .replace("{count}", String(totalJarCount))
              .replace("{max}", String(bucketLimit))}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <ul className="space-y-2.5">
            {displayRows.map((row) => {
              const rowId = row.kind === "existing" ? row.bucket.id : row.pending.tempId;
              const isCustom =
                row.kind === "pending" || isCustomBucketId(row.bucket.id);
              const fallbackDraft: JarDraft =
                row.kind === "existing"
                  ? { name: row.bucket.name, emoji: row.bucket.emoji }
                  : { name: row.pending.name, emoji: row.pending.emoji };
              const draft = getRowDraft(rowId, fallbackDraft);
              const theme = bucketTheme(
                row.kind === "existing"
                  ? row.bucket
                  : (visibleBuckets[0] ?? buckets[0]!),
              );
              const isEditing = editingRowId === rowId;
              const displayName =
                row.kind === "existing"
                  ? vaultBucketDisplayName({
                      ...row.bucket,
                      name: draft.name,
                      emoji: draft.emoji,
                    })
                  : draft.name.trim() || row.pending.name;

              return (
                <li
                  key={rowId}
                  className="rounded-xl border border-[#BDE9FB]/70 bg-[#FAFDFF]/90 p-3 shadow-sm"
                >
                  {!isEditing ? (
                    <div className="flex items-center gap-3">
                      <BucketEmojiIcon size="md" emoji={draft.emoji} theme={theme} />
                      <p className="min-w-0 flex-1 truncate font-heading text-sm font-extrabold text-[#031F82]">
                        {displayName}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleEdit(rowId)}
                          aria-label={vaultCopy.editJar}
                          className="flex size-8 items-center justify-center rounded-lg text-[#1E3A5F]/55 transition-colors hover:bg-[#BDE9FB]/30 hover:text-[#031F82]"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        {isCustom ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (row.kind === "pending") {
                                setPendingAdds((current) =>
                                  current.filter((entry) => entry.tempId !== rowId),
                                );
                                setDrafts((current) => {
                                  const next = { ...current };
                                  delete next[rowId];
                                  return next;
                                });
                                return;
                              }
                              setDeleteTarget(row.bucket);
                            }}
                            aria-label={vaultCopy.deleteJar}
                            className="flex size-8 items-center justify-center rounded-lg text-[#BE123C]/70 transition-colors hover:bg-[#FEE2E2]/60 hover:text-[#BE123C]"
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block">
                        <span className={manageModalFieldLabelClass}>
                          {vaultCopy.jarNameLabel}
                        </span>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(event) =>
                            updateRowDraft(
                              rowId,
                              { name: event.target.value },
                              fallbackDraft,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5 font-heading text-sm font-bold text-[#031F82] outline-none focus:border-[#0CC1E0]"
                        />
                      </label>
                      <div>
                        <p className={manageModalFieldLabelClass}>
                          {vaultCopy.jarIconLabel}
                        </p>
                        <div className="mt-1">
                          <EmojiPickerGrid
                            selected={draft.emoji}
                            onSelect={(emoji) =>
                              updateRowDraft(rowId, { emoji }, fallbackDraft)
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingRowId(null)}
                        className="font-heading text-xs font-bold text-[#0CC1E0] hover:underline"
                      >
                        {vaultCopy.doneEditing}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 border-t border-[#BDE9FB]/40 bg-white px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className={manageModalSecondaryBtnClass}
            >
              {vaultCopy.cancelChanges}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={manageModalPrimaryBtnClass}
            >
              {vaultCopy.saveChanges}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        align="center"
        labelledBy="vault-delete-jar-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-delete-jar-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {vaultCopy.deleteJarConfirmTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]">
          {deleteNeedsFallback
            ? vaultCopy.deleteJarWithBalanceBody
            : vaultCopy.deleteJarConfirmBody}
        </p>

        {deleteTarget && deleteNeedsFallback ? (
          <div className="mt-3">
            <label className="block">
              <span className={manageModalFieldLabelClass}>
                {vaultCopy.deleteJarFallbackLabel}
              </span>
              <select
                value={deleteFallbackId}
                onChange={(event) =>
                  setDeleteFallbackId(event.target.value as VaultBucketId)
                }
                className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-2 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
              >
                {fallbackOptions.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {vaultBucketDisplayName(bucket)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {budgetCopy.moveCancel}
          </button>
          <button
            type="button"
            onClick={queueDelete}
            disabled={!canConfirmDelete}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.deleteJarConfirm}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
