# Testing tiers

Pick the lowest tier that fits the change. The scripts print each step's runtime and a total. A cold dev server's startup is printed separately and is not part of the total.

Phone is 390×844. Desktop is 1280×800. WebKit stays off unless the walker is given `--webkit`.

## Tier 1 — quick

One screen or one lesson: copy, styling, button order, or an image swap.

```bash
npm run check:quick -- --lesson=2
npm run check:quick -- --lesson=2,3
```

Runs typecheck, unit tests for the files that changed, and a phone walk of only those lessons, plus one screenshot of the first lesson's first screen. Target under 5 minutes.

## Tier 2 — flow

Lesson flow, the player, or one shared lesson component. The Explorer beat reorder and the master mute button fit here. A converter change with no dependency upgrade fits here too.

```bash
npm run check:flow
npm run check:flow -- --lesson=2
```

Runs typecheck, the lesson-flow and graph unit tests, and a chained walk. With no lesson flag, that chain plays lessons 1–9 at phone and desktop: each lesson is finished through cash-in, then the next lesson is opened from the Academy map. With `--lesson`, those lessons are played in full and the other lessons are spot-checked (first screen and last screen only). Target 10 to 15 minutes.

## Tier 3 — full sweep

Payload-wide changes, a Next.js or dependency upgrade, or the last check before a production go-live. Not for a routine tweak.

```bash
npm run check:full
```

Runs typecheck, the full unit suite, and a direct walk of every Explorer lesson at phone and desktop. Run this once more before the PR #82 go-live.

Batch small tweaks that arrive close together into one push, then run the tier once.
