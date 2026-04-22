FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache \
    libc6-compat \
    vips-dev

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

COPY . .

RUN mkdir -p /app/uploads/images /app/uploads/avaters && \
    chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
        const options = { hostname: 'localhost', port: 3000, path: '/healthz', timeout: 2000 }; \
        const req = http.request(options, (res) => { \
            process.exit(res.statusCode === 200 ? 0 : 1); \
        }); \
        req.on('error', () => process.exit(1)); \
        req.on('timeout', () => process.exit(1)); \
        req.end();"

CMD ["npm", "start"]