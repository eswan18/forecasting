import {
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  categories: CategoriesTable,
  feature_flags: FeatureFlagsTable,
  forecasts: ForecastsTable,
  invite_tokens: InviteTokensTable,
  logins: LoginsTable,
  password_reset_tokens: PasswordResetTokensTable,
  props: PropsTable,
  resolutions: ResolutionsTable,
  suggested_props: SuggestedPropsTable,
  users: UsersTable,
  v_props: VPropsView,
  v_forecasts: VForecastsView,
  v_users: VUsersView,
  v_suggested_props: VSuggestedPropsView,
  v_feature_flags: VFeatureFlagsView,
  v_password_reset_tokens: VPasswordResetTokensView,
}

// Tables

export interface UsersTable {
  id: Generated<number>,
  name: string,
  email: string,
  login_id: number | null,
  is_admin: boolean,
}
export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>

export interface CategoriesTable {
  id: Generated<number>,
  name: string,
}
export type Category = Selectable<CategoriesTable>
export type NewCategory = Insertable<CategoriesTable>
export type CategoryUpdate = Updateable<CategoriesTable>

export interface PropsTable {
  id: Generated<number>,
  text: string,
  category_id: number,
  year: number,
  notes: string | null,
  user_id: number | null,
}
export type Prop = Selectable<PropsTable>
export type NewProp = Insertable<PropsTable>
export type PropUpdate = Updateable<PropsTable>

export interface ForecastsTable {
  id: Generated<number>,
  prop_id: number,
  user_id: number,
  forecast: number,
}
export type Forecast = Selectable<ForecastsTable>
export type NewForecast = Insertable<ForecastsTable>
export type ForecastUpdate = Updateable<ForecastsTable>

export interface ResolutionsTable {
  id: Generated<number>,
  prop_id: number,
  resolution: boolean,
  notes: string | null,
  user_id: number | null,
}
export type Resolution = Selectable<ResolutionsTable>
export type NewResolution = Insertable<ResolutionsTable>
export type ResolutionUpdate = Updateable<ResolutionsTable>

export interface LoginsTable {
  id: Generated<number>,
  username: string,
  password_hash: string,
}
export type Login = Selectable<LoginsTable>
export type NewLogin = Insertable<LoginsTable>
export type LoginUpdate = Updateable<LoginsTable>

export interface SuggestedPropsTable {
  id: Generated<number>,
  suggester_user_id: number,
  prop: string,
}
export type SuggestedProp = Selectable<SuggestedPropsTable>
export type NewSuggestedProp = Insertable<SuggestedPropsTable>
export type SuggestedPropUpdate = Updateable<SuggestedPropsTable>

export interface FeatureFlagsTable {
  id: Generated<number>,
  name: string,
  user_id: number | null,
  enabled: boolean,
}
export type FeatureFlag = Selectable<FeatureFlagsTable>
export type NewFeatureFlag = Insertable<FeatureFlagsTable>
export type FeatureFlagUpdate = Updateable<FeatureFlagsTable>

export interface PasswordResetTokensTable {
  id: Generated<number>,
  login_id: number,
  token: string,
  initiated_at: Date,
  expires_at: Date,
}
export type PasswordReset = Selectable<PasswordResetTokensTable>
export type NewPasswordReset = Insertable<PasswordResetTokensTable>
export type PasswordResetUpdate = Updateable<PasswordResetTokensTable>

export interface InviteTokensTable {
  id: Generated<number>,
  token: string,
  created_at: Date,
  used_at: Date | null,
  notes: string | null,
}
export type InviteToken = Selectable<InviteTokensTable>;
export type NewInviteToken = Insertable<InviteTokensTable>;
export type InviteTokenUpdate = Updateable<InviteTokensTable>;

// Views

export interface VPropsView {
  prop_id: number,
  prop_text: string,
  prop_notes: string | null,
  prop_user_id: number,
  category_id: number,
  category_name: string,
  year: number,
  resolution_id: number | null,
  resolution: boolean | null,
  resolution_user_id: number | null,
  resolution_notes: string | null,
}
export type VProp = Selectable<VPropsView>

export interface VForecastsView {
  user_id: number,
  user_name: string,
  category_id: number,
  category_name: string,
  prop_id: number,
  prop_text: string,
  prop_notes: string | null,
  year: number,
  forecast_id: number
  forecast: number,
  resolution_id: number | null,
  resolution: boolean | null,
  resolution_user_id: number | null,
  resolution_notes: string | null,
  score: number | null,
}
export type VForecast = Selectable<VForecastsView>

export interface VUsersView {
  id: number,
  name: string,
  email: string,
  is_admin: boolean,
  login_id: number | null,
  username: string | null,
}
export type VUser = Selectable<VUsersView>

export interface VSuggestedPropsView {
  id: number,
  prop_text: string,
  user_id: number,
  login_id: number | null,
  user_name: string,
  user_email: string,
  user_username: string | null,
}
export type VSuggestedProp = Selectable<VSuggestedPropsView>

export interface VFeatureFlagsView {
  id: number,
  name: string,
  user_id: number | null,
  enabled: boolean,
  user_name: string | null,
  user_email: string | null,
  user_login_id: number | null,
  user_is_admin: boolean | null,
}
export type VFeatureFlag = Selectable<VFeatureFlagsView>

export interface VPasswordResetTokensView {
  id: number,
  login_id: number,
  token: string,
  initiated_at: Date,
  expires_at: Date,
  username: string | null,
  user_id: number | null,
  name: string | null,
  email: string | null,
}
export type VPasswordResetToken = Selectable<VPasswordResetTokensView>