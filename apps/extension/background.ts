import { loadState, saveState } from "../../src/storage/state";
import { applyMutation, type StateMutation } from "../../src/storage/mutations";

let pending: Promise<unknown> = Promise.resolve();
function enqueue(mutation: StateMutation) {
  const operation = pending.then(async () => {
    const next = applyMutation(await loadState(), mutation);
    await saveState(next);
    return next;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install")
    void enqueue({ kind: "reset", target: "startup" }).then(() =>
      chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") }),
    );
});
chrome.runtime.onStartup.addListener(() => {
  void enqueue({ kind: "reset", target: "startup" });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (message?.type === "autoskip/mutate") {
    enqueue(message.mutation).then(
      (state) => sendResponse({ ok: true, state }),
      (error) => sendResponse({ ok: false, error: String(error) }),
    );
    return true;
  }
  if (message?.type === "autoskip/ping") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
  }
  return false;
});
