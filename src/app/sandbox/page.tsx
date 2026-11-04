import type { Metadata } from "next";
import { Sandbox } from "@/components/sandbox/Sandbox";

export const metadata: Metadata = { title: "Engineering Sandbox" };

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Engineering Sandbox</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">
        Configure your own agent — task, model, instructions, tools, data and safety rules — run it, read its trace, test it against a dataset,
        and export it as a working Node.js script. More settings unlock as you progress through the course.
      </p>
      <div className="mt-6"><Sandbox /></div>
    </div>
  );
}
