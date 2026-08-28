import { loadState, resetSessionStats } from "../../src/storage/state";

chrome.runtime.onInstalled.addListener((details) => {
  void loadState();
  if (details.reason === "install") {
    void resetSessionStats();
  }
});

chrome.runtime.onStartup.addListener(() => {
  void resetSessionStats();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "autoskip/ping") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return true;
  }
  return false;
});
