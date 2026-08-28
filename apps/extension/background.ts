import { loadState } from "../../src/storage/state";

chrome.runtime.onInstalled.addListener(() => {
  void loadState();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "autoskip/ping") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return true;
  }
  return false;
});
