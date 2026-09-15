import { actionNoun, t } from "../i18n/messages";
import type { ActionType } from "../types";

const TOAST_ID = "autoskip-toast";
const PROMPT_ID = "autoskip-prompt";

export type ToastOptions = {
  message: string;
  undoLabel?: string;
  onUndo?: () => void | Promise<void>;
  durationMs?: number;
};

export type PromptChoice = "once" | "series" | "service" | "dismiss";

export type PromptOptions = {
  mode: "first-encounter" | "smart";
  actionType: ActionType;
  locale?: string;
  allowSeries?: boolean;
  serviceName?: string;
  onChoice: (choice: PromptChoice) => void;
};

function ensureStyles(): void {
  if (document.getElementById("autoskip-styles")) return;
  const style = document.createElement("style");
  style.id = "autoskip-styles";
  style.textContent = `
    #${TOAST_ID}, #${PROMPT_ID} {
      position: fixed;
      z-index: 2147483646;
      left: 50%;
      transform: translateX(-50%);
      bottom: 28px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(12, 18, 22, 0.94);
      color: #f4f6f8;
      font: 500 13px/1.35 "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.38);
      backdrop-filter: blur(12px);
      max-width: min(560px, calc(100vw - 24px));
    }
    #${PROMPT_ID} {
      bottom: 88px;
      flex-wrap: wrap;
      row-gap: 8px;
    }
    #${TOAST_ID} button, #${PROMPT_ID} button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 7px 12px;
      font: inherit;
      cursor: pointer;
      background: #e8edf2;
      color: #111;
    }
    #${PROMPT_ID} button[data-variant="ghost"] {
      background: transparent;
      color: #d7dde5;
      border: 1px solid rgba(255,255,255,0.18);
    }
    #${PROMPT_ID} button[data-variant="primary"] {
      background: #0f6e56;
      color: #f4fffa;
    }
    @media (prefers-reduced-motion: no-preference) {
      #${TOAST_ID}, #${PROMPT_ID} {
        animation: autoskip-fade-in 160ms ease-out;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #${TOAST_ID}, #${PROMPT_ID} { animation: none; }
    }
    @keyframes autoskip-fade-in {
      from { opacity: 0; transform: translate(-50%, 8px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.documentElement.appendChild(style);
  document.addEventListener("fullscreenchange", () => {
    for (const id of [TOAST_ID, PROMPT_ID]) {
      const overlay = document.getElementById(id);
      if (overlay) overlayRoot().appendChild(overlay);
    }
  });
}

export function showToast(options: ToastOptions): void {
  ensureStyles();
  document.getElementById(TOAST_ID)?.remove();

  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const message = document.createElement("span");
  message.textContent = options.message;
  toast.appendChild(message);

  if (options.onUndo) {
    const undo = document.createElement("button");
    undo.type = "button";
    undo.textContent = options.undoLabel ?? "Undo";
    undo.addEventListener("click", () => {
      undo.disabled = true;
      toast.remove();
      void Promise.resolve(options.onUndo?.()).catch(() => {
        showToast({
          message:
            "Could not save your preference. Please try again from Settings.",
        });
      });
    });
    toast.appendChild(undo);
  }

  overlayRoot().appendChild(toast);

  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, options.durationMs ?? 4_500);
}

export function showActionPrompt(options: PromptOptions): void {
  ensureStyles();
  document.getElementById(PROMPT_ID)?.remove();

  const locale = options.locale ?? "auto";
  const noun = actionNoun(options.actionType, locale);
  const prompt = document.createElement("div");
  prompt.id = PROMPT_ID;
  prompt.setAttribute("role", "dialog");
  prompt.setAttribute("aria-label", "AutoSkip preference");

  const message = document.createElement("span");
  message.textContent = t(
    options.mode === "first-encounter"
      ? "prompt.firstEncounter"
      : "prompt.smart",
    locale,
    { action: noun },
  );
  prompt.appendChild(message);

  const choices: Array<{
    label: string;
    value: PromptChoice;
    variant?: "primary" | "ghost";
  }> =
    options.mode === "first-encounter"
      ? [
          {
            label: t("prompt.skipOnce", locale),
            value: "once",
            variant: "primary",
          },
          { label: t("prompt.alwaysSeries", locale), value: "series" },
          {
            label: t("prompt.alwaysService", locale, {
              service: options.serviceName ?? "this streaming app",
            }),
            value: "service",
          },
          {
            label: t("prompt.notNow", locale),
            value: "dismiss",
            variant: "ghost",
          },
        ]
      : [
          {
            label: t("prompt.alwaysSeries", locale),
            value: "series",
            variant: "primary",
          },
          {
            label: t("prompt.alwaysService", locale, {
              service: options.serviceName ?? "this streaming app",
            }),
            value: "service",
          },
          {
            label: t("prompt.notNow", locale),
            value: "dismiss",
            variant: "ghost",
          },
        ];

  for (const choice of choices) {
    if (choice.value === "series" && options.allowSeries === false) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label;
    if (choice.variant) button.dataset.variant = choice.variant;
    button.addEventListener("click", () => {
      options.onChoice(choice.value);
      prompt.remove();
    });
    prompt.appendChild(button);
  }

  overlayRoot().appendChild(prompt);
}

function overlayRoot(): Element {
  const fullscreen = document.fullscreenElement;
  return fullscreen && !(fullscreen instanceof HTMLVideoElement)
    ? fullscreen
    : document.documentElement;
}

export function dismissPrompt(): void {
  document.getElementById(PROMPT_ID)?.remove();
}

export function dismissOverlays(): void {
  document.getElementById(TOAST_ID)?.remove();
  document.getElementById(PROMPT_ID)?.remove();
}

export function isPromptVisible(): boolean {
  return Boolean(document.getElementById(PROMPT_ID));
}
