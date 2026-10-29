## v1.0.0 - Complete Modern Environment

**DevWorkspace Pro** yanzu cikakken environment ne na gaskiya:

| Fasali | Bayani |
|---|---|
| **VERSIONS** (git-like) | Commit snapshots (har 50), restore, line-diff view, delete - a bottom panel tab |
| **Device frames** | Preview: Desktop / iPhone SE / iPhone 14 / Pixel 7 - test websites kamar app |
| **Auto-refresh preview** | Yana sabunta yayin rubutawa |
| **Format code** | HTML/CSS/JS formatter (js-beautify) - toolbar button |
| **Smart preview** | Duk local `href`/`src` (assets/css, assets/js...) suna inlining kai tsaye |
| **Full search** | Content + filename matching |
| Production | CSP, PWA install, error monitoring, CI/CD, DEPLOYMENT.md |

Duk wani project na **website ko mobile app** (PWA -> APK via PWABuilder/Capacitor) - duba DEPLOYMENT.md.

## Production Ready (v0.5.0)

- **Security**: CSP meta headers, referrer policy, XSS-safe rendering (textContent), HTTPS-only features
- **Error monitoring**: global error/unhandledrejection handlers -> log panel
- **PWA**: install prompt button, service-worker update notification, offline shell
- **CI/CD**: `.github/workflows/ci.yml` (typecheck + build + backend tests + dist artifact)
- **Config**: `backend/.env.example`, `DEPLOYMENT.md` (cikakken deployment guide)
- **Meta fixes**: viewport-fit, color-scheme, robots.txt

## Settings - General (v0.3.8)

Sashe **Settings** (ikon gear a topbar) yana da tab ɗin **General**:

| Saiti | Bayani |
|---|---|
| Theme | Dark / Light / **System** (yana bin saitin wayar/computer ɗinka) |
| Language | English / Hausa / العربية (RTL) |
| Font size | 10-28 (Monaco) |
| Font family | Fira Code, Consolas, Monaco, Cascadia Code... |
| Tab size | 2 / 4 / 8 |
| Word wrap | On/Off |
| Minimap | On/Off (default: off a wayar hannu) |
| Line numbers | On/Off |
| Auto-save | Adana kai-tsaye bayan canje-canje |
| **Danger zone** | Reset workspace - share duka ayyuka + saituna + reload |

Duk saituna ana adana su a `localStorage` (`dwp-settings-v1`) kuma suna aiki nan take.

## Mobile Layout (v0.3.6)

- **Drawer scrim** - mai launi ko ba a bu\u0257e sidebar ba (overlay) yana rufewa idan ka ta\u0253a waje.
- **Panel toggle** - danna panel tab mai aiki (OUTPUT/TERMINAL) a \u0199asa\u0257aya - panel zai rufe ya \u2019yantu filin editor.
- **Panel 48vh** a wayar hannu (ba 145px ba), safe-area insets, viewport-fit=cover.

## Ingantaccen Fasali (v0.3.4)

- **Harsuna 3 + RTL** - English / Hausa / \u0627\u0644\u0639\u0631\u0628\u064a\u06d4 Za\u025bi daga topbar (EN/HA/\u0639), yana adana a localStorage kuma yana juyawa tsari zuwa RTL.
- **Rename project** - \u0253anna ikon fensir a kan project mai aiki a explorer.
- **Duplicate project** - kwafi project gaba \u0257aya (files + folders) daga ikon kwafi.
- Tree rows yanzu suna amfani da `padding-inline-start` don **RTL** support.

## Yadda Ake Aiki da Source (app.ts -> main.js)

- **`frontend/app.ts`** = source of truth (edit wannan file kawai).
- **`frontend/main.js`** = fassarar JS da aka samu daga app.ts. **Wannan shine file browser ke ɗauka** — kuma yana aiki a **kowane static host ba tare da build ba** (GitHub Pages, Firebase Hosting, Android WebView, shared hosting...).
- Bayan ka gyara `app.ts`, gudanar: `npm run build:js` (yana amfani da esbuild da Vite ya kawo, babu buƙatar install na ƙari).
- Ko ka bar `main.js` kamar yadda yake — shigo da kansa yana aiki.

