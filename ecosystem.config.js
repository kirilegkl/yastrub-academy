// PM2 — запуск сайта (Next.js) и Telegram-бота на VPS.
//   pm2 start ecosystem.config.js
//   pm2 logs strilets-web / strilets-bot
//   pm2 save && pm2 startup   (автозапуск после ребута)
//
// Секреты берутся из web/.env и bot/.env (Next.js и python-dotenv читают их сами).
module.exports = {
  apps: [
    {
      name: "strilets-web",
      cwd: "./web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3012",
      env: { NODE_ENV: "production" },
      max_restarts: 10,
      autorestart: true,
    },
    {
      name: "strilets-bot",
      cwd: "./bot",
      script: "main.py",
      interpreter: "/var/www/yastrub.academy/bot/.venv/bin/python",
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
