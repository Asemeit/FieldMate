# CHAPTER 7: IMPLEMENTATION (PROTOTYPE FRAMEWORK)

> **Word document:** Open `FieldMate_Chapters_7_to_9.docx` in Microsoft Word (Times New Roman, styled headings, tables).

---

## 7.0 Introduction

This chapter presents the implementation of the **AI-Enabled Crop Disease Advisor** (prototype name: **FieldMate**), a Progressive Web Application (PWA) developed to address the crop disease management challenges identified in Chapters One and Five. As stated in Section 1.2, farmers in Kenya — including Uasin Gishu County — face late disease detection, limited access to extension officers, dependence on inaccurate manual methods, and high cost of modern diagnostic tools.

Chapter Five confirmed these findings empirically: **46.7%** of respondents identified delayed disease detection as the major challenge, **36.7%** reported inaccurate diagnosis, and **35%** cited high cost of agricultural experts. At the same time, **73.3%** expected early disease detection as the primary benefit of an AI advisory system, and **83.3%** indicated they would recommend such a system.

The prototype was therefore implemented as an offline-first, voice-assisted PWA targeting smallholder farmers in **Uasin Gishu County (Eldoret)**, supporting crop disease diagnosis for **maize, potato, tomato, wheat, and beans** as defined in Section 1.5. Implementation followed the three-layer architecture described in Chapter Four (Presentation, Application, and Database layers) and the testing plan in Chapter Three (unit, integration, system, and user acceptance testing).

The overall goal in Section 1.3.1 — to design, develop, and validate an AI-enabled, voice-assisted, offline-first PWA for timely crop disease diagnosis — was pursued through a **Minimum Viable Product (MVP)** within the 14-week project duration (Section 1.6). Where aspirational targets (e.g., 10+ crop-disease combinations at ≥92% accuracy, nine language packs) exceed prototype scope, this chapter notes what was fully implemented, partially implemented, or planned as future work (Section 6.4).

---

## 7.1 System Implementation

### 7.1.1 Implementation Approach and Link to Research Objectives

The system was developed using **iterative prototyping**, aligned with the descriptive research design in Section 3.2. Each development cycle translated research findings and design artefacts (Chapter Four) into working modules that were tested in Google Chrome before integration.

| Research / Design Reference | Implementation Response |
|-----------------------------|-------------------------|
| **1.3.3.1** — Traditional diagnosis challenges (Ch. 2.2.1) | Image upload + AI/ML pipeline for faster identification; digital history replaces manual record keeping |
| **1.3.3.2** — Benefits of AI diagnosis (Ch. 2.2.2) | Early detection, improved accuracy, voice access, offline PWA, weather alerts, PDF reports |
| **1.3.2** — AI-powered disease detection | TensorFlow.js on-device ML + optional Claude Vision API + offline knowledge base |
| **1.3.2** — Voice-guided recommendations | Web Speech API with English/Kiswahili content; adjustable voice speed |
| **1.3.2** — Weather-integrated predictor | Open-Meteo API with rule-based risk when humidity, temperature, and rainfall thresholds are met |
| **1.3.2** — Global farmer accessibility | Mobile-first UI, large touch targets, high-contrast green theme, interactive onboarding tour |
| **4.4.1** — Three-layer architecture | React presentation layer, service modules as application layer, IndexedDB as database layer |
| **5.3–5.4** — User expectations | Simplicity for low smartphone-agriculture usage (31.7% rarely use phones for farming) |

### 7.1.2 System Architecture (Implemented)

The implemented architecture follows Chapter Four, Section 4.4.1:

