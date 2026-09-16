import type { ActionType, AutoSkipState, StatsBucket } from "../types";
import { ESTIMATED_DURATION_MS } from "../types";

function bump(stats: StatsBucket, action: ActionType): StatsBucket {
  const next = { ...stats };
  switch (action) {
    case "intro":
      next.intros += 1;
      break;
    case "recap":
      next.recaps += 1;
      break;
    case "credits":
      next.credits += 1;
      break;
    case "stillWatching":
      next.stillWatching += 1;
      break;
  }
  next.estimatedMsSaved += ESTIMATED_DURATION_MS[action];
  return next;
}

export function recordSkip(
  state: AutoSkipState,
  action: ActionType,
): AutoSkipState {
  return {
    ...state,
    stats: bump(state.stats, action),
    sessionStats: bump(state.sessionStats, action),
  };
}

export function removeSkip(
  state: AutoSkipState,
  action: ActionType,
): AutoSkipState {
  const key = {
    intro: "intros",
    recap: "recaps",
    credits: "credits",
    stillWatching: "stillWatching",
  }[action] as keyof StatsBucket;
  const decrement = (stats: StatsBucket) =>
    stats[key] <= 0
      ? stats
      : {
          ...stats,
          [key]: stats[key] - 1,
          estimatedMsSaved: Math.max(
            0,
            stats.estimatedMsSaved - ESTIMATED_DURATION_MS[action],
          ),
        };
  return {
    ...state,
    stats: decrement(state.stats),
    sessionStats: decrement(state.sessionStats),
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export function summarizeStats(stats: StatsBucket): string {
  const label = (count: number, singular: string) =>
    `${count} ${singular}${count === 1 ? "" : "s"}`;
  return [
    label(stats.intros, "intro"),
    label(stats.recaps, "recap"),
    label(stats.credits, "next episode"),
    label(stats.stillWatching, "continuation"),
  ].join(" · ");
}
