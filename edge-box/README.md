# GradeGlow School Edge Box

A zero-dependency Node server for schools with unreliable or absent internet. It
serves the offline-first GradeGlow SPA over the local LAN, receives ultra-low
bandwidth patch deltas from student devices, and — when a WAN link is available —
opportunistically syncs with the central relay. Built-in only (`node:http`,
`node:fs`, `node:crypto`, `node:path`), so it runs identically on a Raspberry Pi 5,
a school desktop, or in Docker.

## Quick start (any machine with Node 18+)

```bash
# 1. Build the SPA from the repository root
npm install
npm run build

# 2. Run the box
node edge-box/server.js
# → http://0.0.0.0:8080  (browse the SPA)
# → http://0.0.0.0:8080/api/health
```

Optional environment variables:

| Variable                | Default                       | Meaning |
| ----------------------- | ----------------------------- | ------- |
| `PORT`                  | `8080`                        | HTTP port |
| `EDGE_HOST`             | `0.0.0.0`                     | Bind address |
| `EDGE_ID`               | `school-mesh-box`             | Unique box id reported in health/sync |
| `EDGE_DATA_DIR`         | `./data`                      | JSON store directory (persists quiz data, change log, cursors) |
| `EDGE_STATIC_DIR`       | `./dist`                      | Built SPA directory |
| `EDGE_AUTH_TOKEN`       | *(empty = open LAN)*          | Bearer token for all `/api/*` except `/api/health` |
| `EDGE_CLOUD_URL`        | *(empty = sync disabled)*     | Relay base URL, e.g. `http://cloud-relay.lan:8080` |
| `EDGE_CLOUD_TOKEN`      | *(empty)*                     | Bearer token sent to the relay |
| `EDGE_SYNC_INTERVAL_MS` | `0` (disabled)                | How often to push/pull changes |
| `EDGE_DATA_DIR`         | `./data`                      | see above |

## API

| Endpoint                   | Auth | Description |
| -------------------------- | ---- | ----------- |
| `GET /api/health`          | no   | Liveness + stats (version, cursors, cloud state) |
| `GET /api/sync/changes?since=<cursor>&limit=<n>` | yes | Incremental change log (batch ≤ 500) |
| `POST /api/sync/changes`   | yes  | Apply a batch of JSON-patch ops; returns new cursor |
| `GET /api/catalog`         | yes  | Offline curriculum catalog |

Patch ops follow RFC-6902 `add` / `remove` / `replace`; invalid batches are
rejected with `422` and a stable `cursor` so clients can retry safely.

## Raspberry Pi 5 deployment

```bash
# On the Pi (Raspberry Pi OS / Ubuntu Server):
sudo apt update && sudo apt install -y nodejs npm
npm run build
node edge-box/server.js
```

Expose the box on the hotspot AP:
`sudo nmcli device wifi hotspot ssid GradeGlow-Mesh password 'study-now'` then
browse `http://192.168.4.1:8080` from every student device.

## Docker

```bash
npm run build                    # must exist before the image build
docker compose -f edge-box/docker-compose.yml up -d --build
```

Healthcheck polls `/api/health` every 30s; `edge-box-data` volume keeps quiz
deltas and sync cursors across restarts. Place a `.dockerignore` at the
repository root before building to keep `node_modules` out of the build context.

## Opportunistic cloud sync

The built-in syncer only talks to `http://` relays (plain LAN/over-link traffic);
`https://` endpoints are rejected by design because HTTP clients on schools'
proxies do not handle TLS certificates. For an HTTPS relay, run this box on a
schedule instead:

```bash
# On a machine with internet (via cron or an operator's laptop):
node edge-box/server.js &                      # local queue
curl -X POST https://relay.example/api/sync/changes --data-binary @changes.json
```

## Data & durability

All state lives in `EDGE_DATA_DIR/store.json` written atomically (write tmp +
rename). It contains `documents` (quiz submissions, progress, telemetry),
`changes` (append-only op log, capped at 5000 entries) and `cloudCursors`
(push/pull watermarks). The opportunistic tick pushes every locally-created
change once, skips echoing server-originated changes, and pulls remote changes
while advancing the pull cursor.