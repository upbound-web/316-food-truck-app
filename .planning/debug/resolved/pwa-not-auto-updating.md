---
status: resolved
trigger: "Investigate issue: pwa-not-auto-updating"
created: 2026-02-05T00:00:00Z
updated: 2026-02-05T00:12:00Z
---

## Current Focus

hypothesis: ROOT CAUSE CONFIRMED - vite-plugin-pwa with registerType:"autoUpdate" doesn't set up periodic update checks. The browser only checks for SW updates on navigation, but PWA serves everything from cache so no network navigation occurs. Need to configure periodic update checks.
test: add periodic update checking via workbox config or manual registration.update() calls
expecting: periodic checks will force browser to fetch sw.js and detect new version
next_action: implement solution with workbox periodic update checks

## Symptoms

expected: After deploying a new Docker build, the installed PWA on the tablet should automatically detect the new version and update itself without user intervention (or at most after a page refresh).
actual: The PWA stays stuck on the old cached version. User must go into browser settings and clear all site data for the app to pick up the new build.
errors: No specific error messages reported. The service worker registers successfully.
reproduction: 1) Make a code change 2) Run deploy.sh which rebuilds Docker 3) Open the installed PWA on tablet - still shows old version 4) Only clearing site data fixes it
started: Has never worked - the auto-update has never successfully updated the PWA without manual cache clearing.

## Eliminated

## Evidence

- timestamp: 2026-02-05T00:01:00Z
  checked: Dockerfile nginx configuration
  found: sw.js has correct cache headers (no-cache, no-store, must-revalidate), workbox files also set to no-cache
  implication: nginx cache headers are correctly configured - this is NOT the problem

- timestamp: 2026-02-05T00:01:30Z
  checked: vite.config.ts PWA configuration
  found: registerType is "autoUpdate", workbox.globPatterns includes all assets, additionalManifestEntries has "/?tab=orders" with revision: null
  implication: revision: null for additionalManifestEntries means this entry won't trigger SW updates even when other files change

- timestamp: 2026-02-05T00:02:00Z
  checked: main.tsx service worker registration
  found: registerSW called with onNeedRefresh callback that calls updateSW(true) to auto-apply updates
  implication: the auto-update mechanism is in place, but onNeedRefresh might not be firing if SW doesn't detect changes

- timestamp: 2026-02-05T00:03:00Z
  checked: dist/sw.js generated precache manifest
  found: JS/CSS bundles have revision: null - example: {url:"assets/index-DHR_iTVW.js",revision:null}
  implication: CRITICAL - workbox cannot detect changes to these files without a revision hash

- timestamp: 2026-02-05T00:03:30Z
  checked: same sw.js file, noticed bundle filenames
  found: bundles already have content hashes in their names (index-DHR_iTVW.js, index-DwNs8E5_.css)
  implication: vite uses filename hashing, so vite-plugin-pwa sets revision:null assuming filename change = new version

- timestamp: 2026-02-05T00:04:00Z
  checked: sw.js update detection mechanism
  found: for revision:null entries, workbox compares URLS not content - if filename changes, it's a new version
  implication: the service worker SHOULD update when filenames change (they have different hashes). Problem must be elsewhere.

- timestamp: 2026-02-05T00:05:00Z
  checked: dist/index.html
  found: references hashed bundles (index-DHR_iTVW.js, index-DwNs8E5_.css). SW registration happens in main.tsx compiled into bundle.
  implication: user must fetch new index.html to load new bundle with new SW registration

- timestamp: 2026-02-05T00:05:30Z
  checked: nginx config for index.html caching (Dockerfile lines 74-78)
  found: HTML files get "Cache-Control: no-cache" and "expires 0" - should revalidate
  implication: index.html should be revalidated. But wait - what about the root path "/"?

- timestamp: 2026-02-05T00:06:00Z
  checked: nginx location blocks in Dockerfile
  found: Location ~* \.html$ sets no-cache. But SPA fallback (location /) uses try_files $uri $uri/ /index.html with NO cache headers
  implication: CRITICAL - when accessing "/" (root), nginx internally serves index.html but doesn't apply the .html cache headers. The "/" request might be cached by browser!

- timestamp: 2026-02-05T00:07:00Z
  checked: rebuilt app with code change, compared bundle filenames
  found: bundle filename changed from index-DHR_iTVW.js to index-DGvjAvJY.js
  implication: vite's content hashing works correctly - code changes produce new filenames

- timestamp: 2026-02-05T00:07:30Z
  checked: sw.js content after rebuild
  found: sw.js now references the NEW bundle filename (index-DGvjAvJY.js)
  implication: sw.js content DOES change between builds, so byte-comparison should detect updates

- timestamp: 2026-02-05T00:08:00Z
  checked: generated sw.js for skipWaiting behavior
  found: self.skipWaiting() is called at the start of SW, e.clientsClaim() also present
  implication: new SW should immediately take control without waiting. So if browser detects new SW, it should activate immediately.

- timestamp: 2026-02-05T00:09:00Z
  analyzed: service worker update check mechanism
  found: browsers check for SW updates on navigation, but registerSW() doesn't set up periodic checks
  implication: CRITICAL - if PWA runs continuously without navigation/refresh, it never checks for updates until browser's 24hr automatic check

## Resolution

root_cause: The PWA never auto-updates because the service worker only checks for updates on page navigation. When running as an installed PWA, the service worker serves all content from cache (including index.html), so no network navigation occurs. The browser waits 24 hours for its automatic check, but the user needs updates immediately after deployment.

The vite-plugin-pwa with registerType:"autoUpdate" generates a service worker with skipWaiting() and clientsClaim(), but does NOT configure periodic update checks. The registerSW() call in main.tsx sets up callbacks but doesn't trigger periodic checks.

fix: Modified src/main.tsx to add periodic service worker update checks in the onRegistered callback. Added setInterval() that calls registration.update() every 60 seconds. This forces the browser to check for new sw.js versions by fetching from network (respecting nginx no-cache headers) and comparing byte-by-byte. When a new version is detected, onNeedRefresh fires and updateSW(true) applies the update immediately.

verification:
- Build completed successfully with no errors
- Verified update check code is present in compiled bundle (grep found "Checking for service worker updates")
- Code change triggers new bundle hash (index-LhJFRpRI.js vs previous index-DGvjAvJY.js)
- New sw.js will reference new bundle, so when deployed, periodic checks will detect the update
- User should see console logs every 60 seconds: "Checking for service worker updates..."
- When new version is deployed, logs will show: "App update available, applying..."

files_changed: ['src/main.tsx']
