import { describe, expect, beforeEach } from "vitest";
import { sql } from "kysely";
import { getTestDb } from "../helpers/testDatabase";
import { TestDataFactory } from "../helpers/testFactories";
import { getTestTracker } from "../helpers/testIdTracker";
import {
  ifRunningContainerTestsIt,
  shouldRunContainerTests,
} from "../helpers/testUtils";

describe("choice props schema", () => {
  let db: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      db = await getTestDb();
      factory = new TestDataFactory(db);
    }
  });

  ifRunningContainerTestsIt("defaults props.kind to binary", async () => {
    const prop = await factory.createProp();
    const row = await db
      .selectFrom("props")
      .select("kind")
      .where("id", "=", prop.id)
      .executeTakeFirstOrThrow();
    expect(row.kind).toBe("binary");
  });

  ifRunningContainerTestsIt("rejects an unknown kind", async () => {
    await expect(
      factory.createProp({ kind: "multi" } as any),
    ).rejects.toThrow();
  });

  ifRunningContainerTestsIt("rejects changing a prop's kind", async () => {
    const prop = await factory.createProp();
    await expect(
      db
        .updateTable("props")
        .set({ kind: "one_of" })
        .where("id", "=", prop.id)
        .execute(),
    ).rejects.toThrow(/cannot be changed/);
  });

  ifRunningContainerTestsIt(
    "rejects a null forecast on a binary prop and a scalar forecast on a choice prop",
    async () => {
      const user = await factory.createUser();
      const binary = await factory.createProp();
      await expect(
        db
          .insertInto("forecasts")
          .values({ user_id: user.id, prop_id: binary.id, forecast: null })
          .execute(),
      ).rejects.toThrow(/binary props/);
      const { prop } = await factory.createChoiceProp("one_of", ["A", "B"]);
      await expect(
        db
          .insertInto("forecasts")
          .values({ user_id: user.id, prop_id: prop.id, forecast: 0.5 })
          .execute(),
      ).rejects.toThrow(/choice props/);
    },
  );

  ifRunningContainerTestsIt(
    "rejects a null resolution on a binary prop and a boolean resolution on a choice prop",
    async () => {
      const binary = await factory.createProp();
      await expect(
        db
          .insertInto("resolutions")
          .values({ prop_id: binary.id, resolution: null })
          .execute(),
      ).rejects.toThrow(/binary props/);
      const { prop } = await factory.createChoiceProp("any_of", ["A", "B"]);
      await expect(
        db
          .insertInto("resolutions")
          .values({ prop_id: prop.id, resolution: true })
          .execute(),
      ).rejects.toThrow(/choice props/);
    },
  );

  ifRunningContainerTestsIt("allows only one resolution per prop", async () => {
    const prop = await factory.createProp();
    await factory.createResolution(prop.id);
    await expect(factory.createResolution(prop.id)).rejects.toThrow(
      /resolutions_prop_unique/,
    );
  });

  ifRunningContainerTestsIt(
    "rejects a forecast option that belongs to a different prop",
    async () => {
      const user = await factory.createUser();
      const a = await factory.createChoiceProp("one_of", ["A1", "A2"]);
      const b = await factory.createChoiceProp("one_of", ["B1", "B2"]);
      const header = await db
        .insertInto("forecasts")
        .values({ user_id: user.id, prop_id: a.prop.id, forecast: null })
        .returning("id")
        .executeTakeFirstOrThrow();
      getTestTracker().trackId("forecasts", header.id); // so afterEach cleanup removes it
      await expect(
        db
          .insertInto("forecast_options")
          .values({
            forecast_id: header.id,
            prop_id: a.prop.id,
            option_id: b.options[0].id,
            probability: 1,
          })
          .execute(),
      ).rejects.toThrow();
    },
  );

  ifRunningContainerTestsIt(
    "has RLS enabled and the named policies on the new tables",
    async () => {
      const rls = await sql<{ relname: string; relrowsecurity: boolean }>`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relname IN ('prop_options', 'forecast_options', 'resolution_options')`.execute(
        db,
      );
      expect(rls.rows).toHaveLength(3);
      expect(rls.rows.every((r) => r.relrowsecurity)).toBe(true);
      const policies = await sql<{ policyname: string }>`
      SELECT policyname FROM pg_policies
      WHERE tablename IN ('prop_options', 'forecast_options', 'resolution_options')`.execute(
        db,
      );
      expect(policies.rows.map((p) => p.policyname).sort()).toEqual([
        "manage_forecast_options",
        "manage_prop_options",
        "manage_resolution_options",
        "view_forecast_options",
        "view_prop_options",
        "view_resolution_options",
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "exposes options with outcomes through v_prop_options",
    async () => {
      const { prop, options } = await factory.createChoiceProp("one_of", [
        "A",
        "B",
        "C",
      ]);
      await factory.createChoiceResolution(
        prop.id,
        options.map((o, i) => ({ optionId: o.id, outcome: i === 1 })),
      );
      const rows = await db
        .selectFrom("v_prop_options")
        .selectAll()
        .where("prop_id", "=", prop.id)
        .orderBy("position")
        .execute();
      expect(rows.map((r: any) => [r.option_text, r.outcome])).toEqual([
        ["A", false],
        ["B", true],
        ["C", false],
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "scores an unresolved any_of prop as null rather than dividing by zero",
    async () => {
      // The score subquery matches no rows until the prop resolves, so the
      // any_of divisor (the option count) is 0 there; without the NULLIF guard
      // in the view this read fails outright with "division by zero".
      const user = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp("any_of", [
        "A",
        "B",
      ]);
      await factory.createChoiceForecast(
        user.id,
        prop.id,
        options.map((o) => ({ optionId: o.id, probability: 0.5 })),
      );
      const rows = await db
        .selectFrom("v_forecasts")
        .select(["prop_kind", "score"])
        .where("prop_id", "=", prop.id)
        .execute();
      expect(rows).toHaveLength(1);
      expect(rows[0].prop_kind).toBe("any_of");
      expect(rows[0].score).toBeNull();
    },
  );
});
