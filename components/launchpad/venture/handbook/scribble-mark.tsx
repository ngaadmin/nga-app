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
} as const;

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
