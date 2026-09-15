import type { ActionType } from "../types";

export type MessageKey =
  | "toast.intro"
  | "toast.recap"
  | "toast.credits"
  | "toast.stillWatching"
  | "toast.undone"
  | "prompt.pause"
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
  "toast.credits": "Advanced to the next episode",
  "toast.stillWatching": "Continued watching automatically",
  "toast.undoPaused": "This action is paused for now",
  "toast.undone":
    "Returned to before the skip. This action is paused for now.",
  "prompt.pause": "Pause this action",
  "toast.skippedOnce": "Skipped once",
  "prompt.firstEncounter": "Skip this {action}?",
  "prompt.smart": "You usually skip this {action}. Remember that preference?",
  "prompt.skipOnce": "Skip once",
  "prompt.alwaysSeries": "Always for this show",
  "prompt.alwaysService": "Always on {service}",
  "prompt.notNow": "Don’t ask again",
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
  "prompt.alwaysService": "Immer auf {service}",
  "prompt.notNow": "Nicht mehr fragen",
  "prompt.undo": "Rückgängig",
  "prompt.pause": "Automatik pausieren",
  "toast.undone":
    "Zurück zur Position vor dem Sprung. Diese Aktion ist für diese Sitzung pausiert.",
  "toast.undoPaused": "Diese Aktion ist für diese Sitzung pausiert",
  "action.intro": "Intro",
  "action.recap": "Recap",
};

const FR: Partial<Record<MessageKey, string>> = {
  "toast.intro": "Intro ignorée automatiquement",
  "prompt.skipOnce": "Ignorer une fois",
  "prompt.alwaysSeries": "Toujours pour cette série",
  "prompt.alwaysService": "Toujours sur {service}",
  "prompt.notNow": "Ne plus demander",
  "prompt.undo": "Annuler",
  "prompt.pause": "Suspendre l’automatisation",
  "toast.undone":
    "Retour avant le saut. Cette action est suspendue pour cette session.",
  "toast.undoPaused": "Cette action est suspendue pour cette session",
  "action.intro": "intro",
  "action.recap": "résumé",
};

const ES: Partial<Record<MessageKey, string>> = {
  "toast.intro": "Intro omitida automáticamente",
  "prompt.skipOnce": "Omitir una vez",
  "prompt.alwaysSeries": "Siempre para esta serie",
  "prompt.alwaysService": "Siempre en {service}",
  "prompt.notNow": "No volver a preguntar",
  "prompt.undo": "Deshacer",
  "prompt.pause": "Pausar automatización",
  "toast.undone":
    "Volviste al punto anterior al salto. Esta acción se pausa durante la sesión.",
  "toast.undoPaused": "Esta acción se pausa durante la sesión",
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
    "오프닝 건너뛰기",
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
    "weiter ansehen",
    "continuer à regarder",
    "seguir viendo",
    "continua a guardare",
  ],
};
