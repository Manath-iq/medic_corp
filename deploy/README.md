# VPS demo deployment

This deployment is a client demo, not a production medical service. Public pages
use React/Vite with a Node SSR server; Payload/Next.js runs as the CMS. Caddy serves
static assets, proxies public HTML to SSR and API/admin routes to CMS, and obtains
HTTPS certificates. No development servers or publicly exposed database/CMS/SSR ports.

## Layout

- `/opt/medic-demo/app`: explicitly selected application sources, excluding client
  correspondence, internal docs, Git history, local secrets and local builds.
- `/opt/medic-demo/storage/data/clinic.db`: SQLite database.
- `/opt/medic-demo/storage/uploads`: uploaded media/documents.
- `/opt/medic-demo/storage/data/document-history`: immutable document versions.
- `/opt/medic-demo/runtime.env`: server URLs and unique Payload secret (mode 600).
- `/opt/medic-demo/admin.env`: initial demo admin password (mode 600).
- `/opt/medic-demo/backups`: consistent, private backups retained for 14 days.
- Docker volumes: Caddy certificate/configuration state.

The first database is a consistent snapshot of the existing local CMS, not a fresh
seed; changing passwords or content on the VPS does not change the local database.
The server has a separate Payload secret, invalidating local authentication tokens.
The initial admin password must be changed with `provision-admin.ts` before opening
the deployment. The schema is frozen at the imported snapshot. Automatic schema
push is disabled in production. Before future schema changes, create and rehearse
Payload migrations against a backup; do not assume rebuilds migrate the database.

## Build/start

Run from `/opt/medic-demo/app`:

```sh
docker compose --env-file /opt/medic-demo/runtime.env -f deploy/compose.yml build
docker compose --env-file /opt/medic-demo/runtime.env -f deploy/compose.yml up -d
```

Required runtime environment: `PUBLIC_ORIGIN` (without trailing slash) and
`PAYLOAD_SECRET`. `SEO_INDEXABLE` defaults to `false`; keep it false on the demo.
Initially ports bind only to loopback for verification. After DNS
points to the VPS, set `PUBLIC_ORIGIN=https://your-subdomain.example`,
`HTTP_BIND=0.0.0.0:80`, `HTTPS_BIND=0.0.0.0:443`, then rebuild and recreate containers.
CMS configuration uses the origin at build time; rebuild the deployment after
changing it. Public assets use same-origin API access. Leave ports 80 and 443
reachable for certificate issuance/renewal. There are three services: cms, site, web.

Public URLs use `/`; old `/medic_corp/...` content links redirect to `/...` while
preserving the query string. `X-Robots-Tag` and `robots.txt` discourage indexing;
they are not access control. Documents are served by the CMS, not stale static
copies in `dist/documents` or `dist/assets/license`.

## Backup and restore

Install the included systemd service/timer. The nightly backup briefly stops CMS
writes and captures the database, uploads, document history and runtime secret
together. The asset server stays running, but public SSR pages and CMS requests
may briefly return 503 while CMS is stopped. Backup archives contain secrets:
keep permissions private and do not commit
or publish them. Same-server backups do not protect against loss of the VPS;
download an off-server copy and arrange ongoing external backups if needed.

For restoration, first save a backup of the current state. Stop CMS, extract a
chosen archive into a separate directory, validate its database with SQLite
`PRAGMA integrity_check`, and replace `storage` and `runtime.env` with the matching
snapshot. Restore storage ownership to UID/GID 1000. Start the same application
version, check `/api/site`, document downloads and admin login before reopening.
Do not overwrite a running SQLite database. Caddy certificates can be reissued;
the private deployment SSH key is not part of these archives.

## Checks

Verify public page routes, media/PDFs, anonymous preview denial, administrator login,
editing/publishing, container restart persistence, backup integrity, and HTTPS.
Keep only 22/80/443 exposed; Docker bypasses some UFW rules, so do not publish the
CMS port. SSH uses a dedicated key, not the password previously exposed in chat.
## SEO and migration

See [SEO and launch checklist](SEO.ru.md). Copying only `dist` does not deploy SSR.
Check all three services after changing PUBLIC_ORIGIN. Do not enable indexing on
the demo, skip the old site's redirect map, or assume valid schema guarantees rankings.
