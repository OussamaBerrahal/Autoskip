import { afterEach, expect, it, vi } from "vitest";
import { ExtensionReloadRequired, mutateState } from "../src/storage/mutations";
import { DEFAULT_STATE } from "../src/types";

afterEach(() => vi.unstubAllGlobals());

it.each(["empty reply", "closed port"])(
  "saving a show preserves preferences with a legacy worker: %s",
  async (response) => {
    const original = structuredClone(DEFAULT_STATE);
    original.serviceRules.netflix = {
      serviceId: "netflix",
      preferences: { intro: true },
      updatedAt: 1,
    };
    let persisted: typeof original | undefined = original;
    const sendMessage = vi.fn(async (message) => {
      // Older workers recognize this envelope but not the new save-series operation.
      if (message.type === "autoskip/mutate") {
        persisted = undefined;
        return { ok: true, state: persisted };
      }
      if (response === "closed port")
        throw new Error(
          "The message port closed before a response was received.",
        );
      return undefined;
    });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    await expect(
      mutateState({
        kind: "save-series",
        serviceId: "netflix",
        seriesId: "friends",
        seriesTitle: "Friends",
      }),
    ).rejects.toBeInstanceOf(ExtensionReloadRequired);
    expect(persisted).toEqual(original);
  },
);
