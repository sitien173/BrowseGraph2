FROM node:20-alpine AS deps

WORKDIR /workspace

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY web/package*.json ./web/
COPY extension/package*.json ./extension/
RUN npm ci

FROM node:20-alpine AS build

WORKDIR /workspace

COPY --from=deps /workspace/node_modules ./node_modules
COPY backend ./backend
COPY web ./web
COPY package*.json ./
RUN npm --prefix backend run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /workspace/package*.json ./
COPY --from=deps /workspace/backend/package*.json ./backend/
COPY --from=deps /workspace/web/package*.json ./web/
COPY --from=deps /workspace/extension/package*.json ./extension/
COPY --from=build /workspace/node_modules ./node_modules
RUN npm prune --omit=dev --workspace backend

WORKDIR /app/backend

COPY --from=build /workspace/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
