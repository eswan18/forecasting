import { describe, expect, it } from "vitest";

import type { Standing } from "./dashboard-view";
import { SHOW_PARAM, visibleSeasons, wantsAll } from "./visible-seasons";

const season = (id: number, phase: Standing["phase"]): Standing => ({
  id,
  name: `Season ${id}`,
  phase,
  isPrivate: false,
  leaders: [],
  you: null,
  fieldSize: 0,
});

const all = [season(1, "live"), season(2, "scoring"), season(3, "final")];

describe("wantsAll", () => {
  it("is true only for the exact string", () => {
    expect(wantsAll({ [SHOW_PARAM]: "all" })).toBe(true);
  });

  it("defaults to active when the parameter is absent", () => {
    expect(wantsAll({})).toBe(false);
  });

  it("falls back to active on a value from nowhere", () => {
    expect(wantsAll({ [SHOW_PARAM]: "everything" })).toBe(false);
    expect(wantsAll({ [SHOW_PARAM]: "" })).toBe(false);
    expect(wantsAll({ [SHOW_PARAM]: "ALL" })).toBe(false);
  });

  it("reads the first value when the parameter repeats", () => {
    expect(wantsAll({ [SHOW_PARAM]: ["all", "active"] })).toBe(true);
    expect(wantsAll({ [SHOW_PARAM]: ["active", "all"] })).toBe(false);
  });
});

describe("visibleSeasons", () => {
  it("keeps everything when showing all", () => {
    expect(visibleSeasons(all, true)).toHaveLength(3);
  });

  it("drops only finished seasons otherwise", () => {
    const shown = visibleSeasons(all, false);
    expect(shown.map((s) => s.phase)).toEqual(["live", "scoring"]);
  });

  it("treats scoring as active — the standing can still move", () => {
    expect(visibleSeasons([season(9, "scoring")], false)).toHaveLength(1);
  });

  it("returns nothing when every season has finished", () => {
    expect(visibleSeasons([season(1, "final")], false)).toEqual([]);
  });
});
