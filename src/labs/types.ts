import type { ComponentType } from "react";
import type { Mode } from "@/content/schema";

/** Props every lab receives from the lesson page. */
export interface LabProps {
  /** Call when the learner has genuinely completed the lab's challenge. */
  onComplete?: (summary?: string) => void;
  /** Lab-specific settings from lesson content (e.g. which scenario to open on). */
  [key: string]: unknown;
}

export interface LabEntry {
  id: string;
  title: string;
  short: string;
  moduleId: string;
  mode: Mode;
  /** True if the lab runs without any network or API key. */
  offline: boolean;
  load: () => Promise<{ default: ComponentType<LabProps> }>;
}
