# apty — single-image Next.js build.
# glibc (bookworm-slim) so libsql's prebuilt native binary loads cleanly.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install deps (all — build needs devDeps). The correct linux libsql binary is
# fetched here, inside the target platform.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The public VAPID key is inlined into the client bundle at build time.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN mkdir -p /app/data

EXPOSE 3000
# Migrations run automatically on boot (src/instrumentation.ts).
CMD ["npm", "run", "start"]
