# Dockerfile لتطبيق Next.js - جاهز للتشغيل في بيئة الإنتاج على Ubuntu
FROM node:20-alpine AS base

# مرحلة تثبيت الحزم
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# مرحلة البناء
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# مرحلة التشغيل النهائي (خفيفة وسريعة)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
