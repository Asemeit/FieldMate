# FieldMate — 50 Demo Users Guide

Use this before your presentation to show that FieldMate supports multiple registered farmer accounts stored in **IndexedDB** (`FieldMateDB` → `users` table).

---

## Quick steps (2 minutes)

### 1. Start the app

```powershell
cd "C:\Users\S A R D A R\Downloads\fieldwork\fieldwork"
npm run dev
```

Open **Chrome** → **http://localhost:5173**

### 2. Log in

Use your own account, or register once if needed.

### 3. Unlock developer options (hidden from lecturers)

Before seeding, unlock admin tools **once per browser session**:

- **Option A:** Open `http://localhost:5173/settings?admin=1`
- **Option B:** On Settings, tap the **"Settings"** title **5 times quickly** — you'll see "Developer options unlocked"

Then scroll down to see **Registered accounts**, **Seed 50 Demo Farmers**, and **Claude API Key**.

### 4. Seed 50 farmers

1. Go to **Settings** (bottom nav)
2. Scroll to **Local Storage**
3. Click **Seed 50 Demo Farmers (Presentation)**
4. Confirm the dialog
5. **Registered accounts** should show **50** (or more if you already had accounts)

> **Note:** The seed button and account counter are **hidden** during normal use so lecturers and farmers only see a clean Settings page.

---

## Demo accounts created

| Field | Value |
|--------|--------|
| **Emails** | Realistic personal emails (e.g. `james.kipchoge@gmail.com`, `maryrotich@gmail.com`, `peter.bett@yahoo.com`, …) |
| **Password** (all accounts) | `fieldmate123` |
| **County** | Uasin Gishu County |
| **Names** | Kenyan farmer names (e.g. James Kipchoge, Mary Rotich, …) |

**Example login for demo:**

- Email: `james.kipchoge@gmail.com`
- Password: `fieldmate123`

---

## What to tell your lecturer

> "FieldMate stores farmer accounts locally in IndexedDB. Each user has a hashed password, name, email, and county. We seeded 50 pilot farmers for the Uasin Gishu deployment to show the system scales beyond a single account."

**Show in the app:**

1. **Settings → Registered accounts: 50**
2. **Chrome DevTools → Application → IndexedDB → FieldMateDB → users** (optional, if they ask to see the database)

---

## Verify in Chrome DevTools (optional)

1. Press **F12**
2. **Application** tab
3. **IndexedDB** → **FieldMateDB** → **users**
4. You should see 50 rows with realistic emails like `james.kipchoge@gmail.com`, `maryrotich@gmail.com`, etc.
5. `passwordHash` is **SHA-256 hashed** — not plain text (security requirement)

---

## Important notes

- Data lives **only in this browser** on **localhost:5173**
- Running seed again **skips** accounts that already exist (safe to click twice)
- Your personal account (`zalphaprecious@gmail.com`) is **not removed** — seed only adds farmers
- After a **PC restart**, run `npm run dev` again before opening the app

---

## Presentation script (30 seconds)

1. "FieldMate uses IndexedDB for offline-first farmer accounts."
2. Open **Settings** → point at **Registered accounts: 50**
3. "These are 50 pilot farmers in Uasin Gishu — each can log in with their email and password."
4. Optional: log out → log in as `james.kipchoge@gmail.com` / `fieldmate123` → show dashboard

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Count still shows 0 | Hard refresh (`Ctrl + Shift + R`), seed again |
| Can't log in as demo farmer | Password is exactly `fieldmate123` (8+ characters). Use `james.kipchoge@gmail.com` or check DevTools for the full list. |
| Still see old `farmer01@fieldmate.local` emails | Unlock admin → seed again — old demo emails are replaced automatically |
| Count shows less than 50 | You may have skipped duplicates — seed again or clear users in DevTools |
| App won't load | Run `npm run dev` in the project folder |

---

## Why not Python?

Python is great for generating names on paper, but FieldMate stores users **inside the browser**. The **Seed 50 Demo Farmers** button writes directly to IndexedDB with the same password hashing as real registration — no external script needed.
