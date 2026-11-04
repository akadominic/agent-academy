"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button, Segmented } from "@/components/ui/primitives";
import type { useTracePlayer } from "./useTracePlayer";

export function PlayerControls({ player, length, label = "Event" }: { player: ReturnType<typeof useTracePlayer>; length: number; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Playback controls">
      <Button variant="primary" size="sm" onClick={player.toggle} aria-label={player.playing ? "Pause" : "Play"}>
        {player.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {player.playing ? "Pause" : player.atEnd ? "Replay" : "Play"}
      </Button>
      <Button size="sm" onClick={player.back} disabled={player.index === 0} aria-label="Step back">
        <SkipBack className="h-4 w-4" /> Back
      </Button>
      <Button size="sm" onClick={player.forward} disabled={player.atEnd} aria-label="Step forward">
        Step <SkipForward className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={player.reset} aria-label="Reset">
        <RotateCcw className="h-4 w-4" /> Reset
      </Button>
      <Segmented
        size="sm"
        label="Speed"
        value={String(player.speed)}
        onChange={(v) => player.setSpeed(Number(v))}
        options={[{ value: "0.5", label: "½×" }, { value: "1", label: "1×" }, { value: "2", label: "2×" }]}
      />
      <span className="text-xs tabular-nums text-ink-3" aria-live="polite">
        {label} {Math.min(player.index + 1, length)} / {length}
      </span>
    </div>
  );
}
