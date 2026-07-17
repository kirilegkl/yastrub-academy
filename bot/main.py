"""Telegram-бот доступа к курсам (aiogram 3.x).

Аутентификация: регистрация и оплата — на сайте. Сайт генерит одноразовый
link_token и даёт кнопку t.me/<bot>?start=<link_token>. Бот по /start<token>
привязывает chat_id к пользователю в общей БД. Доступ к материалам — только
после статуса paid/in_progress.

Запуск (dev):  python3 bot/main.py
Запуск (prod): pm2 start ecosystem.config.js  (процесс strilets-bot)
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
from aiogram.enums import ParseMode

from dotenv import load_dotenv

import db

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("strilets-bot")

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

dp = Dispatcher()


def t(locale: str | None, uk: str, en: str) -> str:
    return en if locale == "en" else uk


@dp.message(CommandStart(deep_link=True))
async def start_with_token(message: Message):
    # aiogram кладёт payload после /start в message.text: "/start <token>"
    parts = (message.text or "").split(maxsplit=1)
    token = parts[1].strip() if len(parts) > 1 else ""

    row = await db.bind_user_by_token(token, message.chat.id, message.from_user.username)
    if row:
        await message.answer(
            t(
                row["locale"],
                f"✅ Вітаємо, <b>{row['fullName']}</b>! Ваш акаунт прив'язано.\n\n"
                "Надішліть /courses — ваші курси, /certificate — сертифікати.",
                f"✅ Welcome, <b>{row['fullName']}</b>! Your account is linked.\n\n"
                "Send /courses for your courses, /certificate for certificates.",
            )
        )
    else:
        await message.answer(
            "🔗 Посилання для прив'язки недійсне або вже використане.\n"
            "Зареєструйтесь на сайті ще раз, щоб отримати нове.\n\n"
            "🔗 This linking code is invalid or already used. Please register on the site again."
        )


@dp.message(CommandStart())
async def start_plain(message: Message):
    user = await db.get_user_by_chat(message.chat.id)
    if user:
        await message.answer(
            t(
                user["locale"],
                f"Вітаємо, {user['fullName']}! Надішліть /courses або /certificate.",
                f"Welcome, {user['fullName']}! Send /courses or /certificate.",
            )
        )
    else:
        await message.answer(
            "👋 Це бот доступу до курсів стрілецької підготовки.\n"
            "Щоб отримати доступ, зареєструйтесь на сайті та натисніть кнопку «Відкрити бота».\n\n"
            f"🌐 {APP_URL}"
        )


@dp.message(Command("courses"))
async def courses(message: Message):
    user = await db.get_user_by_chat(message.chat.id)
    if not user:
        await message.answer("Спочатку прив'яжіть акаунт через сайт. / Link your account via the site first.")
        return

    rows = await db.get_active_courses(user["id"])
    if not rows:
        await message.answer(
            t(
                user["locale"],
                "У вас поки немає активних курсів. Після підтвердження оплати доступ з'явиться тут.",
                "You have no active courses yet. Access appears here once payment is confirmed.",
            )
        )
        return

    lines = [t(user["locale"], "<b>Ваші курси:</b>", "<b>Your courses:</b>")]
    for r in rows:
        title = r["titleEn"] if user["locale"] == "en" else r["titleUa"]
        lines.append(f"• {title} — <i>{r['status']}</i>")
    lines.append("")
    lines.append(
        t(
            user["locale"],
            "📚 Матеріали та розклад надасть ваш інструктор. (демо-версія)",
            "📚 Materials and schedule are provided by your instructor. (demo)",
        )
    )
    await message.answer("\n".join(lines))


@dp.message(Command("certificate"))
async def certificate(message: Message):
    user = await db.get_user_by_chat(message.chat.id)
    if not user:
        await message.answer("Спочатку прив'яжіть акаунт через сайт. / Link your account first.")
        return

    rows = await db.get_certificates(user["id"])
    if not rows:
        await message.answer(
            t(
                user["locale"],
                "Сертифікатів поки немає. Вони з'являться після завершення курсу.",
                "No certificates yet. They appear after course completion.",
            )
        )
        return

    lines = [t(user["locale"], "<b>Ваші сертифікати:</b>", "<b>Your certificates:</b>")]
    for r in rows:
        url = f"{APP_URL}/cert/{r['qrToken']}"
        lines.append(f"• {r['courseTitle']} — {r['certNumber']}\n  {url}")
    await message.answer("\n".join(lines), disable_web_page_preview=True)


@dp.message(F.text)
async def fallback(message: Message):
    await message.answer("Команди: /courses, /certificate")


async def main():
    from aiogram.client.default import DefaultBotProperties

    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    log.info("Bot starting (long polling)...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
