"use server";

import { sql, type Transaction } from "kysely";
import type { Database, PropOptionSummary } from "@/types/db_types";
import { isChoiceKind, type PropKind } from "@/lib/prop-kind";

/**
 * Loads the option summaries for every choice prop in `props`, keyed by prop
 * id and ordered by position. Binary props get no entry (callers default to
 * `[]`). Runs inside the caller's RLS transaction.
 */
export async function attachOptions<
  T extends { prop_id: number; prop_kind: PropKind },
>(
  trx: Transaction<Database>,
  props: T[],
  userId: number | null,
): Promise<Map<number, PropOptionSummary[]>> {
  const propIds = [
    ...new Set(
      props.filter((p) => isChoiceKind(p.prop_kind)).map((p) => p.prop_id),
    ),
  ];
  const result = new Map<number, PropOptionSummary[]>();
  if (propIds.length === 0) return result;

  const [options, averages, mine] = await Promise.all([
    trx
      .selectFrom("v_prop_options")
      .selectAll()
      .where("prop_id", "in", propIds)
      .orderBy("prop_id")
      .orderBy("position")
      .execute(),
    trx
      .selectFrom("forecast_options")
      .select([
        "option_id",
        sql<number>`AVG(probability)`.as("community_average"),
      ])
      .where("prop_id", "in", propIds)
      .groupBy("option_id")
      .execute(),
    userId === null
      ? Promise.resolve([] as { option_id: number; probability: number }[])
      : trx
          .selectFrom("forecast_options")
          .innerJoin(
            "forecasts",
            "forecasts.id",
            "forecast_options.forecast_id",
          )
          .select([
            "forecast_options.option_id",
            "forecast_options.probability",
          ])
          .where("forecast_options.prop_id", "in", propIds)
          .where("forecasts.user_id", "=", userId)
          .execute(),
  ]);

  const averageByOption = new Map(
    averages.map((a) => [a.option_id, Number(a.community_average)] as const),
  );
  const mineByOption = new Map(
    mine.map((m) => [m.option_id, Number(m.probability)] as const),
  );

  for (const o of options) {
    const list = result.get(o.prop_id) ?? [];
    list.push({
      option_id: o.option_id,
      text: o.option_text,
      position: o.position,
      outcome: o.outcome,
      user_forecast: mineByOption.get(o.option_id) ?? null,
      community_average: averageByOption.get(o.option_id) ?? null,
    });
    result.set(o.prop_id, list);
  }
  return result;
}
