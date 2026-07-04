"""
Jarvish Command Center - Local Python Daemon (Backend)
========================================================
Tech Stack : FastAPI + Uvicorn + SQLite + psutil + pywin32
Platform   : Windows 10/11 (uses win32gui/win32process for window-title inspection)

WHAT THIS DOES
--------------
1. Persists focus sessions + daily aggregate stats in a local SQLite file (jarvish.db).
2. Runs a background watchdog thread that, while Focus Mode is ACTIVE, scans all
   visible top-level windows on the machine every few seconds.
     - Apps in BLOCKED_PROCESS_NAMES are killed outright (psutil.terminate/kill).
     - Apps in WHITELISTED_PROCESS_NAMES (Cursor, VS Code, Chrome) are allowed to run,
       but if one of their *window titles* matches a blocked keyword
       (e.g. a Chrome tab titled "Instagram" or "Netflix"), we soft-kill just that
       WINDOW by posting WM_CLOSE to it -- this closes the offending tab/window
       without nuking the entire browser process (which would kill every other tab).
3. Exposes REST endpoints for the React frontend:
     POST /focus/start
     POST /focus/stop
     GET  /focus/status
     GET  /stats/today
     GET  /stats/graph

RUN
---
    pip install -r requirements.txt
    python main.py
    (Uvicorn serves on http://127.0.0.1:8008)

NOTE ON THE "KILL SWITCH"
--------------------------
Windows does not let you close a single browser *tab* from the outside in a
supported way -- the only officially addressable unit is a top-level window (HWND).
So the practical/robust approach (used below) is:
  - If the whole app is on the blacklist (e.g. a standalone "Instagram" or
    "Netflix" desktop app/PWA) -> kill the process.
  - If the offending content is a TAB inside a whitelisted browser -> close only
    that window via WM_CLOSE. This works well for pinned/"Open as window" PWAs
    (e.g. installing Netflix or Instagram as a Chrome App gives it its own HWND
    and its own window title), and for normal tabs where the tab title matches.
    It will NOT reach *inside* a single multi-tab window to close one tab among
    many, because a normal Chrome window can host many tabs. If you want
    per-tab granularity, install the distracting sites as separate "Chrome Apps"
    (chrome --app=https://...) so each gets its own window/process.
"""

import asyncio
import sqlite3
import sys
import threading
import time
from contextlib import contextmanager
from datetime import datetime, date, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import psutil

# --------------------------------------------------------------------------
# Windows-only imports (window title inspection + precise window close).
# Wrapped in try/except so the file can still be imported/linted on non-Windows
# machines; the watchdog simply no-ops if pywin32 isn't available.
# --------------------------------------------------------------------------
IS_WINDOWS = sys.platform == "win32"
WIN32_AVAILABLE = False
if IS_WINDOWS:
    try:
        import win32gui
        import win32process
        import win32con
        WIN32_AVAILABLE = True
    except ImportError:
        WIN32_AVAILABLE = False


# ==========================================================================
# CONFIG
# ==========================================================================

DB_PATH = "jarvish.db"
MONITOR_INTERVAL_SECONDS = 2.0  # how often the watchdog scans windows/processes

# Standalone apps that are ALWAYS killed the moment Focus Mode is active,
# regardless of window title (edit this list to taste).
BLOCKED_PROCESS_NAMES = {
    "instagram.exe",
    "netflix.exe",
    "spotify.exe",   # example extra distraction, remove if you want music allowed
    "discord.exe",
}

# Browser / editor processes that are allowed to run, but whose WINDOW TITLES
# are inspected for distracting content.
WHITELISTED_PROCESS_NAMES = {
    "chrome.exe",
    "code.exe",     # VS Code
    "cursor.exe",   # Cursor
}

# If a whitelisted app's window title contains any of these (case-insensitive),
# that specific window is soft-closed. Titles containing ALLOWED keywords are
# explicitly spared even if they'd otherwise match (e.g. "YouTube - Tutorials").
BLOCKED_TITLE_KEYWORDS = ["instagram", "netflix"]
ALLOWED_TITLE_OVERRIDES = ["youtube - tutorials"]


# ==========================================================================
# DATABASE LAYER
# ==========================================================================

@contextmanager
def get_db():
    """Context-managed SQLite connection. check_same_thread=False because the
    watchdog thread and the FastAPI event loop both touch the DB."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS focus_sessions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time      TEXT NOT NULL,
                end_time        TEXT,
                duration_minutes REAL,
                project_tag     TEXT
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS daily_stats (
                date               TEXT PRIMARY KEY,
                total_focus_hours  REAL NOT NULL DEFAULT 0,
                tasks_completed    INTEGER NOT NULL DEFAULT 0
            );
            """
        )


