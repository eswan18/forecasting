import { describe, expect, beforeEach, vi } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import {
  ifRunningContainerTestsIt,
  shouldRunContainerTests,
} from "../../tests/helpers/testUtils";

vi.mock("server-only", () => ({}));

describe("attachOptions", () => {
  let db: any;
  let factory: TestDataFactory;
  let attachOptions: typeof import("./prop-options").attachOptions;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
      attachOptions = (await import("./prop-options")).attachOptions;
    }
  });

  ifRunningContainerTestsIt("returns nothing for binary props", async () => {
    const prop = await factory.createProp();
    const map = await db
      .transaction()
      .execute((trx: any) =>
        attachOptions(trx, [{ prop_id: prop.id, prop_kind: "binary" }], null),
      );
    expect(map.size).toBe(0);
  });

  ifRunningContainerTestsIt(
    "returns options in position order with user values, averages and outcomes",
    async () => {
      const me = await factory.createUser();
      const other = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp("one_of", [
        "A",
        "B",
        "C",
      ]);
      await factory.createChoiceForecast(me.id, prop.id, [
        { optionId: options[0].id, probability: 0.5 },
        { optionId: options[1].id, probability: 0.3 },
        { optionId: options[2].id, probability: 0.2 },
      ]);
      await factory.createChoiceForecast(other.id, prop.id, [
        { optionId: options[0].id, probability: 0.1 },
        { optionId: options[1].id, probability: 0.1 },
        { optionId: options[2].id, probability: 0.8 },
      ]);
      await factory.createChoiceResolution(
        prop.id,
        options.map((o, i) => ({ optionId: o.id, outcome: i === 2 })),
      );

      const map = await db
        .transaction()
        .execute((trx: any) =>
          attachOptions(
            trx,
            [{ prop_id: prop.id, prop_kind: "one_of" }],
            me.id,
          ),
        );
      const summary = map.get(prop.id)!;
      expect(summary.map((o: any) => o.text)).toEqual(["A", "B", "C"]);
      expect(summary.map((o: any) => o.user_forecast)).toEqual([0.5, 0.3, 0.2]);
      expect(summary.map((o: any) => Number(o.community_average))).toEqual([
        0.3, 0.2, 0.5,
      ]);
      expect(summary.map((o: any) => o.outcome)).toEqual([false, false, true]);
    },
  );

  ifRunningContainerTestsIt(
    "leaves user_forecast null for a user without a forecast",
    async () => {
      const me = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp("any_of", [
        "A",
        "B",
      ]);
      const map = await db
        .transaction()
        .execute((trx: any) =>
          attachOptions(
            trx,
            [{ prop_id: prop.id, prop_kind: "any_of" }],
            me.id,
          ),
        );
      const summary = map.get(prop.id)!;
      expect(summary).toHaveLength(options.length);
      expect(
        summary.every(
          (o: any) =>
            o.user_forecast === null &&
            o.community_average === null &&
            o.outcome === null,
        ),
      ).toBe(true);
    },
  );
});
