# Stage 1: Build React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime (hardened, non-root)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN apk upgrade --no-cache && \
    npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn*

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node server ./server

USER node
EXPOSE 8080

CMD ["node", "server/index.js"]