```bash
npm install
npm run dev        # development (Vite)
npm run build:js   # app.ts -> main.js
npm run build      # typecheck + main.js + dist bundle
npm run backend    # API server (port 8787)
```


## File Explorer Management (v0.3.2)

- **Projects section** a kan sidebar — duba, switch, share, da \u0199ir\u0199irar sabon project.
- **New Project dialog** — za\u025bi template (Blank / Website / Firebase App / Admin Dashboard); kowane template yana \u0199ir\u0199irar tsarin files (index.html, about.html, contact.html, assets/css/styles.css, assets/js/main.js, assets/images, README.md).
- **Real folders** — \u0199ir\u0199iri, rename, share folder (tare da dukkan files a ciki); \"New file in this folder\" daga kowane folder.
- **ZIP Import** yanzu yana \u0199ir\u0199irar sabon project (ba ya maye gurbin na yanzu).

## Gyara / Fixes (v0.3.1)

- `frontend/app.ts` is now the **single source of truth** (full 635-line app). Dead duplicate `frontend/main.js` removed; `index.html` loads `/frontend/app.ts` and Vite compiles it (dev + build).
- **Service worker registered** (`navigator.serviceWorker.register('./sw.js')`), skipped on Vite dev ports (5173/5174) to avoid stale caches. Removed unused duplicate root `sw.js`; `public/sw.js` cache bumped to v3.
- `npm run build` now **type-checks** (`tsc --noEmit`) before bundling; new `npm run typecheck` script.
- Removed unused `monaco-editor` npm dependency (Monaco loads from CDN via `loader.js`).

# DevWorkspace Pro

DevWorkspace Pro is a web-first software workspace project. This archive includes the frontend, a Node.js API backend, Supabase database migrations, and setup notes.

## Important: GitHub Pages limitation

GitHub Pages can host static frontend files only. It does **not** run the Node.js backend or securely host backend environment variables. The frontend can be published on GitHub Pages, but API routes and backend features will not work until the backend is deployed to a Node.js-capable host and configured.

## Project contents

- `index.html` — application entry page
- `frontend/` — frontend source files
- `backend/` — Node.js API and tests
- `supabase/migrations/` — database/RLS SQL migrations
- `SUPABASE-DATABASE-SETUP.md` — database setup notes
- `backend/.env.example` — backend environment variable template

## Upload this project to GitHub from Android

1. Download and extract this ZIP on your phone using a file manager that supports ZIP extraction.
2. Open the repository: https://github.com/au773047-cyber/DevWorkspace-Pro
3. Use **Add file → Upload files** if the option is available in your browser.
4. Upload the *contents* of the extracted `devworkspace-pro-milestone-3` folder (not the ZIP itself), preserving the folder structure.
5. Commit the upload to the `main` branch.
6. In GitHub, open **Settings → Pages** and confirm the intended deployment source/branch. GitHub Pages does not execute `backend/`.

If uploading many files on mobile is difficult, use GitHub's browser interface in desktop mode or upload in smaller batches while preserving paths.

## Configure Supabase and backend

1. Review `SUPABASE-DATABASE-SETUP.md`.
2. Apply the SQL migrations to the correct Supabase project after reviewing them.
3. Deploy `backend/` to a Node.js host.
4. Set backend environment variables using the host's secret/environment settings:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `CORS_ORIGIN`
   - `PORT` (if required by the host)
5. Never put a Supabase service-role key or other server secret in frontend files or commit it to GitHub.
6. Update the frontend API configuration to the deployed backend URL, if needed.

## Verification status

This is a source package, not a claim that every production feature is deployed. After uploading, verify the GitHub Pages build, run backend tests, configure the real Supabase project, and test authentication and database access before treating the app as production-ready.
