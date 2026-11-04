import type { Metadata } from "next";
import { LabsIndex } from "@/components/course/LabsIndex";

export const metadata: Metadata = { title: "Labs" };

export default function LabsPage() {
  return <LabsIndex />;
}
