/** Payload shape version stored in academy_lesson_versions.payload. Bump on a shape change. */
export const MASTER_PAYLOAD_SCHEMA_VERSION = 1;

/**
 * Modules whose lessons are read from academy_lesson_versions.
 * Module 1 is in the live database, and production serves it from there.
 * Later modules are not in the app or the database yet. Do not add one
 * here until its published version is the lesson learners should play.
 */
export const ACADEMY_DB_LESSON_MODULES: readonly number[] = [1];
