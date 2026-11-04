import type { GlossaryTerm } from "../schema";
import { coreTerms } from "./core";
import { m01Terms } from "./m01";
import { m02Terms } from "./m02";
import { m03Terms } from "./m03";
import { m04Terms } from "./m04";
import { m05Terms } from "./m05";

export const GLOSSARY: GlossaryTerm[] = [...coreTerms, ...m01Terms, ...m02Terms, ...m03Terms, ...m04Terms, ...m05Terms];

const byId = new Map(GLOSSARY.map((t) => [t.id, t]));
export function getTerm(id: string): GlossaryTerm | undefined {
  return byId.get(id);
}
