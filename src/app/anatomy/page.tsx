import type { Metadata } from "next";
import { AnatomyPageClient } from "./AnatomyPageClient";

export const metadata: Metadata = {
  title: "Agent Anatomy Explorer",
  description: "Every part of a production AI agent, with a live request travelling through it.",
};

export default function AnatomyPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent">Signature experience</p>
      <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">Agent Anatomy Explorer</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">
        Your whole mental model of an AI agent, in one picture. It starts with the five core parts and grows as you complete modules.
        Press <strong>Play</strong> to watch a customer&apos;s request travel through the real agent loop, pause anywhere to inspect it,
        and inject failures to see how a well-built agent responds.
      </p>
      <div className="mt-6">
        <AnatomyPageClient />
      </div>
    </div>
  );
}
