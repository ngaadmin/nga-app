-- School-trial usage export.
-- Run in the Supabase SQL editor (service role / postgres). Each statement
-- stands alone. Download the result as CSV from the editor.
-- in_school_hours is Monday–Friday, Australia/Brisbane, 08:30 until 15:00.

-- 1. Raw events
SELECT
  id,
  created_at,
  username,
  class_id,
  event_type,
  lesson_number,
  xp_total,
  streak_days,
  in_school_hours,
  metadata
FROM public.usage_events_report
ORDER BY created_at;

-- 2. Per-student summary
SELECT
  report.username,
  latest_class.class_id,
  COUNT(*) FILTER (
    WHERE report.event_type = 'login' AND report.in_school_hours
  ) AS logins_school,
  COUNT(*) FILTER (
    WHERE report.event_type = 'login' AND NOT report.in_school_hours
  ) AS logins_home,
  COUNT(*) FILTER (WHERE report.event_type = 'lesson_started') AS lessons_started,
  COUNT(*) FILTER (WHERE report.event_type = 'lesson_completed') AS lessons_completed,
  COUNT(*) FILTER (WHERE report.event_type = 'medal_earned') AS medals,
  (
    ARRAY_AGG(report.xp_total ORDER BY report.created_at DESC)
    FILTER (WHERE report.xp_total IS NOT NULL)
  )[1] AS latest_xp,
  (
    ARRAY_AGG(report.streak_days ORDER BY report.created_at DESC)
    FILTER (WHERE report.streak_days IS NOT NULL)
  )[1] AS latest_streak,
  COUNT(*) FILTER (WHERE report.event_type = 'vault_visit') AS vault_visits,
  COUNT(*) FILTER (WHERE report.event_type = 'launchpad_visit') AS launchpad_visits
FROM public.usage_events_report AS report
LEFT JOIN (
  SELECT DISTINCT ON (username)
    username,
    class_id
  FROM public.usage_events_report
  WHERE class_id IS NOT NULL
  ORDER BY username, created_at DESC
) AS latest_class ON latest_class.username = report.username
GROUP BY report.username, latest_class.class_id
ORDER BY latest_class.class_id NULLS LAST, report.username;

-- 3. Per-class summary
SELECT
  class_id,
  COUNT(DISTINCT username) AS students,
  COUNT(*) FILTER (
    WHERE event_type = 'login' AND in_school_hours
  ) AS logins_school,
  COUNT(*) FILTER (
    WHERE event_type = 'login' AND NOT in_school_hours
  ) AS logins_home,
  COUNT(*) FILTER (WHERE event_type = 'lesson_started') AS lessons_started,
  COUNT(*) FILTER (WHERE event_type = 'lesson_completed') AS lessons_completed,
  COUNT(*) FILTER (WHERE event_type = 'medal_earned') AS medals,
  COUNT(*) FILTER (WHERE event_type = 'vault_visit') AS vault_visits,
  COUNT(*) FILTER (WHERE event_type = 'launchpad_visit') AS launchpad_visits
FROM public.usage_events_report
GROUP BY class_id
ORDER BY class_id NULLS LAST;
