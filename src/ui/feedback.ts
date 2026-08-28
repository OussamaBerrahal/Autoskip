const TOAST_ID = "autoskip-toast";
const PROMPT_ID = "autoskip-prompt";

export type ToastOptions = {
  message: string;
  onUndo?: () => void;
  durationMs?: number;
};

export type PromptChoice = "once" | "series" | "service" | "dismiss";

export type PromptOptions = {
  message: string;
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
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(12, 14, 18, 0.92);
      color: #f4f6f8;
      font: 500 13px/1.35 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(10px);
      max-width: min(520px, calc(100vw - 32px));
    }
    #${PROMPT_ID} {
      bottom: 88px;
      flex-wrap: wrap;
    }
    #${TOAST_ID} button, #${PROMPT_ID} button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 6px 12px;
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
    @media (prefers-reduced-motion: no-preference) {
      #${TOAST_ID}, #${PROMPT_ID} {
        animation: autoskip-fade-in 160ms ease-out;
      }
    }
    @keyframes autoskip-fade-in {
      from { opacity: 0; transform: translate(-50%, 8px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.documentElement.appendChild(style);
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
    undo.textContent = "Undo";
    undo.addEventListener("click", () => {
      options.onUndo?.();
      toast.remove();
    });
    toast.appendChild(undo);
  }

  document.documentElement.appendChild(toast);

  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, options.durationMs ?? 4_500);
}

export function showSmartPrompt(options: PromptOptions): void {
  ensureStyles();
  document.getElementById(PROMPT_ID)?.remove();

  const prompt = document.createElement("div");
  prompt.id = PROMPT_ID;
  prompt.setAttribute("role", "dialog");
  prompt.setAttribute("aria-label", "AutoSkip preference");

  const message = document.createElement("span");
  message.textContent = options.message;
  prompt.appendChild(message);

  const choices: Array<{ label: string; value: PromptChoice; ghost?: boolean }> = [
    { label: "Always for this series", value: "series" },
    { label: "Always on this service", value: "service" },
    { label: "Not now", value: "dismiss", ghost: true },
  ];

  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label;
    if (choice.ghost) button.dataset.variant = "ghost";
    button.addEventListener("click", () => {
      options.onChoice(choice.value);
      prompt.remove();
    });
    prompt.appendChild(button);
  }

  document.documentElement.appendChild(prompt);
}

export function dismissOverlays(): void {
  document.getElementById(TOAST_ID)?.remove();
  document.getElementById(PROMPT_ID)?.remove();
}
