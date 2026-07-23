import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── ТИМЧАСОВЕ ПРИХОВУВАННЯ КУРСІВ ────────────────────────────
// Щоб знову показати ВСІ курси — постав SHOW_ALL = true (і `npm run seed`).
// Поки SHOW_ALL = false, активні лише курси зі списку VISIBLE_SLUGS.
const SHOW_ALL = false;
const VISIBLE_SLUGS = new Set<string>([
  "ar15-16-zero-to-fighter", // AR-15 — Базова підготовка
  "ar15-16-home-defense", // AR-15 — Захист оселі
  "ar15-16-team", // AR-15 — Швидкісна стрільба
]);

// ── Інструктори ─────────────────────────────────────────────
// Наразі один інструктор — призначається на всі курси.
const instructors = [
  {
    key: "kirilo",
    fullName: "Кирило «Єгер»",
    nickname: "Єгер",
    photo: "/instructors/kirilo.jpg",
    bioUa: "Інструктор зі стрілецької та тактичної підготовки.",
    bioEn: "Firearms and tactical training instructor.",
    credentialsUa: "Карабін, високоточна стрільба, тактика, підготовка цивільних і підрозділів.",
    credentialsEn: "Carbine, precision shooting, tactics, training for civilians and units.",
    resumeUa:
      "Кирило «Єгер» — інструктор зі стрілецької та тактичної підготовки з багаторічним практичним досвідом. Спеціалізація: робота з карабіном AR-платформи, високоточна стрільба, стрільба з нестійких положень, тактична медицина та підготовка до реальних сценаріїв. Проводить курси для цивільних і військових, від базового рівня до просунутого. Основний принцип — безпека, фундаментали та відпрацювання навичок до автоматизму.",
    resumeEn:
      "Kirilo «Yeger» is a firearms and tactical training instructor with years of hands-on experience. Focus: AR-platform carbine work, precision shooting, shooting from unstable positions, tactical medicine and real-scenario preparation. Trains civilians and military, from beginner to advanced. Core principle — safety, fundamentals and drilling skills to automaticity.",
    videos: [] as string[], // додай посилання на відео пізніше (YouTube або /videos/*.mp4)
    specialization: [],
  },
];

type CourseInput = {
  slug: string;
  titleUa: string;
  titleEn: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  price: number;
  summaryUa: string;
  items: string[];
  instructors: string[];
};

type Category = {
  cat: string;
  catEn: string;
  order: number;
  courses: CourseInput[];
};