```
┌──────────────────────────────────────────────────────────────────┐
│              FARMER — Smartphone / Tablet Browser                 │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ Auth Pages │  │ Dashboard   │  │ Diagnose → Results → PDF │  │
│  │ Login/Reg  │  │ Weather     │  │ History | Settings     │  │
│  └─────┬──────┘  └──────┬──────┘  └────────────┬─────────────┘  │
│        └────────────────┼───────────────────────┘                 │
│                         ▼                                         │
│              ┌─────────────────────┐                             │
│              │ AppContext (State)  │                             │
│              └──────────┬──────────┘                             │
│    ┌────────────────────┼────────────────────┐                  │
│    ▼                    ▼                    ▼                  │
│ auth.ts           mlClassifier.ts        speech.ts              │
│ claude.ts         weather.ts             sync.ts                 │
│ db.ts             pdfExport.ts                                   │
│                         ▼                                         │
│              ┌─────────────────────┐                             │
│              │ IndexedDB FieldMateDB│                            │
│              │ users | diagnoses    │                            │
│              │ settings | weather   │                            │
│              └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

### 7.1.3 Module-by-Module Implementation

#### A. User Management (Functional Requirement 4.1.1 — Register and Login)

Implemented in `src/services/auth.ts` and pages `LoginPage`, `RegisterPage`, `ForgotPasswordPage`:
- Farmer registration with validated email, name (2–80 characters), and password (minimum 8 characters).
- Login, logout, and password reset.
- Passwords stored as **salted SHA-256 hashes** — never plain text (security requirement, Section 4.1.2).
- Profile update (name and county) in Settings — satisfies Update operation on user records.
- Session stored in `sessionStorage` and IndexedDB `settings.activeUser`.

#### B. Crop Image Upload and Disease Detection (Functional Requirements — Upload, Analyze, Detect)

Implemented in `DetectPage`, `ResultsPage`, `claude.ts`, `mlClassifier.ts`:
1. Farmer selects crop: **Maize, Potato, Tomato, Wheat, or Beans** (Section 1.5).
2. Leaf photo captured via **device camera** or **gallery upload**.
3. **LeafGuideOverlay** component guides correct framing (addresses Section 1.6 — poor image quality).
4. **Analysis pipeline** (priority order):
   - **TensorFlow.js ML model** (Maize, Potato, Tomato) — trained on PlantVillage classes; runs on-device.
   - **Claude Vision API** (optional, when API key configured) — live AI analysis.
   - **Offline demo knowledge base** (`DISEASE_DATABASE` in `claude.ts`) — for Wheat, Beans, or when ML/API unavailable.
5. Results show disease name, **confidence percentage**, severity, symptoms, causes, treatment, and prevention in selected language.
6. **AnalysisModeBadge** displays mode: ML Model, Live AI, or Demo.

*Prototype note:* Section 1.3.2 targets ≥92% accuracy across 10+ crop-disease pairs. The MVP implements **six ML disease classes** (maize rust, maize blight, potato early/late blight, tomato early/late blight) plus extended offline entries for wheat and beans, consistent with the 14-week limitation (Section 1.6).

#### C. Treatment Recommendations and Voice Guidance (Section 1.3.2 — Voice-Guided)

- Bilingual disease content (English and Kiswahili) in `DISEASE_DATABASE`.
- **Text-to-Speech** via Web Speech API (`speech.ts`) with online audio fallback for Chrome compatibility.
- Voice speed control and test playback in Settings.
- Dashboard and results **Play** buttons read recommendations aloud — addressing literacy barriers (Chapter 2.2.1, item 7).
- *Prototype scope:* English and Kiswahili only; Kikuyu, Luhya, Kalenjin, and other languages in Section 1.3.2 are future work (Section 6.4).

#### D. Weather-Integrated Disease Risk (Section 1.3.2 — Weather Predictor)

Implemented in `weather.ts`, `WeatherPage`, `useCropWeather.ts`:
- Location: **Eldoret, Uasin Gishu County** (0.5143°N, 35.2698°E).
- Data source: **Open-Meteo API** (live when online).
- Displays temperature, humidity, rainfall, wind speed.
- **Rule-based risk engine:** flags elevated disease risk when conditions favour pathogens (e.g., humidity >80%, temperature 18–28°C, rainfall >5 mm) — matching Section 1.3.2 thresholds.
- Weather cached in IndexedDB for offline viewing.

#### E. History, Reports, and Record Management (Addresses Chapter 2.2.1 — Poor Records)

- Every diagnosis saved to IndexedDB with timestamp, image, confidence, and full recommendation snapshot.
- **History page:** list, view, delete individual records (CRUD Delete).
- **PDF export** (`pdfExport.ts` + jsPDF): crop, disease, confidence, treatment, analysis mode — satisfies Generate Reports (Section 4.1.1).
- **Clear Scan History** in Settings for bulk delete.
- Pending offline records marked `syncStatus: pending`; sync service processes when online (Section 1.5).

#### F. Accessibility and Onboarding (Section 1.3.2 — Global Accessibility)

- Mobile-first responsive layout with bottom navigation and large touch targets.
- Green high-contrast agricultural theme (Chapter Four UI design).
- **EN / SW** language toggle in header and Settings.
- **Interactive 6-step onboarding tour** for first-time users (`OnboardingTour.tsx`).
- **Pilot region banner** identifying Uasin Gishu County deployment.

#### G. Progressive Web Application (Section 1.5, 1.6)

- Built with **vite-plugin-pwa** and service worker for asset caching.
- Installable on Android home screen without app store.
- Offline access to cached app shell, stored diagnoses, and demo disease knowledge base.
- Development server: `http://localhost:5173`; production build via `npm run build`.

