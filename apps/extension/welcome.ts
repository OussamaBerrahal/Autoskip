import { adapters } from "../../src/adapters";
import { mutateState } from "../../src/storage/mutations";
import type { ServiceId } from "../../src/types";

const form = document.querySelector<HTMLFormElement>("#setup-form")!;
const button = document.querySelector<HTMLButtonElement>("#quick-start")!;
const status = document.querySelector<HTMLElement>("#setup-status")!;
const inputs = new Map<ServiceId, HTMLInputElement>();
for (const adapter of adapters) {
  const label = document.createElement("label");
  label.className = "app-choice";
  label.append(document.createTextNode(adapter.displayName));
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = true;
  input.addEventListener("change", () => {
    button.disabled = !Array.from(inputs.values()).some(
      (input) => input.checked,
    );
  });
  inputs.set(adapter.id, input);
  label.append(input);
  document.querySelector("#setup-services")!.append(label);
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = Array.from(inputs.entries())
    .filter(([, input]) => input.checked)
    .map(([id]) => id);
  if (!selected.length) return;
  button.disabled = true;
  status.textContent = "";
  void mutateState({ kind: "setup", serviceIds: selected })
    .then(() => {
      document.querySelector<HTMLElement>("#setup")!.hidden = true;
      document.querySelector<HTMLElement>("#complete")!.hidden = false;
      document.querySelector("#complete-summary")!.textContent =
        `Intros and recaps will be skipped on ${adapters
          .filter((adapter) => selected.includes(adapter.id))
          .map((adapter) => adapter.displayName)
          .join(", ")}.`;
      document.querySelector<HTMLElement>(".primary-link")!.focus();
    })
    .catch(() => {
      button.disabled = false;
      status.textContent = "Couldn't save your choices. Please try again.";
    });
});
