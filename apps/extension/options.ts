import { adapters } from "../../src/adapters";
import { setServiceEnabled } from "../../src/rules/engine";
import { formatDuration, summarizeStats } from "../../src/storage/stats";
import { loadState, saveState, updateState } from "../../src/storage/state";
import type { AutoSkipState, ServiceId } from "../../src/types";
import { DEFAULT_STATS } from "../../src/types";

const servicesEl = document.getElementById("services")!;
const enabledInput = document.getElementById("enabled") as HTMLInputElement;
const debugInput = document.getElementById("debug") as HTMLInputElement;
const localeSelect = document.getElementById("locale") as HTMLSelectElement;
const statsEl = document.getElementById("stats")!;
const resetSessionBtn = document.getElementById("reset-session") as HTMLButtonElement;
const resetLifetimeBtn = document.getElementById("reset-lifetime") as HTMLButtonElement;
const exportBtn = document.getElementById("export") as HTMLButtonElement;
const importBtn = document.getElementById("import") as HTMLButtonElement;
const importFile = document.getElementById("import-file") as HTMLInputElement;

function renderServices(state: AutoSkipState): void {
  servicesEl.innerHTML = "";
  for (const adapter of adapters) {
    const label = document.createElement("label");
    label.className = "row";
    const span = document.createElement("span");
    span.textContent = adapter.displayName;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.services[adapter.id]?.enabled !== false;
    input.addEventListener("change", () => {
      void updateState((current) =>
        setServiceEnabled(current, adapter.id as ServiceId, input.checked),
      ).then(refresh);
    });
    label.append(span, input);
    servicesEl.appendChild(label);
  }
}

async function refresh(): Promise<void> {
  const state = await loadState();
  enabledInput.checked = state.enabled;
  debugInput.checked = state.debugLogging;
  localeSelect.value = state.locale || "auto";
  renderServices(state);
  statsEl.textContent = `Session: ${summarizeStats(state.sessionStats)} (~${formatDuration(state.sessionStats.estimatedMsSaved)}) · Lifetime: ${summarizeStats(state.stats)} (~${formatDuration(state.stats.estimatedMsSaved)})`;
}

enabledInput.addEventListener("change", () => {
  void updateState((s) => ({ ...s, enabled: enabledInput.checked })).then(refresh);
});

debugInput.addEventListener("change", () => {
  void updateState((s) => ({ ...s, debugLogging: debugInput.checked })).then(refresh);
});

localeSelect.addEventListener("change", () => {
  void updateState((s) => ({ ...s, locale: localeSelect.value })).then(refresh);
});

resetSessionBtn.addEventListener("click", () => {
  void updateState((s) => ({ ...s, sessionStats: { ...DEFAULT_STATS } })).then(refresh);
});

resetLifetimeBtn.addEventListener("click", () => {
  if (!confirm("Reset lifetime statistics? This cannot be undone.")) return;
  void updateState((s) => ({ ...s, stats: { ...DEFAULT_STATS } })).then(refresh);
});

exportBtn.addEventListener("click", () => {
  void (async () => {
    const state = await loadState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "autoskip-preferences.json";
    a.click();
    URL.revokeObjectURL(url);
  })();
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    void (async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AutoSkipState;
        await saveState(parsed);
        await refresh();
      } catch {
        alert("Could not import that file.");
      }
    })();
  };
  reader.readAsText(file);
});

void refresh();
