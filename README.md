# 🔢 Visitor Counter v2 — Full Stack Demo

A real-time visitor counter built with Node.js, Express, PostgreSQL, and vanilla HTML/CSS/JS.

**New in v2:** Light/Dark theme toggle · Visits chart · Admin auth for reset · Visit notes/labels

---

## 📁 Project Structure

```
visitor-counter/
├── server.js        → Express backend API
├── package.json     → Dependencies
├── setup.sql        → Database setup script
├── .env.example     → Environment variables template
└── public/
    └── index.html   → Frontend UI
```

---

## 🚀 Setup & Run

### Step 1 — Install Dependencies
```bash
npm install
```
> No new packages needed for v2 features — Chart.js loads from CDN.

### Step 2 — Setup Database
```bash
# Start PostgreSQL
sudo service postgresql start

# Run setup script
psql -U postgres -f setup.sql
```

> **Already have the old table?** Just run this one line to add the note column:
> ```sql
> ALTER TABLE visitors ADD COLUMN IF NOT EXISTS note VARCHAR(100);
> ```

### Step 3 — Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit with your DB credentials and set your admin key
nano .env
```

Make sure to set `ADMIN_KEY` to something secret — this is the password
required to reset the visitor counter from the UI.

### Step 4 — Start Server
```bash
node server.js
```

### Step 5 — Open in Browser
```
http://localhost:3000
```

---

## 🌐 API Endpoints

| Method | Endpoint      | Description                              | Auth required? |
|--------|---------------|------------------------------------------|----------------|
| GET    | /api/count    | Get total visitor count                  | No             |
| POST   | /api/visit    | Record a new visit (accepts `note` body) | No             |
| GET    | /api/recent   | Get last 10 visits (includes note)       | No             |
| GET    | /api/stats    | Get hourly visit counts (last 24h)       | No             |
| DELETE | /api/reset    | Reset counter                            | ✅ Bearer token |

### POST /api/visit — request body
```json
{ "note": "Friend demo" }
```
The `note` field is optional. Omit it or send `null` for no label.

### DELETE /api/reset — Authorization header
```
Authorization: Bearer your-admin-key-here
```
Returns `401 Unauthorized` if the key is wrong or missing.

---

## ✨ New Features in v2

### 🌗 Light / Dark Theme Toggle
- Button in top-right of header switches between dark (default) and light mode
- Preference saved in `localStorage` — persists across page reloads
- Chart colors update automatically when theme changes

### 📊 Visits Chart
- Bar chart showing visits per hour for the last 24 hours
- Uses Chart.js loaded from CDN (no npm install)
- Powered by new `GET /api/stats` endpoint using `DATE_TRUNC('hour', ...)`
- Auto-refreshes every 10 seconds alongside the counter

### 🔐 Admin Auth for Reset
- Reset button opens a modal dialog instead of a browser `confirm()`
- User must enter the `ADMIN_KEY` from `.env` to proceed
- Key is sent as `Authorization: Bearer <key>` header
- Server returns `401 Unauthorized` if the key is wrong

### 🏷️ Visit Notes / Labels
- Text input below the Record Visit button
- Optional label (max 50 chars) stored in the `note` column
- Displayed in the Recent Visits list next to each entry

---

## ⚙️ Tech Stack

- **Frontend** → HTML, CSS, JavaScript, Chart.js (CDN)
- **Backend** → Node.js + Express
- **Database** → PostgreSQL
- **Process Manager** → PM2 (optional)

---

## 🔧 Run with PM2 (Keep alive)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name visitor-counter

# Stop
pm2 stop visitor-counter
```

---

## 📝 Notes
- If PostgreSQL is not available, the app automatically falls back to an in-memory counter.
- The in-memory fallback does not support notes or stats — those require the database.