// ── Каталог курсів ──────────────────────────────────────────
const catalog: Category[] = [
  {
    cat: "Карабін AR-15",
    catEn: "AR-15 Carbine",
    order: 1,
    courses: [
      {
        slug: "ar15-16-zero-to-fighter",
        titleUa: "AR-15 — Базова підготовка",
        titleEn: "AR-15 — Basic Training",
        level: "beginner",
        duration: "3 дні",
        price: 1200,
        summaryUa: "Базовий повний курс: від будови AR-15 до бойової перезарядки, нічної та багатоцільової стрільби.",
        instructors: ["kovalenko", "shevchenko"],
        items: [
          "Анатомія AR-15: верхній/нижній ресивер, BCG, буфер, УСМ",
          "Чищення, мастило, ресурс деталей — правильний догляд",
          "Пристрілка на 50/100/200 м: нульова точка, купчастість",
          "Базова стійка, хват, дихання, робота з УСМ",
          "Норматив на заряджання / розряджання / постановку на запобіжник",
          "Типи затримок: визначення та усунення по нормативу",
          "Базові вправи: перехід між позиціями стоячи / коліно / лежачи",
          "Тактична та бойова перезарядка під тиском",
          "Стрільба по рухомій цілі",
          "Стрільба по множинних цілях: порядок уражень",
          "Нічна стрільба: базові техніки з ліхтарем",
          "Довідка: законодавство, зберігання, транспортування в Україні",
        ],
      },
      {
        slug: "ar15-16-home-defense",
        titleUa: "AR-15 — Захист оселі",
        titleEn: "AR-15 — Home Defense",
        level: "intermediate",
        duration: "2 дні",
        price: 1400,
        summaryUa: "Конфігурація та тактика застосування карабіна для захисту домівки.",
        instructors: ["kovalenko", "shevchenko"],
        items: [
          "Конфігурація AR для захисту оселі: ствол, ліхтар, прицільні",
          "Вибір боєприпасів: пробивна здатність та безпека домочадців",
          "Аналіз будинку: сектори, небезпечні кути, мертві зони",
          "Рух з карабіном у коридорі та кімнаті",
          "Техніки роботи з ліхтарем: Surefire, Harries, Rogers",
          "Стрільба в обмеженому просторі: акустика, дульний тиск",
          "Реакція на виявлення загрози вночі",
          "Координація з родиною: план евакуації, зони відходу",
          "Швидкий доступ до зброї: сейф, кріплення, готовність",
          "Юридичні аспекти самооборони: що можна, що ні",
        ],
      },
      {
        slug: "ar15-16-team",
        titleUa: "AR-15 — Швидкісна стрільба",
        titleEn: "AR-15 — Speed Shooting",
        level: "intermediate",
        duration: "2 дні",
        price: 3900,
        summaryUa:
          "Швидкісні техніки роботи з карабіном: спліт, дабл-тап, вскидка, перенос вогню, стрільба по рухомій цілі.",
        instructors: ["shevchenko", "kovalenko"],
        items: [
          "Спліт",
          "Дабл тап",
          "Вскидка",
          "Перезарядка",
          "Перенос вогню",
          "Стрільба по рухомій цілі",
          "Стрільба в напрямку",
          "Стрільба по-сомалійськи",
        ],
      },
      {
        slug: "ar15-16-precision",
        titleUa: "AR-15 — Точна стрільба",
        titleEn: "AR-15 — Precision Shooting",
        level: "intermediate",
        duration: "2 дні",
        price: 4200,
        summaryUa: "Технологія точного пострілу з карабіна: фундаментали, стабільність, аналіз.",
        instructors: ["kovalenko", "bondar"],
        items: [
          "Фундаментали точності: дихання, цикл пострілу",
          "Керування спуском без збиття",
          "Природна точка прицілювання",
          "Пристрілка та підтвердження нуля",
          "Стрільба з опори та з рук",
          "Аналіз пробоїн і корекція помилок",
        ],
      },
      {
        slug: "ar15-16-unstable",
        titleUa: "AR-15 — Нестійкі положення",
        titleEn: "AR-15 — Unstable Positions",
        level: "intermediate",
        duration: "1 день",
        price: 3500,
        summaryUa: "Стрільба з нестійких та нестандартних положень і опор.",
        instructors: ["shevchenko", "kovalenko"],
        items: [
          "Стрільба з коліна, сидячи, лежачи на схилі",
          "Використання підручних опор",
          "Стрільба з-за укриття під кутом",
          "Швидка стабілізація в нестандартних позах",
          "Контроль зброї на нерівній поверхні",
        ],
      },
      {
        slug: "ar15-16-marksman-500",
        titleUa: "AR-15 — Марксман 400м",
        titleEn: "AR-15 — Marksman 400m",
        level: "advanced",
        duration: "3 дні",
        price: 5800,
        summaryUa: "Влучна стрільба з карабіна на дистанції до 400 м: балістика, поправки.",
        instructors: ["bondar", "shevchenko"],
        items: [
          "Балістика 5.56 на середніх дистанціях",
          "Оптика LPVO та налаштування",
          "Побудова DOPE-таблиці до 500 м",
          "Поправки на вітер та відстань",
          "Стрільба на 300–500 м по ростовій фігурі",
          "Стрільба з опор та нестійких положень",
        ],
      },
    ],
  },
  {
    cat: 'AR-15 10.5" — Короткий карабін',
    catEn: 'AR-15 10.5" — Short Carbine',
    order: 2,
    courses: [
      {
        slug: "ar15-105-vehicle",
        titleUa: 'Карабін 10.5" — Робота в авто',
        titleEn: 'Carbine 10.5" — Vehicle Work',
        level: "advanced",
        duration: "2 дні",
        price: 5500,
        summaryUa: 'Розміщення, витягання та стрільба з карабіна 10.5" в автомобілі.',
        instructors: ["shevchenko", "kovalenko"],
        items: [
          'Чому 10.5" для авто: переваги перед 16", обмеження',
          "Розміщення зброї в салоні: кріплення, кобури, авто-сейф",
          "Техніка витягання карабіна з авто — водій та пасажир",
          "Стрільба з авто: через вікно, через скло, з різних сидінь",
          "Вихід з авто під вогнем: права / ліва сторона",
          "Авто як укриття vs прикриття — де стояти",
          "Сценарій 1: атака на зупинене авто",
          "Сценарій 2: засідка в русі — виїзд та відповідь",
          "Координація водій + пасажир + задні",
          "Нічна робота в авто: ліхтар, ПНБ, тонування",
        ],
      },
      {
        slug: "ar15-105-cqb",
        titleUa: 'Карабін 10.5" — CQB: ближній бій у приміщенні',
        titleEn: 'Carbine 10.5" — CQB',
        level: "advanced",
        duration: "3 дні",
        price: 6000,
        summaryUa: "Прийоми роботи в кімнаті, дверях, сходах — від входу до зачистки.",
        instructors: ["shevchenko"],
        items: [
          "Прийоми роботи в кімнаті, дверях та на сходах",
          "Вхід у приміщення та точки домінування",
          "Кути, «нарізання пирога», мертві зони",
          "Зачистка приміщення: від входу до контролю",
        ],
      },
      {
        slug: "ar15-105-hunting",
        titleUa: 'Карабін 10.5" — Полювання',
        titleEn: 'Carbine 10.5" — Hunting',
        level: "intermediate",
        duration: "2 дні",
        price: 3800,
        summaryUa: "Полювання з коротким карабіном: боєприпаси, дистанції, зони ураження, безпека.",
        instructors: ["kovalenko", "bondar"],
        items: [
          "Вибір карабіна 10.5\" та боєприпасу для полювання",
          "Пристрілка під дистанції полювання",
          "Зони ураження звіра та етичний постріл",
          "Скрадання та стрільба з різних положень і опор",
          "Стрільба у сутінках: ліхтар, оптика",
          "Безпека та законодавство полювання в Україні",
        ],
      },
    ],
  },
  {
    cat: "AR-10 .308",
    catEn: "AR-10 .308",
    order: 3,
    courses: [
      {
        slug: "ar10-basic",
        titleUa: "АР10 — Базовий рівень",
        titleEn: "AR-10 — Basic Level",
        level: "beginner",
        duration: "2 дні",
        price: 4000,
        summaryUa: "Будова гвинтівки, тюнінг, збірка, пристрілка, можливості гвинтівки.",
        instructors: ["kovalenko", "shevchenko"],
        items: [
          "Будова гвинтівки AR-10",
          "Тюнінг та підбір комплектуючих",
          "Збірка / розбірка",
          "Пристрілка",
          "Можливості гвинтівки та боєприпасу",
        ],
      },
      {
        slug: "ar10-marksman-400",
        titleUa: "АР10 — Марксман 400м",
        titleEn: "AR-10 — Marksman 400m",
        level: "intermediate",
        duration: "3 дні",
        price: 5500,
        summaryUa: "Роль марксмана, балістика .308, стрільба на 400 м.",
        instructors: ["bondar", "shevchenko"],
        items: [
          "Роль марксмана у підрозділі",
          "Балістика .308 Win",
          "Пристрілка та DOPE до 400 м",
          "Поправки на вітер і відстань",
          "Стрільба на 400 м по ростовій фігурі",
        ],
      },
      {
        slug: "ar10-speed",
        titleUa: "АР10 — Швидкісна стрільба",
        titleEn: "AR-10 — Speed Shooting",
        level: "intermediate",
        duration: "2 дні",
        price: 5000,
        summaryUa: "Управління гвинтівкою на швидкості: динамічні цілі на різних дистанціях.",
        instructors: ["shevchenko", "bondar"],
        items: [
          "Керування .308 на швидкості",
          "Парні постріли, controlled pair",
          "Динамічні цілі на різних дистанціях",
          "Перенос вогню між цілями",
          "Перезарядка та усунення затримок під таймером",
        ],
      },
      {
        slug: "ar10-urban-sniping",
        titleUa: "АР10 — Міський снайпінг",
        titleEn: "AR-10 — Urban Sniping",
        level: "advanced",
        duration: "3 дні",
        price: 6500,
        summaryUa:
          "Задачі 50–450 м, маскування позиції в будівлі, антидрон, контрснайпінг, швидкісна стрільба, балістичні вікна.",
        instructors: ["bondar"],
        items: [
          "Задачі та дистанції 50–450 м",
          "Маскування вогневої позиції в будівлі",
          "Балістичні вікна та стрільба крізь прорізи",
          "Антидрон: виявлення та ураження FPV",
          "Контрснайпінг та пасивна безпека",
          "Швидкісна стрільба з позиції",
        ],
      },
      {
        slug: "ar10-moving-targets",
        titleUa: "АР10 — Стрільба по рухомим цілям",
        titleEn: "AR-10 — Moving Targets",
        level: "advanced",
        duration: "2 дні",
        price: 5500,
        summaryUa: "Винос, випередження, вразливі вузли техніки, балістичний калькулятор.",
        instructors: ["bondar", "shevchenko"],
        items: [
          "Винос та випередження по рухомій цілі",
          "Швидкість цілі та розрахунок поправки",
          "Вразливі вузли техніки",
          "Робота з балістичним калькулятором",
          "Стрільба по цілі, що рухається, на різних дистанціях",
        ],
      },
      {
        slug: "ar10-long-range-1000",
        titleUa: "АР10 — Long Range 1000м",
        titleEn: "AR-10 — Long Range 1000m",
        level: "advanced",
        duration: "5 днів",
        price: 9000,
        summaryUa:
          "Робота в парі, метеостанції, далекомір, вітер, деривація, швидкість і БК кулі, площа ураження.",
        instructors: ["bondar"],
        items: [
          "Робота в парі: стрілець + коректувальник",
          "Метеостанція та зчитування умов",
          "Далекомір і визначення дистанції",
          "Вітер та деривація",
          "Швидкість і балістичний коефіцієнт (БК) кулі",
          "Площа ураження та розрахунок пострілу до 1000 м",
        ],
      },
      {
        slug: "ar10-unstable",
        titleUa: "АР10 — Нестійкі положення",
        titleEn: "AR-10 — Unstable Positions",
        level: "intermediate",
        duration: "2 дні",
        price: 4800,
        summaryUa: "Стрільба з барикад, триподів, мотузок, стрільба сидячи, вправи на швидкість.",
        instructors: ["bondar", "shevchenko"],
        items: [
          "Стрільба з барикад",
          "Стрільба з триподу",
          "Використання мотузок/натяжок як опори",
          "Стрільба сидячи та з нестандартних поз",
          "Вправи на швидкість і стабілізацію",
        ],
      },
    ],
  },
  {
    cat: "Savage 110 .338 Lapua Magnum",
    catEn: "Savage 110 .338 Lapua Magnum",
    order: 4,
    courses: [
      {
        slug: "lm338-sniper-1500",
        titleUa: ".338 — Снайперський курс від нуля до 1500 м",
        titleEn: ".338 — Sniper Course, Zero to 1500 m",
        level: "advanced",
        duration: "5 днів",
        price: 9500,
        summaryUa: "Від знайомства з .338 LM до підтвердженого пострілу на 1500 м.",
        instructors: ["bondar"],
        items: [
          "Знайомство з .338 LM: балістика, перевага над .308 на дистанції",
          "Анатомія Savage 110: ложе, УСМ, ствол, оптика",
          "Вибір та монтаж оптики: 5–25×, рівень, кільця",
          "Пристрілка на 100 м та перевірка нульової точки",
          "Побудова DOPE-таблиці: 100–1500 м крок по 100 м",
          "Вплив вітру: читання, розрахунок поправки",
          "Метеорологічні поправки: тиск, температура, вологість",
          "Перші довгі дистанції: стрільба на 500–700 м",
          "Стрільба на 800–1000 м: підтвердження DOPE",
          "Стрільба на 1200–1500 м: виклики та рішення",
          "Процедура пострілу: ССА, стабілізація, слідкування",
          "ТО та ресурс ствола .338: правило 1500 пострілів",
        ],
      },
      {
        slug: "lm338-meteo",
        titleUa: ".338 — Метеорологія та балістика",
        titleEn: ".338 — Meteorology & Ballistics",
        level: "advanced",
        duration: "2 дні",
        price: 6000,
        summaryUa: "Читання вітру та погоди, балістичні калькулятори, польова методика поправок.",
        instructors: ["bondar"],
        items: [
          "Польовий метеограф: читання Kestrel, Garmin Xero",
          "Читання вітру без приладів: трава, дерева, міраж у оптику",
          "Поправки на перехресний та фронтальний вітер",
          "Балістичні калькулятори: Applied Ballistics, Hornady 4DOF",
          "Вплив висоти над рівнем моря на балістику",
          "Ефект Коріоліса та деривація .338 на 1000+ м",
          "Нагрів ствола та зміщення точки попадання",
          "Польова методика: збір даних, внесення поправок, верифікація",
        ],
      },
      {
        slug: "lm338-antimaterial",
        titleUa: ".338 — Антиматеріальна стрільба та цілі",
        titleEn: ".338 — Anti-Materiel Shooting",
        level: "advanced",
        duration: "3 дні",
        price: 7500,
        summaryUa: "Цілі для .338, балістика по перешкодах, дальня стрільба по дронах.",
        instructors: ["bondar"],
        items: [
          "Цілі для .338: що доцільно, що краще .50 BMG",
          "Балістика по скляних, металевих та бетонних перешкодах",
          "Вразливі вузли техніки: оптика, паливна система, двигун",
          "Далека стрільба по дронах та FPV-носіях",
          "Порівняння боєприпасів .338: FMJBT, APIT, Scenar, BTHP",
          "Стабілізація на великих дистанціях: мішок, сошки, задній упор",
          "Маскування позиції: тепловий та візуальний підпис",
          "Снайпер без коректувальника: самостійна робота",
          "Евакуація та зміна позиції після розкриття",
          "Психологія довгого пострілу: рутина та концентрація",
        ],
      },
    ],
  },
  {
    cat: "Дробовик 12 калібр",
    catEn: "Shotgun 12 gauge",
    order: 5,
    courses: [
      {
        slug: "shotgun-antidrone",
        titleUa: "Дробовик — Захист від FPV дронів",
        titleEn: "Shotgun — Anti-FPV Drone Defense",
        level: "intermediate",
        duration: "2 дні",
        price: 4200,
        summaryUa: "Збиття FPV-дронів дробовиком: патрон, упередження, командна робота.",
        instructors: ["kovalenko", "bondar"],
        items: [
          "Загроза FPV: типи дронів, швидкість, висоти, поведінка",
          "Чому дробовик: конус дробу vs швидкість FPV",
          "Вибір патрона: дріб №1, №3, картеч — що реально збиває",
          "Техніка стрільби по повітряній цілі: упередження, плавний лід",
          "Спортивна база: тарілка як тренажер для антидрон-стрільби",
          "Ефективна дальність: що таке реальні 30–50 м для дробу",
          "Сектори відповідальності: позиції та розподіл команди",
          "Командна робота: хто дивиться, хто стріляє, хто перезаряджає",
          "Маскування від FPV: теплова та ІЧ-сигнатура",
          "Правові норми застосування по дронах в умовах воєнного стану",
        ],
      },
      {
        slug: "shotgun-home-defense",
        titleUa: "Дробовик — Захист оселі",
        titleEn: "Shotgun — Home Defense",
        level: "beginner",
        duration: "2 дні",
        price: 3500,
        summaryUa: "Конфігурація, боєприпаси та тактика дробовика для захисту дому.",
        instructors: ["kovalenko"],
        items: [
          "Дробовик vs карабін vs пістолет: що вибрати для дому",
          "Конфігурація: ствол, магазин, ліхтар, прицільні пристрої",
          "Вибір боєприпасу: картеч 00, дріб №4, slug — розсіювання вдома",
          "Рух з дробовиком: коридор, двері, сходи",
          "Контроль дулового зрізу в обмеженому просторі",
          "Техніка тримання кутів та відкриття дверей",
          "Дія при виявленні: попередження, постріл, зупинка загрози",
          "Взаємодія з членами родини: сигнали, зони відходу",
          "Юридика: самооборона, що дозволено в Україні",
          "Практичний тест-сценарій: курс захисту оселі",
        ],
      },
      {
        slug: "shotgun-reloading",
        titleUa: "Дробовик — Релоадінг",
        titleEn: "Shotgun — Reloading",
        level: "intermediate",
        duration: "1 день",
        price: 3000,
        summaryUa: "Техніки та швидкість перезарядки дробовика під таймер.",
        instructors: ["kovalenko"],
        items: [
          "Типи перезарядки: тактична, бойова, sport load — коли що",
          "Аналіз часу: хронометраж кожного методу",
          "Техніка side saddle reload: основна та допоміжна рука",
          "Tube reload: подача 1+1, 2+2, 4+4",
          "Reload on the move: перезарядка в русі без зупинки",
          "Quad load: техніка, тренажери, відпрацювання",
          "Рукавички, патронташ, поясний носій: що зручніше",
          "Дрилі під таймером: внесення стресу",
          "Змагальний релоадінг: 3-gun техніки від топ-стрільців",
          "Топ-10 помилок та їх виправлення",
        ],
      },
      {
        slug: "shotgun-3gun",
        titleUa: "Дробовик — Тактичний курс: 3-gun",
        titleEn: "Shotgun — Tactical 3-gun",
        level: "intermediate",
        duration: "2 дні",
        price: 4500,
        summaryUa: "Підготовка до змагань, перехід між зброєю, вогневі точки.",
        instructors: ["shevchenko", "kovalenko"],
        items: [
          "Підготовка до змагань 3-gun",
          "Перехід між зброєю",
          "Вогневі точки та переміщення",
          "Тактика проходження вправ",
        ],
      },
      {
        slug: "shotgun-ammo",
        titleUa: "Дробовик — Боєприпаси: балістика та вибір",
        titleEn: "Shotgun — Ammunition & Ballistics",
        level: "beginner",
        duration: "1 день",
        price: 2500,
        summaryUa: "Slug, 00, дріб, гумові, флеш-банг — що, коли і навіщо.",
        instructors: ["kovalenko"],
        items: [
          "Slug, картеч 00, дріб — балістика та застосування",
          "Гумові та спеціальні боєприпаси",
          "Флеш-банг та менш летальні засоби",
          "Вибір боєприпасу під задачу",
        ],
      },
      {
        slug: "shotgun-tuning",
        titleUa: "Дробовик — Тюнінг і модернізація",
        titleEn: "Shotgun — Tuning & Upgrades",
        level: "beginner",
        duration: "1 день",
        price: 2500,
        summaryUa: "Заміна приклада, подовження магазину, установка ліхтаря, чок.",
        instructors: ["kovalenko"],
        items: [
          "Заміна приклада",
          "Подовження магазину",
          "Установка ліхтаря та прицільних",
          "Вибір та встановлення чока",
        ],
      },
    ],
  },
  {
    cat: "Savage 64 — .22LR",
    catEn: "Savage 64 — .22LR",
    order: 6,
    courses: [
      {
        slug: "lr22-intro",
        titleUa: ".22LR — Введення в стрілецьку справу",
        titleEn: ".22LR — Introduction to Shooting",
        level: "beginner",
        duration: "1 день",
        price: 2500,
        summaryUa: "Безпечний старт у стрільбі: від 4 правил до точності 10 з 10 на 25 м.",
        instructors: ["kovalenko", "bondar"],
        items: [
          "4 правила безпеки: залізні принципи",
          "Анатомія Savage 64: деталі, робота механізму",
          "Заряджання, розряджання, огляд — правильна процедура",
          "Базова стійка, хват, прицілювання, робота з УСМ",
          "Перші постріли: стрільба на 10 і 25 м",
          "Типи затримок .22LR: осічка, роздвоєний патрон",
          "Чищення та догляд: особливості .22LR (нагар від мастила)",
          "Пристрілка на 25 та 50 м",
          "Базові вправи на точність: 10 з 10 у монету на 25 м",
          "Підготовка до переходу на centerfire — що вже вмієш",
        ],
      },
      {
        slug: "lr22-ar15-analog",
        titleUa: ".22LR — Тренувальний аналог AR-15",
        titleEn: ".22LR — AR-15 Training Analog",
        level: "beginner",
        duration: "2 дні",
        price: 3000,
        summaryUa: "Дешеве тренування техніки AR-15 на .22LR: дрилі, перезарядка, план на 1000 пострілів.",
        instructors: ["kovalenko", "bondar"],
        items: [
          "Навіщо .22 замість centerfire: ціна, об’єм, навантаження",
          "Перенесення техніки: що тренується, що ні",
          "Дрилі точності на зменшених мішенях (25 м = 100 м ростова)",
          "Швидкісні дрилі: Bill Drill на .22LR під таймер",
          "Перезарядка та усунення затримок — аналог AR-15",
          "Магазинні дрилі: обмін, подача, активний резерв",
          "Стрільба з різних позицій: стоячи / коліно / лежачи",
          "Тренування з коліматором та оптикою",
          "Програма: 1000 пострілів за місяць — структурований план",
          "Оцінка: що реально переноситься на 5.56, що не переноситься",
        ],
      },
      {
        slug: "lr22-sniping",
        titleUa: ".22LR — Малокаліберний снайпінг",
        titleEn: ".22LR — Rimfire Sniping",
        level: "intermediate",
        duration: "2 дні",
        price: 3500,
        summaryUa: "Точна стрільба .22LR до 100 м: оптика, DOPE, рухомі цілі, Rimfire Challenge.",
        instructors: ["bondar", "kovalenko"],
        items: [
          "Балістика .22LR: траєкторія, сильне зниження, вплив вітру",
          "Пристрілка на 50, 75, 100 м",
          "Вибір оптики для .22LR: від 4× до 12×",
          "DOPE-таблиця для .22LR від 25 до 100 м",
          "Техніка точного пострілу: поклад, дихання, стабілізація",
          "Вправа: 10 з 10 в монету на 50 м",
          "Стрільба по рухомих цілях на .22",
          "Практичне застосування: пест-контроль, полювання",
          "Змагання зі .22LR: Rimfire Challenge — правила та тактика",
          "Психологія точного пострілу: рутина та концентрація",
        ],
      },
    ],
  },
  {
    cat: "Професійні навички",
    catEn: "Professional Skills",
    order: 7,
    courses: [
      {
        slug: "ar15-16-night-nvg",
        titleUa: "AR-15 — Нічні операції: ЛЦУ, ПНБ, Тепловізори",
        titleEn: "AR-15 — Night Ops: Lasers, NVG, Thermals",
        level: "advanced",
        duration: "2 дні",
        price: 5500,
        summaryUa: "Технології ночі та ефективний захист проти них.",
        instructors: ["shevchenko", "kovalenko"],
        items: [
          "Робота з пасивними нічними прицілами та ПНБ",
          "ЛЦУ та IR-лазери: застосування й безпека",
          "Тепловізори: виявлення та робота вночі",
          "Орієнтація та пересування в темряві",
          "Прицілювання та стрільба з ПНБ",
        ],
      },
      {
        slug: "ar15-16-tccc",
        titleUa: "AR-15 — ТактМед: TCCC",
        titleEn: "AR-15 — TacMed: TCCC",
        level: "intermediate",
        duration: "2 дні",
        price: 4500,
        summaryUa: "TCCC з карабіном: само/взаємодопомога, один поранений — хто стріляє.",
        instructors: ["kovalenko", "shevchenko"],
        items: [
          "TCCC з карабіном: принципи під вогнем",
          "Самодопомога та взаємодопомога",
          "Розподіл ролей: один поранений — хто стріляє, хто надає допомогу",
          "Евакуація пораненого під прикриттям",
        ],
      },
      {
        slug: "ar15-16-vehicle-stop",
        titleUa: "AR-15 — Зупинка авто на блокпостах",
        titleEn: "AR-15 — Vehicle Stop at Checkpoints",
        level: "advanced",
        duration: "2 дні",
        price: 5200,
        summaryUa: "Балістика по техніці, цільові зони та тактика зупинки транспортних засобів.",
        instructors: ["shevchenko", "kovalenko"],
        items: [
          "Загрози від ТЗ: сценарії та типи нападів",
          "Балістика AR-15 по металу: що пробиває, що відхиляється",
          "Цільові зони: двигун, паливний бак, колеса, лобове скло",
          "Позиціювання стрільця відносно рухомого авто",
          "Стрільба по рухомому транспорту: упередження",
          "Тактика блок-посту: командна робота та сигнали",
          "Ідентифікація загрози: рішення стріляти / не стріляти",
          "Стрільба під кутом: 45°, 90°, ззаду",
          "Правовий аспект: застосування зброї по ТЗ в умовах воєнного стану",
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding catalog...");

  const instructorIdByKey: Record<string, string> = {};
  for (const i of instructors) {
    const created = await prisma.instructor.upsert({
      where: { id: i.key },
      update: {
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
        isActive: true,
      },
      create: {
        id: i.key,
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
        isActive: true,
      },
    });
    instructorIdByKey[i.key] = created.id;
  }

  const activeSlugs: string[] = [];
  let sort = 0;

  for (const category of catalog) {
    for (const c of category.courses) {
      sort += 1;
      activeSlugs.push(c.slug);

      const syllabus = [
        {
          titleUa: "Програма курсу",
          titleEn: "Course program",
          items: c.items.map((s) => ({ ua: s, en: s })),
        },
      ];

      const data = {
        titleUa: c.titleUa,
        titleEn: c.titleEn,
        shortDescUa: c.summaryUa,
        shortDescEn: c.summaryUa,
        fullDescUa: c.summaryUa,
        fullDescEn: c.summaryUa,
        price: c.price,
        currency: "UAH",
        duration: c.duration,
        level: c.level,
        category: category.cat,
        categoryEn: category.catEn,
        categoryOrder: category.order,
        coverImage: `/courses/${c.slug}.jpg`,
        syllabus,
        isActive: SHOW_ALL || VISIBLE_SLUGS.has(c.slug),
        sortOrder: sort,
      };

      const course = await prisma.course.upsert({
        where: { slug: c.slug },
        update: data,
        create: { slug: c.slug, ...data },
      });

      await prisma.courseInstructor.deleteMany({ where: { courseId: course.id } });
      // Наразі один інструктор — призначаємо його на всі курси.
      // (Поле c.instructors у каталозі залишено як історичне; ігноруємо його.)
      for (const i of instructors) {
        const instructorId = instructorIdByKey[i.key];
        if (instructorId) {
          await prisma.courseInstructor.create({
            data: { courseId: course.id, instructorId },
          });
        }
      }
    }
  }

  // Приховати старі курси, яких немає в новому каталозі (без видалення — щоб не чіпати заявки)
  await prisma.course.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });

  const total = catalog.reduce((n, c) => n + c.courses.length, 0);
  console.log(`Seed complete: ${total} courses in ${catalog.length} categories.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
