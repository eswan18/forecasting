import { afterEach, describe, expect, it } from "vitest";

import { envFileFor, getCurrentEnvironment } from "./environment";

describe("envFileFor", () => {
  it("maps every environment to its own dotenv file", () => {
    expect(envFileFor("local")).toBe(".env.local");
    expect(envFileFor("dev")).toBe(".env.dev");
    expect(envFileFor("staging")).toBe(".env.staging");
    expect(envFileFor("prod")).toBe(".env.prod");
  });

  it("rejects an environment it has no file for", () => {
    expect(() => envFileFor("qa")).toThrow(/Invalid ENV value: qa/);
  });

  // The whole point of the message is telling you what you could have typed
  // instead, so a name missing from it is as good as a name that does not work.
  it("names every valid environment when it rejects one", () => {
    expect(() => envFileFor("qa")).toThrow(
      /local, dev, staging, prod/,
    );
  });
});

describe("getCurrentEnvironment", () => {
  const original = process.env.ENV;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ENV;
    } else {
      process.env.ENV = original;
    }
  });

  it("reports the environment that is set", () => {
    process.env.ENV = "staging";
    expect(getCurrentEnvironment()).toBe("staging");
  });

  it("falls back to local when nothing is set", () => {
    delete process.env.ENV;
    expect(getCurrentEnvironment()).toBe("local");
  });
});
