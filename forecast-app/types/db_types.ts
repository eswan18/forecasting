import {
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

// Tables: users, categories, props, forecasts, resolutions

export interface Database {
  users: UsersTable,
  categories: CategoriesTable,
  props: PropsTable,
  forecasts: ForecastsTable,
  resolutions: ResolutionsTable,
  v_forecasts: VForecastsView,
}

export interface UsersTable {
  id: Generated<number>,
  name: string,
  email: string,
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