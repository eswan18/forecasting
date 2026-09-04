/**
 * Limits for the admin's hand-written email, shared by the form and the server
 * action that re-checks it.
 *
 * They live here rather than in `lib/db_actions/admin-email.ts` because that
 * file is `"use server"`, and such a module may only export async functions —
 * a plain `export const` there is a build error, not a style preference.
 */
export const SUBJECT_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 10_000;