### 7.1.4 Testing Conducted (Chapter 3.6)

| Test Type | What Was Tested | Outcome |
|-----------|-----------------|---------|
| **Unit testing** | Auth hashing, validation, confidence normalisation, weather risk rules | Individual functions verified in isolation |
| **Integration testing** | Camera → ML pipeline → IndexedDB save → History display | End-to-end scan workflow functional |
| **System testing** | Full user journeys: register, scan, results, PDF, weather, voice | All core modules working in Chrome |
| **User acceptance testing** | Questionnaire (n=60, Chapter Five) + prototype demonstration | 83.3% would recommend AI system |

### 7.1.5 Deployment (Prototype Stage)

```powershell
cd fieldwork
npm run dev
```
Open Google Chrome → `http://localhost:5173`

Pilot validation geography (Section 1.5): primary focus **Kenya (Uasin Gishu County)**.

---

## 7.2 Technologies Used

### 7.2.1 Hardware Platform

#### Development Hardware
| Component | Specification | Purpose |
|-----------|---------------|---------|
| Developer laptop/PC | Windows 10/11, 8 GB+ RAM, 256 GB SSD | Coding, ML inference testing, documentation |
| Display | 1920×1080 | UI design and mobile emulation in DevTools |
| Internet | Wi-Fi / mobile hotspot | npm packages, Open-Meteo API, optional Claude API |

#### Target Farmer Hardware (Section 1.5 — Smartphone Access)
| Component | Specification | Purpose |
|-----------|---------------|---------|
| Smartphone | Android 8.0+, 2 GB+ RAM | Primary farmer device |
| Camera | 5 MP+ rear camera | Leaf image capture |
| Storage | 500 MB+ free | PWA cache and IndexedDB |
| Audio | Built-in speaker | Voice guidance (Section 1.3.2) |

### 7.2.2 Programming Language

| Language | Version | Role in Project |
|----------|---------|-----------------|
| **TypeScript** | 6.0.x | Primary language — components, services, types |
| **JavaScript (ES Modules)** | ES2022+ | Compiled output, service worker |
| **HTML5** | — | Application structure, PWA meta tags |
| **CSS3** | — | Styling via Tailwind CSS |
| **JSON** | — | ML class labels, configuration |

TypeScript was chosen for type safety when handling diagnosis entities, user records, and API responses — supporting reliability (Section 4.1.2).

