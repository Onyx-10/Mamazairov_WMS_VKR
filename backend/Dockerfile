# --- СТАДИЯ 1: Сборщик (Builder) ---
# Используем стабильный образ Node.js на Alpine Linux для сборки
FROM node:22.16.0-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости, включая dev, которые нужны для сборки
RUN npm install

# Копируем остальной код приложения
COPY . .

# Генерируем Prisma Client (зависит от dev-зависимости @prisma/client)
RUN npx prisma generate

# Собираем приложение в продакшен-сборку
RUN npm run build

# --- СТАДИЯ 2: Продакшен (Production) ---
# Используем тот же легковесный образ Node.js
FROM node:22.16.0-alpine

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json из сборщика
COPY --from=builder /usr/src/app/package*.json ./

# ИСПРАВЛЕНО: Устанавливаем ТОЛЬКО production-зависимости.
# Это ключевая оптимизация, которая делает образ маленьким.
# `npm ci` использует package-lock.json для быстрой и предсказуемой установки.
RUN npm ci --omit=dev

# Копируем собранное приложение из сборщика
COPY --from=builder /usr/src/app/dist ./dist
# Копируем схему Prisma для выполнения миграций при запуске
COPY --from=builder /usr/src/app/prisma ./prisma

# Копируем и делаем исполняемым наш стартовый скрипт
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Запускаем приложение через стартовый скрипт
CMD ["./entrypoint.sh"]