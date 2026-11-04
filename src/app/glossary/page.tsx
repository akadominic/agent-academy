import type { Metadata } from "next";
import { GlossaryList } from "@/components/course/GlossaryList";

export const metadata: Metadata = { title: "Glossary" };

export default function GlossaryPage() {
  return <GlossaryList />;
}
