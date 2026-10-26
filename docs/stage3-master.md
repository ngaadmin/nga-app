# Stage 3 master workbook

Preview reads Module 1 from `lib/academy/lessons/payload/source/master/module-1-screens.xlsx` (Cath's master, md5 `f6ff7ed92af8e34cc54987f627e980dc`). The workbook is named Academy - Screens (All Cohorts). Cohort tabs are `M1 Explorer`, `M1 Pathfinder`, and `M1 Maverick`, plus `Lesson Details`. `M2 Explorer`, `M2 Pathfinder`, and `M2 Maverick` are ignored, including when `M2 Explorer` has rows. The reader still accepts the older `Explorer M1` tab names. Production stays on Screens1.csv, Lesson-Details.csv, and Explorer `lessons.json`. Image Name (column J) is optional. A blank cell is not an error. A picture cell that says `not allowed` is no picture.

Flag: `ACADEMY_MASTER_PAYLOAD` (server) and `NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD` (the Academy map). `1` or `true` turns it on. `0` or `false` turns it off. When neither is set, it is on only for a Vercel preview (`VERCEL_ENV=preview`).

Lesson pages on that flag call `connection()` and fetch `academy_lesson_current` with `cache: "no-store"`, so a preview request is not baked at build time. An empty table, a missing table, or a failed request falls back to the bundled workbook. A production build leaves the flag off, so lessons 1–9 stay static and still read the old files. A bad row rejects the publish. The current pointer stays on the last good version.

Migration (not applied): `supabase/migrations/20261026001000_academy_lesson_versions.sql`. Bucket `academy-media` is in that file. `npm run lesson:upload:media` is a dry run until `--apply`. It copies WebP and MP3 bytes as-is and skips an object name that already exists.

Pictures and clips resolve from `NEXT_PUBLIC_ACADEMY_MEDIA_BASE` when that is set, and from `/public` when it is empty.

## Still open

- Module 2 routes still play `lib/academy/lessons/payload/source/explorer-m1/workbook.xlsx` sheet `Explorer M2 Screens`. The master's M2 tabs are not played. The old workbook stays.
- The migration has not been applied, and nothing has been uploaded to storage. Preview uses the files under `/public`.
- Every picture cell on the three M1 tabs names a file, and every named picture and Audio File Name resolves. A named file shows on the lesson screen, including a two-bucket sort. A blank cell or `not allowed` still shows no picture. This master has neither. The extra `Sheet1` tab is Cath's reference list. The reader selects `Lesson Details` and the `M1` cohort tabs by name and does not read `Sheet1`.