def upsert_daily_stats(day: str, add_hours: float = 0.0, add_tasks: int = 0):
    """Add to today's totals, creating the row if it doesn't exist yet."""
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO daily_stats (date, total_focus_hours, tasks_completed)
            VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                total_focus_hours = total_focus_hours + excluded.total_focus_hours,
                tasks_completed   = tasks_completed + excluded.tasks_completed
            """,
            (day, add_hours, add_tasks),
        )


def compute_streak(conn) -> int:
    """Count consecutive days (walking backwards from today) that have
    total_focus_hours > 0."""
    rows = conn.execute(
        "SELECT date, total_focus_hours FROM daily_stats ORDER BY date DESC"
    ).fetchall()
    stats_by_date = {r["date"]: r["total_focus_hours"] for r in rows}

    streak = 0
    cursor_day = date.today()
    while True:
        key = cursor_day.isoformat()
        if stats_by_date.get(key, 0) > 0:
            streak += 1
            cursor_day -= timedelta(days=1)
        else:
            break
    return streak


# ==========================================================================
# FOCUS STATE (in-memory, thread-safe)
# ==========================================================================

class FocusState:
    def __init__(self):
        self._lock = threading.Lock()
        self.active: bool = False
        self.session_start: Optional[datetime] = None
        self.project_tag: Optional[str] = None

    def start(self, project_tag: Optional[str]):
        with self._lock:
            self.active = True
            self.session_start = datetime.now()
            self.project_tag = project_tag

    def stop(self):
        """Returns (start_time, end_time, duration_minutes, project_tag) and
        resets state. Raises if no session was running."""
        with self._lock:
            if not self.active or self.session_start is None:
                raise ValueError("No active focus session to stop.")
            start = self.session_start
            end = datetime.now()
            duration_minutes = (end - start).total_seconds() / 60.0
            tag = self.project_tag
            self.active = False
            self.session_start = None
            self.project_tag = None
            return start, end, duration_minutes, tag

    def is_active(self) -> bool:
        with self._lock:
            return self.active

    def snapshot(self):
        with self._lock:
            return {
                "active": self.active,
                "session_start": self.session_start.isoformat() if self.session_start else None,
                "project_tag": self.project_tag,
            }


focus_state = FocusState()


# ==========================================================================
# WATCHDOG / KILL-SWITCH
# ==========================================================================

def _title_is_blocked(title: str) -> bool:
    lowered = title.lower().strip()
    if not lowered:
        return False
    for allowed in ALLOWED_TITLE_OVERRIDES:
        if allowed in lowered:
            return False
    for blocked in BLOCKED_TITLE_KEYWORDS:
        if blocked in lowered:
            return True
    return False


def _close_window_softly(hwnd) -> None:
    """Ask a single window to close (WM_CLOSE) instead of killing its whole
    process. This is the 'soft-kill' -- a normal browser will just close that
    one window/tab-group, not the entire application."""
    try:
        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
    except Exception as e:
        print(f"[watchdog] failed to close window {hwnd}: {e}")


def _kill_process(proc: psutil.Process) -> None:
    try:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except psutil.TimeoutExpired:
            proc.kill()
        print(f"[watchdog] killed blocked process: {proc.name()} (pid={proc.pid})")
    except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
        print(f"[watchdog] could not kill process {proc.pid}: {e}")


def _scan_and_enforce_windows():
    """Enumerate all visible top-level windows, cross-reference with the
    process that owns each one, and enforce the whitelist/blacklist rules."""

    def _enum_handler(hwnd, results):
        if not win32gui.IsWindowVisible(hwnd):
            return
        title = win32gui.GetWindowText(hwnd)
        if not title:
            return
        try:
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            proc = psutil.Process(pid)
            pname = proc.name().lower()
        except (psutil.NoSuchProcess, psutil.AccessDenied, Exception):
            return
        results.append((hwnd, pid, pname, title))

    windows = []
    win32gui.EnumWindows(_enum_handler, windows)

    for hwnd, pid, pname, title in windows:
        # Case 1: fully blacklisted standalone app -> kill the process entirely.
        if pname in BLOCKED_PROCESS_NAMES:
            try:
                _kill_process(psutil.Process(pid))
            except psutil.NoSuchProcess:
                pass
            continue

        # Case 2: whitelisted app, but window title looks distracting -> soft-close
        # just that window.
        if pname in WHITELISTED_PROCESS_NAMES and _title_is_blocked(title):
            print(f"[watchdog] soft-closing distracting window: '{title}' ({pname})")
            _close_window_softly(hwnd)


def _scan_and_enforce_processes_fallback():
    """Non-Windows / no-pywin32 fallback: can only enforce the blunt
    process-name blacklist (no window-title granularity)."""
    for proc in psutil.process_iter(attrs=["pid", "name"]):
        try:
            pname = (proc.info["name"] or "").lower()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
        if pname in BLOCKED_PROCESS_NAMES:
            _kill_process(proc)


def watchdog_loop(stop_event: threading.Event):
    """Runs forever in a daemon thread. Only takes action while Focus Mode
    is active."""
    print("[watchdog] thread started.")
    while not stop_event.is_set():
        try:
            if focus_state.is_active():
                if WIN32_AVAILABLE:
                    _scan_and_enforce_windows()
                else:
                    _scan_and_enforce_processes_fallback()
        except Exception as e:
            # Never let the watchdog thread die from a transient error
            # (e.g. a process/window disappearing mid-scan).
            print(f"[watchdog] error during scan: {e}")
        stop_event.wait(MONITOR_INTERVAL_SECONDS)
    print("[watchdog] thread stopped.")


# ==========================================================================
# FASTAPI APP
# ==========================================================================

app = FastAPI(title="Jarvish Command Center - Local Daemon", version="1.0.0")

# --- CORS Settings (Bridge to Frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Iska matlab React kisi bhi port se request bhej sakta hai
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



_watchdog_stop_event = threading.Event()
_watchdog_thread: Optional[threading.Thread] = None


@app.on_event("startup")
def on_startup():
    init_db()
    global _watchdog_thread
    if not WIN32_AVAILABLE and IS_WINDOWS:
        print(
            "[startup] WARNING: pywin32 not installed. Window-title based "
            "blocking is disabled; only the blunt process-name blacklist "
            "will be enforced. Run: pip install pywin32"
        )
    elif not IS_WINDOWS:
        print("[startup] WARNING: not running on Windows. Falling back to "
              "process-name-only enforcement (no window title inspection).")
    _watchdog_thread = threading.Thread(
        target=watchdog_loop, args=(_watchdog_stop_event,), daemon=True
    )
    _watchdog_thread.start()


@app.on_event("shutdown")
def on_shutdown():
    _watchdog_stop_event.set()
    if _watchdog_thread:
        _watchdog_thread.join(timeout=5)


# --------------------------------------------------------------------------
# Pydantic request/response models
# --------------------------------------------------------------------------

class FocusStartRequest(BaseModel):
    project_tag: Optional[str] = None


class FocusStopRequest(BaseModel):
    tasks_completed: int = 0  # optional: increment today's completed-task count


class FocusSessionOut(BaseModel):
    start_time: str
    end_time: Optional[str] = None
    duration_minutes: Optional[float] = None
    project_tag: Optional[str] = None


class TodayStatsOut(BaseModel):
    date: str
    total_focus_hours: float
    tasks_completed: int
    streak_days: int
    focus_active: bool


class GraphPointOut(BaseModel):
    date: str
    total_focus_hours: float
    tasks_completed: int


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.post("/focus/start", response_model=FocusSessionOut)
def start_focus(payload: FocusStartRequest):
    if focus_state.is_active():
        raise HTTPException(status_code=409, detail="A focus session is already active.")
    focus_state.start(payload.project_tag)
    snap = focus_state.snapshot()
    return FocusSessionOut(
        start_time=snap["session_start"],
        end_time=None,
        duration_minutes=None,
        project_tag=snap["project_tag"],
    )


@app.post("/focus/stop", response_model=FocusSessionOut)
def stop_focus(payload: FocusStopRequest):
    try:
        start, end, duration_minutes, tag = focus_state.stop()
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO focus_sessions (start_time, end_time, duration_minutes, project_tag)
            VALUES (?, ?, ?, ?)
            """,
            (start.isoformat(), end.isoformat(), duration_minutes, tag),
        )

    today_key = date.today().isoformat()
    upsert_daily_stats(
        today_key,
        add_hours=duration_minutes / 60.0,
        add_tasks=payload.tasks_completed,
    )

    return FocusSessionOut(
        start_time=start.isoformat(),
        end_time=end.isoformat(),
        duration_minutes=round(duration_minutes, 2),
        project_tag=tag,
    )


