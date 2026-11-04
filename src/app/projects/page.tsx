import type { Metadata } from "next";
import { ProjectsIndex } from "@/components/course/ProjectsIndex";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsIndex />;
}
