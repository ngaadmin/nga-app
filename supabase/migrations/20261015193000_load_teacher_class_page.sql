-- One round trip for the teacher class page.
-- PostgREST checks the caller JWT, and this function returns the teacher row,
-- class seats, and learner_progress payloads together.
-- The password columns stay revoked from browser roles. Only this definer
-- function, running as its owner, reads them for auth.uid().

CREATE OR REPLACE FUNCTION public.load_teacher_class_page()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN jsonb_build_object('error', 'signed_out')
    WHEN teacher.id IS NULL THEN jsonb_build_object('error', 'not_teacher')
    ELSE jsonb_build_object(
      'error', NULL,
      'id', teacher.id,
      'is_teacher', teacher.is_teacher,
      'account_status', teacher.account_status,
      'seat_cap', teacher.seat_cap,
      'class_password', teacher.class_password,
      'class_password_enc', teacher.class_password_enc,
      'class_cohort', teacher.class_cohort,
      'seats', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', seat.id,
            'username', seat.username,
            'curriculum_cohort', seat.curriculum_cohort,
            'payload', progress.payload
          )
          ORDER BY seat.username
        )
        FROM public.profiles AS seat
        LEFT JOIN public.learner_progress AS progress
          ON progress.user_id = seat.id
        WHERE seat.teacher_id = teacher.id
          AND seat.is_teacher = false
      ), '[]'::jsonb)
    )
  END
  FROM (SELECT auth.uid() AS uid) AS caller
  LEFT JOIN public.profiles AS teacher
    ON teacher.id = caller.uid
   AND teacher.is_teacher IS TRUE
   AND teacher.account_status = 'active';
$$;

REVOKE ALL ON FUNCTION public.load_teacher_class_page() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.load_teacher_class_page() FROM anon;
GRANT EXECUTE ON FUNCTION public.load_teacher_class_page() TO authenticated;