@app.get("/focus/status")
def focus_status():
    return focus_state.snapshot()


@app.get("/stats/today", response_model=TodayStatsOut)
def stats_today():
    today_key = date.today().isoformat()
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM daily_stats WHERE date = ?", (today_key,)
        ).fetchone()
        streak = compute_streak(conn)

    total_hours = row["total_focus_hours"] if row else 0.0
    tasks = row["tasks_completed"] if row else 0

    return TodayStatsOut(
        date=today_key,
        total_focus_hours=round(total_hours, 2),
        tasks_completed=tasks,
        streak_days=streak,
        focus_active=focus_state.is_active(),
    )


@app.get("/stats/graph", response_model=List[GraphPointOut])
def stats_graph():
    """Returns one row per day for the last 52 weeks (364 days) so the
    frontend can render a GitHub-style contribution/evolution graph. Days
    with no recorded activity are filled in with zeros so the grid is
    always a complete rectangle."""
    end = date.today()
    start = end - timedelta(days=364)  # 52 weeks * 7 days

    with get_db() as conn:
        rows = conn.execute(
            "SELECT date, total_focus_hours, tasks_completed FROM daily_stats "
            "WHERE date >= ? AND date <= ?",
            (start.isoformat(), end.isoformat()),
        ).fetchall()

    by_date = {r["date"]: r for r in rows}

    graph: List[GraphPointOut] = []
    cursor_day = start
    while cursor_day <= end:
        key = cursor_day.isoformat()
        r = by_date.get(key)
        graph.append(
            GraphPointOut(
                date=key,
                total_focus_hours=round(r["total_focus_hours"], 2) if r else 0.0,
                tasks_completed=r["tasks_completed"] if r else 0,
            )
        )
        cursor_day += timedelta(days=1)

    return graph


# ==========================================================================
# ENTRYPOINT
# ==========================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8008, reload=False)
