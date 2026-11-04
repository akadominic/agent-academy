import type { Metadata } from "next";
import { ProgressManager } from "@/components/course/ProgressManager";

export const metadata: Metadata = { title: "Your progress" };

export default function ProgressPage() {
  return <ProgressManager />;
}
