# Stage 3 master workbook

Module 1 lessons are read from the database, one lesson at a time. A content change needs a new version, not a redeploy.

## Source

The workbook is `lib/academy/lessons/payload/source/master/module-1-screens.xlsx`. It is Cath's master, md5 `d1be7cb71278952bdd8772c857e70af7`, and it's named Academy - Screens (All Cohorts).

- The reader takes `--module <n>` and reads `Lesson Details` plus the `M<n> Explorer`, `M<n> Pathfinder`, and `M<n> Maverick` tabs. The older `Explorer M1` tab names still work.
- Module 2 still plays the old Explorer workbook. `ACADEMY_DB_LESSON_MODULES` in `schema-version.ts` lists the modules that are read from the database. Add a module there once its draft is published.
- Lesson numbers are progress keys (milestones 1–54). A publish that moves a lesson title to another number is refused.

## Flag

The flags are `ACADEMY_MASTER_PAYLOAD` (server) and `NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD` (the Academy map).

- `1` or `true` turns it on, and `0` or `false` turns it off.
- When neither is set, the flag is on only for a Vercel preview (`VERCEL_ENV=preview`).
- With the flag off, Module 1 still plays the bundled Screens1.csv path from `/public`.

## How a lesson loads

A lesson loads in this order:

1. The current version, from `academy_lesson_current` joined to `academy_lesson_versions`. Only that lesson's slice is selected. The Next data cache keeps it for 5 minutes under the tag `academy-lessons`.
2. The last good copy this server fetched, if the read fails. This logs `academy_lesson_served_stale`.
3. A friendly error screen, "This lesson can't load right now". This logs `academy_lesson_error_screen`.

There is no bundled fallback, and every fallback logs a JSON line.

An unknown `schemaVersion`, a row for another module, or a version without an https `mediaBase` counts as a failed read.

## Drafts

Drafts show only when `VERCEL_ENV=preview`, through `?draft=<version id>`, `?draft=latest`, or `ACADEMY_PREVIEW_VERSION_ID`. Draft reads aren't cached. A production deployment never reads a draft.

## Media

Pictures and clips come only from the public `academy-media` bucket, under `images/<name>` and `audio/<name>`.

- A picture that fails to load shows a placeholder and logs `academy_media_failed`. So does a clip that fails.
- Uploads are delta-only and never overwrite a name. An existing object of a different size is reported as a conflict, so a changed picture needs a new name.
- Uploads are stored with `cache-control: public, max-age=31536000, immutable`.
- New or changed pictures are capped at 120KB. Lars pictures are capped at 90KB.
- Lars art (any name with `lars`, and the `beat-ex-m1-l*` scenes) is held until Jasper approves the compressed set. After that, run:

      npx tsx tools/upload-academy-media.ts --module 1 --apply --release-held \
        --source <approved-dir> --source <approved-dir>/pairs

## Publishing

    npx tsx tools/publish-master-lessons.ts --module 1 --draft

This checks the workbook and the bucket, then stores a draft. A missing picture or clip blocks the draft.

- `--allow-held-pending` stores missing held Lars objects in `media.pending` instead. A draft with anything pending can't be promoted.
- `--promote <id>` prints what is blocking, or the SQL to move `academy_lesson_current` plus the revalidate call. It never runs either one.

To revalidate after a promote, POST `/api/academy/revalidate` with the header `x-academy-revalidate-secret` set to `ACADEMY_REVALIDATE_SECRET`. The route returns 404 when that secret is unset.

## Preview job

`tools/academy-preview-job.ts` runs in `prebuild`, and only when all three of these hold:

- `VERCEL_ENV=preview`
- `ACADEMY_PREVIEW_JOB=1`
- the branch is in its allow-list

It uploads the media that isn't held, using the preview's own Supabase env, then stores a draft with the held Lars art pending. It never writes `academy_lesson_current`, never prints a key, and never fails the build.

## Still open

- Screens1.csv (the flag-off path) still names the `beat-ex-m1-l*-r1` scenes on 6 rows where the master now names `-r2`. Those `-r2` files are held Lars art and aren't in `/public`, so the CSV is left alone.
- M1 pictures stay in `/public` until every M1 object, including the held Lars set, is verified in the bucket and the flag is on in production.
