import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MODULES, getModule } from "@/content/curriculum";
import { ModuleView } from "@/components/course/ModuleView";

export function generateStaticParams() {
  return MODULES.map((m) => ({ moduleId: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ moduleId: string }> }): Promise<Metadata> {
  const { moduleId } = await params;
  const m = getModule(moduleId);
  return { title: m ? `Module ${m.number}: ${m.title}` : "Module", description: m?.goal };
}

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  if (!getModule(moduleId)) notFound();
  return <ModuleView moduleId={moduleId} />;
}
