# DevWorkspace Pro - Production Deployment Guide

Cikakken jagorar sanya **DevWorkspace Pro** a production (gaskiya).

## 1. Tsarin Aiki (Architecture)

```
Browser (PWA)  --->  Static hosting (frontend)
      |                     |
      +---> Supabase (auth, DB, RLS)
      +---> Backend API (optional: cloud projects sync) ---> Supabase
```

## 2. Abin da Kake Buƙata

- **Supabase project** (free tier ya isa): auth + PostgreSQL + RLS
- **Frontend hosting**: Netlify / Vercel / Firebase Hosting / GitHub Pages / VPS
- **Backend hosting** (optional): Render / Railway / Fly.io / VPS
- **Domain + HTTPS** (Let's Encrypt / hosting provider)

## 3. Supabase Setup (Muhimmiya)

1. https://supabase.com -> New project
2. **SQL Editor**: run migrations a `supabase/migrations/`
3. **Authentication**: enable Email; add site URL + redirect URLs
4. **Row Level Security**: tabbatar RLS yana KUNNE a duk tables — publishable key ba secret ba ne, amma RLS ke tsaro
5. Project Settings -> API: kwafi `URL`, `publishable` (anon) key

## 4. Frontend Deployment

Duk hosting na static zai iya:

```bash
npm install
npm run build   # typecheck + main.js + dist/
# upload dist/ ko root files
```

**Netlify / Vercel**: drag & drop `dist/` (ko connect repo — CI yana build kai tsaye)
**Firebase Hosting**: `firebase init hosting` -> `public: dist` -> `firebase deploy`
**GitHub Pages**: settings -> Pages -> deploy from branch (root ko /dist via gh-pages)

### Environment (frontend)
Supabase config yana cikin `frontend/main.js` (publishable key — ABIN HALARTA ne a fili, amma KADA ka sanya service-role key a frontend). Don gina da key daga env, yi build tare da string replacement (CI).

## 5. Backend Deployment (Optional)

```bash
cd backend
cp .env.example .env   # cika saitunan Supabase + CORS_ORIGIN (domain ɗinka!)
npm install
npm start
```

- **Render/Railway**: New Web Service -> repo -> build `npm install`, start `node src/server.js`, add env vars
- **VPS**: `pm2 start src/server.js` + nginx reverse proxy + HTTPS (certbot)

**Security**: `CORS_ORIGIN` = domain ɗinka kacal. `SERVICE_ROLE_KEY` kafin backend kacal.

**Shell terminal**: ba a bayar da shi ba a wannan sigar (an cire `/api/terminal` don tsaro). Gudanar da umarni yana buƙatar kwantena mai keɓe (sandbox) kafin a sake ƙara shi.

**Env vars na backend**: `CORS_ORIGIN` (dole, exact origin ɗin frontend, babu `*`), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `TRUST_PROXY=true` idan kana bayan proxy/load balancer, `RATE_LIMIT_PER_MIN`, `MAX_FILES_PER_PROJECT`, `MAX_PROJECTS_PER_USER`. Duba `backend/.env.example`.

## 6. PWA + Offline

- `public/sw.js` + `manifest.json` suna aiki da kansu a production
- Users za su iya installing app (Add to Home Screen)
- Sabuwar version -> SW yana update, user yana reload

## 7. Security Checklist

- [x] CSP meta a `index.html` (ida ka ƙara domain na bakar fata, ƙara shi a CSP)
- [x] `toast`/`log` suna amfani da `textContent` (babu XSS)
- [ ] HTTPS kawai a production
- [ ] RLS kunne a Supabase
- [ ] Rotate keys idan aka sake setup
- [ ] Backend `CORS_ORIGIN` restricted

## 8. Monitoring & Backup

- **Logs**: app yana kwakwalwa output panel; backend yana console
- **Backup**: kowane project zaka iya **Export ZIP** (file explorer)
- **Errors**: global handlers suna aika errors zuwa log panel

## 9. CI/CD

`.github/workflows/ci.yml` — kowane push:
typecheck -> build -> backend tests -> upload `dist/`

Don auto-deploy: ƙara `peaceiris/actions-gh-pages` ko Netlify/Vercel action.
