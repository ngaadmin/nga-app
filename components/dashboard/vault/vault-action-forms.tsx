"use client";

import type { ReactNode } from "react";
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
  return (
    <label className={vaultAmountFieldShellClass}>
      <span className="shrink-0 font-heading text-base font-bold text-[#031F82]">
        {currencySymbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "" || /^\d*\.?\d*$/.test(next)) {
            onChange(next);
          }
        }}
        onBlur={onBlur}
        placeholder="0.00"
        aria-label={ariaLabel}
        className={vaultAmountInputClass}
      />
    </label>
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
