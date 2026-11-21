# VPS demo deployment

This deployment is a client demo, not a production medical service. Public pages
remain React/Vite; Payload/Next.js runs as a production Node server. Caddy serves
static pages, proxies CMS and obtains/renews HTTPS certificates for the configured
domain. No development servers or publicly exposed database/CMS ports.

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
`PAYLOAD_SECRET`. Initially ports bind only to loopback for verification. After DNS
points to the VPS, set `PUBLIC_ORIGIN=https://your-subdomain.example`,
`HTTP_BIND=0.0.0.0:80`, `HTTPS_BIND=0.0.0.0:443`, then rebuild and recreate containers.
Both images use the origin at build time, so changing only runtime variables is
not sufficient. Leave ports 80 and 443 reachable for certificate issuance/renewal.

Public URLs use `/`; old `/medic_corp/...` content links redirect to `/...` while
preserving the query string. `X-Robots-Tag` and `robots.txt` discourage indexing;
they are not access control. Documents are served by the CMS, not stale static
copies in `dist/documents` or `dist/assets/license`.

## Backup and restore

Install the included systemd service/timer. The nightly backup briefly stops CMS
writes and captures the database, uploads, document history and runtime secret
together. The public static server stays running, but CMS requests may briefly
fail. Backup archives contain secrets: keep permissions private and do not commit
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
