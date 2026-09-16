import type { ActionPreferences, ActionType } from "../../src/types";

export const choices: Record<ActionType, { label: string; help: string }> = {
  intro: { label: "Skip intros", help: "Go straight to the story." },
  recap: { label: "Skip recaps", help: "Skip the ‘previously on…’ part." },
  credits: {
    label: "Play next episode",
    help: "Move on when this episode is ending.",
  },
  stillWatching: {
    label: "Keep watching",
    help: "Answer ‘Are you still watching?’ for you.",
  },
};
export function preferenceFields(
  container: HTMLElement,
  id: string,
  onChange: (action: ActionType, checked: boolean) => void,
): Record<ActionType, HTMLInputElement> {
  const fields = {} as Record<ActionType, HTMLInputElement>;
  for (const [action, copy] of Object.entries(choices)) {
    const label = document.createElement("label");
    label.className = "preference";
    const text = document.createElement("span");
    text.className = "preference-copy";
    const title = document.createElement("span");
    title.className = "preference-title";
    title.textContent = copy.label;
    title.id = `${id}-${action}-label`;
    const help = document.createElement("span");
    help.className = "preference-help";
    help.textContent = copy.help;
    help.id = `${id}-${action}-help`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.dataset.action = action;
    input.id = `${id}-${action}`;
    input.setAttribute("aria-labelledby", title.id);
    input.setAttribute("aria-describedby", help.id);
    input.addEventListener("change", () =>
      onChange(action as ActionType, input.checked),
    );
    text.append(title, help);
    label.append(text, input);
    container.append(label);
    fields[action as ActionType] = input;
  }
  return fields;
}
export function updateFields(
  fields: Record<ActionType, HTMLInputElement>,
  preferences: ActionPreferences,
): void {
  for (const action of Object.keys(fields) as ActionType[])
    fields[action].checked = preferences[action];
}
