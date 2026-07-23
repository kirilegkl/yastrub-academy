export type SyllabusSection = {
  titleUa: string;
  titleEn: string;
  items: { ua: string; en: string }[];
};

export type InstructorDTO = {
  id: string;
  fullName: string;
  nickname: string | null;
  photo: string | null;
  bioUa: string;
  bioEn: string;
  credentialsUa: string;
  credentialsEn: string;
  resumeUa: string;
  resumeEn: string;
  videos: string[];
  specialization: string[];
};

export type CourseDTO = {
  id: string;
  slug: string;
  titleUa: string;
  titleEn: string;
  shortDescUa: string;
  shortDescEn: string;
  fullDescUa: string;
  fullDescEn: string;
  price: number;
  currency: string;
  duration: string;
  level: string;
  category: string;
  categoryEn: string;
  categoryOrder: number;
  coverImage: string | null;
  syllabus: SyllabusSection[];
  instructors: InstructorDTO[];
};