### 7.2.3 Programming Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+/20 LTS | Runtime environment |
| **npm** | 10.x | Package management |
| **Vite** | 8.0.x | Development server, bundler, HMR |
| **Visual Studio Code / Cursor IDE** | Latest | Code editing and debugging |
| **Google Chrome DevTools** | Latest | IndexedDB inspection, mobile emulation, network analysis |
| **ESLint** | 10.x | Code quality |
| **Git** | 2.x | Version control |
| **Google Colab** (training phase) | Cloud | ML model experimentation per Section 1.6 limitation solution |

### 7.2.4 Software Platform

| Software | Version | Function |
|----------|---------|----------|
| **React / React DOM** | 19.2.x | UI framework (Presentation Layer) |
| **React Router DOM** | 7.16.x | Page routing |
| **Tailwind CSS** | 3.4.x | Responsive mobile-first styling |
| **TensorFlow.js** | 4.22.x | On-device ML disease classification (PlantVillage-based model) |
| **IndexedDB** | Browser API | Local database — `FieldMateDB` v2 (Chapter 4.4.6 ERD) |
| **jsPDF** | 4.2.x | PDF report generation |
| **vite-plugin-pwa** | 1.3.x | Service worker, offline caching, installability |
| **Lucide React** | 1.17.x | Icons |
| **Web Speech API** | Browser-native | Text-to-speech voice guidance |
| **Web Crypto API** | Browser-native | SHA-256 password hashing |
| **Open-Meteo API** | REST | Live weather for Eldoret region |
| **Anthropic Claude Vision API** | Optional | Live AI image analysis when configured |
| **PlantVillage Dataset** | Open dataset | ML training data (Section 1.6) |

**Software platform summary:** The prototype is a **client-side PWA** — no dedicated backend server is required at MVP stage. All farmer data resides in the browser IndexedDB, aligning with offline accessibility benefits in Section 2.2.2.

---

## 7.3 Features of the Prototype

### 7.3.1 Technical Manual Screenshots

*Insert screenshots with captions below for the technical/system administrator documentation.*

| Figure | Screenshot to Capture | Caption |
|--------|----------------------|---------|
| **7.1** | VS Code project tree (`src/pages`, `src/services`, `src/components`) | FieldMate source code structure showing modular implementation |
| **7.2** | Chrome DevTools → Application → IndexedDB → FieldMateDB | Four object stores matching Chapter 4.4.6 ERD |
| **7.3** | IndexedDB `users` record showing hashed `passwordHash` | Secure password storage — not plain text |
| **7.4** | Network tab loading `/models/plant-disease/model.json` | TensorFlow.js model loading for on-device inference |
| **7.5** | Results page with **ML Model** badge and confidence % | AI disease detection output (Section 1.3.2) |
| **7.6** | `mlClassifier.ts` and `db.ts` in editor | Application layer service implementation |
| **7.7** | `vite.config.ts` showing PWA and TTS proxy plugins | Server configuration for PWA and voice fallback |
| **7.8** | Terminal: successful `npm run build` | Production build verification |
| **7.9** | AnalysisModeBadge showing ML / Live AI / Demo modes | Three-tier diagnosis pipeline |
| **7.10** | Chrome mobile emulation — full app in phone frame | Mobile-first PWA layout (Section 1.3.2 accessibility) |

### 7.3.2 User Manual Screenshots — Main Activity Step by Step

*User manual for farmers and extension officers — main workflow.*

