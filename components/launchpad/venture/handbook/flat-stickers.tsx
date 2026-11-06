/** Flat colour marks for Getting Ready. Penny and the official props stay the app art. */
export function FlatSticker({ kind }: { kind: "flyer" | "clipboard" | "calendar" | "umbrella" | "phone" | "polaroid" | "stars" | "envelope" | "ball" | "note" | "bulb" }) {
  const fill = {
    flyer: "#3FB7DA",
    clipboard: "#E8A87C",
    calendar: "#7EB6D9",
    umbrella: "#5B8DEF",
    phone: "#19347D",
    polaroid: "#F4E7C8",
    stars: "#FFA503",
    envelope: "#F2C14E",
    ball: "#7BC67E",
    note: "#F7E7A1",
    bulb: "#FFD15C",
  }[kind];
  return (
    <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden="true" className="h-[72px] w-[96px]">
      <rect x="8" y="8" width="80" height="56" rx="12" fill={fill} />
      {kind === "flyer" && <circle cx="48" cy="18" r="6" fill="#FFA503" />}
      {kind === "stars" && <polygon points="48,16 52,28 64,28 54,36 58,48 48,40 38,48 42,36 32,28 44,28" fill="#fff" />}
      {kind === "phone" && <rect x="36" y="18" width="24" height="36" rx="4" fill="#fff" />}
      {kind === "bulb" && <circle cx="48" cy="32" r="14" fill="#fff" />}
    </svg>
  );
}
