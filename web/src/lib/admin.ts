/** Проверка админ-токена: заголовок Authorization: Bearer <ADMIN_TOKEN> или ?token=. */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${expected}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("token") === expected) return true;
  return false;
}