| Step | Action | Figure | Caption |
|------|--------|--------|---------|
| **1** | Open `http://localhost:5173` in Chrome | 7.11 | Launching the AI-Enabled Crop Disease Advisor |
| **2** | Tap **Register** — enter name, email, password | 7.12 | Creating a farmer account (Section 4.1.1) |
| **3** | Tap **Login** with registered credentials | 7.13 | User authentication |
| **4** | Complete 6-step onboarding tour on first login | 7.14 | Interactive guide for new users |
| **5** | View dashboard — greeting, weather summary, recent scans | 7.15 | Farmer home screen — Uasin Gishu pilot region |
| **6** | Tap **Weather** — view temperature, humidity, disease risk | 7.16 | Weather-integrated disease risk alerts (Section 1.3.2) |
| **7** | Tap **Diagnose** — select crop (e.g. Maize) — open camera | 7.17 | Crop selection and image capture |
| **8** | Centre leaf in guide frame — capture photo | 7.18 | Leaf positioning guide for accurate AI analysis |
| **9** | Tap **Analyze** — view disease name, confidence, treatment | 7.19 | AI diagnosis results and recommendations |
| **10** | Tap **Play** to hear advice in English or Kiswahili | 7.20 | Voice-guided recommendations (Section 2.2.2, item 4) |
| **11** | Tap **Download PDF Report** on results page | 7.21 | PDF report for extension officers (Section 4.1.1) |
| **12** | Tap **History** — view past diagnoses | 7.22 | Digital diagnosis history (Section 2.2.2, item 7) |
| **13** | Tap **Settings** — update profile, language, voice speed | 7.23 | Profile and accessibility settings |
| **14** | Toggle **EN / SW** in header | 7.24 | Bilingual interface — English and Kiswahili |
| **15** | Tap logout — return to landing page | 7.25 | Secure session end |

---

## 7.4 Database Management System

### 7.4.1 DBMS Selection

The prototype implements the database layer described in **Chapter Four, Section 4.4.6 (Entity Relationship Diagram)** using **IndexedDB** — a browser-native object database API. IndexedDB was selected because:

1. It supports **offline-first operation** (Section 2.2.2, benefit 5; Section 1.6 limitation solution).
2. It requires **no separate database server** — suitable for MVP and smallholder smartphone deployment.
3. It implements **structured entities** with primary keys and CRUD operations (Section 4.1.1).
4. It satisfies the **Systems Analysis database requirement** in Chapter Four.

**Database name:** `FieldMateDB` | **Version:** 2 | **Implementation:** `src/services/db.ts`

### 7.4.2 Database Schema (Mapped to Chapter 4 ERD)

#### Entity: User (Object Store: `users`)
| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| email | string | **PK** | Login identifier |
| name | string | — | Farmer full name |
| passwordHash | string | — | Salted SHA-256 hash |
| county | string | — | e.g. Uasin Gishu County |
| createdAt | number | — | Registration timestamp |

#### Entity: Diagnosis (Object Store: `diagnoses`)
| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| id | string | **PK** | Unique scan ID |
| cropType | string | — | Maize, Potato, Tomato, Wheat, Beans |
| diseaseName | string | — | Identified disease |
| confidence | number | — | Model confidence (0–100) |
| imageUrl | string | — | Leaf photo (base64/blob) |
| recommendation | object | — | Full advice snapshot (JSON) |
| timestamp | number | — | Scan date/time |
| syncStatus | string | — | synced / pending |
| analysisMode | string | — | ml / live-ai / demo |

#### Entity: Settings (Object Store: `settings`)
| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| key | string | **PK** | Setting name |
| value | any | — | language, voiceSpeed, activeUser, etc. |

#### Entity: Weather (Object Store: `weather`)
| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| location | string | **PK** | Eldoret |
| temperature, humidity, rainfall, windSpeed | number | — | Weather metrics |
| riskLevel | string | — | Low / Medium / High |
| riskAlerts | array | — | Disease risk messages |
| timestamp | number | — | Cache time |

### 7.4.3 Entity Relationship Diagram (Implemented)

