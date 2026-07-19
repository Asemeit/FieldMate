# FieldMate PWA - Developer Handoff Documentation

Welcome to **FieldMate**, a Progressive Web Application (PWA) designed to aid smallholder farmers with crop leaf disease diagnostic tracking. This document is a comprehensive engineering handoff manual providing future developers with structural context, architectural decisions, core algorithms, storage schemas, and local operational guides.

---

## 1. Executive Summary & Purpose

FieldMate serves farmers, particularly those in remote, limited-literacy, or low-connectivity agricultural areas. 
- **Core Functionality:** Farmers upload or capture leaf photos of distressed crops. The system analyzes leaf markings (using Claude Vision API or a high-fidelity offline simulation) to return actionable treatment and prevention recommendations.
- **Accessibility:** Highly accessible UI with touch-safe tap targets, a bottom mobile navbar, and a **Bilingual Web Speech Assistant** that vocalizes instructions and recommendations in Swahili or English.
- **Offline Reliability:** Auto-cached static assets, offline mock advisory rules, cached weather reports, local data caching in IndexedDB, and automatic background synchronization when network connections recover.

---

## 2. Technology Stack & Key Libraries

- **Frontend Library:** React 19 + TypeScript (strict types enabled).
- **Build Engine & Bundler:** Vite 8.
- **Styling framework:** Tailwind CSS v3 + PostCSS (configured with an agricultural Emerald/Forest Green theme and responsive touch utility overrides).
- **Navigation Routing:** React Router v7.
- **Icons Library:** Lucide React (agricultural, environment, and general navigation vectors).
- **Database Engine:** Native browser IndexedDB (wrapped inside a custom typed Promise-based singleton service).
- **Speech Engine:** Web Speech API (`window.speechSynthesis`).
- **External Interfaces:**
  - **Open-Meteo API:** High-resolution free public meteorological forecasting.
  - **Anthropic Claude Messages API:** High-precision Claude 3 Haiku / Claude 3.5 Sonnet visual diagnostic analysis.
- **PWA Compilation Plugin:** `vite-plugin-pwa` (handles manifest.webmanifest creation, Workbox service worker injections, and automatic static file precaching).

---

## 3. Directory Layout

The codebase utilizes a highly organized, modular folder hierarchy:

```text
fieldwork/
├── index.html                 # SEO meta, PWA viewport settings, Google fonts
├── package.json               # Package definitions and compiler scripts
├── vite.config.ts             # PWA precaching strategies and webmanifest options
├── tailwind.config.js         # Custom forest/emerald color palette tokens
├── postcss.config.js          # Tailwind compilation loader
├── tsconfig.app.json          # TS compilation configurations (strict parameters)
├── public/
│   ├── icon-192x192.png       # Manifest Launcher icon
│   └── icon-512x512.png       # HD Manifest launcher / splash branding
└── src/
    ├── main.tsx               # Entry hook mounting App to DOM #root
    ├── App.tsx                # Client-side router table and ProtectedRoute guards
    ├── index.css              # Custom animation styles, mobile scrollbar hides
    ├── types/
    │   └── index.ts           # Shared TypeScript interfaces (Diagnosis, Weather, Settings)
    ├── context/
    │   └── AppContext.tsx     # Centralized state provider (language, auth, sync, TTS, toasts)
    ├── components/
    │   ├── Layout.tsx         # Top brand bar, network banners, bottom navigation links
    │   └── VoicePlayer.tsx    # glowing voice reader widgets with animated equalizers
    ├── services/
    │   ├── db.ts              # Local IndexedDB database client
    │   ├── speech.ts          # Speech synthesis engine and localized voice lookups
    │   ├── weather.ts         # Open-Meteo client computing blight/rust crop risks
    │   ├── claude.ts          # Claude client & comprehensive offline mock data
    │   └── sync.ts            # Online network listeners for background sync
    └── pages/
        ├── LandingPage.tsx    # Branding welcomer & Android install prompt trigger
        ├── LoginPage.tsx      # Secure access portal (offline simulated)
        ├── RegisterPage.tsx   # Sign-up page
        ├── ForgotPassword.tsx # Retrieve account portal
        ├── DashboardPage.tsx  # Greet banner, live crop risk details, recent list
        ├── DetectPage.tsx     # Active crop grids, file previews, scanning overlays
        ├── ResultsPage.tsx    # Confidence metrics, danger status tags, advisory lists
        ├── WeatherPage.tsx    # detailed weather gauges, bacterial risk warnings
        ├── HistoryPage.tsx    # Local history queries, crop icons, pending sync checkmarks
        └── SettingsPage.tsx   # Swahili switcher, voice speed sliders, DB purgers
```

