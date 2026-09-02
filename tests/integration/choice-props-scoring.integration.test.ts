import { describe, expect, beforeEach } from "vitest";
import { Kysely, sql } from "kysely";
import { Database } from "@/types/db_types";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import {
  ifRunningContainerTestsIt,
  shouldRunContainerTests,
} from "../helpers/testUtils";
import {
  scoreBinaryForecast,
  scoreChoiceForecast,
} from "@/lib/choice-forecast";

/**
 * `v_forecasts.score` is the SQL twin of `scoreChoiceForecast`; these tests pin
 * the two together for every prop kind so a change to one without the other
 * fails loudly. The two agree only on fully-covered inputs (every option has a
 * probability and an outcome), which is what the factories produce here.
 */

/** pg hands numerics back as strings, so normalize before comparing. */
async function scoreFor(
  db: Kysely<Database>,
  userId: number,
  propId: number,
): Promise<number | null> {
  const row = await db
    .selectFrom("v_forecasts")
    .select("score")
    .where("user_id", "=", userId)
    .where("prop_id", "=", propId)
    .executeTakeFirstOrThrow();
  return row.score === null ? null : Number(row.score);
}

describe("v_forecasts.score for every prop kind", () => {
  let db: Kysely<Database>;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
    }
  });

  ifRunningContainerTestsIt("binary is unchanged: (outcome - p)^2", async () => {
    const user = await factory.createUser();
    const prop = await factory.createProp();
    await factory.createForecast(user.id, prop.id, { forecast: 0.7 });
    expect(await scoreFor(db, user.id, prop.id)).toBeNull();
    await factory.createResolution(prop.id, { resolution: true });
    const expected = scoreBinaryForecast(0.7, true);
    expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(expected, 10);
    // Sanity: (1 - 0.7)^2
    expect(expected).toBeCloseTo(0.09, 10);
  });

  ifRunningContainerTestsIt(
    "one_of matches scoreChoiceForecast and halves the multi-category Brier",
    async () => {
      const user = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp("one_of", [
        "Knicks",
        "Spurs",
        "Thunder",
        "Other",
      ]);
      const probs = [0.23, 0.18, 0.15, 0.44].map((probability, i) => ({
        optionId: options[i].id,
        probability,
      }));
      await factory.createChoiceForecast(user.id, prop.id, probs);
      expect(await scoreFor(db, user.id, prop.id)).toBeNull();
      const outcomes = options.map((o) => ({
        optionId: o.id,
        outcome: o.text === "Spurs",
      }));
      await factory.createChoiceResolution(prop.id, outcomes);
      const expected = scoreChoiceForecast("one_of", probs, outcomes);
      expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(expected, 10);
      // Sanity: 1/2 * [(0.23)^2 + (1 - 0.18)^2 + (0.15)^2 + (0.44)^2]
      expect(expected).toBeCloseTo(
        0.5 * (0.0529 + 0.6724 + 0.0225 + 0.1936),
        10,
      );
    },
  );

  ifRunningContainerTestsIt(
    "any_of matches scoreChoiceForecast and averages per-option Briers",
    async () => {
      const user = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp("any_of", [
        "A",
        "B",
        "C",
      ]);
      const probs = [0.9, 0.2, 0.5].map((probability, i) => ({
        optionId: options[i].id,
        probability,
      }));
      await factory.createChoiceForecast(user.id, prop.id, probs);
      expect(await scoreFor(db, user.id, prop.id)).toBeNull();
      const outcomes = [true, true, false].map((outcome, i) => ({
        optionId: options[i].id,
        outcome,
      }));
      await factory.createChoiceResolution(prop.id, outcomes);
      const expected = scoreChoiceForecast("any_of", probs, outcomes);
      expect(await scoreFor(db, user.id, prop.id)).toBeCloseTo(expected, 10);
      // Sanity: 1/3 * [(1 - 0.9)^2 + (1 - 0.2)^2 + (0.5)^2]
      expect(expected).toBeCloseTo((0.01 + 0.64 + 0.25) / 3, 10);
    },
  );

  ifRunningContainerTestsIt(
    "a competition average counts a choice prop once",
    async () => {
      const user = await factory.createUser();
      const competition = await factory.createCompetition();
      const binary = await factory.createCompetitionProp(competition.id);
      await factory.createForecast(user.id, binary.id, { forecast: 0.6 });
      await factory.createResolution(binary.id, { resolution: false });
      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["A", "B", "C", "D"],
        { competition_id: competition.id },
      );
      const probs = options.map((o) => ({
        optionId: o.id,
        probability: 0.25,
      }));
      await factory.createChoiceForecast(user.id, prop.id, probs);
      await factory.createChoiceResolution(
        prop.id,
        options.map((o, i) => ({ optionId: o.id, outcome: i === 0 })),
      );

      // One row per (user, prop) regardless of kind: the four-option prop must
      // not weigh four times as much as the binary one in the average.
      const rows = await db
        .selectFrom("v_forecasts")
        .select(["prop_id", "score"])
        .where("competition_id", "=", competition.id)
        .where("user_id", "=", user.id)
        .execute();
      expect(rows).toHaveLength(2);
      const scores = new Map(rows.map((r) => [r.prop_id, Number(r.score)]));
      expect(scores.get(binary.id)).toBeCloseTo(0.36, 10);
      expect(scores.get(prop.id)).toBeCloseTo(0.375, 10);

      const result = await sql<{ avg: string | null }>`
        SELECT AVG(score) AS avg FROM v_forecasts
        WHERE competition_id = ${competition.id} AND user_id = ${user.id}`.execute(
        db,
      );
      // Binary: (0 - 0.6)^2 = 0.36. one_of: 1/2 * [(1 - 0.25)^2 + 3 * (0.25)^2]
      // = 1/2 * 0.75 = 0.375.
      expect(Number(result.rows[0].avg)).toBeCloseTo((0.36 + 0.375) / 2, 10);
    },
  );
});