```
┌─────────────┐       ┌──────────────────┐
│    users    │       │     settings     │
│─────────────│       │──────────────────│
│ email (PK)  │◄──────│ activeUser (FK)  │
│ name        │       │ language         │
│ passwordHash│       │ voiceSpeed       │
│ county      │       └──────────────────┘
│ createdAt   │
└─────────────┘
       │
       │ (session link via activeUser)
       ▼
┌─────────────────────────────────────────┐
│              diagnoses                   │
│─────────────────────────────────────────│
│ id (PK) | cropType | diseaseName        │
│ confidence | imageUrl | recommendation  │
│ timestamp | syncStatus | analysisMode   │
└─────────────────────────────────────────┘

┌─────────────┐
│   weather   │  (cached by location — independent entity)
│ location(PK)│
└─────────────┘
```

### 7.4.4 Normalisation (Third Normal Form)

| Store | 3NF Justification |
|-------|-------------------|
| **users** | Each farmer stored once; email is unique PK; no repeating groups |
| **settings** | Key-value pairs avoid duplicating preferences on every diagnosis |
| **diagnoses** | Each scan is one atomic fact record; user linked via session |
| **weather** | Weather cached by location; not redundantly embedded in diagnoses |

### 7.4.5 CRUD Operations (Chapter 4.1.1 Compliance)

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| **users** | Register | Login, getUserByEmail | Update profile | — |
| **diagnoses** | Save after scan | History, Results | — | Delete one / Clear all |
| **settings** | saveSetting | getSetting | updateSettings | — |
| **weather** | saveWeather (cache) | getCachedWeather | — | — |

### 7.4.6 Security Measures (Section 4.1.2)

- Salted SHA-256 password hashing before storage.
- Email normalised to lowercase.
- Input validation on all registration and profile fields.
- No plain-text passwords in IndexedDB.
- Developer tools (API key, demo seeding) hidden from standard user interface.

### 7.4.7 How Implementation Addresses Chapter Five Findings

| Chapter 5 Finding | Database / System Response |
|-------------------|---------------------------|
| 46.7% — delayed detection | Instant local save after scan; history always available |
| 35% — poor record management | Structured diagnoses store with PDF export |
| 35% — high expert cost | Self-service diagnosis stored locally at no per-scan fee |
| 73.3% — early detection benefit | ML analysis returns results in seconds with confidence % |
| 83.3% — would recommend | Usable MVP demonstrating AI advisory workflow |

---

## 7.5 Chapter Summary

This chapter demonstrated how the AI-Enabled Crop Disease Advisor was implemented as the FieldMate PWA prototype, translating the requirements of Chapters One, Four, and Five into a working system. The three-layer architecture was realised using React, TypeScript service modules, and IndexedDB. Core features — AI/ML disease detection, voice guidance in English and Kiswahili, weather-integrated risk alerts, offline PWA operation, PDF reports, and digital history — directly address the traditional challenges in Section 2.2.1 and deliver the benefits described in Section 2.2.2. Future enhancements (Section 6.4) including additional languages, more crop-disease models, and expanded field validation remain recommended next steps beyond this prototype.

---

# CHAPTER 8: REFERENCES (APA 7th Edition)

Abdullahi, A. S., Mahmud, M. S., & Alkali, A. M. (2022). Mobile-based plant disease detection using deep learning: A review. *Computers and Electronics in Agriculture*, *200*, 107194. https://doi.org/10.1016/j.compag.2022.107194

Food and Agriculture Organization. (2021). *Integrated pest management: An introduction*. FAO. https://www.fao.org

Google. (2024). *IndexedDB API*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

Kenya Agricultural and Livestock Research Organization. (2023). *Digital agricultural services in Kenya*. KALRO. https://www.kalro.org

Kenya National Bureau of Statistics. (2023). *2019 Kenya population and housing census: Uasin Gishu County*. KNBS. https://www.knbs.or.ke

Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016). Using deep learning for image-based plant disease detection. *Frontiers in Plant Science*, *7*, 1419. https://doi.org/10.3389/fpls.2016.01419

Mozilla Developer Network. (2024). *Progressive web apps*. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

Open-Meteo. (2024). *Weather API documentation*. https://open-meteo.com/en/docs

Penn State University. (2024). *PlantVillage*. https://plantvillage.psu.edu/

