FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 3001
CMD ["node", "dist/index.js"]
