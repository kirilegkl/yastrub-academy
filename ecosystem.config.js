// PM2 — запуск сайта (Next.js) и Telegram-бота на VPS.
//   pm2 start ecosystem.config.js
//   pm2 logs yastrub-web / yastrub-bot
//   pm2 save && pm2 startup   (автозапуск после ребута)
//
// Секреты берутся из web/.env и bot/.env (Next.js и python-dotenv читают их сами).
module.exports = {
  apps: [
    {
      name: "yastrub-web",
      cwd: "./web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production" },
      max_restarts: 10,
      autorestart: true,
    },
    {
      name: "yastrub-bot",
      cwd: "./bot",
      script: "main.py",
      interpreter: "python3",
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
