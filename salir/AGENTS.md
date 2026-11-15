# Salir: canonical GitHub Pages application

The user chose casasdeharobtt.es/salir/ as the public address. This folder is independent of the club homepage. The user requested a visible Salir link in the club navigation in version 1.5. Keep it in the desktop and mobile menus. Its URL is public, not password protected. Preserve other publication settings unless the user requests changing them.

Increment VERSION for each user-visible release, then run `node tools/build-salir.mjs` from the repository root. Versions began at 1.0; this migration is 1.4. Keep the version badge and By Miguel Castillo Perona author line visible.

All local assets must resolve inside /salir/. The manifest id and service worker must stay scoped to this app. Delete only salir-shell-* caches, never the club's caches. Do not register /sw.js from this app. Keep the root club worker's /salir/ exclusion.

Weather and city search use Open-Meteo directly from the browser. Current GPS locality names use BigDataCloud reverse-geocode-client directly from the browser, only following a successful fresh device geolocation, never for route or stored coordinates; shared-server queries returned upstream 429s. Radar is recent RainViewer imagery, not a future forecast. Recommendations use the existing combined conditions score and the user's saved hours/duration; retain those behaviors unless requested otherwise.

Validate with `node --test tools/salir-tests/*.test.mjs`. Files in this folder are the source and the published static assets. Do not upload ZIPs, secrets, .openai project metadata, or the obsolete server worker. No build or DNS change is needed to publish this folder through the club's existing GitHub Pages setup.

