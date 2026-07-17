import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

/**
 * Создаёт (идемпотентно) сертификат для завершённого enrollment.
 * cert_number: SA-<год>-<6 символов>. qr_token — постоянный публичный токен.
 */
export async function createCertificateForEnrollment(enrollmentId: string) {
  const existing = await prisma.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: true, course: true, instructor: true },
  });
  if (!enrollment) throw new Error("enrollment not found");

  const year = enrollment.completedAt?.getFullYear() ?? new Date().getFullYear();
  const certNumber = `YA-${year}-${nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, "0")}`;
  const qrToken = nanoid(32);

  return prisma.certificate.create({
    data: {
      enrollmentId,
      certNumber,
      holderFullName: enrollment.user.fullName,
      courseTitle: enrollment.course.titleUa,
      instructorName: enrollment.instructor?.fullName ?? "—",
      qrToken,
    },
  });
}
