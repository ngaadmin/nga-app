/** Payload shape version stored in academy_lesson_versions.payload. Bump on a shape change. */
export const MASTER_PAYLOAD_SCHEMA_VERSION = 1;

/**
 * Modules whose lessons are read from academy_lesson_versions.
 * Module 2 still plays the older bundled Explorer workbook.
 */
export const ACADEMY_DB_LESSON_MODULES: readonly number[] = [1];
