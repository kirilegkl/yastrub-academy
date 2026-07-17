import { prisma } from "@/lib/db";
import PurchaseWizard from "./PurchaseWizard";
import type { CourseDTO, SyllabusSection } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCourses(): Promise<CourseDTO[]> {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: [{ categoryOrder: "asc" }, { sortOrder: "asc" }],
    include: {
      instructors: { include: { instructor: true } },
    },
  });

  return courses.map((c: (typeof courses)[number]) => ({
    id: c.id,
    slug: c.slug,
    titleUa: c.titleUa,
    titleEn: c.titleEn,
    shortDescUa: c.shortDescUa,
    shortDescEn: c.shortDescEn,
    fullDescUa: c.fullDescUa,
    fullDescEn: c.fullDescEn,
    price: c.price,
    currency: c.currency,
    duration: c.duration,
    level: c.level,
    category: c.category,
    categoryEn: c.categoryEn,
    categoryOrder: c.categoryOrder,
    coverImage: c.coverImage,
    syllabus: (c.syllabus as unknown as SyllabusSection[]) ?? [],
    instructors: c.instructors
      .filter((ci: (typeof c.instructors)[number]) => ci.instructor.isActive)
      .map((ci: (typeof c.instructors)[number]) => ({
        id: ci.instructor.id,
        fullName: ci.instructor.fullName,
        photo: ci.instructor.photo,
        bioUa: ci.instructor.bioUa,
        bioEn: ci.instructor.bioEn,
        credentialsUa: ci.instructor.credentialsUa,
        credentialsEn: ci.instructor.credentialsEn,
        specialization: ci.instructor.specialization,
      })),
  }));
}

export default async function Home() {
  let courses: CourseDTO[] = [];
  let dbError = false;
  try {
    courses = await getCourses();
  } catch (e) {
    dbError = true;
    console.error("DB error on home:", e);
  }

  return <PurchaseWizard courses={courses} dbError={dbError} />;
}
