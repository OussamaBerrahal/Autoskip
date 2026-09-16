import type { ActionType } from "../types";

export interface PlaybackSample {
  key: string;
  time: number;
  duration: number;
  paused: boolean;
  seeking: boolean;
  ended: boolean;
  rate: number;
  now: number;
}

/** A control appearing is not evidence that an episode has ended. */
export class PlaybackGuard {
  private previous: PlaybackSample | null = null;
  private playedSeconds = 0;
  private attempted = new Set<ActionType>();
  private lastAdvanceAt = -Infinity;

  observe(sample: PlaybackSample): void {
    const previous = this.previous;
    if (!previous || previous.key !== sample.key) {
      this.playedSeconds = 0;
      this.attempted.clear();
    } else {
      const elapsed = Math.max(0, (sample.now - previous.now) / 1000);
      const progress = sample.time - previous.time;
      // Seeking to the credits and resuming an already-watched episode do not
      // count as having watched it. Accumulate only continuous playback.
      if (
        !previous.paused &&
        !previous.seeking &&
        !sample.seeking &&
        progress > 0 &&
        progress <= elapsed * Math.max(previous.rate, sample.rate) + 1
      ) {
        this.playedSeconds += progress;
      }
    }
    this.previous = sample;
  }

  allows(type: ActionType): boolean {
    const sample = this.previous;
    if (!sample) return false;
    if (type !== "stillWatching" && this.attempted.has(type)) return false;
    if (type !== "credits") return true;
    if (
      !Number.isFinite(sample.duration) ||
      sample.duration <= 0 ||
      sample.seeking
    )
      return false;
    const remaining = sample.duration - sample.time;
    return (
      (sample.ended ||
        (!sample.paused &&
          remaining >= 0 &&
          remaining <= Math.min(60, sample.duration * 0.05))) &&
      this.playedSeconds >= 30 &&
      sample.now - this.lastAdvanceAt >= 60000
    );
  }

  markAttempt(type: ActionType): void {
    if (type !== "stillWatching") this.attempted.add(type);
    if (type === "credits") this.lastAdvanceAt = this.previous?.now ?? 0;
  }
}
