import { ACTION_TYPES, DEFAULT_STATE, DEFAULT_STATS } from "../types";
import type { AutoSkipState, RuleSet, ServiceId, StatsBucket } from "../types";
const services = Object.keys(DEFAULT_STATE.services) as ServiceId[];
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a preferences object");
  return value as Record<string, unknown>;
}
function flag(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid preference");
  return value;
}
function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new Error("Invalid count");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string" || value.length > 1000)
    throw new Error("Invalid title or identifier");
  return value;
}
function stats(value: unknown): StatsBucket {
  const input = object(value),
    result = { ...DEFAULT_STATS };
  for (const key of Object.keys(result) as (keyof StatsBucket)[])
    if (key in input) result[key] = count(input[key]);
  return result;
}
function rules(
  value: unknown,
  scope: "service" | "series" | "session",
): Record<string, RuleSet> {
  const result: Record<string, RuleSet> = {};
  for (const [key, valueRule] of Object.entries(object(value))) {
    const rule = object(valueRule);
    if (!services.includes(rule.serviceId as ServiceId))
      throw new Error("Unknown service");
    const serviceId = rule.serviceId as ServiceId;
    const seriesId =
      rule.seriesId === undefined ? undefined : text(rule.seriesId);
    if (scope === "series" && !seriesId)
      throw new Error("Series rule needs an identifier");
    const expected =
      scope === "service"
        ? serviceId
        : `${serviceId}::${seriesId ?? "unknown"}`;
    if (key !== expected) throw new Error("Invalid rule key");
    const preferences = object(rule.preferences);
    const safe: RuleSet = {
      serviceId,
      preferences: {},
      updatedAt: count(rule.updatedAt),
    };
    if (seriesId) safe.seriesId = seriesId;
    if (rule.seriesTitle !== undefined)
      safe.seriesTitle = text(rule.seriesTitle);
    if (rule.expiresAt !== undefined) safe.expiresAt = count(rule.expiresAt);
    for (const action of ACTION_TYPES)
      if (action in preferences)
        safe.preferences[action] = flag(preferences[action]);
    result[key] = safe;
  }
  return result;
}
export function validateImport(value: unknown): AutoSkipState {
  const input = object(value),
    result = structuredClone(DEFAULT_STATE);
  for (const key of ["enabled", "debugLogging"] as const)
    if (key in input) result[key] = flag(input[key]);
  if ("pausedUntil" in input) result.pausedUntil = count(input.pausedUntil);
  if ("locale" in input) {
    if (!["auto", "en", "de", "fr", "es"].includes(String(input.locale)))
      throw new Error("Unsupported language");
    result.locale = String(input.locale);
  }
  if (input.services !== undefined) {
    const items = object(input.services);
    for (const service of services)
      if (items[service] !== undefined)
        result.services[service].enabled = flag(object(items[service]).enabled);
  }
  if (input.serviceRules !== undefined)
    result.serviceRules = rules(input.serviceRules, "service");
  if (input.seriesRules !== undefined)
    result.seriesRules = rules(input.seriesRules, "series");
  if (input.sessionRules !== undefined)
    result.sessionRules = rules(input.sessionRules, "session");
  for (const key of ["stats", "sessionStats"] as const)
    if (input[key] !== undefined) result[key] = stats(input[key]);
  for (const key of [
    "manualSkipCounts",
    "dismissedPrompts",
    "offeredFirstEncounter",
  ] as const) {
    if (input[key] === undefined) continue;
    const entries = Object.entries(object(input[key]));
    if (entries.length > 10000) throw new Error("Too many saved entries");
    for (const [entry, value] of entries) {
      if (
        entry === "__proto__" ||
        entry === "constructor" ||
        entry === "prototype"
      )
        throw new Error("Invalid key");
      if (key === "manualSkipCounts") result[key][text(entry)] = count(value);
      else result[key][text(entry)] = flag(value);
    }
  }
  return result;
}
