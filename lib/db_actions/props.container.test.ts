import { vi, describe, expect, beforeEach } from "vitest";
import { getTestDb } from "../../tests/helpers/testDatabase";
import { TestDataFactory } from "../../tests/helpers/testFactories";
import { getTestTracker } from "../../tests/helpers/testIdTracker";
import {
  shouldRunContainerTests,
  ifRunningContainerTestsIt,
} from "../../tests/helpers/testUtils";

let createProp: typeof import("./props").createProp;

// `props.ts` transitively imports the server-only `attachOptions` helper.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/get-user", () => ({
  getUserFromCookies: vi.fn(),
}));

vi.mock("@/lib/pubsub/client", () => ({
  publishEvent: vi.fn().mockResolvedValue("msg-mock"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getUserFromCookies } from "@/lib/get-user";

/**
 * `createProp` against a real PostgreSQL: the option insert, its position and
 * trimming, and the fact that a rejected prop leaves no row behind.
 */
describe("createProp against the database", () => {
  let testDb: any;
  let factory: TestDataFactory;

  beforeEach(async () => {
    if (shouldRunContainerTests()) {
      testDb = await getTestDb();
      factory = new TestDataFactory(testDb);
      vi.clearAllMocks();

      const propsModule = await import("./props");
      createProp = propsModule.createProp;
    } else {
      vi.clearAllMocks();
    }
  });

  /** Every prop carrying this text, so cleanup and absence checks are exact. */
  async function propsWithText(text: string) {
    const rows = await testDb
      .selectFrom("props")
      .select(["id", "kind", "text"])
      .where("text", "=", text)
      .execute();
    // Props created through the action are not tracked by the factory.
    for (const row of rows) {
      getTestTracker().trackId("props", row.id);
    }
    return rows;
  }

  ifRunningContainerTestsIt(
    "stores a choice prop with its trimmed options in position order",
    async () => {
      const admin = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(admin);

      const text = "Which team wins the championship?";
      const result = await createProp({
        prop: {
          text,
          kind: "one_of",
          category_id: 1,
          user_id: null,
          competition_id: null,
        },
        options: ["  Knicks  ", "Spurs", "\tNets\n"],
      });

      expect(result.success).toBe(true);

      const props = await propsWithText(text);
      expect(props).toHaveLength(1);
      expect(props[0].kind).toBe("one_of");

      const options = await testDb
        .selectFrom("prop_options")
        .select(["text", "position"])
        .where("prop_id", "=", props[0].id)
        .orderBy("position")
        .execute();
      expect(options).toEqual([
        { text: "Knicks", position: 0 },
        { text: "Spurs", position: 1 },
        { text: "Nets", position: 2 },
      ]);
    },
  );

  ifRunningContainerTestsIt(
    "rejects options on a yes/no prop and inserts nothing",
    async () => {
      const admin = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(admin);

      const text = "Will it rain in Chicago tomorrow?";
      const result = await createProp({
        prop: { text, category_id: 1, user_id: null, competition_id: null },
        options: ["A", "B"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(await propsWithText(text)).toEqual([]);
    },
  );

  ifRunningContainerTestsIt(
    "rejects a choice prop with no options and inserts nothing",
    async () => {
      const admin = await factory.createAdminUser();
      vi.mocked(getUserFromCookies).mockResolvedValue(admin);

      const text = "Which candidate wins the primary?";
      const result = await createProp({
        prop: {
          text,
          kind: "one_of",
          category_id: 1,
          user_id: null,
          competition_id: null,
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR");
      }
      expect(await propsWithText(text)).toEqual([]);
    },
  );
});
