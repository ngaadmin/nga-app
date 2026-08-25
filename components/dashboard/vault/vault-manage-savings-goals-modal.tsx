"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { PencilIcon, TrashIcon } from "@/lib/dashboard/icons";
import {
  canAddCustomSavingsGoal,
  canDeleteSavingsGoal,
  isCustomSavingsGoal,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import {
  parseVaultTargetAmount,
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { cn } from "@/lib/utils/cn";

const GOAL_EMOJI_PRESETS = [
  "🎯",
  "🛡️",
  "🏖️",
  "🎮",
  "📱",
  "🚲",
  "🎁",
  "💻",
  "🎸",
  "👟",
  "🐶",
  "⭐",
  "🔥",
  "💰",
  "🏠",
] as const;

const manageModalPrimaryBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const manageModalSecondaryBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border border-[#BDE9FB] bg-white px-4 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF] disabled:cursor-not-allowed disabled:opacity-40";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-[#9F1239] bg-[#BE123C] font-heading text-sm font-bold text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const manageModalFieldLabelClass =
  "font-heading text-sm font-bold text-[#031F82]";

const resetLinkClass =
  "font-heading text-sm font-bold text-[#BE123C]/80 underline-offset-2 transition-colors hover:text-[#BE123C] hover:underline disabled:cursor-not-allowed disabled:opacity-40";

type GoalDraft = {
  name: string;
  emoji: string;
  targetInput: string;
};

type PendingAdd = {
  tempId: string;
  name: string;
  emoji: string;
  targetInput: string;
};

type ManageRow =
  | { kind: "existing"; goal: SavingsGoal }
  | { kind: "pending"; pending: PendingAdd };

type ConfirmReset = { goal: SavingsGoal };

function EmojiPickerGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="listbox">
      {GOAL_EMOJI_PRESETS.map((emoji) => (
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

function TargetAmountField({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string, hitCap: boolean) => void;
  ariaLabel: string;
}) {
  const { currencySymbol } = useCurrency();
  const [hitCap, setHitCap] = useState(false);

  function handleChange(nextRaw: string) {
    const { value: next, hitCap: capped } = sanitizeVaultAmountInput(nextRaw);
    setHitCap(capped);
    onChange(next, capped);
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5">
        <span className="shrink-0 font-heading text-sm font-bold text-[#031F82]">
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Optional"
          aria-label={ariaLabel}
          className="min-w-0 flex-1 bg-transparent font-sans text-sm tabular-nums text-[#031F82] outline-none"
        />
      </label>
      {hitCap ? (
        <p className="mt-1 font-sans text-sm text-[#1E3A5F]/70" role="status">
          {vaultCopy.maxAmountReachedNotice}
        </p>
      ) : null}
    </div>
  );
}

export type VaultManageSavingsGoalsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  isPremium: boolean;
  onUpdateGoalDetails: (
    goalId: SavingsGoalId,
    updates: { name?: string; emoji?: string; targetAmount?: number },
  ) => void;
  onAddGoal: (name: string, targetAmount: number, emoji: string) => void;
  onDeleteGoal: (goalId: SavingsGoalId) => void;
  onResetGoalBalance: (goalId: SavingsGoalId) => void;
  startOnAdd?: boolean;
};

export function VaultManageSavingsGoalsModal({
  isOpen,
  onClose,
  goals,
  isPremium,
  onUpdateGoalDetails,
  onAddGoal,
  onDeleteGoal,
  onResetGoalBalance,
  startOnAdd = false,
}: VaultManageSavingsGoalsModalProps) {
  const { formatWholeMoney: formatMoney } = useCurrency();

  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>({});
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<SavingsGoalId>>(
    () => new Set(),
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalEmoji, setNewGoalEmoji] = useState("🎯");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [confirmReset, setConfirmReset] = useState<ConfirmReset | null>(null);

  const canAddMore = canAddCustomSavingsGoal(isPremium);
  const showPremiumNotice = !isPremium && !canAddMore;

  const visibleGoals = useMemo(
    () => goals.filter((goal) => !pendingDeleteIds.has(goal.id)),
    [goals, pendingDeleteIds],
  );

  const displayRows = useMemo((): ManageRow[] => {
    const existing: ManageRow[] = visibleGoals.map((goal) => ({
      kind: "existing",
      goal,
    }));
    const pending: ManageRow[] = pendingAdds.map((entry) => ({
      kind: "pending",
      pending: entry,
    }));
    return [...existing, ...pending];
  }, [pendingAdds, visibleGoals]);

  const resetLocalState = useCallback(() => {
    setDrafts({});
    setPendingAdds([]);
    setPendingDeleteIds(new Set());
    setEditingRowId(null);
    setAddFormOpen(false);
    setNewGoalName("");
    setNewGoalEmoji("🎯");
    setNewGoalTarget("");
    setConfirmReset(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetLocalState();
      return;
    }

    const nextDrafts: Record<string, GoalDraft> = {};
    for (const goal of goals) {
      nextDrafts[goal.id] = {
        name: goal.name,
        emoji: goal.emoji,
        targetInput: goal.targetAmount > 0 ? String(goal.targetAmount) : "",
      };
    }
    setDrafts(nextDrafts);
    if (startOnAdd) setAddFormOpen(true);
  }, [goals, isOpen, resetLocalState, startOnAdd]);

  function goalDraftFrom(goal: SavingsGoal): GoalDraft {
    return {
      name: goal.name,
      emoji: goal.emoji,
      targetInput: goal.targetAmount > 0 ? String(goal.targetAmount) : "",
    };
  }

  function getRowDraft(rowId: string, fallback: GoalDraft): GoalDraft {
    return drafts[rowId] ?? fallback;
  }

  function updateRowDraft(rowId: string, patch: Partial<GoalDraft>, fallback: GoalDraft) {
    setDrafts((current) => ({
      ...current,
      [rowId]: { ...getRowDraft(rowId, fallback), ...patch },
    }));
  }

  const hasChanges = useMemo(() => {
    if (pendingAdds.length > 0 || pendingDeleteIds.size > 0) return true;

    for (const goal of goals) {
      if (pendingDeleteIds.has(goal.id)) continue;
      const draft = drafts[goal.id];
      if (!draft) continue;
      const targetAmount = parseVaultTargetAmount(draft.targetInput);
      if (
        draft.name.trim() !== goal.name ||
        draft.emoji !== goal.emoji ||
        targetAmount !== goal.targetAmount
      ) {
        return true;
      }
    }

    return false;
  }, [drafts, goals, pendingAdds.length, pendingDeleteIds]);

  function handleAddToList() {
    const trimmed = newGoalName.trim();
    if (!trimmed || !canAddMore) return;

    const tempId = `pending-goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPendingAdds((current) => [
      ...current,
      {
        tempId,
        name: trimmed,
        emoji: newGoalEmoji,
        targetInput: newGoalTarget,
      },
    ]);
    setDrafts((current) => ({
      ...current,
      [tempId]: {
        name: trimmed,
        emoji: newGoalEmoji,
        targetInput: newGoalTarget,
      },
    }));
    setNewGoalName("");
    setNewGoalEmoji("🎯");
    setNewGoalTarget("");
    setAddFormOpen(false);
  }

  function handleSave() {
    for (const goal of goals) {
      if (pendingDeleteIds.has(goal.id)) continue;
      const draft = drafts[goal.id];
      if (!draft) continue;
      const trimmed = draft.name.trim();
      if (!trimmed) continue;
      const targetAmount = parseVaultTargetAmount(draft.targetInput);
      if (
        trimmed !== goal.name ||
        draft.emoji !== goal.emoji ||
        targetAmount !== goal.targetAmount
      ) {
        onUpdateGoalDetails(goal.id, {
          name: trimmed,
          emoji: draft.emoji,
          targetAmount,
        });
      }
    }

    for (const add of pendingAdds) {
      const draft = drafts[add.tempId] ?? add;
      onAddGoal(
        draft.name.trim() || add.name,
        parseVaultTargetAmount(draft.targetInput),
        draft.emoji,
      );
    }

    for (const goalId of pendingDeleteIds) {
      if (canDeleteSavingsGoal(goalId)) {
        onDeleteGoal(goalId);
      }
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

  function confirmResetAction() {
    if (!confirmReset) return;
    onResetGoalBalance(confirmReset.goal.id);
    setConfirmReset(null);
  }

  const confirmTitle = confirmReset
    ? vaultCopy.resetGoalBalanceConfirmTitle
    : "";

  const confirmBody = confirmReset
    ? vaultCopy.resetGoalBalanceConfirmBody
    : "";

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={handleCancel}
        align="center"
        labelledBy="vault-manage-goals-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,40rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="vault-manage-goals-title"
                className="font-heading text-lg font-extrabold text-[#031F82]"
              >
                {vaultCopy.manageSavingsGoalsTitle}
              </h2>
              <p className="mt-1 font-sans text-sm leading-snug text-[#1E3A5F]/70">
                {vaultCopy.manageSavingsGoalsBody}
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

          {showPremiumNotice ? (
            <div className="mt-3 rounded-xl border border-[#BDE9FB] bg-[#FAFDFF]/80 p-3">
              <p className="font-heading text-sm font-extrabold text-[#031F82]">
                {vaultCopy.premiumGoalsLockedTitle}
              </p>
              <p className="mt-1 font-sans text-sm text-[#1E3A5F]/70">
                {vaultCopy.premiumGoalsLockedBody}
              </p>
            </div>
          ) : null}

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
            {vaultCopy.addSavingsGoal}
          </button>

          {addFormOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-[#BDE9FB] bg-[#FAFDFF]/80 p-3">
              <label className="block">
                <span className={manageModalFieldLabelClass}>
                  {vaultCopy.goalNameLabel}
                </span>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(event) => setNewGoalName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#BDE9FB] bg-white px-2.5 py-1.5 font-sans text-sm text-[#031F82] outline-none focus:border-[#0CC1E0]"
                />
              </label>
              <div>
                <p className={manageModalFieldLabelClass}>{vaultCopy.goalIconLabel}</p>
                <div className="mt-1">
                  <EmojiPickerGrid selected={newGoalEmoji} onSelect={setNewGoalEmoji} />
                </div>
              </div>
              <div>
                <p className={manageModalFieldLabelClass}>{vaultCopy.goalTargetLabel}</p>
                <div className="mt-1">
                  <TargetAmountField
                    value={newGoalTarget}
                    onChange={(value) => setNewGoalTarget(value)}
                    ariaLabel={vaultCopy.goalTargetLabel}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddToList}
                disabled={!newGoalName.trim()}
                className={cn("h-touch w-full", manageModalPrimaryBtnClass)}
              >
                {vaultCopy.addSavingsGoal}
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <ul className="space-y-2.5">
            {displayRows.map((row) => {
              const rowId = row.kind === "existing" ? row.goal.id : row.pending.tempId;
              const isCustom =
                row.kind === "pending" ||
                (row.kind === "existing" && isCustomSavingsGoal(row.goal.id));
              const fallbackDraft: GoalDraft =
                row.kind === "existing"
                  ? goalDraftFrom(row.goal)
                  : {
                      name: row.pending.name,
                      emoji: row.pending.emoji,
                      targetInput: row.pending.targetInput,
                    };
              const draft = getRowDraft(rowId, fallbackDraft);
              const isEditing = editingRowId === rowId;
              const balance = row.kind === "existing" ? row.goal.balance : 0;
              const displayName =
                row.kind === "existing"
                  ? `${draft.emoji} ${draft.name.trim() || row.goal.name}`
                  : `${draft.emoji} ${draft.name.trim() || row.pending.name}`;

              return (
                <li
                  key={rowId}
                  className="rounded-xl border border-[#BDE9FB]/70 bg-[#FAFDFF]/90 p-3 shadow-sm"
                >
                  {!isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-sm font-extrabold text-[#031F82]">
                            {displayName}
                          </p>
                          <p className="mt-0.5 font-heading text-sm font-bold text-[#15803D]">
                            Saved: {formatMoney(balance)}
                          </p>
                          <p className="font-heading text-sm font-bold text-[#1E3A5F]/70">
                            Target:{" "}
                            {parseVaultTargetAmount(draft.targetInput) > 0
                              ? formatMoney(parseVaultTargetAmount(draft.targetInput))
                              : "Not set"}
                          </p>
                        </div>
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
                                setPendingDeleteIds(
                                  (current) => new Set([...current, row.goal.id]),
                                );
                              }}
                              aria-label={vaultCopy.deleteGoal}
                              className="flex size-8 items-center justify-center rounded-lg text-[#BE123C]/70 transition-colors hover:bg-[#FEE2E2]/60 hover:text-[#BE123C]"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {row.kind === "existing" ? (
                        <button
                          type="button"
                          onClick={() => setConfirmReset({ goal: row.goal })}
                          className={resetLinkClass}
                        >
                          {vaultCopy.resetGoalBalance}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block">
                        <span className={manageModalFieldLabelClass}>
                          {vaultCopy.goalNameLabel}
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
                          {vaultCopy.goalIconLabel}
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
                      <div>
                        <p className={manageModalFieldLabelClass}>
                          {vaultCopy.goalTargetLabel}
                        </p>
                        <div className="mt-1">
                          <TargetAmountField
                            value={draft.targetInput}
                            onChange={(value) =>
                              updateRowDraft(rowId, { targetInput: value }, fallbackDraft)
                            }
                            ariaLabel={`${vaultCopy.goalTargetLabel} for ${draft.name}`}
                          />
                        </div>
                      </div>
                      {row.kind === "existing" ? (
                        <button
                          type="button"
                          onClick={() => setConfirmReset({ goal: row.goal })}
                          className={resetLinkClass}
                        >
                          {vaultCopy.resetGoalBalance}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setEditingRowId(null)}
                        className="font-heading text-sm font-bold text-[#0CC1E0] hover:underline"
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
              {vaultCopy.saveGoalChanges}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={confirmReset !== null}
        onClose={() => setConfirmReset(null)}
        align="center"
        labelledBy="vault-reset-confirm-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="vault-reset-confirm-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {confirmTitle}
        </h2>
        <p className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]">
          {confirmBody}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmReset(null)}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0]"
          >
            {vaultCopy.resetCancel}
          </button>
          <button
            type="button"
            onClick={confirmResetAction}
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {vaultCopy.resetConfirm}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
