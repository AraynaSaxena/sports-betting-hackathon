import { useEffect, useRef } from "react";

/**
 * Fires onCue(second) when the video time crosses any integer second in cueSeconds.
 * - Pass the ref object (not ref.current).
 * - Debounces to once per second boundary.
 */
export function useVideoCues(videoRef, cueSeconds = [], onCue = () => {}) {
  const firedRef = useRef(new Set()); // track seconds we already fired

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return;

    const wanted = new Set(cueSeconds.map(s => Math.floor(Number(s))));
    const onTime = () => {
      const sec = Math.floor(el.currentTime);
      if (wanted.has(sec) && !firedRef.current.has(sec)) {
        firedRef.current.add(sec);
        onCue(sec);
      }
    };

    el.addEventListener("timeupdate", onTime);
    // reset when user seeks backward
    const onSeeked = () => {
      firedRef.current.clear();
    };
    el.addEventListener("seeked", onSeeked);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeked", onSeeked);
    };
  }, [videoRef, onCue, JSON.stringify(cueSeconds)]);
}
