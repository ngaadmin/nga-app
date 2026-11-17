# Lesson content

Shipped Module 1 lessons do not live in this folder. Production reads them from `academy_lesson_versions`.

The checked-in authoring files are the local source, and the lesson path outside production when the master-payload flag is off:

- Explorer: `lib/academy/lessons/payload/source/explorer-m1/lessons.json`.
- Pathfinder and Maverick: `lib/academy/lessons/payload/source/Screens1.csv` plus `Lesson-Details.csv`.
- `design-shell.ts` is the dev screen gallery at `/dashboard/academy/lesson/shell`.

The baked `m1-l*.ts` files, the Explorer JSON import under `data/explorer/`, and `templates/lesson-authoring/` were removed in stage 2. Copies are in `archive/stage2-lesson-files/`. The master workbook diff is `docs/stage2-unwind-report.md`.

Those authoring files stay until they are retired on purpose. Deleting them does not change what production serves. Do not add a new baked lesson file here, and do not turn the production flag off to serve them.
