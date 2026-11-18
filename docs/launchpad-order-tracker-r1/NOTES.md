# My order tracker printable PDF r1

Review-only mock. Show Cath only. Nothing to Melvin until she says.

Cath asked in chat on 17 Nov 2026, 6:50am Australia/Brisbane, to turn the My order tracker workbook page into a downloadable PDF, because the 11-column table is unreadable at 390 wide.

The mock reuses the approved poster workbook page pattern (`/workspace/launchpad-poster-blank-r2/workbook-poster-page.png`): a small preview image plus a link to a printable PDF, with Close on the PDF viewer returning to the same page. No new template and no bespoke screen.

Live source for the restyle: test alias SHA 2097d5c7 / fec7a8de, workbook page 22 (`data-handbook-page="order-tracker"`).

## Outputs

- `/workspace/launchpad-order-tracker-pdf-r1/workbook-tracker-page.png` — 390x844 @2x (780x1688). Live p22 restyled in a headless browser.
- `/workspace/launchpad-order-tracker-pdf-r1/workbook-pdf-viewer.png` — 390x844 @2x. Close returns to the same page (verified: after-close screenshot is pixel-identical).
- `/workspace/launchpad-order-tracker-pdf-r1/blank-tracker-A4.pdf` — print-ready, landscape A4, 1 page, 12 mm margins, vector type.
- `/workspace/launchpad-order-tracker-pdf-r1/blank-tracker-Letter.pdf` — print-ready, landscape US Letter, 1 page, 12 mm margins, vector type.
- `/workspace/launchpad-order-tracker-pdf-r1/filled-tracker-example.png` — filled example used as the on-page preview, from the live example row data (Letter layout).
- `/workspace/launchpad-order-tracker-pdf-r1/workbook-tracker-before-after.png` — live p22 vs the mock.
- `/workspace/launchpad-order-tracker-pdf-r1/contact-r1.png` — workbook page, viewer, and filled example.
- `/workspace/launchpad-order-tracker-pdf-r1/mockups.html` — local review sheet.
- `/workspace/launchpad-order-tracker-pdf-r1/render-check.json` — header, overflow, and type checks (all problems empty).

Rebuild: `node tools/render.mjs` then the contact compose in the same tools run, or re-run the Python contact block in this folder's shell history. The render script writes the PDFs, the filled example, and the two phone mocks.

## Column headers (exact, from the live table)

1. Date booked
2. Customer (first name only)
3. Service and package
4. Day and time
5. One-off or regular
6. Price
7. Notes
8. Reminder set?
9. Done?
10. Paid?
11. Feedback asked?

These match `lib/launchpad/content/surface-copy.ts` (`booking-form` fields + ticks) and the live `<th>` text on p22. Long headers use planned line breaks (Date / booked, Customer / (first name / only), and so on). Nothing wraps mid-word.

## Filled example rows (from the live table)

| Date booked | Customer (first name only) | Service and package | Day and time | One-off or regular | Price | Notes | Reminder set? | Done? | Paid? | Feedback asked? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mar 12 | Sam | 30-minute walk | Saturday morning | One-off | $15 | Meet at the park | yes | yes | no | no |
| Mar 14 | Alex | 30-minute walk | Tuesday after school | Regular | $15 | Front gate | yes | no | no | no |

The blank PDFs have the same 11 headers, 12 empty rows, and empty tick boxes. The filled example keeps both live rows, then 10 empty rows.

## Workbook page (restyled live p22)

Standard workbook chrome is unchanged: My workbook, Dog walking, Back to the corridor, spiral paper, L5 tab, Page 22, prev/next, Continue. The teal "Dog walking" identity (kicker) appears once.

On the paper:

- Title: My order tracker (existing aqua Fredoka 18px, with the existing underline).
- Existing kicker, once: "These are the details to collect for each order." (Inter 16/26, #4A5568).
- 290px preview of the filled example, 1px navy border, same thumb treatment as the draft poster.
- Link line, modeled on the poster's "Here's a blank one you can print, fill in, photocopy and hang up."

**Link copy is a placeholder, pending Storybird:** "Here's a blank tracker you can print and fill in for every order."

The link uses the live poster pattern: Inter 16px semibold, aqua, underline, document icon. Tapping it is mocked to the in-app viewer (Close top-left, printer icon top-right, dark stage). Close returns to this page.

Fits 390x844 with no document scroll and no paper scroll. No em dashes, no UK spelling, no Penny, no new doodle patterns.

## What this would drop from the live page

Flag these before anything is built. The live page is an in-workbook editable ledger (`data-editable="true"`). This mock follows the poster pattern (preview + printable PDF) and would remove:

- The second intro line: "Here's a table you can use. Put each order on its own row." Replaced by the print link.
- The in-page 11-column table (the thing that is unreadable at 390).
- The on-page "Example" heading. The filled preview itself is labeled Example.
- The second live example row as an in-app table row. Both Sam and Alex still appear on the filled preview, so the worked example is not lost from the mock.
- The blank learner table under the examples (`data-learner-rows`).
- The "Add a row" control (`data-tracker-add`).
- In-app editing of the learner's own tracker rows. Register C060 / C061 (Cath, 16 Nov) authorised a new My order tracker workbook page as a ledger, with rows in the existing answers store. A print-and-fill PDF is a different interaction: the learner would print and write on paper, like the blank poster, instead of adding rows in the app.

Nothing has been removed from the build. This is a proposed mock only.

## Doodles

The live p22 has no scribble images (no rhythm doodles, no large end-of-page scribble). The printable sheet uses the existing approved paw and bone scribbles from `/launchpad/scribbles/paw.png` and `bone.png`, at the top corners, slightly rotated, no new patterns.

## Decisions

- Reuse the poster workbook template pattern rather than invent a new screen or a new template.
- Print PDFs are vector (Playwright / Chromium), not 300 dpi rasters, so the 11 headers stay sharp. Margin is 12 mm, matching the blank poster PDFs.
- Header type is Inter 600, 9.5pt, with planned wraps. Tick columns (Reminder set?, Done?, Paid?, Feedback asked?) are narrower, with empty checkbox squares for handwriting.
- US date form from the live table is kept (Mar 12, Mar 14).
- The privacy line Cath removed from the booking form on 11 Nov is not restored.
- The filled Letter layout is the preview art, because that is the tighter of the two page sizes.

## Checks

`render-check.json`: all sheet and workbook `problems` arrays are empty. Workbook paper scroll delta is 0. Paper content is 16px or above (existing chrome, such as Page 22 at 11px and Continue at 15px, was left alone). Headers in the PDFs match the live table exactly. After Close, the workbook page screenshot is pixel-identical to the page mock.
