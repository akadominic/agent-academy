import type { LabEntry } from "./types";
import { coreLabs } from "./entries/core";
import { m01Labs } from "./entries/m01";
import { m02Labs } from "./entries/m02";
import { m03Labs } from "./entries/m03";
import { m04Labs } from "./entries/m04";
import { m05Labs } from "./entries/m05";

export const LABS: LabEntry[] = [...coreLabs, ...m01Labs, ...m02Labs, ...m03Labs, ...m04Labs, ...m05Labs];

export function getLab(id: string): LabEntry | undefined {
  return LABS.find((l) => l.id === id);
}
