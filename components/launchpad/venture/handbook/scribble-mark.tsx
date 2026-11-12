/**
 * Approved cuts-r2 scribbles. Placements are phone pixels on a 390×844 frame.
 * The image is letterboxed inside its footprint so the drawing is not cropped.
 */
export const SCRIBBLE_SRC = {
  beagle: "/launchpad/scribbles/beagle.png",
  kit: "/launchpad/scribbles/kit.png",
  treats: "/launchpad/scribbles/treats.png",
  calendar: "/launchpad/scribbles/calendar.png",
  pawtrail: "/launchpad/scribbles/pawtrail.png",
  paw: "/launchpad/scribbles/paw.png",
  bone: "/launchpad/scribbles/bone.png",
  heart: "/launchpad/scribbles/heart.png",
  bulb: "/launchpad/scribbles/bulb.png",
  star: "/launchpad/scribbles/star.png",
  sparkle: "/launchpad/scribbles/sparkle.png",
  smiley: "/launchpad/scribbles/smiley.png",
  "smiley-black": "/launchpad/scribbles/smiley-black-ink.png",
  coins: "/launchpad/scribbles/coins.png",
  growth: "/launchpad/scribbles/growth.png",
  jar: "/launchpad/scribbles/jar.png",
  wallet: "/launchpad/scribbles/wallet.png",
} as const;

export type ScribbleName = keyof typeof SCRIBBLE_SRC;

const RHYTHM = ["paw", "bone", "heart", "star", "sparkle", "treats"] as const;
const RHYTHM_ROT = [-8, 6, -4, 9];

type Pin = { name: ScribbleName; x: number; y: number; size?: number };

/** Phone-pixel pins for the pages Jasper marked. The paper card maps them onto the 390×844 frame. */
const FRAME_PINS: Record<string, readonly Pin[]> = {
  week: [
    { name: "paw", x: 326, y: 232 },
    { name: "bone", x: 308, y: 370 },
    { name: "heart", x: 326, y: 412 },
    { name: "star", x: 250, y: 560 },
    { name: "sparkle", x: 310, y: 600, size: 28 },
  ],
  "ready-c": [
    { name: "paw", x: 326, y: 258 },
    { name: "bone", x: 326, y: 456 },
    { name: "bone", x: 326, y: 640 },
  ],
  "sales-tell": [
    { name: "star", x: 330, y: 206 },
    { name: "sparkle", x: 330, y: 308, size: 28 },
  ],
  "ready-before": [{ name: "bone", x: 255, y: 600, size: 70 }],
  "ready-after": [
    { name: "bone", x: 326, y: 380 },
    { name: "bone", x: 250, y: 630, size: 80 },
  ],
};

function rhythmNames(pageNumber: number, count: number): ScribbleName[] {
  const names: ScribbleName[] = [];
  let cursor = Math.max(0, pageNumber - 1) * 3;
  for (let index = 0; index < count; index += 1) {
    if (index % 2 !== 1) continue;
    names[index] = RHYTHM[cursor % RHYTHM.length]!;
    cursor += 1;
  }
  return names;
}

