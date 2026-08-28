import { resolveAdapter } from "../../src/adapters";
import { startController } from "../../src/engine/controller";
import type { ContentContextResponse, PopupMessage } from "../../src/messaging";

startController();

chrome.runtime.onMessage.addListener((message: PopupMessage, _sender, sendResponse) => {
  if (message?.type === "autoskip/get-context") {
    const adapter = resolveAdapter();
    const response: ContentContextResponse = {
      serviceId: adapter?.id ?? null,
      serviceName: adapter?.displayName ?? null,
      seriesId: adapter?.getSeriesId() ?? null,
      seriesTitle: adapter?.getSeriesTitle() ?? null,
    };
    sendResponse(response);
    return true;
  }
  return false;
});
