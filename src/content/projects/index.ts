import type { ProjectDef } from "../schema";
import { p1 } from "./p1";
import { p2 } from "./p2";
import { p3 } from "./p3";
import { p4 } from "./p4";

/** Built projects. Projects 5–7 and the capstone are listed in PLANNED_PROJECTS until built. */
export const PROJECTS: ProjectDef[] = [p1, p2, p3, p4].filter((p): p is ProjectDef => p !== null);

export const PLANNED_PROJECTS = [
  { id: "p5", number: 5, title: "Document Question-Answering Assistant", moduleId: "m9", focus: "RAG, retrieval and citations" },
  { id: "p6", number: 6, title: "Multi-Step Order Assistant", moduleId: "m11", focus: "Orchestration, state and permissions" },
  { id: "p7", number: 7, title: "Production-Ready Agent", moduleId: "m16", focus: "Tests, logging, cost controls, authentication and deployment" },
  { id: "capstone", number: 8, title: "Capstone: Kampala Market Assistant", moduleId: "m19", focus: "Everything, end to end, deployed" },
];

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id);
}
