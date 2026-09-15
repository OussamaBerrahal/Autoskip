import { isVisible } from "./dom";
import type { ActionType } from "../types";

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
