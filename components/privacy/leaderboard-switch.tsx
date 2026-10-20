"use client";

type LeaderboardSwitchProps = {
  enabled: boolean;
  scope: "child" | "class";
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
};

/** Parent or teacher control. Off until they switch it on. */
export function LeaderboardSwitch({
  enabled,
  scope,
  disabled = false,
  onChange,
}: LeaderboardSwitchProps) {
  const detail = enabled
    ? scope === "class"
      ? "On for this class."
      : "On for this child."
    : scope === "class"
      ? "Off for this class until you switch it on."
      : "Off until you switch it on.";

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-extrabold text-[#031F82]">Community leaderboard</p>
        <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Community leaderboard"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          enabled ? "bg-[#0CC1E0]" : "bg-[#BDE9FB]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
