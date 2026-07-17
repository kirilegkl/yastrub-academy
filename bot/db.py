"""Доступ к той же PostgreSQL, что и сайт (Prisma-схема).

Важно: Prisma по умолчанию создаёт колонки в camelCase, поэтому в SQL
идентификаторы берём в двойные кавычки: "tgChatId", "linkToken" и т.д.
Enum-поля сравниваем как ::text.
"""

import os
import asyncpg

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        dsn = os.environ["DATABASE_URL"]
        _pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=5)
    return _pool


async def bind_user_by_token(link_token: str, chat_id: int, username: str | None):
    """Привязывает Telegram chat_id к пользователю по одноразовому linkToken.

    Возвращает запись пользователя или None. linkToken после привязки обнуляется.
    """
    pool = await get_pool()
    async with pool.acquire() as con:
        row = await con.fetchrow(
            'SELECT id, "fullName", locale FROM users WHERE "linkToken" = $1',
            link_token,
        )
        if not row:
            return None
        await con.execute(
            'UPDATE users SET "tgChatId" = $1, "tgUsername" = COALESCE($2, "tgUsername"), '
            '"linkToken" = NULL WHERE id = $3',
            str(chat_id),
            username,
            row["id"],
        )
        return row


async def get_user_by_chat(chat_id: int):
    pool = await get_pool()
    async with pool.acquire() as con:
        return await con.fetchrow(
            'SELECT id, "fullName", locale FROM users WHERE "tgChatId" = $1',
            str(chat_id),
        )


async def get_active_courses(user_id: str):
    """Курсы пользователя со статусом paid / in_progress."""
    pool = await get_pool()
    async with pool.acquire() as con:
        return await con.fetch(
            '''SELECT c."titleUa", c."titleEn", e.status::text AS status
               FROM enrollments e
               JOIN courses c ON c.id = e."courseId"
               WHERE e."userId" = $1 AND e.status::text IN ('paid','in_progress')
               ORDER BY e."createdAt" DESC''',
            user_id,
        )


async def get_certificates(user_id: str):
    pool = await get_pool()
    async with pool.acquire() as con:
        return await con.fetch(
            '''SELECT ce."certNumber", ce."qrToken", ce."courseTitle"
               FROM certificates ce
               JOIN enrollments e ON e.id = ce."enrollmentId"
               WHERE e."userId" = $1
               ORDER BY ce."issuedAt" DESC''',
            user_id,
        )
