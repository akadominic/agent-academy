import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_LESSONS, getLesson } from "@/content/curriculum";
import { LessonView } from "@/components/lesson/LessonView";

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ moduleId: l.moduleId, lessonId: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  return { title: lesson?.title ?? "Lesson", description: lesson?.subtitle };
}

export default async function LessonPage({ params }: { params: Promise<{ moduleId: string; lessonId: string }> }) {
  const { moduleId, lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson || lesson.moduleId !== moduleId) notFound();
  return <LessonView lessonId={lessonId} />;
}
