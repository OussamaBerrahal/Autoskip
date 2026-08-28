import { describe, expect, it } from "vitest";
import { formatDuration, recordSkip, summarizeStats } from "../src/storage/stats";
import { DEFAULT_STATE } from "../src/types";

describe("stats", () => {
  it("records lifetime and session skips", () => {
    const next = recordSkip(DEFAULT_STATE, "intro");
    expect(next.stats.intros).toBe(1);
    expect(next.sessionStats.intros).toBe(1);
    expect(next.stats.estimatedMsSaved).toBe(90_000);
  });

  it("formats durations and summaries", () => {
    expect(formatDuration(2_000)).toBe("2s");
    expect(formatDuration(125_000)).toBe("2m 05s");
    expect(formatDuration(3_720_000)).toBe("1h 2m");
    expect(summarizeStats(DEFAULT_STATE.stats)).toContain("0 intros");
  });
});
