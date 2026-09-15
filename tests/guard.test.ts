import { describe, expect, it } from "vitest";
import { PlaybackGuard, type PlaybackSample } from "../src/engine/guard";

const sample = (patch: Partial<PlaybackSample> = {}): PlaybackSample => ({
  key: "episode-1",
  time: 0,
  duration: 1200,
  paused: false,
  seeking: false,
  ended: false,
  rate: 1,
  now: 0,
  ...patch,
});
function play(
  guard: PlaybackGuard,
  start: number,
  seconds: number,
  now = 0,
  key = "episode-1",
) {
  for (let n = 0; n <= seconds; n++)
    guard.observe(sample({ key, time: start + n, now: now + n * 1000 }));
}
describe("episode advance safeguards", () => {
  it("never advances in the middle of an episode, even after continuous playback", () => {
    const guard = new PlaybackGuard();
    play(guard, 100, 100);
    expect(guard.allows("credits")).toBe(false);
  });
  it("doesn't advance when a previously watched episode resumes at the end", () => {
    const guard = new PlaybackGuard();
    guard.observe(sample({ time: 1190 }));
    expect(guard.allows("credits")).toBe(false);
    guard.observe(sample({ key: "episode-2", time: 1199, now: 1000 }));
    expect(guard.allows("credits")).toBe(false);
  });
  it("does not count a seek as watching 30 seconds", () => {
    const guard = new PlaybackGuard();
    guard.observe(sample());
    guard.observe(sample({ time: 1190, now: 1000 }));
    guard.observe(sample({ time: 1191, now: 2000 }));
    expect(guard.allows("credits")).toBe(false);
  });
  it("allows the end card after playback, just once even if the control is replaced", () => {
    const guard = new PlaybackGuard();
    play(guard, 1110, 31);
    expect(guard.allows("credits")).toBe(true);
    guard.markAttempt("credits");
    guard.observe(sample({ time: 1142, now: 32000 }));
    expect(guard.allows("credits")).toBe(false);
  });
  it("requires fresh playback on the next episode and a gap between advances", () => {
    const guard = new PlaybackGuard();
    play(guard, 1110, 31);
    guard.markAttempt("credits");
    play(guard, 1100, 41, 32000, "episode-2");
    expect(guard.allows("credits")).toBe(false);
    play(guard, 1141, 21, 73000, "episode-2");
    expect(guard.allows("credits")).toBe(true);
  });
  it("leaves paused credits alone and allows playback that has ended naturally", () => {
    const guard = new PlaybackGuard();
    play(guard, 1140, 59);
    guard.observe(sample({ time: 1199, now: 60000, paused: true }));
    expect(guard.allows("credits")).toBe(false);
    guard.observe(
      sample({ time: 1200, now: 61000, paused: true, ended: true }),
    );
    expect(guard.allows("credits")).toBe(true);
  });
  it("doesn't act on unknown duration or an active seek", () => {
    const guard = new PlaybackGuard();
    play(guard, 1110, 31);
    guard.observe(sample({ time: 1142, now: 32000, seeking: true }));
    expect(guard.allows("credits")).toBe(false);
    guard.observe(sample({ time: 1143, now: 33000, duration: Infinity }));
    expect(guard.allows("credits")).toBe(false);
  });
  it("rearms intro/recap only on a new episode, independently of one another", () => {
    const guard = new PlaybackGuard();
    guard.observe(sample());
    guard.markAttempt("intro");
    expect(guard.allows("intro")).toBe(false);
    expect(guard.allows("recap")).toBe(true);
    guard.observe(sample({ key: "episode-2" }));
    expect(guard.allows("intro")).toBe(true);
  });
});
