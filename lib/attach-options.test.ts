import { describe, expect, beforeEach, vi } from "vitest";
import { getTestDb } from "../tests/helpers/testDatabase";
import { TestDataFactory } from "../tests/helpers/testFactories";
import {
  ifRunningContainerTestsIt,
  shouldRunContainerTests,
} from "../tests/helpers/testUtils";

vi.mock("server-only", () => ({}));

describe("attachOptions", () => {
  let db: any;
  let factory: TestDataFactory;
  let attachOptions: typeof import("./attach-options").attachOptions;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
      attachOptions = (await import("./attach-options")).attachOptions;
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
          attachOptions(trx, [{ prop_id: prop.id, prop_kind: "one_of" }], me.id),
        );
      const summary = map.get(prop.id)!;
      expect(summary.map((o: any) => o.text)).toEqual(["A", "B", "C"]);
      expect(summary.map((o: any) => o.user_forecast)).toEqual([0.5, 0.3, 0.2]);
      // Raw, not Number()-wrapped: the helper owns that conversion.
      expect(summary.map((o: any) => o.community_average)).toEqual([
        0.3, 0.2, 0.5,
      ]);
      expect(summary.map((o: any) => o.outcome)).toEqual([false, false, true]);
    },
  );

  ifRunningContainerTestsIt(
    "keys options by prop for several choice props at once",
    async () => {
      const me = await factory.createUser();
      const { prop: pair, options: pairOptions } =
        await factory.createChoiceProp("one_of", ["P1", "P2"]);
      const { prop: trio, options: trioOptions } =
        await factory.createChoiceProp("any_of", ["T1", "T2", "T3"]);
      await factory.createChoiceForecast(me.id, trio.id, [
        { optionId: trioOptions[0].id, probability: 0.9 },
        { optionId: trioOptions[1].id, probability: 0.4 },
        { optionId: trioOptions[2].id, probability: 0.1 },
      ]);

      const map = await db.transaction().execute((trx: any) =>
        attachOptions(
          trx,
          [
            { prop_id: pair.id, prop_kind: "one_of" },
            { prop_id: trio.id, prop_kind: "any_of" },
          ],
          me.id,
        ),
      );

      expect(map.size).toBe(2);
      expect(map.get(pair.id)!.map((o: any) => o.text)).toEqual(["P1", "P2"]);
      expect(map.get(pair.id)!.map((o: any) => o.option_id)).toEqual(
        pairOptions.map((o) => o.id),
      );
      expect(
        map.get(pair.id)!.every((o: any) => o.user_forecast === null),
      ).toBe(true);
      expect(map.get(trio.id)!.map((o: any) => o.text)).toEqual([
        "T1",
        "T2",
        "T3",
      ]);
      expect(map.get(trio.id)!.map((o: any) => o.position)).toEqual([0, 1, 2]);
      expect(map.get(trio.id)!.map((o: any) => o.user_forecast)).toEqual([
        0.9, 0.4, 0.1,
      ]);
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
          attachOptions(trx, [{ prop_id: prop.id, prop_kind: "any_of" }], me.id),
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