/** A 32px doodle on the right of every second body paragraph. Price columns are left alone. Punch-list pages pin theirs in the gutter instead. */
export function layoutWorkbookDoodles(scroll: HTMLElement, pageNumber: number, sheet: string) {
  scroll.querySelectorAll("[data-rhythm-doodle]").forEach((node) => node.remove());
  const card = scroll.closest("[data-paper-card]") as HTMLElement | null;
  card?.querySelectorAll("[data-pinned-doodle]").forEach((node) => node.remove());
  const paras = [...scroll.querySelectorAll("p, li")].filter((el) => {
    if (el.closest("[data-scribble-large], [data-weekly-focus], [data-workbook-templates], button, [data-inline-editor], [data-cost-workbook], [data-price-sheet], [data-jobs-sheet], [data-cost-row], [data-budget-sheet]")) return false;
    return (el.textContent ?? "").trim().length > 0;
  });
  const flyer = (scroll.textContent ?? "").includes("What my flyer will say");
  const online = (scroll.textContent ?? "").includes("What my online post");
  const pins: Pin[] = [...(FRAME_PINS[sheet] ?? [])];
  if (flyer) pins.push({ name: "paw", x: 326, y: 662 });
  const pinned = new Set(pins.map((pin) => pin.name));
  const punch = pins.length > 0 || sheet === "pricing" || online;
  if (!punch || sheet !== "week") {
    const names = rhythmNames(pageNumber, paras.length);
    let placed = 0;
    paras.forEach((el, index) => {
      if (index % 2 !== 1) return;
      const name = names[index];
      if (!name) return;
      placed += 1;
      if (sheet === "pricing" && (name === "star" || name === "sparkle")) return;
      if (punch && pinned.has(name)) return;
      const img = document.createElement("img");
      img.src = SCRIBBLE_SRC[name];
      img.alt = "";
      img.width = 32;
      img.height = 32;
      img.dataset.rhythmDoodle = name;
      const turn = Math.floor(placed / 1);
      if (!punch || !card) {
        img.className = "pointer-events-none absolute top-1/2 z-raised h-auto w-8 -translate-y-1/2 mix-blend-multiply";
        img.style.right = `${(turn % 2 ? 18 : 0) + 48}px`;
        img.style.transform = `translateY(-70%) rotate(${RHYTHM_ROT[turn % RHYTHM_ROT.length]}deg)`;
        const node = el as HTMLElement;
        node.classList.add("relative", "pr-[96px]");
        node.appendChild(img);
        return;
      }
      const para = el.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      img.dataset.pinnedDoodle = name;
      img.className = "pointer-events-none absolute z-raised mix-blend-multiply";
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.left = `${Math.max(0, box.width - 44)}px`;
      img.style.top = `${Math.max(0, para.top - box.top)}px`;
      img.style.transform = `rotate(${RHYTHM_ROT[turn % RHYTHM_ROT.length]}deg)`;
      card.appendChild(img);
    });
  }
  if (!card) return;
  const dialog = card.closest("[data-handbook]") as HTMLElement | null;
  const dialogBox = (dialog ?? card).getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();
  const originX = cardBox.left - dialogBox.left;
  const originY = cardBox.top - dialogBox.top;
  for (const pin of pins) {
    const size = pin.size ?? 32;
    const img = document.createElement("img");
    img.src = SCRIBBLE_SRC[pin.name];
    img.alt = "";
    img.width = size;
    img.height = size;
    img.dataset.pinnedDoodle = pin.name;
    img.className = "pointer-events-none absolute z-raised mix-blend-multiply";
    img.style.left = `${pin.x - originX}px`;
    img.style.top = `${pin.y - originY}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    card.appendChild(img);
  }
  if (sheet === "pricing") {
    placeAnchorDoodle(card, scroll, "differently", "star", 32);
    placeAnchorDoodle(card, scroll, "price-calc", "sparkle", 28);
  }
}

function placeAnchorDoodle(card: HTMLElement, scroll: HTMLElement, anchor: string, name: ScribbleName, size: number) {
  const el = scroll.querySelector(`[data-doodle-anchor='${anchor}']`);
  if (!el) return;
  const para = el.getBoundingClientRect();
  const box = card.getBoundingClientRect();
  const img = document.createElement("img");
  img.src = SCRIBBLE_SRC[name];
  img.alt = "";
  img.dataset.pinnedDoodle = name;
  img.className = "pointer-events-none absolute z-raised mix-blend-multiply";
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.style.left = `${Math.max(0, box.width - size - 16)}px`;
  img.style.top = `${Math.max(0, para.top - box.top)}px`;
  card.appendChild(img);
}

/** End-of-page scribble, about 80px, right aligned. */
export function LargeScribble({ name, className = "mt-8" }: { name: ScribbleName; className?: string }) {
  return (
    <div className={`${className} flex justify-end pr-16`} data-scribble-large={name}>
      <img src={SCRIBBLE_SRC[name]} alt="" width={80} height={80} draggable={false} className="h-auto w-20 mix-blend-multiply" />
    </div>
  );
}

export function ScribbleMark({
  name,
  x,
  y,
  w,
  h,
  angle = 0,
  frame,
}: {
  name: ScribbleName;
  x: number;
  y: number;
  w: number;
  h?: number;
  angle?: number;
  /** Top-left of this paper on the 390×844 frame, so phone pixels land on the card. */
  frame: { left: number; top: number };
}) {
  return (
    <span
      aria-hidden="true"
      data-scribble={name}
      className="pointer-events-none absolute z-raised flex items-center justify-center"
      style={{
        left: x - frame.left,
        top: y - frame.top,
        width: w,
        height: h ?? w,
        transform: angle ? `rotate(${angle}deg)` : undefined,
      }}
    >
      <img src={SCRIBBLE_SRC[name]} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
    </span>
  );
}
