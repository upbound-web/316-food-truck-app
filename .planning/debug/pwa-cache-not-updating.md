---
status: verifying
trigger: "PWA installed on tablet doesn't update when new Docker builds are deployed"
created: 2026-02-05T00:00:00Z
updated: 2026-02-05T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - nginx serves sw.js and manifest.webmanifest without Cache-Control headers, causing browser to cache them indefinitely
test: verified nginx config in Dockerfile has no Cache-Control directives
expecting: adding proper Cache-Control headers for PWA files will fix auto-update
next_action: implement fix in Dockerfile nginx config

## Symptoms

expected: After deploying a new Docker build, the PWA on the tablet should automatically detect and apply the update (new service worker) without manual intervention.
actual: The installed PWA stays on old cached version after every deploy. User must manually go to browser settings and clear site data for the app to pick up the new build.
errors: No known errors - just silently stays on old version.
reproduction: 1) Make a code change, 2) Run deploy.sh which rebuilds Docker with --no-cache, 3) Open the PWA on tablet - it still shows the old version, 4) Clear site data on tablet - now shows new version.
started: Has never auto-updated. The app uses VitePWA with registerType: "autoUpdate" and workbox for service worker generation. The updateSW(true) call was just added to onNeedRefresh but hasn't been tested yet (the tablet still has the old version without this fix cached).

## Eliminated

## Evidence

- timestamp: 2026-02-05T00:01:00Z
  checked: Dockerfile nginx configuration
  found: nginx config has NO Cache-Control headers for ANY files, including sw.js and manifest.json
  implication: Service worker file (sw.js) is being served with default nginx caching headers, which likely includes aggressive caching. Browsers cache sw.js and never check for updates.

- timestamp: 2026-02-05T00:01:30Z
  checked: vite.config.ts PWA configuration
  found: registerType is "autoUpdate" and workbox config looks reasonable
  implication: The VitePWA plugin should generate a service worker that auto-updates, but this only works if the browser can detect a new sw.js file

- timestamp: 2026-02-05T00:02:00Z
  checked: main.tsx service worker registration
  found: Has updateSW(true) in onNeedRefresh callback, which forces immediate update
  implication: This is correct, but onNeedRefresh only fires when a new service worker is detected. If browser never re-fetches sw.js, this callback never fires.

- timestamp: 2026-02-05T00:03:00Z
  checked: Service worker detection mechanism
  found: VitePWA with registerType "autoUpdate" relies on browser periodically checking sw.js for updates. Standard PWA behavior: browser checks sw.js every 24 hours or on navigation. But if sw.js is cached with long expiry, browser never makes the network request.
  implication: Root cause identified - nginx must serve sw.js and manifest.webmanifest with "Cache-Control: no-cache" or "max-age=0" headers

## Resolution

root_cause: nginx serves sw.js and manifest.webmanifest without proper Cache-Control headers. Default nginx behavior allows browsers to cache these files for extended periods. When a new build is deployed with updated sw.js, the browser never checks the server because it trusts its cached version. PWA auto-update mechanism (registerType: "autoUpdate") depends on the browser detecting a byte-difference in sw.js, which only happens if the browser makes a network request for it.
fix: Modified Dockerfile to add nginx location blocks with proper Cache-Control headers:
  - sw.js: "no-cache, no-store, must-revalidate" (always fetch from server)
  - manifest.webmanifest: "no-cache, no-store, must-revalidate" (always fetch from server)
  - workbox-*.js: "no-cache, no-store, must-revalidate" (always fetch from server)
  - index.html: "no-cache" (revalidate on each load)
  - Static assets (js/css/images): "public, immutable" with 1 year cache (Vite uses content hashes)
verification: Testing nginx config syntax and examining generated config
files_changed: ['Dockerfile']
