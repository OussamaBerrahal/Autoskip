import { isVisible } from "./dom";
import type { ActionType, DetectedAction } from "../types";

export function playbackVideo(): HTMLVideoElement | null {
  return Array.from(document.querySelectorAll("video")).find(isVisible) ?? null;
}

/** Keep only an in-memory bookmark for short, same-video skips. Never navigate to undo. */
export function captureUndo(type: ActionType): (() => boolean) | null {
  if (type !== "intro" && type !== "recap") return null;
  const video = playbackVideo();
  if (!video || video.readyState < 1 || !Number.isFinite(video.currentTime))
    return null;
  const time = video.currentTime,
    source = video.currentSrc,
    url = location.href;
  const seekable = () =>
    Array.from({ length: video.seekable.length }, (_, i) => i).some(
      (i) => video.seekable.start(i) <= time && video.seekable.end(i) >= time,
    );
  if (!seekable()) return null;
  return () => {
    if (
      !video.isConnected ||
      location.href !== url ||
      video.currentSrc !== source ||
      !seekable()
    )
      return false;
    try {
      video.currentTime = time;
      return Math.abs(video.currentTime - time) < 0.5;
    } catch {
      return false;
    }
  };
}

export function playbackKey(video: HTMLVideoElement): string {
  return `${location.origin}${location.pathname}::${video.currentSrc}`;
}

export function actionResult(action: DetectedAction): () => Promise<boolean> {
  const video = playbackVideo();
  const time = video?.currentTime ?? 0,
    source = video?.currentSrc;
  const path = location.pathname,
    paused = video?.paused;
  const started = performance.now();
  return async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const current = playbackVideo();
      if (action.type === "credits") {
        if (
          location.pathname !== path ||
          (current &&
            (current.currentSrc !== source || current.currentTime < time - 2))
        )
          return true;
      } else if (action.type === "intro" || action.type === "recap") {
        const naturalProgress =
          ((performance.now() - started) / 1000) * (video?.playbackRate ?? 1);
        if (
          !isVisible(action.element) &&
          current === video &&
          video &&
          video.currentSrc === source &&
          location.pathname === path &&
          video.currentTime - time > naturalProgress + 2
        )
          return true;
      } else if (
        current &&
        !current.paused &&
        (paused || !isVisible(action.element))
      ) {
        return true;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    return false;
  };
}
