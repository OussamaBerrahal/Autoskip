/** Shared domain types for AutoSkip. */

export type ServiceId = "netflix" | "prime-video" | "disney-plus" | "apple-tv";

export type ActionType = "intro" | "recap" | "credits" | "stillWatching";

export type RuleScope = "service" | "series" | "session";

export interface DetectedAction {
  type: ActionType;
  element: HTMLElement;
  label: string;
  confidence: "high" | "medium";
}

export interface StreamingAdapter {
  readonly id: ServiceId;
  readonly displayName: string;
  matches(url: URL): boolean;
  getSeriesId(): string | null;
  getSeriesTitle(): string | null;
  detectIntro(): DetectedAction | null;
  detectRecap(): DetectedAction | null;
  detectCredits(): DetectedAction | null;
  detectStillWatching(): DetectedAction | null;
  skipIntro(action: DetectedAction): boolean;
  skipRecap(action: DetectedAction): boolean;
  continuePlayback(action: DetectedAction): boolean;
}

export interface ActionPreferences {
  intro: boolean;
  recap: boolean;
  credits: boolean;
  stillWatching: boolean;
}

export interface RuleSet {
  serviceId: ServiceId;
  seriesId?: string;
  seriesTitle?: string;
  preferences: Partial<ActionPreferences>;
  updatedAt: number;
  /** Session rules expire at this timestamp (ms). */
  expiresAt?: number;
}

export interface StatsBucket {
  intros: number;
  recaps: number;
  credits: number;
  stillWatching: number;
  /** Estimated milliseconds saved. */
  estimatedMsSaved: number;
}

export interface ServiceSettings {
  enabled: boolean;
}

export interface AutoSkipState {
  enabled: boolean;
  /** Temporary global pause, expressed as an expiry timestamp. Zero means active. */
  pausedUntil: number;
  /** Per-service enable flags. */
  services: Record<ServiceId, ServiceSettings>;
  /** Service-level defaults keyed by service id. */
  serviceRules: Record<string, RuleSet>;
  /** Series overrides keyed by `${serviceId}::${seriesId}`. */
  seriesRules: Record<string, RuleSet>;
  /** Session overrides keyed by `${serviceId}::${seriesId ?? "unknown"}`. */
  sessionRules: Record<string, RuleSet>;
  /** Lifetime aggregates. */
  stats: StatsBucket;
  /** Reset when Chrome starts. Stored locally for popup access. */
  sessionStats: StatsBucket;
  /** Prompt history: `${serviceId}::${seriesId}::${actionType}` → manual skip count. */
  manualSkipCounts: Record<string, number>;
  dismissedPrompts: Record<string, boolean>;
  /** First-encounter prompt already shown for a control signature key. */
  offeredFirstEncounter: Record<string, boolean>;
  /** Enables diagnostic console messages. */
  debugLogging: boolean;
  locale: string;
}

export interface RuntimeContext {
  serviceId: ServiceId | null;
  serviceName: string | null;
  serviceEnabled: boolean;
  seriesId: string | null;
  seriesTitle: string | null;
  effective: ActionPreferences;
  serviceDefaults: ActionPreferences;
  seriesOverrides: ActionPreferences | null;
  stats: StatsBucket;
  sessionStats: StatsBucket;
}

export const DEFAULT_PREFERENCES: ActionPreferences = {
  intro: false,
  recap: false,
  credits: false,
  stillWatching: false,
};

export const DEFAULT_STATS: StatsBucket = {
  intros: 0,
  recaps: 0,
  credits: 0,
  stillWatching: 0,
  estimatedMsSaved: 0,
};

export const DEFAULT_SERVICES: Record<ServiceId, ServiceSettings> = {
  netflix: { enabled: true },
  "prime-video": { enabled: true },
  "disney-plus": { enabled: true },
  "apple-tv": { enabled: true },
};

export const DEFAULT_STATE: AutoSkipState = {
  enabled: true,
  pausedUntil: 0,
  services: structuredClone(DEFAULT_SERVICES),
  serviceRules: {},
  seriesRules: {},
  sessionRules: {},
  stats: { ...DEFAULT_STATS },
  sessionStats: { ...DEFAULT_STATS },
  manualSkipCounts: {},
  dismissedPrompts: {},
  offeredFirstEncounter: {},
  debugLogging: false,
  locale: "auto",
};

/** Rough duration estimates used only for local "time saved" display. */
export const ESTIMATED_DURATION_MS: Record<ActionType, number> = {
  intro: 90_000,
  recap: 60_000,
  credits: 45_000,
  stillWatching: 5_000,
};

export const ACTION_TYPES: ActionType[] = [
  "intro",
  "recap",
  "credits",
  "stillWatching",
];
