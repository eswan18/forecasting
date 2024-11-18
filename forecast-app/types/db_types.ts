import {
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  users: UsersTable,
  categories: CategoriesTable,
  props: PropsTable,
  forecasts: ForecastsTable,
  resolutions: ResolutionsTable,
  logins: LoginsTable,
  suggested_props: SuggestedPropsTable,
  v_props: VPropsView,
  v_forecasts: VForecastsView,
  v_users: VUsersView,
  v_suggested_props: VSuggestedPropsView,
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
}
export type Resolution = Selectable<ResolutionsTable>
export type NewResolution = Insertable<ResolutionsTable>
export type ResolutionUpdate = Updateable<ResolutionsTable>

export interface LoginsTable {
  id: Generated<number>,
  username: string,
  password_hash: string,
  is_salted: boolean,
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

// Views

export interface VPropsView {
  prop_id: number,
  prop_text: string,
  category_id: number,
  category_name: string,
  year: number,
  resolution: boolean | null,
}
export type VProp = Selectable<VPropsView>

export interface VForecastsView {
  user_id: number,
  user_name: string,
  category_id: number,
  category_name: string,
  prop_id: number,
  prop_text: string,
  year: number,
  forecast: number,
  resolution: boolean | null,
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
  is_salted: boolean | null,
}
export type VUser = Selectable<VUsersView>

export interface VSuggestedPropsView {
  id: number,
  prop: string,
  user_id: number,
  name: string,
  email: string,
}
export type VSuggestedProp = Selectable<VSuggestedPropsView>