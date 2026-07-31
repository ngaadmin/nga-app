"use client";

import type { ReactNode } from "react";
import {
  vaultV2ActionButtonRowClass,
  vaultV2ActionFieldRowClass,
  vaultV2ActionPanelClass,
  vaultV2AmountFieldShellClass,
  vaultV2AmountInputClass,
  vaultV2FieldInputClass,
  vaultV2FieldLabelClass,
  vaultV2PrimaryBtnClass,
  vaultV2SecondaryBtnClass,
} from "@/lib/dashboard/vault-v2/vault-v2-action-form-styles";
import { cn } from "@/lib/utils/cn";

type VaultV2ActionPanelProps = {
  children: ReactNode;
  className?: string;
};

export function VaultV2ActionPanel({ children, className }: VaultV2ActionPanelProps) {
  return <div className={cn(vaultV2ActionPanelClass, className)}>{children}</div>;
}

type VaultV2ActionFieldRowProps = {
  amountField: ReactNode;
  secondaryField: ReactNode;
};

export function VaultV2ActionFieldRow({ amountField, secondaryField }: VaultV2ActionFieldRowProps) {
  return (
    <div className={vaultV2ActionFieldRowClass}>
      {amountField}
      {secondaryField}
    </div>
  );
}

type VaultV2AmountFieldProps = {
  currencySymbol: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  onBlur?: () => void;
};

export function VaultV2AmountField({
  currencySymbol,
  value,
  onChange,
  ariaLabel,
  onBlur,
}: VaultV2AmountFieldProps) {
  return (
    <label className={vaultV2AmountFieldShellClass}>
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
        className={vaultV2AmountInputClass}
      />
    </label>
  );
}

type VaultV2SelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function VaultV2SelectField({
  value,
  onChange,
  ariaLabel,
  children,
  className,
}: VaultV2SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className={cn(vaultV2FieldInputClass, className)}
    >
      {children}
    </select>
  );
}

type VaultV2LabeledSelectFieldProps = VaultV2SelectFieldProps & {
  label: string;
};

export function VaultV2LabeledSelectField({
  label,
  ...selectProps
}: VaultV2LabeledSelectFieldProps) {
  return (
    <label className="block space-y-1">
      <span className={vaultV2FieldLabelClass}>{label}</span>
      <VaultV2SelectField {...selectProps} />
    </label>
  );
}

type VaultV2ActionButtonRowProps = {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryDisabled?: boolean;
};

export function VaultV2ActionButtonRow({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}: VaultV2ActionButtonRowProps) {
  return (
    <div className={vaultV2ActionButtonRowClass}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={vaultV2PrimaryBtnClass}
      >
        {primaryLabel}
      </button>
      <button type="button" onClick={onSecondary} className={vaultV2SecondaryBtnClass}>
        {secondaryLabel}
      </button>
    </div>
  );
}
