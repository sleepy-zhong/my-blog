FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libvips-dev && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

COPY . .

RUN mkdir -p /opt/bootstrap/home-cats && \
    if [ -d /app/uploads/home-cats ]; then cp -R /app/uploads/home-cats/. /opt/bootstrap/home-cats/; fi && \
    mkdir -p /app/uploads/images /app/uploads/avaters /app/uploads/home-cats && \
    chmod +x /app/scripts/docker-entrypoint.sh && \
    chown -R node:node /app /opt/bootstrap

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

ENTRYPOINT ["sh", "/app/scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]
