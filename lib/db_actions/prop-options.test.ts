import { vi, describe, expect, beforeEach } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../../tests/helpers/testUtils";

let updatePropOptions: typeof import("./prop-options").updatePropOptions;

// `prop-options.ts` is a server module; neither import survives in vitest.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";

describe("updatePropOptions", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();

      const propOptionsModule = await import("./prop-options");
      updatePropOptions = propOptionsModule.updatePropOptions;
    } else {
      vi.clearAllMocks();
    }
  });

  /** The prop's options as stored, ordered by position. */
  async function storedOptions(propId: number) {
    return testDb
      .selectFrom("prop_options")
      .select(["id", "text", "position"])
      .where("prop_id", "=", propId)
      .orderBy("position")
      .execute();
  }

  ifRunningContainerTestsIt(
    "renames the labels in place, trimmed, leaving ids and positions alone",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["Knicks", "Spurs"],
        { user_id: owner.id, competition_id: null },
      );

      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "  New York Knicks  " },
          { id: options[1].id, text: "San Antonio Spurs" },
        ],
      });

      expect(result.success).toBe(true);
      expect(await storedOptions(prop.id)).toEqual([
        { id: options[0].id, text: "New York Knicks", position: 0 },
        { id: options[1].id, text: "San Antonio Spurs", position: 1 },
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "swaps two labels in one call",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["Knicks", "Spurs"],
        { user_id: owner.id, competition_id: null },
      );

      // A permutation: each UPDATE lands on a label the other row still
      // holds, so this only commits because the (prop_id, text) uniqueness
      // is deferred to the end of the transaction.
      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "Spurs" },
          { id: options[1].id, text: "Knicks" },
        ],
      });

      expect(result.success).toBe(true);
      expect(await storedOptions(prop.id)).toEqual([
        { id: options[0].id, text: "Spurs", position: 0 },
        { id: options[1].id, text: "Knicks", position: 1 },
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "rotates three labels in one call",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "any_of",
        ["Rain", "Snow", "Sleet"],
        { user_id: owner.id, competition_id: null },
      );

      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "Snow" },
          { id: options[1].id, text: "Sleet" },
          { id: options[2].id, text: "Rain" },
        ],
      });

      expect(result.success).toBe(true);
      expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
        "Snow",
        "Sleet",
        "Rain",
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "refuses to remove an option and leaves the labels untouched",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["Knicks", "Spurs", "Nets"],
        { user_id: owner.id, competition_id: null },
      );

      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "Renamed Knicks" },
          { id: options[1].id, text: "Renamed Spurs" },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        expect(result.error).toContain("added or removed");
      }
      expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
        "Knicks",
        "Spurs",
        "Nets",
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "refuses to add an option that does not belong to the prop",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["Knicks", "Spurs"],
        { user_id: owner.id, competition_id: null },
      );
      const other = await factory.createChoiceProp("one_of", ["Red", "Blue"], {
        user_id: owner.id,
        competition_id: null,
      });

      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "Knicks" },
          { id: options[1].id, text: "Spurs" },
          { id: other.options[0].id, text: "Nets" },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        expect(result.error).toContain("added or removed");
      }
      // Neither prop was touched.
      expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
        "Knicks",
        "Spurs",
      ]);
      expect(
        (await storedOptions(other.prop.id)).map((o: any) => o.text),
      ).toEqual(["Red", "Blue"]);
    },
  );

  ifRunningContainerTestsIt(
    "rejects duplicate labels before touching the database",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const { prop, options } = await factory.createChoiceProp(
        "any_of",
        ["Rain", "Snow"],
        { user_id: owner.id, competition_id: null },
      );

      const result = await updatePropOptions({
        propId: prop.id,
        options: [
          { id: options[0].id, text: "Sleet" },
          { id: options[1].id, text: " Sleet " },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
        const validationResult = result as {
          validationErrors?: Record<string, string[]>;
        };
        expect(validationResult.validationErrors?.options).toContain(
          "Options must be unique",
        );
      }
      expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
        "Rain",
        "Snow",
      ]);
    },
  );

  ifRunningContainerTestsIt("rejects a blank label", async () => {
    const owner = await factory.createUser();
    vi.mocked(getUserFromCookies).mockResolvedValue(owner);

    const { prop, options } = await factory.createChoiceProp(
      "any_of",
      ["Rain", "Snow"],
      { user_id: owner.id, competition_id: null },
    );

    const result = await updatePropOptions({
      propId: prop.id,
      options: [
        { id: options[0].id, text: "   " },
        { id: options[1].id, text: "Snow" },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("VALIDATION_ERROR");
    }
    expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
      "Rain",
      "Snow",
    ]);
  });

  // The same branch that answers a caller whose RLS policies hide every
  // option row: the visible option set is empty. (RLS itself cannot be
  // exercised here — the container's `test_user` owns the tables and is a
  // superuser, and no table sets FORCE ROW LEVEL SECURITY, so policies are
  // bypassed for every test connection.)
  ifRunningContainerTestsIt(
    "is NOT_FOUND when the prop has no visible options",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const binaryProp = await factory.createPersonalProp(owner.id);

      const result = await updatePropOptions({
        propId: binaryProp.id,
        options: [
          { id: 1, text: "A label" },
          { id: 2, text: "Another label" },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
      }
      expect(await storedOptions(binaryProp.id)).toEqual([]);
    },
  );

  ifRunningContainerTestsIt(
    "is NOT_FOUND for a prop that does not exist",
    async () => {
      const owner = await factory.createUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(owner);

      const result = await updatePropOptions({
        propId: -1,
        options: [
          { id: 1, text: "A label" },
          { id: 2, text: "Another label" },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
      }
    },
  );

  ifRunningContainerTestsIt("requires a logged-in user", async () => {
    vi.mocked(getUserFromCookies).mockResolvedValue(null);

    const result = await updatePropOptions({
      propId: 1,
      options: [
        { id: 1, text: "A label" },
        { id: 2, text: "Another label" },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("UNAUTHORIZED");
    }
  });

  // Pins the schema property the two permutation tests above rely on: a
  // non-deferrable UNIQUE (prop_id, text) would reject the first UPDATE.
  ifRunningContainerTestsIt(
    "defers (prop_id, text) uniqueness to commit",
    async () => {
      const owner = await factory.createUser();
      const { prop, options } = await factory.createChoiceProp(
        "one_of",
        ["Red", "Blue"],
        { user_id: owner.id, competition_id: null },
      );

      await testDb.transaction().execute(async (trx: any) => {
        await trx
          .updateTable("prop_options")
          .set({ text: "Blue" })
          .where("id", "=", options[0].id)
          .execute();
        await trx
          .updateTable("prop_options")
          .set({ text: "Red" })
          .where("id", "=", options[1].id)
          .execute();
      });

      expect((await storedOptions(prop.id)).map((o: any) => o.text)).toEqual([
        "Blue",
        "Red",
      ]);
    },
  );
});
