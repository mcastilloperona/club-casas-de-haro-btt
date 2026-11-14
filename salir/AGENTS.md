# Salir: canonical GitHub Pages application

The user chose casasdeharobtt.es/salir/ as the public address. This folder is independent of the club homepage. Keep it absent from club navigation and sitemap until the user requests a visible link. Its URL is public, not password protected. Keep the noindex meta directive while it is unlisted.

Increment VERSION for each user-visible release, then run `node tools/build-salir.mjs` from the repository root. Versions began at 1.0; this migration is 1.4. Keep the version badge and By Miguel Castillo Perona author line visible.

All local assets must resolve inside /salir/. The manifest id and service worker must stay scoped to this app. Delete only salir-shell-* caches, never the club's caches. Do not register /sw.js from this app. Keep the root club worker's /salir/ exclusion.

Weather and geocoding use Open-Meteo directly from the browser; shared-server queries returned upstream 429s. Radar is recent RainViewer imagery, not a future forecast. Recommendations use the existing combined conditions score and the user's saved hours/duration; retain those behaviors unless requested otherwise.

Validate with `node --test tools/salir-tests/*.test.mjs`. Files in this folder are the source and the published static assets. Do not upload ZIPs, secrets, .openai project metadata, or the obsolete server worker. No build or DNS change is needed to publish this folder through the club's existing GitHub Pages setup.
