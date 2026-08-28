import type { StreamingAdapter } from "../types";
import { appleTvAdapter } from "./apple-tv";
import { disneyPlusAdapter } from "./disney-plus";
import { netflixAdapter } from "./netflix";
import { primeVideoAdapter } from "./prime-video";

export const adapters: StreamingAdapter[] = [
  netflixAdapter,
  primeVideoAdapter,
  disneyPlusAdapter,
  appleTvAdapter,
];

export function resolveAdapter(url: URL = new URL(window.location.href)): StreamingAdapter | null {
  return adapters.find((adapter) => adapter.matches(url)) ?? null;
}

export {
  appleTvAdapter,
  disneyPlusAdapter,
  netflixAdapter,
  primeVideoAdapter,
};
