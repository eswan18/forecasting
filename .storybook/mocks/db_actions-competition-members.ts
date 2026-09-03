// Storybook mock for `@/lib/db_actions/competition-members`, used by the
// members sheet and the invite dialog. The real module reaches Postgres.
import { success } from "@/lib/server-action-result";

export type CompetitionRole = "admin" | "forecaster";

export const getCompetitionMembers = async () => success([]);
export const getCurrentUserRole = async () => success(null);
export const removeCompetitionMember = async () => success(undefined);
export const updateMemberRole = async () => success(undefined);
export const getMemberCount = async () => success(0);
export const getEligibleMembers = async () => success([]);
export const addCompetitionMemberById = async () => success(undefined);
