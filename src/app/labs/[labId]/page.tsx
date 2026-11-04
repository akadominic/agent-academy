import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LABS, getLab } from "@/labs/registry";
import { getModule } from "@/content/curriculum";
import { LabPageClient } from "./LabPageClient";

export function generateStaticParams() {
  return LABS.map((l) => ({ labId: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ labId: string }> }): Promise<Metadata> {
  const { labId } = await params;
  return { title: getLab(labId)?.title ?? "Lab" };
}

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const lab = getLab(labId);
  if (!lab) notFound();
  const mod = getModule(lab.moduleId);
  const lesson = mod?.lessons.find((l) => l.sections.some((s) => s.blocks.some((b) => b.type === "lab" && b.lab === lab.id)));
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <nav className="mb-3 text-sm text-ink-3">
        <Link href="/labs" className="hover:text-ink">Labs</Link> / {mod ? `Module ${mod.number}` : ""}
      </nav>
      <h1 className="font-display text-3xl font-semibold">{lab.title}</h1>
      <p className="mt-1 max-w-2xl text-ink-2">{lab.short}</p>
      {lesson && (
        <p className="mt-2 text-sm">
          Taught in: <Link className="text-accent hover:underline" href={`/learn/${lesson.moduleId}/${lesson.id}`}>{lesson.title}</Link>
        </p>
      )}
      <div className="mt-6">
        <LabPageClient id={lab.id} />
      </div>
    </div>
  );
}
