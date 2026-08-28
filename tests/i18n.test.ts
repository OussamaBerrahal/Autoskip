import { describe, expect, it } from "vitest";
import { actionNoun, t, toastMessage } from "../src/i18n/messages";

describe("i18n", () => {
  it("returns english defaults", () => {
    expect(toastMessage("intro", "en")).toContain("Intro skipped");
    expect(actionNoun("recap", "en")).toBe("recap");
  });

  it("supports german prompt labels", () => {
    expect(t("prompt.skipOnce", "de")).toBe("Einmal überspringen");
  });

  it("interpolates action nouns", () => {
    expect(t("prompt.firstEncounter", "en", { action: "intro" })).toContain("intro");
  });
});
