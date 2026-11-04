import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/content/projects";
import { ProjectView } from "@/components/course/ProjectView";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ projectId: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  return { title: getProject(projectId)?.title ?? "Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!getProject(projectId)) notFound();
  return <ProjectView projectId={projectId} />;
}
