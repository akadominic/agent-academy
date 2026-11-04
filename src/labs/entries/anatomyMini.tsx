"use client";

import AnatomyExplorer from "../core/AnatomyExplorer";
import type { LabProps } from "../types";

export default function AnatomyMini(props: LabProps) {
  return <AnatomyExplorer {...props} minimal />;
}
