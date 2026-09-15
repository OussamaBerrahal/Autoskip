import { adapters } from "../../src/adapters";
import { savedPreferences } from "../../src/rules/engine";
import { mutateState } from "../../src/storage/mutations";
import type { AutoSkipState } from "../../src/types";
import { preferenceFields, updateFields } from "./preferences";

/** Shared by the popup and Settings, backed by the same persistent show rules. */
export function showManager(
  root: ParentNode,
  run: (action: () => Promise<unknown>, success?: string) => void,
) {
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const search = $<HTMLInputElement>("#show-search");
  const serviceFilter = $<HTMLSelectElement>("#show-service");
  let currentState: AutoSkipState | null = null;
  for (const adapter of adapters)
    serviceFilter.add(new Option(adapter.displayName, adapter.id));
  function renderShows() {
    const state = currentState;
    if (!state) return;
    const container = $("#shows");
    const opened = new Set(
      Array.from(
        container.querySelectorAll<HTMLDetailsElement>("details[open]"),
      ).map((el) => el.dataset.key),
    );
    const focused =
      document.activeElement instanceof HTMLElement &&
      container.contains(document.activeElement)
        ? document.activeElement.id
        : null;
    const all = Object.entries(state.seriesRules);
    $("#show-count").textContent = String(all.length);
    const query = search.value.trim().toLocaleLowerCase();
    const results = all
      .filter(
        ([, rule]) =>
          (serviceFilter.value === "all" ||
            serviceFilter.value === rule.serviceId) &&
          (rule.seriesTitle ?? "Unnamed show")
            .toLocaleLowerCase()
            .includes(query),
      )
      .sort(([, a], [, b]) =>
        (a.seriesTitle ?? "").localeCompare(b.seriesTitle ?? ""),
      );
    container.replaceChildren();
    $("#shows-empty").hidden = results.length > 0;
    $("#shows-empty").textContent =
      all.length === 0
        ? "Your shows will appear here. While watching, open AutoSkip and choose ‘Only this show’ to give it its own settings."
        : "No shows match. Try another name or streaming app.";
    for (const [key, rule] of results) {
      const adapter = adapters.find((a) => a.id === rule.serviceId)!;
      const card = document.createElement("details");
      card.className = "show-card";
      card.dataset.key = key;
      card.open = opened.has(key);
      const summary = document.createElement("summary");
      summary.id = `show-${encodeURIComponent(key)}`;
      const meta = document.createElement("span");
      meta.className = "show-meta";
      const title = document.createElement("span");
      title.textContent = rule.seriesTitle ?? "Unnamed show";
      const app = document.createElement("small");
      app.textContent = adapter.displayName;
      meta.append(title, app);
      summary.append(meta);
      card.append(summary);
      const note = document.createElement("p");
      note.className = "show-note";
      note.textContent = `Remove to use your ${adapter.displayName} settings.`;
      card.append(note);
      const fields = document.createElement("fieldset");
      fields.className = "preference-list";
      const legend = document.createElement("legend");
      legend.className = "sr-only";
      legend.textContent = rule.seriesTitle ?? "Show choices";
      fields.append(legend);
      const inputs = preferenceFields(fields, summary.id, (action, checked) =>
        run(() =>
          mutateState({
            kind: "rule",
            scope: "series",
            serviceId: rule.serviceId,
            seriesId: rule.seriesId!,
            seriesTitle: rule.seriesTitle ?? null,
            patch: { [action]: checked },
          }),
        ),
      );
      updateFields(
        inputs,
        savedPreferences(state, rule.serviceId, rule.seriesId!),
      );
      card.append(fields);
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "text-button";
      reset.id = `${summary.id}-reset`;
      reset.textContent = "Remove show settings";
      reset.title = `Use my ${adapter.displayName} settings instead`;
      reset.addEventListener("click", () =>
        run(
          async () => {
            await mutateState({
              kind: "clear-series",
              serviceId: rule.serviceId,
              seriesId: rule.seriesId!,
            });
            search.focus();
          },
          `${rule.seriesTitle ?? "This show"} now uses your ${adapter.displayName} settings.`,
        ),
      );
      card.append(reset);
      container.append(card);
    }
    if (focused)
      document.getElementById(focused)?.focus({ preventScroll: true });
  }
  search.addEventListener("input", renderShows);
  serviceFilter.addEventListener("change", renderShows);
  return {
    render(state: AutoSkipState) {
      currentState = state;
      renderShows();
    },
  };
}
