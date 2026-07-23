"use client";

import { useI18n } from "@/lib/i18n";
import type { InstructorDTO } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

// Перетворюємо будь-яке YouTube-посилання на embed-URL.
function youtubeEmbed(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/) || null;
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function InstructorView({ instructor: i }: { instructor: InstructorDTO }) {
  const { t, locale, toggle } = useI18n();

  const resume = locale === "en" ? i.resumeEn : i.resumeUa;
  const creds = locale === "en" ? i.credentialsEn : i.credentialsUa;
  const bio = locale === "en" ? i.bioEn : i.bioUa;

  // Резюме розбиваємо на абзаци (по порожньому рядку або крапці з переносом).
  const resumeParas = resume
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink-line/70 bg-ink-bg/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-5 h-14 flex items-center justify-between">
          <a
            href="/"
            className="font-display text-xs md:text-sm tracking-brand text-ink-text hover:text-ink-accent transition-colors"
          >
            {[t.hero_pre, t.hero_brand, t.hero_post].filter(Boolean).join(" ")}
          </a>
          <button
            onClick={toggle}
            className="chip px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink-text hover:border-ink-line2 transition-colors"
          >
            {t.lang}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-28">
        <div className="pt-8">
          <a href="/" className="text-sm text-ink-muted hover:text-ink-accent transition-colors">
            {t.inst_back_courses}
          </a>
        </div>

        {/* Профіль */}
        <section className="pt-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          <div className="h-40 w-40 shrink-0 rounded-3xl bg-ink-surface2 border border-ink-line grid place-items-center overflow-hidden font-display font-bold text-4xl text-ink-accent">
            {i.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={i.photo}
                alt={i.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              initials(i.fullName)
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
              {i.fullName}
            </h1>
            <p className="mt-3 text-ink-muted leading-relaxed">{bio}</p>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">{creds}</p>
          </div>
        </section>

        {/* Резюме */}
        {resumeParas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold mb-4">{t.inst_resume}</h2>
            <div className="card p-6 space-y-4">
              {resumeParas.map((p, idx) => (
                <p key={idx} className="text-[15px] text-ink-muted leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Відео */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-4">{t.inst_videos}</h2>
          {i.videos.length === 0 ? (
            <div className="card p-6 text-sm text-ink-muted">{t.inst_no_videos}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {i.videos.map((v, idx) => {
                const embed = youtubeEmbed(v);
                return (
                  <div key={idx} className="card overflow-hidden">
                    <div className="aspect-video w-full bg-black">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={`video-${idx}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={v} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-12">
          <a href="/" className="btn px-7 py-3 text-sm inline-block">
            {t.inst_back_courses}
          </a>
        </div>

        <footer className="mt-24 pt-6 border-t border-ink-line text-xs text-ink-muted flex items-center justify-between">
          <span className="font-display tracking-brand">{t.brand}</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}
