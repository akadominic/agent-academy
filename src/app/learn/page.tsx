import type { Metadata } from "next";
import { CourseMap } from "@/components/course/CourseMap";
import { MODULES } from "@/content/curriculum";

export const metadata: Metadata = { title: "Course map" };

export default function LearnPage() {
  const built = MODULES.filter((m) => m.status === "complete").length;
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Course map</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">
        Twenty modules, from “what is a computer?” to a deployed AI agent. Each module unlocks a new capability and builds on the ones before it.
        Modules {MODULES.filter((m) => m.status === "complete").map((m) => m.number).join(", ")} are fully built ({built} of {MODULES.length}); the rest are outlined and in development.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-raised p-4">
        <div className="flex min-w-max items-center gap-1.5 text-sm" aria-label="Prerequisite chain">
          {["Computers & Internet", "Programming", "Language Models", "Prompts", "APIs", "Tools", "Agent Loop", "Memory", "Knowledge", "Integrations", "Workflows", "Testing", "Security", "Cost", "Interfaces", "Deployment", "Operations", "Capstone"].map((s, i, a) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="rounded-full bg-sunken px-2.5 py-1">{s}</span>
              {i < a.length - 1 && <span className="text-ink-3">→</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-8"><CourseMap /></div>
    </div>
  );
}