---

## 4. Architectural Core & Code Design

### A. IndexedDB local storage (`src/services/db.ts`)
The storage client opens `FieldMateDB` (v1) and initializes three structured object stores:
1. **`diagnoses` Store:** Keyed by a unique `id`. Holds the crop type, identified disease, base64 image string, confidence score, treatment arrays, timestamp, and a `syncStatus` marker. 
   - *Index 1:* `timestamp` (used to query history in reverse-chronological order).
   - *Index 2:* `syncStatus` (used to quickly fetch unsynced pending diagnoses for upload).
2. **`weather` Store:** Keyed by `location` name. Caches the latest Open-Meteo report so the farmer's dashboard can render weather telemetry immediately while offline.
3. **`settings` Store:** Keyed by preference parameter `key` (saves system language `en`/`sw`, custom API keys, TTS speed rates, active user session details, and notification toggles).

### B. Dynamic Weather Risk Calculations (`src/services/weather.ts`)
The `weatherService` fetches live temperature, humidity, rainfall, and wind speeds. It then runs a custom agricultural algorithm to assess fungal and bacterial leaf disease outbreak risks:
- **Incubation incubation zone:** Relative humidity $\ge 75\%$ coupled with warm temperatures in the range $[18, 29]^\circ\text{C}$ indicates optimal conditions for fungal spores.
- **Disease risk output:** 
  - **High Risk:** Triggered when the warm temperature window coincides with relative humidity above 75%. Generates a critical blight/rust warning: *"CRITICAL ALERT: Warm temperatures and high humidity create a severe breeding zone..."*
  - **Medium Risk:** Triggered if humidity is moderate ($60\% - 75\%$) or temperature is warm. Generates a moderate leaf blight warning.
  - **Low Risk:** Favorable dry/cold conditions that restrict spore growth.
- **Offline Resilience:** If the network fetch fails, the service queries IndexedDB for the last cached report. If the cache is empty, it returns a safe preloaded Eldoret, Kenya forecast.

### C. Bilingual Web Speech Synthesis (`src/services/speech.ts`)
Controls text-to-speech (TTS) readouts. It strips out Markdown markers (stars, hashes, brackets) from the diagnostics before reading to keep the speech fluent and clear.
- **Localized Voice discovery:**
  - **English:** Looks for `en` system voices, prioritizing high-fidelity Google engines.
  - **Swahili:** Scans for `sw` system voices (e.g. `sw-TZ` or `sw-KE`). If missing, it falls back to standard Google English engines, which read Swahili phonetically with high legibility.
- **Throttling rates:** Speed is set slightly slower by default ($0.9\text{x}$) to assist farmers, and is adjustable in settings between $0.5\text{x}$ and $2.0\text{x}$.

### D. Claude Vision API Client & Simulation Fallbacks (`src/services/claude.ts`)
Provides the AI service layer. When a farmer triggers a leaf scan:
1. **API Key detection:** If an Anthropic API Key is saved in Settings, the app initiates a direct client-side fetch call to Anthropic's secure message endpoint (`https://api.anthropic.com/v1/messages`).
   - *Model:* `claude-3-haiku-20240307` (selected for its speed, low cost, and high visual accuracy).
   - *Payload:* Passes the crop type, a Base64-encoded leaf photo, and a specific system prompt instructing Claude to respond **strictly** with a pre-validated JSON structure mapping English and Swahili diagnosis telemetry.
