# FieldMate — Lecturer Demo Script (5–7 minutes)

## Before you start
1. Run: `npm run dev` in the `fieldwork` folder (inner project with `package.json`).
2. Open Chrome: `http://localhost:5173` (use port from terminal).
3. Hard refresh: `Ctrl+Shift+R`.
4. Optional: open DevTools → **Application** → **IndexedDB** → `FieldMateDB`.

---

## 1. User accounts & security (Weeks 3–4, 8–9)
- **Register** a farmer account (password min 8 chars).
- Show **IndexedDB → users** — password is hashed, not plain text.
- **Login** and show protected dashboard.

## 2. Interface design (Weeks 1–2)
- Point out: consistent green theme, bottom navigation, EN/SW language toggle, mobile-first layout.
- **Pilot region**: Eldoret, Uasin Gishu County.

## 3. Machine learning diagnosis (Weeks 12–13) ⭐
- Go to **Diagnose** → select **Maize**, **Potato**, or **Tomato**.
- Upload/capture a leaf photo → **Analyze**.
- Results show **ML Model (TensorFlow.js)** badge.
- Explain: *"MobileNet model trained on PlantVillage dataset; inference runs on-device in the browser."*
- Show **confidence %** on results.

## 4. Database & CRUD (Weeks 5–6)
- **History** — list of past scans.
- **Delete** one record (Delete operation).
- **Settings → Clear Scan History** (bulk delete).

## 5. Profile update (Week 3–4 Update)
- **Settings → My Profile** → change name/county → **Update Profile**.

## 6. Reports (Weeks 10–11)
- Open any result → **Download PDF Report**.
- Show PDF: crop, disease, confidence, treatment, analysis mode.

## 7. Weather & offline (objectives)
- **Weather** page — climate metrics + disease risk rules.
- Mention **PWA** + IndexedDB for offline use in rural areas.
- **Voice** button on dashboard/weather for low-literacy farmers.

## 8. Fallback modes (if asked)
| Badge | Meaning |
|-------|---------|
| **ML Model** | TensorFlow.js on maize/potato/tomato |
| **Live AI** | Claude Vision (optional API key in Settings) |
| **Demo** | Built-in knowledge base (wheat/beans or ML unavailable) |

---

## One-line project summary
> FieldMate is an offline-first PWA for Uasin Gishu farmers that uses **TensorFlow.js ML** for leaf disease classification, stores data in **IndexedDB**, exports **PDF reports**, and provides **voice-guided** advice in English and Kiswahili.

---

## Documentation files
- `DATABASE_DESIGN.md` — ERD and 3NF for Chapter 4
- Google Form questionnaire — user research (Chapter 5)
