FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS source
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

FROM source AS site-build
ARG PUBLIC_ORIGIN
RUN test -n "$PUBLIC_ORIGIN" && VITE_CMS_URL=same-origin npm run build -- --base / && VITE_CMS_URL=same-origin npm run build:ssr -- --base /
# Documents must be served by CMS access checks, not stale public copies.
RUN rm -rf dist/documents dist/assets/license

FROM site-build AS site
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4175
USER node
EXPOSE 4175
CMD ["node", "server/index.mjs"]

FROM source AS cms-build
ARG PUBLIC_ORIGIN
RUN PAYLOAD_SECRET=build-only-not-a-runtime-secret CMS_URL="$PUBLIC_ORIGIN" SITE_URL="$PUBLIC_ORIGIN" npm run cms:build

FROM cms-build AS cms
ENV NODE_ENV=production
RUN mkdir -p /storage/data /storage/uploads && chown -R node:node /storage /app/cms
USER node
EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start", "cms", "--hostname", "0.0.0.0", "--port", "3001"]

FROM caddy:2-alpine AS web
COPY --from=site-build /app/dist /srv/site
COPY deploy/Caddyfile /etc/caddy/Caddyfile
