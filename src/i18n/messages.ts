import type { ActionType } from "../types";

export type MessageKey =
  | "toast.intro"
  | "toast.recap"
  | "toast.credits"
  | "toast.stillWatching"
  | "toast.undoPaused"
  | "toast.skippedOnce"
  | "prompt.firstEncounter"
  | "prompt.smart"
  | "prompt.skipOnce"
  | "prompt.alwaysSeries"
  | "prompt.alwaysService"
  | "prompt.notNow"
  | "prompt.undo"
  | "action.intro"
  | "action.recap"
  | "action.credits"
  | "action.stillWatching";

const EN: Record<MessageKey, string> = {
  "toast.intro": "Intro skipped automatically",
  "toast.recap": "Recap skipped automatically",
  "toast.credits": "Credits skipped automatically",
  "toast.stillWatching": "Continued watching automatically",
  "toast.undoPaused": "Automation paused for this session",
  "toast.skippedOnce": "Skipped once",
  "prompt.firstEncounter": "Skip this {action}?",
  "prompt.smart": "You usually skip this {action}. Remember that preference?",
  "prompt.skipOnce": "Skip once",
  "prompt.alwaysSeries": "Always for this series",
  "prompt.alwaysService": "Always on this service",
  "prompt.notNow": "Not now",
  "prompt.undo": "Undo",
  "action.intro": "intro",
  "action.recap": "recap",
  "action.credits": "credits",
  "action.stillWatching": "continuation prompt",
};

const DE: Partial<Record<MessageKey, string>> = {
  "toast.intro": "Intro automatisch übersprungen",
  "toast.recap": "Recap automatisch übersprungen",
  "prompt.skipOnce": "Einmal überspringen",
  "prompt.alwaysSeries": "Immer für diese Serie",
  "prompt.alwaysService": "Immer auf diesem Dienst",
  "prompt.notNow": "Nicht jetzt",
  "prompt.undo": "Rückgängig",
  "action.intro": "Intro",
  "action.recap": "Recap",
};

const FR: Partial<Record<MessageKey, string>> = {
  "toast.intro": "Intro ignorée automatiquement",
  "prompt.skipOnce": "Ignorer une fois",
  "prompt.alwaysSeries": "Toujours pour cette série",
  "prompt.alwaysService": "Toujours sur ce service",
  "prompt.notNow": "Pas maintenant",
  "prompt.undo": "Annuler",
  "action.intro": "intro",
  "action.recap": "résumé",
};

const ES: Partial<Record<MessageKey, string>> = {
  "toast.intro": "Intro omitida automáticamente",
  "prompt.skipOnce": "Omitir una vez",
  "prompt.alwaysSeries": "Siempre para esta serie",
  "prompt.alwaysService": "Siempre en este servicio",
  "prompt.notNow": "Ahora no",
  "prompt.undo": "Deshacer",
  "action.intro": "intro",
  "action.recap": "resumen",
};

const TABLES: Record<string, Partial<Record<MessageKey, string>>> = {
  en: EN,
  de: DE,
  fr: FR,
  es: ES,
};

function resolveLocale(preferred: string): string {
  if (preferred && preferred !== "auto") {
    return preferred.split("-")[0]!.toLowerCase();
  }
  const lang =
    typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";
  return (lang || "en").toLowerCase();
}

export function t(
  key: MessageKey,
  preferredLocale = "auto",
  vars: Record<string, string> = {},
): string {
  const locale = resolveLocale(preferredLocale);
  const table = TABLES[locale] ?? EN;
  let text = table[key] ?? EN[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }
  return text;
}

export function actionNoun(type: ActionType, locale = "auto"): string {
  return t(`action.${type}` as MessageKey, locale);
}

export function toastMessage(type: ActionType, locale = "auto"): string {
  return t(`toast.${type}` as MessageKey, locale);
}

/** Multilingual control labels used by adapters. */
export const CONTROL_LABELS: Record<ActionType, string[]> = {
  intro: [
    "skip intro",
    "skip the intro",
    "intro überspringen",
    "vorspann überspringen",
    "passer l'intro",
    "ignorer l'intro",
    "omitir intro",
    "saltar intro",
    "salta intro",
    "pular abertura",
    "イントロをスキップ",
    "건너뛰기",
  ],
  recap: [
    "skip recap",
    "skip the recap",
    "recap überspringen",
    "rückblick überspringen",
    "passer le résumé",
    "omitir resumen",
    "saltar resumen",
    "salta riepilogo",
    "pular resumo",
  ],
  credits: [
    "next episode",
    "skip credits",
    "watch credits",
    "nächste folge",
    "épisode suivant",
    "siguiente episodio",
    "prossimo episodio",
    "próximo episódio",
  ],
  stillWatching: [
    "continue watching",
    "are you still watching",
    "yes, continue",
    "continue",
    "weiter ansehen",
    "continuer à regarder",
    "seguir viendo",
    "continua a guardare",
  ],
};
