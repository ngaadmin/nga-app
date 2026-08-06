"use client";

import { useState, type ReactNode } from "react";
import {
  sanitizeVaultAmountInput,
} from "@/lib/dashboard/vault-amount-input";
import {
  vaultActionButtonRowClass,
  vaultActionFieldRowClass,
  vaultActionPanelClass,
  vaultAmountFieldShellClass,
  vaultAmountInputClass,
  vaultFieldInputClass,
  vaultFieldLabelClass,
  vaultPrimaryBtnClass,
  vaultSecondaryBtnClass,
} from "@/lib/dashboard/vault/vault-action-form-styles";
import { vaultCopy } from "@/lib/dashboard/vault/copy";
import { cn } from "@/lib/utils/cn";

type VaultActionPanelProps = {
  children: ReactNode;
  className?: string;
};

export function VaultActionPanel({ children, className }: VaultActionPanelProps) {
  return <div className={cn(vaultActionPanelClass, className)}>{children}</div>;
}

type VaultActionFieldRowProps = {
  amountField: ReactNode;
  secondaryField: ReactNode;
};

export function VaultActionFieldRow({ amountField, secondaryField }: VaultActionFieldRowProps) {
  return (
    <div className={vaultActionFieldRowClass}>
      {amountField}
      {secondaryField}
    </div>
  );
}

type VaultAmountFieldProps = {
  currencySymbol: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  onBlur?: () => void;
};

export function VaultAmountField({
  currencySymbol,
  value,
  onChange,
  ariaLabel,
  onBlur,
}: VaultAmountFieldProps) {
  const [hitCap, setHitCap] = useState(false);

  function handleChange(nextRaw: string) {
    const { value: next, hitCap: capped } = sanitizeVaultAmountInput(nextRaw);
    setHitCap(capped);
    onChange(next);
  }

  return (
    <div className="min-w-0">
      <label className={vaultAmountFieldShellClass}>
        <span className="shrink-0 font-heading text-base font-bold text-[#031F82]">
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={onBlur}
          placeholder="0"
          aria-label={ariaLabel}
          className={vaultAmountInputClass}
        />
      </label>
      {hitCap ? (
        <p className="mt-1 font-sans text-[10px] text-[#1E3A5F]/70" role="status">
          {vaultCopy.maxAmountReachedNotice}
        </p>
      ) : null}
    </div>
  );
}

type VaultSelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function VaultSelectField({
  value,
  onChange,
  ariaLabel,
  children,
  className,
}: VaultSelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className={cn(vaultFieldInputClass, className)}
    >
      {children}
    </select>
  );
}

type VaultLabeledSelectFieldProps = VaultSelectFieldProps & {
  label: string;
};

export function VaultLabeledSelectField({
  label,
  ...selectProps
}: VaultLabeledSelectFieldProps) {
  return (
    <label className="block space-y-1">
      <span className={vaultFieldLabelClass}>{label}</span>
      <VaultSelectField {...selectProps} />
    </label>
  );
}

type VaultActionButtonRowProps = {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryDisabled?: boolean;
};

export function VaultActionButtonRow({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}: VaultActionButtonRowProps) {
  return (
    <div className={vaultActionButtonRowClass}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={vaultPrimaryBtnClass}
      >
        {primaryLabel}
      </button>
      <button type="button" onClick={onSecondary} className={vaultSecondaryBtnClass}>
        {secondaryLabel}
      </button>
    </div>
  );
}
