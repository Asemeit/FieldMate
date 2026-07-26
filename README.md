# FieldMate

**AI-enabled crop disease advisor for smallholder farmers**

FieldMate is a mobile-first Progressive Web App (PWA) built for farmers in **Uasin Gishu County, Kenya**. Farmers photograph crop leaves to identify diseases, get bilingual treatment advice (English & Kiswahili), check weather-related outbreak risk, and keep scan history offline.

**Repository:** [github.com/Asemeit/FieldMate](https://github.com/Asemeit/FieldMate)

---

## Features

### For farmers
- **Leaf disease detection** — on-device TensorFlow.js model (PlantVillage-trained) for maize, potato, and tomato
- **Advisory fallbacks** — optional Claude Vision API, or built-in disease knowledge base (demo mode)
- **Bilingual UI & voice** — English / Kiswahili guidance for low-literacy users
- **Weather & disease risk** — Open-Meteo climate data for Eldoret / Uasin Gishu
- **Scan history & PDF reports** — save diagnoses locally and export printable advice
- **Offline-first PWA** — IndexedDB storage; installable on phone home screen
- **Secure auth** — register / login / forgot password with hashed passwords

### For administrators
- **User management** — view, edit, reset password, and delete farmer accounts
- **Disease catalog** — add, edit, or remove crop disease advisories used by the app
- **Reports dashboard** — scans by crop, disease, severity, and time range; export PDF summary
- **Enrolment & backup** — register Uasin Gishu pilot farmers; export/import JSON backups
- **Optional Claude API key** — enable live AI analysis when online

---

## Tech stack

| Layer | Technology |
|--------|------------|
| UI | React 19, TypeScript, Tailwind CSS, Vite |
| Routing | React Router |
| ML | TensorFlow.js (browser inference) |
| Storage | IndexedDB (`FieldMateDB`) |
| PWA | `vite-plugin-pwa` (service worker + install prompt) |
| Weather | Open-Meteo API |
| Reports | jsPDF |
| Deploy | Vercel (static SPA) |

---

## Getting started

### Requirements
- Node.js 18+ (20+ recommended)
- Chrome recommended for camera / PWA demos

### Install & run

```bash
git clone https://github.com/Asemeit/FieldMate.git
cd FieldMate
npm install
npm run dev
```

Open **http://localhost:5173**

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Admin access

Administrator role is granted to configured emails in `src/config/admin.ts`.

After logging in as admin, open **Settings → Administrator Panel** for:

1. **Overview** — enrolment, backup, API key  
2. **Users** — manage farmer accounts  
3. **Diseases** — manage advisory catalog  
4. **Reports** — analytics + PDF export  

> Accounts and scan history live in the **browser** (IndexedDB). After deploying or switching devices, use **Export Backup** / **Import Backup** so demo data travels with you.

---

## Deploy to Vercel

1. Push this repo to GitHub (already at [Asemeit/FieldMate](https://github.com/Asemeit/FieldMate)).
2. Import the project in [Vercel](https://vercel.com).
3. Settings:
   - **Framework:** Vite  
   - **Build command:** `npm run build`  
   - **Output directory:** `dist`  
4. Deploy. SPA routing is handled by `vercel.json`.

Or from the CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Install as an app (PWA)

1. Open the live (or `npm run preview`) URL in Chrome on phone or desktop.  
2. Use **Install** / **Add to Home Screen**.  
3. FieldMate opens fullscreen like a native app and can work offline for cached assets and local data.

---

## Project structure (high level)

```
src/
  pages/          # Landing, auth, dashboard, detect, weather, admin, …
  services/       # Auth, ML, disease catalog, weather, PDF, backup
  data/           # Built-in disease knowledge base
  config/         # Pilot region + admin emails
  context/        # App state (user, language, history, settings)
public/
  models/         # TensorFlow.js plant-disease model shards
```

---

## Documentation

| File | Contents |
|------|----------|
| [LECTURER_DEMO.md](./LECTURER_DEMO.md) | 5–7 minute demo script |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Data model / ERD notes |
| [PROJECT_IMPLEMENTATION_CHAPTER.md](./PROJECT_IMPLEMENTATION_CHAPTER.md) | Implementation write-up |
| [DEVELOPER_HANDOFF.md](./DEVELOPER_HANDOFF.md) | Handoff notes |
| [SEED_USERS_GUIDE.md](./SEED_USERS_GUIDE.md) | Pilot farmer enrolment |
| [ML_COLAB_SCREENSHOT_GUIDE.md](./ML_COLAB_SCREENSHOT_GUIDE.md) | ML training screenshots guide |

---

## Pilot context

- **Region:** Eldoret, Uasin Gishu County, Kenya  
- **Focus crops:** Maize, potato, tomato (ML); wheat & beans (advisory database)  
- **Goal:** Fast, offline-capable disease advice for smallholder farmers  

---

## License

Academic / student project — All rights reserved unless otherwise stated by the author.

---

## Author

Built as a final-year / project demonstration system for crop disease advisory in Kenya’s Rift Valley.

**GitHub:** [Asemeit/FieldMate](https://github.com/Asemeit/FieldMate)