2. **Interactive Simulation Mode:** If the API key field is empty, the user is offline, or the network request fails, the service automatically engages a high-fidelity **Advisory Simulation**.
   - It maintains a preloaded database containing comprehensive, localized symptoms, causes, treatments, and prevention guidelines for 5 crops (Maize, Potato, Tomato, Wheat, Beans) and 6 severe crop diseases.
   - It simulates scanning latency for $2.5\text{s}$ (triggering the glowing green laser animation in the UI) before returning a detailed result. This ensures the app is immediately usable for training and demonstrations.

### E. Offline Sync Daemon (`src/services/sync.ts`)
Registers window `online` listeners:
- If an analysis is run while offline, the diagnosis is saved in IndexedDB with `syncStatus: 'pending'`.
- As soon as the device reconnects to a network, the sync service awakens in the background, uploads the image to Claude using the saved API key, updates the records in IndexedDB with the actual diagnosis outputs, sets the status to `synced`, and fires system-wide context events to notify the user.

---

## 5. Global State Architecture (`src/context/AppContext.tsx`)

Coordinates global hooks across pages:
- **`language`:** Handles swapping between English ('en') and Kiswahili ('sw'), updating local settings and triggering immediate voice translation.
- **`isOnline` / `isSyncing`:** Monitors real-time network states.
- **`toast`:** Triggers beautiful, self-dismissing feedback banners at the top of the UI.
- **`speechState`:** Monitors whether the synthesis engine is `'playing'`, `'paused'`, or `'stopped'`, coordinating wave pulses on the voice advisory cards.
- **`diagnosesHistory`:** Aggregates IndexedDB records, providing real-time UI updates when items are synced, created, or deleted.

---

## 6. Progressive Web App (PWA) Configurations

Compiled via the Vite PWA plugin. The configurations are specified in `vite.config.ts`:
- **Display Mode:** `standalone` (mobile app frame, hides address bars).
- **Orientation:** `portrait`.
- **Precached Assets:** Caches all generated bundles, static images, local fonts, and standard layouts.
- **Runtime API Caching:** 
  - Caches `https://api.open-meteo.com/v1/forecast...` calls using a **NetworkFirst** strategy with a 1-hour expiration. This ensures that weather data remains visible offline.
  - Caches Google Web Fonts via a **CacheFirst** strategy with a 1-year expiration.
- **Icons Mapping:** Point to `icon-192x192.png` and `icon-512x512.png` located inside the `public/` directory (both have maskable attributes active).

---

## 7. Developer Operations & Build Checklist

To run or build the application, utilize the following Node/NPM scripts:

### A. Environment Configuration
To execute commands on Windows machines where the system environment path doesn't point to Node.js automatically, prepend the path locally in PowerShell:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

### B. Development Server
Launches a hot-reloading development server on `localhost`:
```bash
npm run dev
```

### C. TypeScript Type Validation
Inspects the TypeScript files for compiler safety:
```bash
npm run tsc
```

### B. Production Bundle Compilation
Compiles all TS modules, compiles Tailwind CSS utilities, creates the PWA manifest, and injects the precached Workbox service worker:
```bash
npm run build
```

---

## 8. Development Roadmap & Next Steps

Future developers looking to expand FieldMate's capabilities should consider the following high-priority milestones:
1. **Camera Leaf Outline Masks:** Implement a dynamic SVG stencil/outline mask overlay on the camera capture preview (e.g., a dashed leaf-shaped boundary) to guide farmers in taking clear, centered leaf photos.
2. **Offline ML Integration:** Compile a lightweight TensorFlow.js or ONNX model directly inside the PWA (`src/services/onnx.ts`) to run basic leaf segmentation and healthy-vs-diseased classifications entirely on-device, bypassing API key requirements.
3. **Local PDF Advisory Export:** Integrate `jspdf` to compile a beautiful, localized PDF advice sheet (combining the crop photo, weather logs, and Claude's treatment rules) so farmers can print or share records via WhatsApp.
4. **Geolocation Geotagging:** Utilize `navigator.geolocation` during leaf scans to save coordinates in IndexedDB. This would enable a future regional outbreak map of blights and rusts.
