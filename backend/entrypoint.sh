#!/bin/sh
# backend/entrypoint.sh

# Применяем последние миграции Prisma к базе данных
echo "Running Prisma migrations..."
npx prisma migrate deploy

# ИСПРАВЛЕНО: Запускаем приложение через npm-скрипт
echo "Starting application..."
npm run start:prod