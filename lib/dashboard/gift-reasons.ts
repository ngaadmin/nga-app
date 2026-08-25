export const VAULT_GIFT_REASON_IDS = [
  "family",
  "friends",
  "birthday",
  "charity",
  "thank-you",
] as const;

export type VaultGiftReasonId = (typeof VAULT_GIFT_REASON_IDS)[number];

export const VAULT_GIFT_REASON_LABELS: Record<VaultGiftReasonId, string> = {
  family: "Family",
  friends: "Friends",
  birthday: "Birthday",
  charity: "Charity",
  "thank-you": "Thank you",
};

export const VAULT_GIFT_CUSTOM_OPTION_ID = "add-custom-gift-option";
