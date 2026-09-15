import type { ActionType, DetectedAction } from "../types";
import {
  findButtonByLabels,
  queryFirstVisible,
  safeClick,
  toDetectedAction,
} from "../engine/dom";
import { CONTROL_LABELS } from "../i18n/messages";

export function detectControl(
  type: ActionType,
  selectors: string[],
  extraLabels: string[] = [],
  allowLabelFallback = true,
): DetectedAction | null {
  const bySelector = queryFirstVisible(selectors);
  if (bySelector) return toDetectedAction(type, bySelector, "high");

  if (!allowLabelFallback) return null;
  const byLabel = findButtonByLabels([...CONTROL_LABELS[type], ...extraLabels]);
  if (byLabel) return toDetectedAction(type, byLabel, "medium");

  return null;
}

export function clickAction(action: DetectedAction): boolean {
  return safeClick(action.element);
}

export function titleFromSelectors(selectors: string[]): string | null {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

export function slugTitle(title: string | null): string | null {
  if (!title) return null;
  return `title:${title.toLowerCase().replace(/\s+/g, " ").trim()}`;
}
