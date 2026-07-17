# Yastrub Academy — платформа курсів стрілецької підготовки

Одностраничный сайт для продажи курсов по стрельбе (карабін, марксман+, снайперська гвинтівка, високоточна стрільба, пістолет, CQB, захист від дронів) с оплатой через банку **monobank**, доступом через **Telegram-бот** и **сертификатами по QR** с эфемерными (одноминутными) страницами и генерацией PDF на лету.

Стек: **Next.js 14 (App Router, TypeScript) + PostgreSQL (Prisma) + Python-бот (aiogram) под PM2**. Двуязычие **UA/EN**. Домен: **yastrub.academy**.

---

## Структура

```
web/    — сайт Next.js + Prisma (лендинг, API, сертификаты, админка)
bot/    — Telegram-бот (aiogram, asyncpg)
ecosystem.config.js  — PM2 (yastrub-web + yastrub-bot)
docker-compose.yml   — локальная PostgreSQL
```

## Что реализовано (MVP)

- Каталог из 7 курсов + инструкторы (many-to-many), seed в БД.
- Мастер покупки: курс → инструктор → программа (аккордеон) → регистрация.
- Оплата через банку monobank (jar). Заготовка эквайринга + вебхук с проверкой подписи.
- Регистрация → запись в PostgreSQL. Одноразовый `linkToken` для привязки Telegram.
- Telegram-бот: `/start <token>` привязывает аккаунт, `/courses`, `/certificate`.
- Сертификаты: выдаются при завершении курса. QR ведёт на `/cert/<qrToken>`, который **каждый скан** создаёт новую сессию, живущую **60 секунд**, и редиректит на неё; по истечении — 410. PDF генерируется на лету через `pdf-lib` по шаблону (шапка + ФИО + QR), с кириллицей (шрифт DejaVuSans).
- Мини-админка `/admin`: подтверждение оплаты, отметка о завершении (→ генерит сертификат).

---

## Быстрый старт (локально)

```bash
# 1. База данных
docker compose up -d          # PostgreSQL на localhost:5432

# 2. Сайт
cd web
cp .env.example .env          # при необходимости отредактируй
npm install
npx prisma migrate dev --name init   # создаёт таблицы
npm run seed                  # 7 курсов + инструкторы
npm run dev                   # http://localhost:3000

# 3. Бот (в отдельном терминале)
cd ../bot
cp .env.example .env          # впиши TELEGRAM_BOT_TOKEN, DATABASE_URL, APP_URL
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

Админка: открой `http://localhost:3000/admin`, введи `ADMIN_TOKEN` из `web/.env`.

### Проверка потока сертификата
1. В админке подтверди оплату заявки → статус `paid`.
2. Нажми «Завершити» → статус `completed`, создаётся сертификат, в ответе есть ссылка `/cert/<qrToken>`.
3. Открой её (или отсканируй QR) → редирект на одноминутную страницу. Обнови через минуту → «Термін дії минув».
4. Кнопка «Завантажити PDF» — свежесгенерированный PDF с ФИО и QR.

---

## Деплой на VPS (домен yastrub.academy)

Требуется: Node.js 20+, Python 3.11+, PostgreSQL, PM2, Nginx, домен + Let's Encrypt.
Корневая папка проекта: **/var/www/yastrub.academy**

```bash
# 0. Распаковать проект в /var/www/yastrub.academy
#    (внутри должны лежать web/, bot/, ecosystem.config.js)
cd /var/www/yastrub.academy

# 1. PostgreSQL: создать базу и пользователя, прописать DATABASE_URL в web/.env и bot/.env
#    Пример:
#    sudo -u postgres psql -c "CREATE USER yastrub WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ';"
#    sudo -u postgres psql -c "CREATE DATABASE yastrub OWNER yastrub;"

# 2. Сайт
cd web
cp .env.example .env          # боевые значения: APP_URL=https://yastrub.academy, MONO_JAR_URL, ADMIN_TOKEN, TELEGRAM_*
npm ci
npx prisma migrate deploy
npm run seed                  # один раз
npm run build

# 3. Бот
cd ../bot
cp .env.example .env          # APP_URL=https://yastrub.academy
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 4. PM2 (из корня проекта)
cd /var/www/yastrub.academy
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

> ⚠️ Для бота PM2 использует системный `python3`. Если ставишь зависимости в venv,
> либо укажи `interpreter: "./bot/.venv/bin/python"` в `ecosystem.config.js`,
> либо ставь пакеты глобально: `pip install -r bot/requirements.txt`.

### Nginx (reverse-proxy) + HTTPS

```nginx
server {
  server_name yastrub.academy www.yastrub.academy;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d yastrub.academy -d www.yastrub.academy   # HTTPS (обязателен для QR/сертификатов)
```

Управление процессами: `pm2 logs yastrub-web`, `pm2 logs yastrub-bot`, `pm2 restart yastrub-web`.

---

## monobank: два способа оплаты

**A. Банка (jar) — по умолчанию.** Задай `MONO_JAR_URL`. Пользователь платит в банку, затем жмёт «Я оплатив». Оплату подтверждает админ в `/admin` (кнопка «Оплату підтв.») → статус `paid`, бот открывает доступ. Банка не даёт вебхука, поэтому подтверждение ручное.

**B. Эквайринг мерчанта (автоматически).** Если есть mono-мерчант — задай `MONO_ACQUIRING_TOKEN`. Тогда `/api/register` создаёт invoice, а `/api/payments/monobank/webhook` принимает вебхук с проверкой подписи `X-Sign` и сам переводит в `paid`. Идемпотентность по `invoiceId`.

---

## Как работают эфемерные страницы сертификата

- `GET /cert/<qrToken>` (это зашито в QR) — постоянная точка входа. На каждый заход создаётся запись `cert_ephemeral_sessions` с `expiresAt = now()+60s` и происходит редирект на `/cert/view/<sessionToken>`.
- `GET /cert/view/<sessionToken>` — рендерит сертификат только если сессия не истекла; иначе показывает «термін дії минув».
- Так страница «живёт минуту и исчезает», но сам QR остаётся рабочим — повторный скан создаёт новую минутную страницу.
- Просроченные сессии подчищаются функцией `cleanupExpiredSessions()` (можно повесить на cron; проверка по времени и так не пускает на истёкшую).

## Безопасность
- Все секреты — в `.env` (в репозиторий не коммитятся).
- HTTPS обязателен. Проверка подписи вебхука monobank, идемпотентность по invoiceId.
- Валидация форм через zod. Согласие на обработку ПД. `noindex` и `no-store` на страницах сертификата.
- Платформа организует запись на легальные тренинги и выдачу доступа; никаких инструкций по изготовлению оружия/боеприпасов.

## Дальнейшие шаги (после MVP)
- Полноценный эквайринг mono (если появится мерчант) вместо ручного подтверждения.
- Загрузка учебных материалов/видео и их выдача в боте по статусу.
- CRUD курсов/инструкторов в админке (сейчас — через seed + смена статусов).
- Email-уведомления (SMTP).
