import type { ActionType, AutoSkipState, StatsBucket } from "../types";
import { ESTIMATED_DURATION_MS } from "../types";

export function recordSkip(
  state: AutoSkipState,
  action: ActionType,
): AutoSkipState {
  const stats: StatsBucket = { ...state.stats };

  switch (action) {
    case "intro":
      stats.intros += 1;
      break;
    case "recap":
      stats.recaps += 1;
      break;
    case "credits":
      stats.credits += 1;
      break;
    case "stillWatching":
      stats.stillWatching += 1;
      break;
  }

  stats.estimatedMsSaved += ESTIMATED_DURATION_MS[action];
  return { ...state, stats };
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
