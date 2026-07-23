"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { CourseDTO, InstructorDTO } from "@/lib/types";

function levelLabel(level: string, t: ReturnType<typeof useI18n>["t"]) {
  if (level === "advanced") return t.level_advanced;
  if (level === "intermediate") return t.level_intermediate;
  return t.level_beginner;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
}

// Пункт програми виду «Заголовок: опис» ділимо на заголовок (видно завжди)
// та опис (розкривається). Якщо двокрапки немає — опису немає.
function splitItem(text: string): { head: string; desc: string } {
  const i = text.indexOf(":");
  if (i === -1) return { head: text.trim(), desc: "" };
  return { head: text.slice(0, i).trim(), desc: text.slice(i + 1).trim() };
}

export default function PurchaseWizard({
  courses,
  dbError,
}: {
  courses: CourseDTO[];
  dbError: boolean;
}) {
  const { t, locale, toggle } = useI18n();
  const [step, setStep] = useState(2);
  const [flowOpen, setFlowOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const [phase, setPhase] = useState<"form" | "pay" | "done">("form");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", tg: "", consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ jarUrl: string; botLink: string; enrollmentId: string } | null>(
    null
  );

  const course = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);
  const instructor = useMemo(
    () => course?.instructors.find((i) => i.id === instructorId) ?? null,
    [course, instructorId]
  );

  // Групування курсів за платформою/зброєю (порядок збережено з сервера).
  const grouped = useMemo(() => {
    const map = new Map<string, { ua: string; en: string; items: CourseDTO[] }>();
    for (const c of courses) {
      const key = c.category || "—";
      if (!map.has(key)) map.set(key, { ua: c.category || "—", en: c.categoryEn || "—", items: [] });
      map.get(key)!.items.push(c);
    }
    return Array.from(map.values());
  }, [courses]);

  const title = (o: { titleUa: string; titleEn: string }) => (locale === "en" ? o.titleEn : o.titleUa);
  const short = (c: CourseDTO) => (locale === "en" ? c.shortDescEn : c.shortDescUa);
  const bio = (i: InstructorDTO) => (locale === "en" ? i.bioEn : i.bioUa);
  const creds = (i: InstructorDTO) => (locale === "en" ? i.credentialsEn : i.credentialsUa);

  // Перехід між кроками усередині модалки — БЕЗ прокрутки сторінки,
  // щоб позиція каталогу зберігалась такою, якою вона була в момент кліку «Обрати».
  function goStep(n: number) {
    setStep(n);
  }

  function openFlow(cId: string) {
    setCourseId(cId);
    setInstructorId(null);
    setStep(2);
    setPhase("form");
    setError(null);
    setResult(null);
    setFlowOpen(true);
  }

  function closeFlow() {
    setFlowOpen(false);
  }

  function scrollToCatalog() {
    if (typeof window !== "undefined") {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function submit() {
    setError(null);
    if (!form.consent) {
      setError(t.err_consent);
      return;
    }
    if (!course) return;
    setSubmitting(true);
    // Відкриваємо вкладку одразу (в межах кліку) — щоб браузер не заблокував,
    // потім перенаправимо її на банку monobank.
    const payWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          instructorId,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          tgUsername: form.tg,
          locale,
        }),
      });
      if (!res.ok) throw new Error("register failed");
      const data = await res.json();
      setResult(data);
      // Одразу відправляємо на банку, без проміжного слайда.
      if (data.jarUrl) {
        if (payWindow) payWindow.location.href = data.jarUrl;
        else window.location.href = data.jarUrl;
      } else if (payWindow) {
        payWindow.close();
      }
      setPhase("done");
    } catch {
      if (payWindow) payWindow.close();
      setError(t.err_generic);
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [t.step_course, t.step_instructor, t.step_program, t.step_register];

  return (
    <div className="min-h-screen">
      {/* Header — минимальный: словесная марка + переключатель языка */}
      <header className="sticky top-0 z-20 border-b border-ink-line/70 bg-ink-bg/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-display text-xs md:text-sm tracking-brand text-ink-text hover:text-ink-accent transition-colors text-left"
          >
            {[t.hero_pre, t.hero_brand, t.hero_post].filter(Boolean).join(" ")}
          </button>
          <button
            onClick={toggle}
            className="chip px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink-text hover:border-ink-line2 transition-colors"
          >
            {t.lang}
          </button>
        </div>
      </header>

      {/* Банер на всю ширину, висота 100px. Поклади зображення у web/public/banner.jpg */}
      <div
        className="relative w-full overflow-hidden border-b border-ink-line"
        style={{
          aspectRatio: "2000 / 700",
          maxHeight: 460,
          background:
            "linear-gradient(90deg,#0e1013,#191c22 40%,#191c22 60%,#0e1013), radial-gradient(600px 120px at 50% 0, rgba(245,179,1,0.10), transparent)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner.jpg"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Віджет поверх банера (десктоп), прижатий до правого краю контенту */}
        <div className="hidden md:block absolute inset-0 pointer-events-none">
          <div className="h-full px-8 lg:px-12 flex items-center justify-end">
            <div className="w-[375px] pointer-events-auto">
              <LeadForm t={t} />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-28">
        {/* Hero */}
        <section className="pt-10 pb-8 md:pt-12 md:pb-10">
          <p
            className="text-ink-muted whitespace-nowrap"
            style={{ fontSize: "clamp(11px, 3.4vw, 18px)" }}
          >
            {t.hero_sub}
          </p>
          <p
            className="mt-2 font-semibold text-ink-text"
            style={{ fontSize: "clamp(12px, 3.6vw, 18px)" }}
          >
            {t.hero_cert}
          </p>

          <div className="mt-7">
            <button className="btn px-7 py-3 text-base" onClick={scrollToCatalog}>
              {t.choose} →
            </button>
          </div>

          {/* Віджет для мобільних — під банером */}
          <div className="md:hidden mt-8">
            <LeadForm t={t} />
          </div>
        </section>

        {dbError && (
          <div className="card p-4 text-sm text-red-300 mb-8">
            База даних недоступна. Перевірте DATABASE_URL та виконайте seed. / Database unavailable.
          </div>
        )}

        {/* Каталог курсів — завжди на сторінці (позиція прокрутки зберігається) */}
        <div id="catalog" className="space-y-12">
            {grouped.map((g) => (
              <section key={g.ua}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display text-lg md:text-xl font-bold text-ink-text">
                    {locale === "en" ? g.en : g.ua}
                  </h2>
                  <span className="chip px-2.5 py-0.5 text-[11px] text-ink-muted">
                    {g.items.length}
                  </span>
                  <div className="flex-1 hairline" />
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((c) => (
                    <article key={c.id} className="card card-hover p-6 flex flex-col">
                      {/* Зображення курсу 1:1. Файл: web/public/courses/<slug>.jpg */}
                      <div
                        className="-mx-6 -mt-6 mb-5 aspect-square w-auto overflow-hidden rounded-t-2xl"
                        style={{
                          background:
                            "linear-gradient(135deg,#151820,#0f1114), radial-gradient(400px 200px at 70% 0, rgba(245,179,1,0.12), transparent)",
                        }}
                      >
                        {c.coverImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.coverImage}
                            alt={title(c)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="chip px-2.5 py-1 text-[11px] text-ink-muted">
                          {levelLabel(c.level, t)}
                        </span>
                        <span className="text-xs text-ink-muted">{c.duration}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold mt-4 leading-snug">{title(c)}</h3>
                      <p className="mt-2 text-sm text-ink-muted flex-1 leading-relaxed">{short(c)}</p>
                      <div className="hairline my-5" />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                            {t.price}
                          </div>
                          <div className="font-display text-2xl font-extrabold text-ink-text">
                            {c.price.toLocaleString("uk-UA")}
                            <span className="text-sm text-ink-muted font-sans font-medium">
                              {" "}
                              {t.uah}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn px-5 py-2.5 text-sm"
                          onClick={() => openFlow(c.id)}
                        >
                          {t.choose}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

        {/* ── Модалка покупки: інструктор → програма → реєстрація ──
            Відкривається поверх каталогу, тому позиція прокрутки зберігається. */}
        {flowOpen && course && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 md:py-10"
            onClick={closeFlow}
          >
            <div
              className="card relative w-full max-w-2xl p-6 md:p-8 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeFlow}
                aria-label="Close"
                className="absolute right-4 top-4 h-9 w-9 rounded-xl border border-ink-line text-ink-muted hover:text-ink-text hover:border-ink-line2 grid place-items-center text-xl leading-none"
              >
                ×
              </button>

              <nav className="mb-6 flex flex-wrap gap-2 pr-10">
                {steps.slice(1).map((label, i) => {
                  const n = i + 2;
                  const active = step === n;
                  const done = step > n;
                  return (
                    <span
                      key={label}
                      className={`chip px-3 py-1 text-[11px] font-medium ${
                        active
                          ? "border-ink-accent text-ink-accent bg-ink-accentSoft"
                          : done
                          ? "text-ink-muted border-ink-line2"
                          : "text-ink-muted/60"
                      }`}
                    >
                      {label}
                    </span>
                  );
                })}
              </nav>

              {/* STEP 2 — instructors */}
              {step === 2 && (
                <section>
                  <h2 className="font-display text-2xl font-bold mb-1">{t.instructors_for}</h2>
                  <p className="text-sm text-ink-muted mb-6">{title(course)}</p>
                  <div className="grid gap-5">
                    {course.instructors.map((i) => (
                      <div
                        key={i.id}
                        className={`card p-6 ${instructorId === i.id ? "card-selected" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-ink-surface2 border border-ink-line grid place-items-center font-display font-bold text-ink-accent overflow-hidden">
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
                          <div>
                            <div className="font-semibold text-lg">{i.fullName}</div>
                            <div className="text-sm text-ink-muted">{bio(i)}</div>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-ink-muted leading-relaxed">{creds(i)}</p>
                        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                          <button
                            className="btn px-5 py-2.5 text-sm flex-1"
                            onClick={() => {
                              setInstructorId(i.id);
                              goStep(3);
                            }}
                          >
                            {t.choose}
                          </button>
                          <a
                            href={`/instructor/${i.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost px-5 py-2.5 text-sm text-center flex-1"
                          >
                            {t.instructor_more}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <button className="btn-ghost px-5 py-2.5 text-sm" onClick={closeFlow}>
                      ← {t.back}
                    </button>
                  </div>
                </section>
              )}

        {/* STEP 3 — syllabus */}
        {step === 3 && course && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-1">{t.program_title}</h2>
            <p className="text-sm text-ink-muted mb-6">
              {title(course)} · {instructor?.fullName}
            </p>
            <div className="space-y-2.5">
              {course.syllabus.map((sec, idx) => (
                <div key={idx} className="card overflow-hidden">
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                    onClick={() => setOpenSection(openSection === idx ? null : idx)}
                  >
                    <span className="font-semibold">
                      {locale === "en" ? sec.titleEn : sec.titleUa}
                    </span>
                    <span
                      className={`text-ink-accent text-xl leading-none transition-transform ${
                        openSection === idx ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {openSection === idx && (
                    <div className="px-4 pb-4 space-y-2">
                      {sec.items.map((it, j) => {
                        const raw = locale === "en" ? it.en : it.ua;
                        const { head, desc } = splitItem(raw);
                        const key = `${idx}-${j}`;
                        const open = openItem === key;
                        const hasDesc = desc.length > 0;
                        return (
                          <div
                            key={j}
                            className="rounded-xl border border-ink-line bg-ink-surface2/40 overflow-hidden"
                          >
                            <button
                              type="button"
                              className={`w-full px-4 py-3 flex items-start gap-2.5 text-left ${
                                hasDesc ? "cursor-pointer" : "cursor-default"
                              }`}
                              onClick={() => hasDesc && setOpenItem(open ? null : key)}
                            >
                              <span className="text-ink-accent mt-0.5">▸</span>
                              <span className="flex-1 text-sm text-ink-text">{head}</span>
                              {hasDesc && (
                                <span
                                  className={`text-ink-accent text-lg leading-none transition-transform ${
                                    open ? "rotate-45" : ""
                                  }`}
                                >
                                  +
                                </span>
                              )}
                            </button>
                            {hasDesc && open && (
                              <div className="px-4 pb-3 pl-9 text-sm text-ink-muted leading-relaxed">
                                {desc}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="card mt-6 p-6 flex items-center justify-between">
              <span className="text-ink-muted">{t.total}</span>
              <span className="font-display text-3xl font-extrabold text-ink-accent">
                {course.price.toLocaleString("uk-UA")}
                <span className="text-base text-ink-muted font-sans font-medium"> {t.uah}</span>
              </span>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="btn-ghost px-5 py-2.5 text-sm" onClick={() => goStep(2)}>
                ← {t.back}
              </button>
              <button className="btn px-7 py-2.5" onClick={() => goStep(4)}>
                {t.next} →
              </button>
            </div>
          </section>
        )}

        {/* STEP 4 — register / pay / done */}
        {step === 4 && course && (
          <section className="max-w-xl">
            {phase === "form" && (
              <>
                <h2 className="font-display text-2xl font-bold mb-6">{t.register_title}</h2>
                <div className="card p-6 space-y-4">
                  <Field
                    label={t.full_name}
                    required
                    value={form.fullName}
                    onChange={(v) => setForm({ ...form, fullName: v })}
                  />
                  <Field
                    label={t.email}
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                  />
                  <Field
                    label={t.phone}
                    required
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                  />
                  <Field
                    label={t.tg}
                    value={form.tg}
                    onChange={(v) => setForm({ ...form, tg: v })}
                    placeholder="@username"
                  />
                  <label className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-1 accent-[#F5B301]"
                    />
                    <span>
                      {t.consent}
                      <span className="text-red-400"> *</span>
                    </span>
                  </label>

                  {error && <div className="text-sm text-red-400">{error}</div>}

                  <div className="hairline" />
                  <div className="flex items-center justify-between">
                    <div className="font-display text-xl font-extrabold text-ink-text">
                      {course.price.toLocaleString("uk-UA")}
                      <span className="text-sm text-ink-muted font-sans font-medium"> {t.uah}</span>
                    </div>
                    <button
                      disabled={
                        submitting || !form.fullName || !form.email || !form.phone || !form.consent
                      }
                      className="btn px-7 py-2.5"
                      onClick={submit}
                    >
                      {submitting ? "..." : t.pay}
                    </button>
                  </div>
                </div>
                <button className="btn-ghost px-5 py-2.5 text-sm mt-5" onClick={() => goStep(3)}>
                  ← {t.back}
                </button>
              </>
            )}

            {phase === "done" && result && (
              <>
                <h2 className="font-display text-2xl font-bold mb-2">{t.done_title}</h2>
                <p className="text-sm text-ink-muted mb-5">{t.done_hint}</p>
                <div className="card p-6 space-y-3">
                  <a
                    href={result.botLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink-accent hover:underline"
                  >
                    {t.bot_title}
                  </a>
                  <div className="text-sm text-ink-muted">{t.bot_hint}</div>
                  <a href="https://t.me/kirilegkl" target="_blank" rel="noopener noreferrer">
                    <span className="btn w-full px-6 py-3.5">{t.support}</span>
                  </a>
                  <a
                    href={result.jarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-ink-muted hover:text-ink-accent"
                  >
                    {t.open_jar}
                  </a>
                </div>
              </>
            )}
          </section>
        )}
            </div>
          </div>
        )}

        <footer className="mt-24 pt-6 border-t border-ink-line text-xs text-ink-muted flex items-center justify-between">
          <span className="font-display tracking-brand">{t.brand}</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-muted">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <input
        className="input mt-1.5 px-3.5 py-2.5 text-sm"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LeadForm({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  const { locale } = useI18n();
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function send() {
    const digits = phone.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 9) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, locale, source: "hero" }),
      });
      if (!res.ok) throw new Error("lead failed");
      setState("done");
      setPhone("");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="card p-6 shadow-2xl" style={{ boxShadow: "0 24px 60px -20px rgba(0,0,0,0.85)" }}>
      <p className="font-display text-lg font-bold leading-snug text-ink-text">
        {t.lead_q1a} <span className="text-ink-accent">{t.lead_q1b}</span>?
      </p>
      <p className="mt-3 text-[15px] text-ink-muted leading-relaxed">
        {t.lead_desc1}
        <br />
        {t.lead_desc2}
      </p>

      {state === "done" ? (
        <div className="mt-4 flex items-center gap-2 text-ink-accent font-semibold">
          <span>✓</span>
          <span>{t.lead_success}</span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <input
            className="input px-3.5 py-3 text-sm flex-1"
            type="tel"
            inputMode="tel"
            placeholder={t.lead_phone_ph}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (state === "error") setState("idle");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            className="btn px-6 py-3 text-sm whitespace-nowrap"
            disabled={state === "sending"}
            onClick={send}
          >
            {state === "sending" ? t.lead_sending : t.lead_send}
          </button>
        </div>
      )}

      {state === "error" && <div className="mt-2 text-sm text-red-400">{t.lead_error}</div>}
    </div>
  );
}
