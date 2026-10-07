# ---- Stage 1: prepare runtime files ----------------------------------------
# The web build is copied from the repository root; a placeholder SPA is
# generated when `dist/` was not built (`npm run build`) at image build time.
FROM node:20-alpine AS prep
WORKDIR /src
COPY . .
RUN mkdir -p /out && \
    cp edge-box/server.js edge-box/package.json /out/ && \
    if [ -d dist ]; then cp -r dist /out/dist; else \
    printf '<!doctype html><meta charset="utf-8"><title>GradeGlow Edge Box</title><body style="font-family:system-ui;padding:2rem"><h1>School Mesh Box is online</h1><p>The GradeGlow SPA bundle was not included at build time. Run <code>npm run build</code> on the repository root, then rebuild this image.</p><p>API status: <a href="/api/health">/api/health</a></p></body>' \
    > /out/dist/index.html; fi

# ---- Stage 2: runtime --------------------------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prep /out/ ./
ENV EDGE_STATIC_DIR=/app/dist
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/api/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "server.js"]