import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { InstructorDTO } from "@/lib/types";
import InstructorView from "./InstructorView";

export const dynamic = "force-dynamic";

// params — Promise-сумісно з Next 14/15 (await працює й на звичайному об'єкті).
export default async function InstructorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const i = await prisma.instructor.findFirst({
    where: { id: slug, isActive: true },
  });

  if (!i) notFound();

  const dto: InstructorDTO = {
    id: i.id,
    fullName: i.fullName,
    nickname: i.nickname,
    photo: i.photo,
    bioUa: i.bioUa,
    bioEn: i.bioEn,
    credentialsUa: i.credentialsUa,
    credentialsEn: i.credentialsEn,
    resumeUa: i.resumeUa,
    resumeEn: i.resumeEn,
    videos: i.videos,
    specialization: i.specialization,
  };

  return <InstructorView instructor={dto} />;
}
