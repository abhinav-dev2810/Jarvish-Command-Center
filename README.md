# Jarvish Command Center

Ek personal productivity dashboard aur OS-level distraction blocker — deep work sessions track karta hai, focus ke dauraan distracting websites block karta hai, aur real stats/streak dikhata hai.

## Features

- **Deep Work Timer** — 25/45/60 min focus sessions, start/pause/reset
- **OS-Level Kill Switch** — Focus session shuru hote hi YouTube, Reddit, Twitter jaisi sites Windows hosts file ke through block ho jaati hain
- **Today's Missions** — Supabase-backed task manager (add/edit/complete/delete)
- **Self-Investment Tracker** — Real focus hours aur streak ka GitHub-style heatmap
- **Live Stats** — Focus hours, tasks completed, aur current streak, real backend data se

## Tech Stack

- **Frontend:** Next.js (TypeScript, Tailwind CSS)
- **Backend 1:** FastAPI (`main.py`) — session tracking, stats, streak (port 8008)
- **Backend 2:** Flask (`kill_switch.py`) — hosts-file kill switch (port 5000)
- **Database:** Supabase (PostgreSQL) — tasks table
- **Local storage:** SQLite (`jarvish.db`) — session/stats history

## Setup & Running Locally

### Prerequisites
- Node.js installed
- Python installed
- Windows (kill switch hosts-file editing ke liye Admin rights chahiye)

### 1. Install dependencies

```bash
npm install
pip install -r requirements.txt --break-system-packages
```

### 2. Environment variables

`.env.local` file mein ye hona chahiye:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

### 3. Run all 3 servers (alag-alag terminals mein)

**Terminal 1 — FastAPI backend (Run as Administrator):**
```bash
python main.py
```
Runs on `http://127.0.0.1:8008`

**Terminal 2 — Flask kill-switch backend (Run as Administrator):**
```bash
python kill_switch.py
```
Runs on `http://127.0.0.1:5000`

**Terminal 3 — Next.js frontend (normal terminal):**
```bash
npm run dev
```
Runs on `http://localhost:3000`

> ⚠️ **Important:** Terminal 1 aur 2 dono **Administrator mode** mein chalane zaroori hain, warna hosts-file edit karte waqt `PermissionError` aayega.

### 4. Open the app

Browser mein `http://localhost:3000` khol.

## Known Limitations

- Microsoft Edge ka default "Secure DNS" hosts-file blocking ko bypass kar sakta hai. Chrome/Firefox mein blocking reliably kaam karti hai.
- Kill-Switch Panel mein kuch apps (Slack, Gmail) abhi sirf UI-level dikhte hain — actual OS-level block sirf YouTube, Reddit, aur Twitter ke liye implemented hai.

## Project Structure

app/                    → Next.js pages
components/dashboard/   → Dashboard UI components
context/                → Shared React context (focus mode state)
lib/                    → Supabase client setup
main.py                 → FastAPI backend (stats, sessions)
kill_switch.py          → Flask backend (hosts-file blocker)