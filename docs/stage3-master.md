# Stage 3 master workbook

Preview reads Module 1 from `lib/academy/lessons/payload/source/master/module-1-screens.xlsx` (Cath's master, md5 `03b6f4167a1ee39df7d2203949626c10`). Production stays on Screens1.csv, Lesson-Details.csv, and Explorer `lessons.json`.

Flag: `ACADEMY_MASTER_PAYLOAD` (server) and `NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD` (the Academy map). `1` or `true` turns it on. `0` or `false` turns it off. When neither is set, it is on only for a Vercel preview (`VERCEL_ENV=preview`).

Lesson pages on that flag call `connection()` and fetch `academy_lesson_current` with `cache: "no-store"`, so a preview request is not baked at build time. An empty table, a missing table, or a failed request falls back to the bundled workbook. A production build leaves the flag off, so lessons 1–9 stay static and still read the old files. A bad row rejects the publish. The current pointer stays on the last good version.

Migration (not applied): `supabase/migrations/20261026001000_academy_lesson_versions.sql`. Bucket `academy-media` is in that file. `npm run lesson:upload:media` is a dry run until `--apply`. It copies WebP and MP3 bytes as-is and skips an object name that already exists.

Pictures and clips resolve from `NEXT_PUBLIC_ACADEMY_MEDIA_BASE` when that is set, and from `/public` when it is empty.

## Still open

- Explorer Module 2 is only on `lib/academy/lessons/payload/source/explorer-m1/workbook.xlsx` sheet `Explorer M2 Screens`. It is not in the master. Routes do not play it. The old workbook stays.
- The migration has not been applied, and nothing has been uploaded to storage. Preview uses the files under `/public`.
- Seven picture cells are still blank on purpose: Pathfinder rows 34, 37, and 97, and Maverick rows 14, 37, 97, and 100. Every filled picture cell and every Audio File Name cell resolves.