Republic of Kenya. (2018). *National climate smart agriculture strategy 2017–2026*. Ministry of Agriculture, Livestock, Fisheries and Irrigation.

TensorFlow Team. (2024). *TensorFlow.js*. https://www.tensorflow.org/js

United Nations. (2015). *Transforming our world: The 2030 Agenda for Sustainable Development* (SDG 2: Zero Hunger). https://sdgs.un.org/goals

W3C. (2024). *Web Speech API specification*. https://w3c.github.io/speech-api

---

# CHAPTER 9: APPENDIX

## 9.1 Questionnaire / Interview Schedule

*(Same instrument used for Chapter Five data collection — n=60 responses)*

### Mapping to Research Objectives

| Section | Questions | Objective / Literature Section |
|---------|-----------|-------------------------------|
| A | A1–A10 | Demographics (Section 5.2) |
| B | B1–B5 | **1.3.3.1** / **2.2.1** — Traditional diagnosis challenges |
| B | B6–B8 | **1.3.3.2** / **2.2.2** — AI benefits: early detection, trust, offline |
| B | B9–B11 | **1.3.2** — Voice, Kiswahili, feature ranking |
| B | B12–B15 | **5.4** — Acceptance, willingness, recommendation |
| B | B16–B17 | Open-ended feedback |

### SECTION A: Respondent Biodata

**A1. Gender:** [ ] Male  [ ] Female  [ ] Prefer not to say

**A2. Age group:** [ ] Below 18  [ ] 18–25  [ ] 26–35  [ ] 36–45  [ ] 46–55  [ ] 56+

**A3. Education level:** [ ] Primary  [ ] Secondary (High school)  [ ] Certificate/Diploma  [ ] University  [ ] Postgraduate

**A4. Category:** [ ] Student/Researcher  [ ] Smallholder Farmer  [ ] Farm Worker  [ ] Extension Officer  [ ] Other

**A5. Years in agriculture:** [ ] Less than 1 year  [ ] 1–3 years  [ ] 4–10 years  [ ] More than 10 years

**A6. Crops grown (tick all):** [ ] Maize  [ ] Wheat  [ ] Potatoes  [ ] Beans  [ ] Tomatoes

**A7. Farm size:** [ ] Less than 1 acre  [ ] 1–3 acres  [ ] 4–10 acres  [ ] More than 10 acres

**A8. Smartphone:** [ ] Yes — personal  [ ] Yes — shared  [ ] No

**A9. Internet access:** [ ] Reliable  [ ] Sometimes  [ ] Rarely  [ ] Never

**A10. Preferred language:** [ ] English  [ ] Kiswahili  [ ] Both

### SECTION B: Crop Disease Management (Objectives 1.3.3.1 & 1.3.3.2)

**B1.** How often do crop disease outbreaks occur per season?
[ ] Never  [ ] Once  [ ] 2–3 times  [ ] More than 3 times

**B2.** Current identification method (tick all):
[ ] Manual observation  [ ] Agricultural expert  [ ] Laboratory  [ ] Machine learning / app  [ ] Other

**B3.** Time to get reliable advice after noticing disease:
[ ] Same day  [ ] 1–3 days  [ ] 4–7 days  [ ] More than 1 week  [ ] Rarely get advice

**B4.** Rate difficulty identifying diseases without expert help:
[ ] 1 Very easy  [ ] 2  [ ] 3 Neutral  [ ] 4  [ ] 5 Very difficult

**B5.** Challenges experienced (tick all matching Chapter 2.2.1):
[ ] Delayed detection  [ ] Inaccurate diagnosis  [ ] High expert cost  [ ] Poor records  [ ] No real-time monitoring  [ ] Limited extension access  [ ] Language/literacy barriers  [ ] Internet dependency

**B6.** Expected AI benefits (tick all matching Chapter 2.2.2):
[ ] Early detection  [ ] Improved accuracy  [ ] Reduced crop losses  [ ] Voice assistance  [ ] Offline access  [ ] Cost reduction  [ ] Better records  [ ] Weather-based alerts

