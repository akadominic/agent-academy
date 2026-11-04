"use client";

import { useCallback, useEffect, useState } from "react";

/** Play/pause/step/back/reset over a pre-computed list of events. */
export function useTracePlayer(length: number, baseDelay = 1100, resetKey?: unknown) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [length, resetKey]);

  useEffect(() => {
    if (!playing) return;
    if (index >= length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(length - 1, i + 1)), baseDelay / speed);
    return () => clearTimeout(t);
  }, [playing, index, length, baseDelay, speed]);

  const forward = useCallback(() => setIndex((i) => Math.min(length - 1, i + 1)), [length]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const reset = useCallback(() => { setIndex(0); setPlaying(false); }, []);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= length - 1) setIndex(0);
      return !p;
    });
  }, [index, length]);

  return { index, setIndex, playing, setPlaying, toggle, forward, back, reset, speed, setSpeed, atEnd: index >= length - 1 };
}
