FROM node:22-bookworm AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ARG APP_VERSION=unknown
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/data
ENV APP_VERSION=$APP_VERSION
VOLUME ["/data"]
EXPOSE 3001
CMD ["node", "dist/index.js"]
