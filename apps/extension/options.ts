import { adapters } from "../../src/adapters";
import { summarizeStats } from "../../src/storage/stats";
import { loadState } from "../../src/storage/state";
import { mutateState } from "../../src/storage/mutations";
import { validateImport } from "../../src/storage/validation";

const enabledInput = document.querySelector<HTMLInputElement>("#enabled")!;
const debugInput = document.querySelector<HTMLInputElement>("#debug")!;
const localeSelect = document.querySelector<HTMLSelectElement>("#locale")!;
const importFile = document.querySelector<HTMLInputElement>("#import-file")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;

for (const adapter of adapters) {
  const label = document.createElement("label");
  label.className = "row";
  const span = document.createElement("span");
  span.textContent = adapter.displayName;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.service = adapter.id;
  input.addEventListener("change", () =>
    run(() =>
      mutateState({
        kind: "service",
        serviceId: adapter.id,
        enabled: input.checked,
      }),
    ),
  );
  label.append(span, input);
  document.querySelector("#services")!.appendChild(label);
}
async function refresh() {
  const state = await loadState();
  enabledInput.checked = state.enabled;
  debugInput.checked = state.debugLogging;
  localeSelect.value = state.locale;
  for (const adapter of adapters)
    document.querySelector<HTMLInputElement>(
      `[data-service="${adapter.id}"]`,
    )!.checked = state.services[adapter.id].enabled;
  document.querySelector("#stats")!.textContent =
    `Since Chrome opened: ${summarizeStats(state.sessionStats)}\nAll time: ${summarizeStats(state.stats)}`;
}
function run(action: () => Promise<unknown>, success = "Saved.") {
  void action()
    .then(async () => {
      await refresh();
      statusEl.textContent = success;
    })
    .catch((error) => {
      statusEl.textContent = `Could not save: ${error instanceof Error ? error.message : "Please try again."}`;
    });
}
enabledInput.addEventListener("change", () =>
  run(() =>
    mutateState({ kind: "settings", patch: { enabled: enabledInput.checked } }),
  ),
);
debugInput.addEventListener("change", () =>
  run(() =>
    mutateState({
      kind: "settings",
      patch: { debugLogging: debugInput.checked },
    }),
  ),
);
localeSelect.addEventListener("change", () =>
  run(() =>
    mutateState({ kind: "settings", patch: { locale: localeSelect.value } }),
  ),
);
document
  .querySelector("#reset-session")!
  .addEventListener("click", () =>
    run(() => mutateState({ kind: "reset", target: "session" })),
  );
document.querySelector("#reset-lifetime")!.addEventListener("click", () => {
  if (confirm("Reset lifetime statistics? This cannot be undone."))
    run(() => mutateState({ kind: "reset", target: "lifetime" }));
});
document.querySelector("#reset-all")!.addEventListener("click", () => {
  if (
    confirm(
      "Delete all preferences, learning, and statistics? Save a backup first if you want to keep them.",
    )
  )
    run(
      () => mutateState({ kind: "reset", target: "all" }),
      "All local data reset.",
    );
});
document.querySelector("#export")!.addEventListener("click", () =>
  run(async () => {
    const blob = new Blob([JSON.stringify(await loadState(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "autoskip-preferences.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "Backup saved. It includes your show choices and counts."),
);
document
  .querySelector("#import")!
  .addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (!file) return;
  run(async () => {
    if (file.size > 1_000_000)
      throw new Error("File is too large (maximum 1 MB).");
    const state = validateImport(JSON.parse(await file.text()));
    if (
      !confirm(
        "Replace your saved AutoSkip preferences and statistics with this file?",
      )
    )
      return;
    await mutateState({ kind: "import", state });
  }, "Backup processed.");
  importFile.value = "";
});
chrome.storage.onChanged.addListener(() => {
  void refresh();
});
void refresh();
