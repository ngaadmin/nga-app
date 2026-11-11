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

const RHYTHM = ["paw", "bone", "heart", "star", "sparkle", "treats"] as const;
const RHYTHM_ROT = [-8, 6, -4, 9];

/** A 32px doodle on the right of every second body paragraph. Price columns are left alone. */
export function placeRhythmDoodles(root: HTMLElement, pageNumber: number) {
  root.querySelectorAll("[data-rhythm-doodle]").forEach((node) => node.remove());
  const paras = [...root.querySelectorAll("p, li")].filter((el) => {
    if (el.closest("[data-scribble-large], [data-weekly-focus], [data-workbook-templates], button, [data-inline-editor], [data-cost-workbook], [data-price-sheet], [data-jobs-sheet], [data-cost-row], [data-budget-sheet]")) return false;
    return (el.textContent ?? "").trim().length > 0;
  });
  let cursor = Math.max(0, pageNumber - 1) * 3;
  paras.forEach((el, index) => {
    if (index % 2 !== 1) return;
    const name = RHYTHM[cursor % RHYTHM.length]!;
    cursor += 1;
    const img = document.createElement("img");
    img.src = SCRIBBLE_SRC[name];
    img.alt = "";
    img.width = 32;
    img.height = 32;
    img.dataset.rhythmDoodle = name;
    img.className = "pointer-events-none absolute top-1/2 z-raised h-auto w-8 -translate-y-1/2 mix-blend-multiply";
    const turn = Math.floor(index / 2);
    img.style.right = `${turn % 2 ? 18 : 0}px`;
    img.style.transform = `translateY(-50%) rotate(${RHYTHM_ROT[turn % RHYTHM_ROT.length]}deg)`;
    const node = el as HTMLElement;
    node.classList.add("relative", "pr-[54px]");
    node.appendChild(img);
  });
}

/** End-of-page scribble, about 80px, right aligned. */
export function LargeScribble({ name }: { name: ScribbleName }) {
  return (
    <div className="mt-11 flex justify-end pr-[18px]" data-scribble-large={name}>
      <img src={SCRIBBLE_SRC[name]} alt="" width={80} height={80} draggable={false} className="h-auto w-20 mix-blend-multiply" />
    </div>
  );
}

export type ScribbleName = keyof typeof SCRIBBLE_SRC;

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
