import type { ActionType, DetectedAction } from "../types";

const CLICK_COOLDOWN_MS = 2_500;
const recentClicks = new WeakMap<HTMLElement, number>();

export function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function textMatches(haystack: string, needles: string[]): boolean {
  const text = normalizeText(haystack);
  return needles.some((needle) => text.includes(normalizeText(needle)));
}

export function queryFirstVisible(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      if (node instanceof HTMLElement && isVisible(node)) {
        return node;
      }
    }
  }
  return null;
}

export function findButtonByLabels(labels: string[]): HTMLElement | null {
  const candidates = document.querySelectorAll(
    'button, [role="button"], a[role="button"]',
  );

  for (const node of candidates) {
    if (!(node instanceof HTMLElement) || !isVisible(node)) continue;
    const label = [
      node.getAttribute("aria-label"),
      node.getAttribute("data-uia"),
      node.getAttribute("title"),
      node.textContent,
    ]
      .filter(Boolean)
      .join(" ");

    if (textMatches(label, labels)) {
      return node;
    }
  }

  return null;
}

export function toDetectedAction(
  type: ActionType,
  element: HTMLElement,
  confidence: DetectedAction["confidence"] = "high",
): DetectedAction {
  return {
    type,
    element,
    label:
      element.getAttribute("aria-label") ||
      element.textContent?.trim() ||
      type,
    confidence,
  };
}

export function safeClick(element: HTMLElement): boolean {
  if (!isVisible(element)) return false;

  const last = recentClicks.get(element) ?? 0;
  const now = Date.now();
  if (now - last < CLICK_COOLDOWN_MS) return false;

  recentClicks.set(element, now);
  element.click();
  return true;
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), waitMs);
  };
}
