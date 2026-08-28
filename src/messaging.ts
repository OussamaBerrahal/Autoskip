import type { ActionPreferences, RuntimeContext, ServiceId } from "./types";

export type ContentContextResponse = {
  serviceId: ServiceId | null;
  serviceName: string | null;
  seriesId: string | null;
  seriesTitle: string | null;
};

export type PopupMessage =
  | { type: "autoskip/get-context" }
  | { type: "autoskip/ping" };

export type BackgroundMessage = PopupMessage;

export type PreferencePatchMessage = {
  type: "autoskip/update-preference";
  scope: "service" | "series" | "session";
  serviceId: ServiceId;
  seriesId: string | null;
  seriesTitle: string | null;
  patch: Partial<ActionPreferences>;
};

export type ContextSnapshot = RuntimeContext & ContentContextResponse;