**B7.** Would you trust app advice if confidence % is shown?
[ ] Yes completely  [ ] Yes with expert confirmation  [ ] Unsure  [ ] No

**B8.** Importance of offline use after install:
[ ] Very important  [ ] Important  [ ] Neutral  [ ] Not important

**B9.** Importance of voice/audio advice:
[ ] Very important  [ ] Important  [ ] Neutral  [ ] Not important

**B10.** Importance of Kiswahili language:
[ ] Very important  [ ] Important  [ ] Neutral  [ ] Not important

**B11.** Rank features (1=most, 5=least): Scan [ ] Weather [ ] Treatment [ ] Voice [ ] PDF [ ] History [ ]

**B12.** Would you recommend an AI crop disease advisor?
[ ] Yes  [ ] Maybe  [ ] No

**B13.** Barriers to adoption (tick all):
[ ] No smartphone  [ ] Poor internet  [ ] Low literacy  [ ] Don't trust technology  [ ] Data cost  [ ] No training

**B14.** After FieldMate demo, ease of use:
[ ] 1 Very difficult  [ ] 2  [ ] 3  [ ] 4  [ ] 5 Very easy

**B15.** Open-ended — biggest crop disease challenge:
_______________________________________________________________________________

**B16.** Open-ended — one improvement for FieldMate:
_______________________________________________________________________________

---

## 9.2 Work Plan (Gantt Chart) — 14 Weeks

| Task / Activity | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 | W14 |
|-----------------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| Literature review (Ch. 2) | ██ | ██ | | | | | | | | | | | | |
| Questionnaire design & collection (Ch. 5) | | ██ | ██ | ██ | | | | | | | | | | |
| Requirements & system analysis (Ch. 4) | | | ██ | ██ | | | | | | | | | | |
| UI/UX design | | | | ██ | ██ | | | | | | | | | |
| IndexedDB database design | | | | | ██ | ██ | | | | | | | | |
| Authentication module | | | | | | ██ | ██ | | | | | | | |
| Dashboard & navigation | | | | | | | ██ | ██ | | | | | | |
| Camera & image upload | | | | | | | | ██ | ██ | | | | | |
| TensorFlow.js ML integration | | | | | | | | | ██ | ██ | | | | |
| Weather module (Open-Meteo) | | | | | | | | | | ██ | | | | |
| Voice guidance & Kiswahili | | | | | | | | | | | ██ | ██ | | |
| PDF reports & history CRUD | | | | | | | | | | | | ██ | | |
| PWA & offline testing | | | | | | | | | | | | | ██ | |
| Report writing (Ch. 6–7) & presentation | | | | | | | | | | | | | ██ | ██ |

**Legend:** ██ = active work period

---

## 9.3 Budget (Kenyan Shillings)

| Item | Description | Qty | Unit (KES) | Total (KES) |
|------|-------------|-----|------------|-------------|
| A1 | Android test smartphone | 1 | 18,000 | 18,000 |
| A2 | Phone stand & USB cable | 1 | 1,500 | 1,500 |
| B1 | Internet bundles (14 weeks) | 14 | 500 | 7,000 |
| B2 | Questionnaire printing (60 copies) | 60 | 20 | 1,200 |
| C1 | Transport — Uasin Gishu field visits | 6 | 800 | 4,800 |
| C2 | Refreshments — focus group | 10 | 200 | 2,000 |
| D1 | Report printing & binding (3 copies) | 3 | 800 | 2,400 |
| D2 | Presentation poster/materials | 1 | 1,500 | 1,500 |
| E1 | Contingency (10%) | 1 | 3,840 | 3,840 |
| | **GRAND TOTAL** | | | **KES 42,240** |

*Assumes developer laptop already owned (Section 1.6). Optional Claude API and hosting not included.*
