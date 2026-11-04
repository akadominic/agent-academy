"use client";

import { LabHost } from "@/components/lesson/LabHost";

export function LabPageClient({ id }: { id: string }) {
  return <LabHost id={id} />;
}
