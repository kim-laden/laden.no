#!/usr/bin/env python3
"""Laden AS Gateway API — SQLite + JWT demo backend."""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import bcrypt
import jwt

BASE = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("LADEN_DB", str(BASE / "laden.db")))
JWT_SECRET = os.environ.get("LADEN_JWT_SECRET", "laden-v12-demo-change-me")
JWT_ALG = "HS256"
HOST = os.environ.get("LADEN_HOST", "127.0.0.1")
PORT = int(os.environ.get("LADEN_PORT", "18790"))
PUBLIC_PREFIX = os.environ.get("LADEN_PUBLIC_PREFIX", "/labs/api")
PUBLIC_SITE = os.environ.get("LADEN_PUBLIC_SITE", "https://laden.no").rstrip("/")
MAIL_FROM = os.environ.get("LADEN_MAIL_FROM", "noreply@laden.no")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
OUTBOX_DIR = Path(os.environ.get("LADEN_MAIL_OUTBOX", str(BASE / "mail-outbox")))
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

LABCARD_SKINS = (
    "default",
    "neon-grid",
    "purple-haze",
    "ice-ops",
    "ember",
    "matrix",
    "gold-op",
    "void",
)
LABCARD_COST = 10

AVATAR_IDS = (
    "av-01",
    "av-02",
    "av-03",
    "av-04",
    "av-05",
    "av-06",
    "av-07",
    "av-08",
    "av-09",
    "av-10",
    "av-11",
    "av-12",
    "custom-laden",
)
AVATAR_COST = 100
STARTER_LLT = 100

def random_starter_avatar() -> str:
    pool = [a for a in AVATAR_IDS if not str(a).startswith("custom-")]
    return secrets.choice(pool) if pool else "av-01"


def valid_avatar(avatar: str) -> bool:
    avatar = (avatar or "").strip()
    if avatar in AVATAR_IDS:
        return True
    return bool(__import__("re").fullmatch(r"custom-[a-z0-9-]+", avatar))


TITLE_CATALOG = {
    "scope-sentinel": {"label": "Scope Sentinel", "price": 25, "blurb": "Written permission first"},
    "packet-whisperer": {"label": "Packet Whisperer", "price": 40, "blurb": "Reads the wire calmly"},
    "header-hunter": {"label": "Header Hunter", "price": 50, "blurb": "X-* is treasure"},
    "flag-farmer": {"label": "Flag Farmer", "price": 75, "blurb": "LLZ{…} collector"},
    "bug-bard": {"label": "Bug Bard", "price": 90, "blurb": "Reports that sing"},
    "mentor": {"label": "Mentor", "price": 100, "blurb": "Teaches without spoilers"},
    "xss-sheriff": {"label": "XSS Sheriff", "price": 125, "blurb": "Escapes the wild west"},
    "jwt-jedi": {"label": "JWT Jedi", "price": 150, "blurb": "alg=none never again"},
    "ssrf-sage": {"label": "SSRF Sage", "price": 175, "blurb": "Metadata? Not today"},
    "zero-day-zen": {"label": "Zero-Day Zen", "price": 200, "blurb": "Calm before the PoC"},
    "ethical-overlord": {"label": "Ethical Overlord", "price": 250, "blurb": "Hunt ethically always"},
}


def title_label(title_id: str) -> str:
    tid = (title_id or "").strip()
    meta = TITLE_CATALOG.get(tid)
    return meta["label"] if meta else tid


def normalize_title(title_id: str) -> str:
    tid = (title_id or "").strip().lower()
    return tid if tid in TITLE_CATALOG else ""


def owned_titles(conn, user_id: int) -> list:
    try:
        rows = conn.execute(
            "SELECT title_id FROM user_titles WHERE user_id=? ORDER BY created_at, title_id",
            (user_id,),
        ).fetchall()
    except sqlite3.OperationalError:
        return []
    out = []
    for r in rows:
        tid = (r["title_id"] or "").strip()
        if tid in TITLE_CATALOG:
            out.append(tid)
    return out


def lab_id_for(user_id) -> str:
    try:
        uid = int(user_id)
    except (TypeError, ValueError):
        return ""
    if uid <= 0:
        return ""
    return f"969-{uid:03d}"


# ---------- helpers ----------

def db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def sha256hex(s: str) -> str:
    return hashlib.sha256(s.strip().encode()).hexdigest()


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()


def check_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False



def valid_email(email: str) -> bool:
    return bool(email and EMAIL_RE.match(email) and len(email) <= 254)



# Per-user account settings (JSON). Defaults are OFF / empty — never auto-enable LLD.
SETTINGS_ALLOWED_KEYS = frozenset({"lld_opt_in", "zocial"})  # language etc. later

ZOCIAL_TOOLS = (
    "burp", "nmap", "metasploit", "wireshark", "sqlmap", "ffuf", "gobuster",
    "hydra", "john", "hashcat", "aircrack-ng", "other",
)
ZOCIAL_DISTROS = ("kali", "parrot", "arch", "ubuntu", "debian", "fedora", "other")
ZOCIAL_TRACKS = ("web", "recon", "network", "wireless", "crypto", "forensics", "osint", "general")


def normalize_zocial(raw) -> dict:
    """Sanitize LabZocial profile fields stored under settings_json.zocial."""
    if not isinstance(raw, dict):
        raw = {}
    bio = str(raw.get("bio") or raw.get("about") or "").strip()[:280]
    tool = str(raw.get("fav_tool") or raw.get("tool") or "").strip()[:64]
    tool_l = tool.lower()
    # Keep free-text tools; normalize known presets to lowercase id
    if tool_l in ZOCIAL_TOOLS:
        tool = tool_l
    distro = str(raw.get("fav_distro") or raw.get("distro") or "").strip().lower()[:32]
    if distro and distro not in ZOCIAL_DISTROS:
        distro = "other"
    role_title = str(raw.get("role_title") or "").strip()[:64]
    location = str(raw.get("location") or raw.get("city") or "").strip()[:64]
    track = str(raw.get("fav_track") or raw.get("track") or "").strip().lower()[:32]
    if track and track not in ZOCIAL_TRACKS:
        track = "general"
    links_out = []
    links = raw.get("links")
    if isinstance(links, list):
        for item in links[:5]:
            if isinstance(item, str):
                url = item.strip()[:200]
                if url.startswith(("http://", "https://")):
                    links_out.append({"label": "", "url": url})
            elif isinstance(item, dict):
                url = str(item.get("url") or "").strip()[:200]
                label = str(item.get("label") or "").strip()[:40]
                if url.startswith(("http://", "https://")):
                    links_out.append({"label": label, "url": url})
    out = {
        "bio": bio,
        "fav_tool": tool,
        "fav_distro": distro,
        "role_title": role_title,
        "location": location,
        "fav_track": track,
        "links": links_out,
    }
    # Drop empties for sparse storage (keep empty bio as "" only if any field set)
    sparse = {k: v for k, v in out.items() if v not in ("", [], None)}
    return sparse


def parse_settings_json(raw) -> dict:
    if raw is None or raw == "":
        return {}
    if isinstance(raw, dict):
        src = raw
    else:
        try:
            src = json.loads(raw)
        except (TypeError, ValueError, json.JSONDecodeError):
            return {}
    if not isinstance(src, dict):
        return {}
    out = {}
    if "lld_opt_in" in src:
        out["lld_opt_in"] = bool(src.get("lld_opt_in"))
    if "zocial" in src:
        z = normalize_zocial(src.get("zocial"))
        if z:
            out["zocial"] = z
    return out


def user_settings_from_row(row) -> dict:
    if not row:
        return {}
    d = dict(row) if not isinstance(row, dict) else row
    return parse_settings_json(d.get("settings_json"))


def lld_opt_in_from_row(row) -> int:
    return 1 if user_settings_from_row(row).get("lld_opt_in") else 0


def merge_user_settings(conn, user_id: int, patch: dict) -> dict:
    """Merge allowed keys into users.settings_json. Unknown keys ignored. Returns new settings."""
    row = conn.execute("SELECT settings_json FROM users WHERE id=?", (user_id,)).fetchone()
    # Preserve raw then re-parse so we do not drop unknown future keys already stored
    raw = {}
    if row and row["settings_json"]:
        try:
            raw = json.loads(row["settings_json"]) if isinstance(row["settings_json"], str) else dict(row["settings_json"] or {})
        except (TypeError, ValueError, json.JSONDecodeError):
            raw = {}
    if not isinstance(raw, dict):
        raw = {}
    cur = parse_settings_json(raw)
    # Keep any non-managed keys already in DB
    for k, v in raw.items():
        if k not in SETTINGS_ALLOWED_KEYS and k not in cur:
            cur[k] = v
    if not isinstance(patch, dict):
        patch = {}
    for k, v in patch.items():
        if k not in SETTINGS_ALLOWED_KEYS:
            continue
        if k == "lld_opt_in":
            cur["lld_opt_in"] = bool(v)
        elif k == "zocial":
            if v is None:
                cur.pop("zocial", None)
            else:
                z = normalize_zocial(v if isinstance(v, dict) else {})
                if z:
                    cur["zocial"] = z
                else:
                    cur.pop("zocial", None)
        else:
            cur[k] = v
    payload = json.dumps(cur, separators=(",", ":"), sort_keys=True)
    try:
        conn.execute("UPDATE users SET settings_json=? WHERE id=?", (payload, user_id))
    except sqlite3.OperationalError:
        pass
    return parse_settings_json(cur)


def zocial_summary(settings_or_row) -> dict:
    if isinstance(settings_or_row, dict) and "settings_json" not in settings_or_row and "fav_tool" not in (settings_or_row.get("zocial") or {}):
        # may be settings dict or raw zocial
        if "zocial" in settings_or_row or "lld_opt_in" in settings_or_row:
            z = (settings_or_row.get("zocial") or {})
        else:
            z = settings_or_row
    else:
        z = user_settings_from_row(settings_or_row).get("zocial") or {}
    return normalize_zocial(z) if z else {}



def public_user(row, conn=None) -> dict:
    if not row:
        return {}
    d = dict(row) if not isinstance(row, dict) else row
    skin = d.get("labcard_skin") or "default"
    if skin not in LABCARD_SKINS:
        skin = "default"
    avatar = (d.get("avatar_id") or "").strip()
    if avatar and not valid_avatar(avatar):
        avatar = ""
    try:
        title = normalize_title(d.get("title") or "")
    except Exception:
        title = ""
    owned = []
    uid = d.get("id")
    if conn is not None and uid is not None:
        try:
            owned = owned_titles(conn, int(uid))
        except Exception:
            owned = []
    elif d.get("titles"):
        owned = [t for t in (d.get("titles") or []) if t in TITLE_CATALOG]
    if title and title not in owned:
        owned = list(owned) + [title]
    settings = user_settings_from_row(d)
    return {
        "id": d.get("id"),
        "username": d.get("username"),
        "display_name": d.get("display_name"),
        "email": d.get("email"),
        "email_verified": int(d.get("email_verified") or 0),
        "role": d.get("role"),
        "xp": d.get("xp") or 0,
        "llt": int(d.get("llt") if d.get("llt") is not None else 10),
        "labcard_skin": skin,
        "avatar_id": avatar,
        "avatar": avatar,
        "title": title,
        "title_label": title_label(title) if title else "",
        "titles": owned,
        "lab_id": lab_id_for(uid),
        "last_seen": d.get("last_seen") or None,
        "is_admin": 1 if (str(d.get("role") or "").lower() == "admin" or int(d.get("is_admin") or 0) == 1 or str(d.get("username") or "").lower() in ("laden", "admin")) else 0,
        "disabled": int(d.get("disabled") or 0) if d.get("disabled") is not None else 0,
        "settings": settings,
        "lld_opt_in": 1 if settings.get("lld_opt_in") else 0,
        "zocial": settings.get("zocial") or {},
    }

def public_zocial_profile(row, conn=None) -> dict:
    """Public LabZocial card — no email / secrets."""
    if not row:
        return {}
    u = public_user(row, conn)
    # Strip private fields
    for k in ("email", "email_verified", "settings", "disabled"):
        u.pop(k, None)
    z = u.get("zocial") if isinstance(u.get("zocial"), dict) else {}
    if not z:
        z = normalize_zocial(user_settings_from_row(row).get("zocial") or {})
    u["zocial"] = z
    try:
        ls = u.get("last_seen")
        online = False
        if ls:
            # SQLite datetime('now') is UTC-ish string; compare via SQL when possible
            online = False
            if conn is not None:
                hit = conn.execute(
                    """SELECT 1 AS o WHERE ? IS NOT NULL
                       AND datetime(?) >= datetime('now', ?)""",
                    (ls, ls, f"-{ONLINE_SECS} seconds"),
                ).fetchone()
                online = bool(hit)
        u["online"] = 1 if online else 0
    except Exception:
        u["online"] = 0
    return u


def llt_reward_for_points(points: int) -> int:
    return max(5, round(int(points or 0) / 10))


def ledger_add(conn, user_id: int, delta: int, reason: str):
    conn.execute(
        "INSERT INTO llt_ledger(user_id, delta, reason) VALUES (?,?,?)",
        (user_id, int(delta), reason),
    )


def llt_snapshot(conn, user_id: int) -> dict:
    try:
        row = conn.execute(
            "SELECT xp, llt, labcard_skin, avatar_id, title FROM users WHERE id=?",
            (user_id,),
        ).fetchone()
    except sqlite3.OperationalError:
        row = conn.execute(
            "SELECT xp, llt, labcard_skin, avatar_id FROM users WHERE id=?",
            (user_id,),
        ).fetchone()
    balance = int(row["llt"] if row and row["llt"] is not None else 10)
    xp = int(row["xp"] or 0) if row else 0
    skin = (row["labcard_skin"] if row else None) or "default"
    if skin not in LABCARD_SKINS:
        skin = "default"
    try:
        avatar = (row["avatar_id"] if row else None) or ""
    except (KeyError, IndexError, TypeError):
        avatar = ""
    avatar = str(avatar).strip()
    if avatar and not valid_avatar(avatar):
        avatar = ""
    try:
        title = normalize_title((row["title"] if row else None) or "")
    except (KeyError, IndexError, TypeError):
        title = ""
    titles = owned_titles(conn, user_id)
    earned = conn.execute(
        "SELECT COALESCE(SUM(delta),0) AS s FROM llt_ledger WHERE user_id=? AND delta>0",
        (user_id,),
    ).fetchone()["s"]
    spent = conn.execute(
        "SELECT COALESCE(SUM(-delta),0) AS s FROM llt_ledger WHERE user_id=? AND delta<0",
        (user_id,),
    ).fetchone()["s"]
    hints = [
        r["ref"]
        for r in conn.execute(
            "SELECT ref FROM llt_unlocks WHERE user_id=? AND kind='hint' ORDER BY id",
            (user_id,),
        )
    ]
    weeklies = [
        r["ref"]
        for r in conn.execute(
            "SELECT ref FROM llt_unlocks WHERE user_id=? AND kind='merch' ORDER BY id",
            (user_id,),
        )
    ]
    solved_count = conn.execute(
        "SELECT COUNT(*) AS c FROM solves WHERE user_id=?", (user_id,)
    ).fetchone()["c"]
    return {
        "balance": balance,
        "xp": xp,
        "earned": int(earned or 0),
        "spent": int(spent or 0),
        "hints": hints,
        "weeklies": weeklies,
        "solved_count": int(solved_count or 0),
        "labcard_skin": skin,
        "avatar_id": avatar,
        "avatar": avatar,
        "title": title,
        "title_label": title_label(title) if title else "",
        "titles": titles,
        "lab_id": lab_id_for(user_id),
    }

def queue_mail(to: str, subject: str, body: str) -> Path:
    """Always write to outbox; optionally POST to Resend if RESEND_API_KEY is set."""
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe = re.sub(r"[^a-zA-Z0-9._+-]+", "_", (to or "unknown"))[:60]
    path = OUTBOX_DIR / f"{ts}-{safe}-{secrets.token_hex(3)}.txt"
    content = (
        f"From: {MAIL_FROM}\n"
        f"To: {to}\n"
        f"Subject: {subject}\n"
        f"Date: {datetime.now(timezone.utc).isoformat()}\n"
        f"\n"
        f"{body}\n"
    )
    path.write_text(content, encoding="utf-8")
    if RESEND_API_KEY:
        try:
            import urllib.request
            payload = json.dumps({
                "from": MAIL_FROM,
                "to": [to],
                "subject": subject,
                "text": body,
            }).encode()
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=payload,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[mail] resend status={resp.status} to={to}")
        except Exception as e:
            print(f"[mail] resend failed (ignored): {e}")
    else:
        print(f"[mail] queued outbox={path.name} to={to}")
    return path



# ---------- Z Drive (LabDrive) — 10 MB floating quota per user ----------
ZDRIVE_QUOTA = 10 * 1024 * 1024  # 10 MiB max per account
ZDRIVE_MAX_FILE = 1 * 1024 * 1024  # 1 MiB per file
ZDRIVE_PATH_RE = re.compile(r"^(/[A-Za-z0-9._\-]+)(/[A-Za-z0-9._\-]+)*$|^/$")


def zdrive_norm(path: str) -> str | None:
    """Normalize a user-relative Z path to absolute form under /."""
    raw = (path or "").strip().replace("\\", "/")
    if not raw or raw in (".", "./"):
        return "/"
    if raw.startswith("Z:") or raw.startswith("z:"):
        raw = raw[2:]
    if raw.startswith("/z/") or raw == "/z":
        raw = raw[2:] or "/"
    if not raw.startswith("/"):
        raw = "/" + raw
    parts: list[str] = []
    for seg in raw.split("/"):
        if not seg or seg == ".":
            continue
        if seg == "..":
            if parts:
                parts.pop()
            continue
        if not re.fullmatch(r"[A-Za-z0-9._\-]+", seg):
            return None
        if len(seg) > 120:
            return None
        parts.append(seg)
    out = "/" + "/".join(parts) if parts else "/"
    if len(out) > 400:
        return None
    return out


def zdrive_parent(path: str) -> str:
    if path == "/":
        return "/"
    return path.rsplit("/", 1)[0] or "/"


def zdrive_name(path: str) -> str:
    if path == "/":
        return ""
    return path.rsplit("/", 1)[-1]


def zdrive_ensure_schema(conn) -> None:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS zdrive_nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          path TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('dir','file')),
          content TEXT NOT NULL DEFAULT '',
          size_bytes INTEGER NOT NULL DEFAULT 0,
          shared INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, path)
        )"""
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_zdrive_user ON zdrive_nodes(user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_zdrive_shared ON zdrive_nodes(shared) WHERE shared=1"
    )



def zdrive_forbidden_other_home(conn, user_id: int, username: str, path: str) -> bool:
    """True if path is under /labz/<other>/ (not this user's home)."""
    home = zdrive_home_path(username)
    if path == "/labz" or path == "/":
        return False
    if not path.startswith("/labz/"):
        return False
    # /labz/<someone>/...
    rest = path[len("/labz/"):]
    other = rest.split("/", 1)[0]
    mine = home[len("/labz/"):]
    if other and other != mine:
        return True
    return False


def zdrive_labz_peers(conn, username: str, limit: int = 12) -> list[str]:
    """Other active usernames to show as locked peers under /labz."""
    me = re.sub(r"[^a-zA-Z0-9._-]", "", (username or "").strip())[:24]
    try:
        rows = conn.execute(
            """SELECT username FROM users
               WHERE COALESCE(disabled,0)=0 AND username != ?
               ORDER BY datetime(COALESCE(last_seen, created_at)) DESC, id DESC LIMIT ?""",
            (me, limit),
        ).fetchall()
    except sqlite3.OperationalError:
        rows = conn.execute(
            """SELECT username FROM users
               WHERE COALESCE(disabled,0)=0 AND username != ?
               ORDER BY id DESC LIMIT ?""",
            (me, limit),
        ).fetchall()
    out = []
    for r in rows:
        u = re.sub(r"[^a-zA-Z0-9._-]", "", (r["username"] or "").strip())[:24]
        if u and u not in out and u != me:
            out.append(u)
    # pad with decoy ops if few users
    for decoy in ("ghost", "ops", "caleb", "mentor", "redteam"):
        if len(out) >= 6:
            break
        if decoy != me and decoy not in out:
            out.append(decoy)
    return out[:8]

def zdrive_home_path(username: str) -> str:
    u = re.sub(r"[^a-zA-Z0-9._-]", "", (username or "operator").strip())[:24] or "operator"
    return f"/labz/{u}"


def zdrive_put_dir(conn, user_id: int, path: str) -> None:
    if not zdrive_get(conn, user_id, path):
        conn.execute(
            "INSERT INTO zdrive_nodes(user_id, path, kind, content, size_bytes) VALUES (?,?, 'dir', '', 0)",
            (user_id, path),
        )


def zdrive_put_file(conn, user_id: int, path: str, content: str) -> None:
    if zdrive_get(conn, user_id, path):
        return
    content = content or ""
    conn.execute(
        """INSERT INTO zdrive_nodes(user_id, path, kind, content, size_bytes)
           VALUES (?,?, 'file', ?, ?)""",
        (user_id, path, content, len(content.encode("utf-8"))),
    )


def zdrive_ensure_root(conn, user_id: int, username: str | None = None) -> None:
    """Ensure / + /labz/<user>/{Documents,Downloads} + decoy FS + welcome."""
    zdrive_ensure_schema(conn)
    if not username:
        row = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
        username = (row["username"] if row else None) or "operator"
    home = zdrive_home_path(username)

    if not zdrive_get(conn, user_id, "/"):
        zdrive_put_dir(conn, user_id, "/")

    # Private home
    for d in ("/labz", home, f"{home}/Documents", f"{home}/Downloads"):
        zdrive_put_dir(conn, user_id, d)

    welcome = (
        f"Z Drive home — {home}\n"
        "Private LabDrive · 10 MB floating max · 1 MB per file\n\n"
        "Folders: Documents/  Downloads/\n"
        "Z is your Lab'z guide hub. LLC starts here when you are logged in.\n"
        "Other operators\' homes are off-limits.\n\n"
        "Try: ls -la · cd Documents · echo note > Documents/todo.txt · df\n"
        "Hunt: there may be a LLZ{…} flag somewhere in the decoy FS…\n"
    )
    zdrive_put_file(conn, user_id, f"{home}/README.txt", welcome)
    zdrive_put_file(
        conn, user_id, f"{home}/Documents/welcome.txt",
        "Drop operator notes here. This folder is yours alone.\n",
    )
    zdrive_put_file(
        conn, user_id, f"{home}/Downloads/.keep",
        "",
    )

    # Decoy "real" filesystem (per-user copy — isolated, not shared)
    decoys = [
        "/etc", "/etc/laden", "/var", "/var/log", "/var/log/laden",
        "/opt", "/opt/laden", "/opt/laden/secrets",
        "/root", "/root/.ssh", "/tmp", "/usr", "/usr/local", "/usr/local/bin",
        "/mnt", "/mnt/backup", "/mnt/backup/2024",
        "/proc", "/sys", "/boot", "/srv", "/srv/ftp",
    ]
    for d in decoys:
        zdrive_put_dir(conn, user_id, d)

    zdrive_put_file(conn, user_id, "/etc/hostname", "llc-zdrive\n")
    zdrive_put_file(conn, user_id, "/etc/passwd", "root:x:0:0:root:/root:/bin/bash\nladen:x:1000:1000:Lab Operator:/labz:/bin/bash\n")
    zdrive_put_file(conn, user_id, "/etc/laden/motd", "Authorized minds only. Hunt ethically.\n")
    zdrive_put_file(
        conn, user_id, "/var/log/laden/auth.log",
        "Sep 29 00:00:01 llc sshd: Accepted publickey for laden\n"
        "Sep 29 00:01:12 llc zdrive: home mount ok\n"
        "# red herring — no flag here\n",
    )
    zdrive_put_file(
        conn, user_id, "/opt/laden/secrets/README",
        "CLASSIFIED — do not commit\napi_key=sk_live_demo_do_not_use\n"
        "# still not the lab flag\n",
    )
    zdrive_put_file(
        conn, user_id, "/root/.ssh/authorized_keys",
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFakeKeyForDemoOnly laden@llc\n",
    )
    zdrive_put_file(
        conn, user_id, "/mnt/backup/2024/inventory.csv",
        "asset,owner,note\nweb01,ops,nginx\ndb01,ops,mysql\n",
    )
    zdrive_put_file(
        conn, user_id, "/srv/ftp/pub/notice.txt",
        "Anonymous FTP decoy. Nothing to see.\n",
    )
    # Flag challenge — slightly hidden
    zdrive_put_dir(conn, user_id, "/opt/laden/secrets/.shadow")
    zdrive_put_file(
        conn, user_id, "/opt/laden/secrets/.shadow/credentials.bak",
        "# rotated credentials backup — ignore\n"
        "admin=legacy\n"
        "hint: deeper\n",
    )
    zdrive_put_file(
        conn, user_id, "/opt/laden/secrets/.shadow/.flag",
        "You found the workstation flag.\n"
        "LLZ{zdrive_home_is_private_labz}\n",
    )
    zdrive_put_dir(conn, user_id, "/tmp/handshakes")
    zdrive_put_file(
        conn, user_id, "/tmp/handshakes/laden-guest.cap",
        "Laden Labs fictional WPA capture\nESSID: Laden-Guest\nBSSID: 02:13:37:ap:88:01\n"
        "# labcrack-ng /z/tmp/handshakes/laden-guest.cap -w Documents/wordlist.txt\n",
    )
    zdrive_put_file(
        conn, user_id, "/tmp/handshakes/iot-lab.cap",
        "Laden Labs fictional WPA capture\nESSID: IOT-LAB-SENSORS\nBSSID: 02:13:37:ap:88:04\n",
    )
    zdrive_put_dir(conn, user_id, "/usr/share")
    zdrive_put_dir(conn, user_id, "/usr/share/wordlists")
    zdrive_put_file(
        conn, user_id, "/usr/share/wordlists/lab-mini.txt",
        "password\n12345678\nladen-guest-2024\nlabnet\nchangeme\n",
    )
    zdrive_put_file(
        conn, user_id, "/tmp/TODO.txt",
        "- finish scope notes\n- check /opt/laden/secrets\n- do not peek other /labz/*\n",
    )


def zdrive_usage(conn, user_id: int) -> int:
    zdrive_ensure_schema(conn)
    row = conn.execute(
        "SELECT COALESCE(SUM(size_bytes),0) AS used FROM zdrive_nodes WHERE user_id=? AND kind='file'",
        (user_id,),
    ).fetchone()
    return int(row["used"] if row else 0)


def zdrive_get(conn, user_id: int, path: str):
    return conn.execute(
        "SELECT * FROM zdrive_nodes WHERE user_id=? AND path=?",
        (user_id, path),
    ).fetchone()


def zdrive_children(conn, user_id: int, path: str):
    if path == "/":
        # direct children: path like /name with no further slash
        rows = conn.execute(
            """SELECT * FROM zdrive_nodes
               WHERE user_id=? AND path != '/' AND path NOT LIKE '/%/%'
               ORDER BY kind DESC, path COLLATE NOCASE""",
            (user_id,),
        ).fetchall()
    else:
        prefix = path + "/"
        rows = conn.execute(
            """SELECT * FROM zdrive_nodes
               WHERE user_id=? AND path LIKE ? ESCAPE '\\'
               ORDER BY kind DESC, path COLLATE NOCASE""",
            (user_id, prefix.replace("%", "\\%") + "%"),
        ).fetchall()
        # only direct children
        depth = path.count("/") + 1
        rows = [r for r in rows if r["path"].count("/") == depth]
    return rows


def zdrive_mkdir(conn, user_id: int, path: str, parents: bool = False, username: str | None = None):
    zdrive_ensure_root(conn, user_id, username)
    path = zdrive_norm(path)
    if path is None or path == "/":
        return {"error": "invalid_path"}, 400
    if not username:
        row = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
        username = (row["username"] if row else None) or ""
    if zdrive_forbidden_other_home(conn, user_id, username, path):
        return {"error": "permission_denied"}, 403
    existing = zdrive_get(conn, user_id, path)
    if existing:
        if existing["kind"] == "dir":
            return {"ok": True, "path": path, "existed": True}, 200
        return {"error": "file_exists"}, 409
    parent = zdrive_parent(path)
    if parents:
        # create ancestor dirs
        parts = [p for p in path.split("/") if p]
        cur = ""
        for seg in parts:
            cur = cur + "/" + seg
            node = zdrive_get(conn, user_id, cur)
            if node and node["kind"] == "file":
                return {"error": "parent_is_file"}, 400
            if not node:
                conn.execute(
                    "INSERT INTO zdrive_nodes(user_id, path, kind) VALUES (?,?, 'dir')",
                    (user_id, cur),
                )
    else:
        pnode = zdrive_get(conn, user_id, parent)
        if not pnode or pnode["kind"] != "dir":
            return {"error": "no_parent"}, 400
        conn.execute(
            "INSERT INTO zdrive_nodes(user_id, path, kind) VALUES (?,?, 'dir')",
            (user_id, path),
        )
    conn.commit()
    return {"ok": True, "path": path}, 200


def zdrive_write(conn, user_id: int, path: str, content: str, append: bool = False, username: str | None = None):
    zdrive_ensure_root(conn, user_id, username)
    path = zdrive_norm(path)
    if path is None or path == "/":
        return {"error": "invalid_path"}, 400
    if not username:
        row = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
        username = (row["username"] if row else None) or ""
    if zdrive_forbidden_other_home(conn, user_id, username, path):
        return {"error": "permission_denied"}, 403
    if not isinstance(content, str):
        content = str(content or "")
    # reject huge payloads early
    if len(content.encode("utf-8")) > ZDRIVE_MAX_FILE:
        return {"error": "file_too_large", "max": ZDRIVE_MAX_FILE}, 400
    parent = zdrive_parent(path)
    pnode = zdrive_get(conn, user_id, parent)
    if not pnode or pnode["kind"] != "dir":
        return {"error": "no_parent"}, 400
    existing = zdrive_get(conn, user_id, path)
    if existing and existing["kind"] == "dir":
        return {"error": "is_directory"}, 400
    old_size = int(existing["size_bytes"]) if existing and existing["kind"] == "file" else 0
    if append and existing and existing["kind"] == "file":
        content = (existing["content"] or "") + content
    new_size = len(content.encode("utf-8"))
    if new_size > ZDRIVE_MAX_FILE:
        return {"error": "file_too_large", "max": ZDRIVE_MAX_FILE}, 400
    used = zdrive_usage(conn, user_id)
    if used - old_size + new_size > ZDRIVE_QUOTA:
        return {
            "error": "quota_exceeded",
            "used": used,
            "quota": ZDRIVE_QUOTA,
            "need": new_size,
        }, 413
    if existing:
        conn.execute(
            """UPDATE zdrive_nodes SET content=?, size_bytes=?, kind='file',
               updated_at=datetime('now') WHERE user_id=? AND path=?""",
            (content, new_size, user_id, path),
        )
    else:
        conn.execute(
            """INSERT INTO zdrive_nodes(user_id, path, kind, content, size_bytes)
               VALUES (?,?, 'file', ?, ?)""",
            (user_id, path, content, new_size),
        )
    conn.commit()
    used2 = zdrive_usage(conn, user_id)
    return {
        "ok": True,
        "path": path,
        "size": new_size,
        "used": used2,
        "quota": ZDRIVE_QUOTA,
    }, 200


def zdrive_rm(conn, user_id: int, path: str, recursive: bool = False, username: str | None = None):
    zdrive_ensure_root(conn, user_id, username)
    path = zdrive_norm(path)
    if path is None or path == "/":
        return {"error": "cannot_remove_root"}, 400
    if not username:
        row = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
        username = (row["username"] if row else None) or ""
    if zdrive_forbidden_other_home(conn, user_id, username, path):
        return {"error": "permission_denied"}, 403
    node = zdrive_get(conn, user_id, path)
    if not node:
        return {"error": "not_found"}, 404
    if node["kind"] == "dir":
        kids = conn.execute(
            "SELECT id FROM zdrive_nodes WHERE user_id=? AND path LIKE ? AND path != ?",
            (user_id, path + "/%", path),
        ).fetchall()
        if kids and not recursive:
            return {"error": "directory_not_empty"}, 400
        if recursive:
            conn.execute(
                "DELETE FROM zdrive_nodes WHERE user_id=? AND (path=? OR path LIKE ?)",
                (user_id, path, path + "/%"),
            )
        else:
            conn.execute(
                "DELETE FROM zdrive_nodes WHERE user_id=? AND path=?",
                (user_id, path),
            )
    else:
        conn.execute(
            "DELETE FROM zdrive_nodes WHERE user_id=? AND path=?",
            (user_id, path),
        )
    conn.commit()
    return {"ok": True, "used": zdrive_usage(conn, user_id), "quota": ZDRIVE_QUOTA}, 200


def zdrive_mv(conn, user_id: int, src: str, dst: str):
    src = zdrive_norm(src)
    dst = zdrive_norm(dst)
    if not src or not dst or src == "/" or dst == "/":
        return {"error": "invalid_path"}, 400
    node = zdrive_get(conn, user_id, src)
    if not node:
        return {"error": "not_found"}, 404
    if zdrive_get(conn, user_id, dst):
        return {"error": "dest_exists"}, 409
    parent = zdrive_parent(dst)
    pnode = zdrive_get(conn, user_id, parent)
    if not pnode or pnode["kind"] != "dir":
        return {"error": "no_parent"}, 400
    # rename node + descendants
    rows = conn.execute(
        "SELECT path FROM zdrive_nodes WHERE user_id=? AND (path=? OR path LIKE ?)",
        (user_id, src, src + "/%"),
    ).fetchall()
    for r in rows:
        old = r["path"]
        new = dst + old[len(src) :] if old != src else dst
        conn.execute(
            "UPDATE zdrive_nodes SET path=?, updated_at=datetime('now') WHERE user_id=? AND path=?",
            (new, user_id, old),
        )
    conn.commit()
    return {"ok": True, "path": dst}, 200


def zdrive_cp(conn, user_id: int, src: str, dst: str):
    src = zdrive_norm(src)
    dst = zdrive_norm(dst)
    if not src or not dst or dst == "/":
        return {"error": "invalid_path"}, 400
    node = zdrive_get(conn, user_id, src)
    if not node:
        return {"error": "not_found"}, 404
    if node["kind"] != "file":
        return {"error": "is_directory", "hint": "cp only files for now"}, 400
    return zdrive_write(conn, user_id, dst, node["content"] or "", append=False)


def zdrive_set_shared(conn, user_id: int, path: str, shared: bool):
    path = zdrive_norm(path)
    if not path or path == "/":
        return {"error": "invalid_path"}, 400
    node = zdrive_get(conn, user_id, path)
    if not node or node["kind"] != "file":
        return {"error": "not_found"}, 404
    conn.execute(
        "UPDATE zdrive_nodes SET shared=?, updated_at=datetime('now') WHERE user_id=? AND path=?",
        (1 if shared else 0, user_id, path),
    )
    conn.commit()
    return {"ok": True, "path": path, "shared": bool(shared)}, 200


def migrate():
    """Safely ALTER live DB: email columns, password_resets, unique email index, backfill."""
    with db() as conn:
        # ADD COLUMN IF NOT EXISTS via try/except (SQLite versions vary)
        alters = [
            "ALTER TABLE users ADD COLUMN email TEXT",
            "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN reset_token_hash TEXT",
            "ALTER TABLE users ADD COLUMN reset_expires TEXT",
            "ALTER TABLE users ADD COLUMN llt INTEGER NOT NULL DEFAULT 10",
            "ALTER TABLE users ADD COLUMN labcard_skin TEXT NOT NULL DEFAULT 'default'",
            "ALTER TABLE users ADD COLUMN avatar_id TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE users ADD COLUMN title TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE users ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'",
        ]
        for sql in alters:
            try:
                conn.execute(sql)
            except sqlite3.OperationalError:
                pass
        conn.execute(
            """CREATE TABLE IF NOT EXISTS password_resets (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              token_hash TEXT NOT NULL UNIQUE,
              expires_at TEXT NOT NULL,
              used_at TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS llt_unlocks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              kind TEXT NOT NULL,
              ref TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(user_id, kind, ref)
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS llt_ledger (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              delta INTEGER NOT NULL,
              reason TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS community_posts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              body TEXT NOT NULL,
              topic TEXT NOT NULL DEFAULT 'general',
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_posts_topic ON community_posts(topic)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC)"
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS user_titles (
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              title_id TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              PRIMARY KEY (user_id, title_id)
            )"""
        )
        # Preserve legacy migrated rows at 10 LLT; new registrations explicitly use STARTER_LLT.
        try:
            conn.execute("UPDATE users SET llt=10 WHERE llt IS NULL")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique "
                "ON users(email) WHERE email IS NOT NULL"
            )
        except sqlite3.OperationalError:
            pass
        # Backfill demo emails (skip if users table not ready yet)
        backfill = {
            "laden": "laden@laden.no",
            "grok": "grok@laden.no",
            "operator": "operator@laden.no",
            "newbie": "newbie@laden.no",
            "caleb": "caleb@laden.no",
            "admin": "admin@laden.no",
            "eple": "eple@laden.no",
        }
        try:
            for username, email in backfill.items():
                row = conn.execute(
                    "SELECT id, email FROM users WHERE username=? COLLATE NOCASE",
                    (username,),
                ).fetchone()
                if not row:
                    continue
                if row["email"] is None or str(row["email"]).strip() == "":
                    try:
                        conn.execute(
                            "UPDATE users SET email=? WHERE id=?",
                            (email, row["id"]),
                        )
                    except sqlite3.IntegrityError:
                        pass
        except sqlite3.OperationalError:
            pass
        # --- LLZ LabZocial social tables ---
        try:
            conn.execute("ALTER TABLE users ADD COLUMN last_seen TEXT")
        except sqlite3.OperationalError:
            pass
        conn.execute(
            """CREATE TABLE IF NOT EXISTS friendships (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              status TEXT NOT NULL DEFAULT 'pending',
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(user_a, user_b),
              CHECK (user_a != user_b),
              CHECK (status IN ('pending','accepted'))
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_friendships_b_status ON friendships(user_b, status)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_friendships_a_status ON friendships(user_a, status)"
        )

        # --- DM / messaging ---
        conn.execute(
            """CREATE TABLE IF NOT EXISTS dm_threads (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_low INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              user_high INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              updated_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(user_low, user_high),
              CHECK (user_low < user_high)
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS dm_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              thread_id INTEGER NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
              sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              kind TEXT NOT NULL DEFAULT 'user',
              body TEXT NOT NULL,
              meta TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              read_at TEXT
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id, id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dm_messages_recipient_unread ON dm_messages(recipient_id, read_at)"
        )

        conn.execute(
            """CREATE TABLE IF NOT EXISTS post_reactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              emoji TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(post_id, user_id, emoji)
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id)"
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS post_comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              body TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id)"
        )

        # --- LLA admin columns ---
        for sql in (
            "ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE community_posts ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE post_comments ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0",
        ):
            try:
                conn.execute(sql)
            except sqlite3.OperationalError:
                pass
        conn.execute(
            """CREATE TABLE IF NOT EXISTS admin_audit (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              actor_id INTEGER NOT NULL,
              action TEXT NOT NULL,
              target TEXT NOT NULL DEFAULT '',
              detail TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )"""
        )
        try:
            conn.execute(
                "UPDATE users SET is_admin=1 WHERE role='admin' OR lower(username) IN ('laden','admin')"
            )
        except sqlite3.OperationalError:
            pass

        zdrive_ensure_schema(conn)
        ensure_core_identities(conn)
        seed_llz_social(conn)
        conn.commit()


def make_token(user_id: int, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "usr": username,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return token if isinstance(token, str) else token.decode()


def user_from_auth(header: str | None):
    if not header or not header.lower().startswith("bearer "):
        return None
    token = header.split(" ", 1)[1].strip()
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = int(data.get("sub"))
    except Exception:
        return None
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        return dict(row) if row else None




def is_admin_user(user) -> bool:
    """Ops gate: is_admin column, role=admin, or usernames laden/admin."""
    if not user:
        return False
    try:
        if int(user.get("is_admin") or 0) == 1:
            return True
    except (TypeError, ValueError):
        pass
    if (user.get("role") or "").strip().lower() == "admin":
        return True
    if (user.get("username") or "").strip().lower() in ("laden", "admin"):
        return True
    return False


def user_disabled(user) -> bool:
    try:
        return int(user.get("disabled") or 0) == 1
    except (TypeError, ValueError):
        return False


def require_admin(user):
    """Return (code, body, ctype) error tuple, or None if OK."""
    if not user:
        return json_bytes({"error": "unauthorized"}, 401)
    if user_disabled(user):
        return json_bytes({"error": "account_disabled"}, 403)
    if not is_admin_user(user):
        return json_bytes({"error": "forbidden", "hint": "admin_only"}, 403)
    return None


def admin_audit(conn, actor_id: int, action: str, target: str = "", detail: str = ""):
    try:
        conn.execute(
            "INSERT INTO admin_audit(actor_id, action, target, detail) VALUES (?,?,?,?)",
            (int(actor_id), (action or "")[:80], (target or "")[:120], (detail or "")[:2000]),
        )
    except sqlite3.OperationalError:
        pass



def dm_pair(a, b):
    a, b = int(a), int(b)
    return (min(a, b), max(a, b))


def dm_get_or_create_thread(conn, a, b):
    """Return dm_threads row for users a,b (creates if missing)."""
    low, high = dm_pair(a, b)
    row = conn.execute(
        "SELECT * FROM dm_threads WHERE user_low=? AND user_high=?",
        (low, high),
    ).fetchone()
    if row:
        return dict(row)
    cur = conn.execute(
        "INSERT INTO dm_threads(user_low, user_high) VALUES (?,?)",
        (low, high),
    )
    tid = cur.lastrowid
    row = conn.execute("SELECT * FROM dm_threads WHERE id=?", (tid,)).fetchone()
    return dict(row)


def dm_resolve_peer(conn, to_val, self_id=None):
    """Resolve username or numeric id to a users row. Returns None if missing."""
    if to_val is None:
        return None
    s = str(to_val).strip()
    if not s:
        return None
    row = None
    if s.isdigit():
        row = conn.execute("SELECT * FROM users WHERE id=?", (int(s),)).fetchone()
    if not row:
        row = conn.execute(
            "SELECT * FROM users WHERE username=? COLLATE NOCASE", (s,)
        ).fetchone()
    return dict(row) if row else None


def dm_peer_public(row) -> dict:
    if not row:
        return {}
    d = dict(row) if not isinstance(row, dict) else row
    avatar = (d.get("avatar_id") or "").strip()
    return {
        "id": d.get("id"),
        "username": d.get("username"),
        "display_name": d.get("display_name"),
        "avatar_id": avatar,
    }


def dm_msg_public(row) -> dict:
    d = dict(row) if not isinstance(row, dict) else row
    return {
        "id": d.get("id"),
        "thread_id": d.get("thread_id"),
        "sender_id": d.get("sender_id"),
        "recipient_id": d.get("recipient_id"),
        "kind": d.get("kind") or "user",
        "body": d.get("body") or "",
        "meta": d.get("meta") or "",
        "created_at": d.get("created_at"),
        "read_at": d.get("read_at"),
    }



def admin_user_row(row, conn=None) -> dict:
    u = public_user(row, conn)
    d = dict(row) if not isinstance(row, dict) else row
    u["is_admin"] = 1 if is_admin_user(d) else 0
    try:
        u["disabled"] = int(d.get("disabled") or 0)
    except (TypeError, ValueError):
        u["disabled"] = 0
    u["created_at"] = d.get("created_at")
    return u


ONLINE_SECS = 5 * 60

def json_bytes(obj, code=200):
    body = json.dumps(obj, ensure_ascii=False).encode()
    return code, body, "application/json; charset=utf-8"


# ---------- seed ----------

CHALLENGES = [
  # track, slug, title, diff, pts, summary, learn, body_html, flag, hint, order
  ("gateway", "scope-first", "Scope First", "easy", 25,
   "The operator oath — read before you poke.",
   "Real bug bounties and pentests start with written scope. Out-of-scope testing is illegal and burns trust.",
   "<p>Read the scope plaque. The flag is the phrase we live by, wrapped in <code>LLZ{...}</code>.</p><pre class='mono'>AUTHORIZED TARGETS ONLY · NO SOCIAL ENGINEERING OF STAFF · REPORT, DON'T EXPLOIT BEYOND PoC</pre><p>Flag format uses underscores: the three-word motto of this platform's gateway.</p><p class='mono muted'>Motto: hunt ethically always</p>",
   "LLZ{hunt_ethically_always}", "Three words from the motto line.", 10),

  ("recon", "banner-grab-lite", "Banner Whisper", "easy", 40,
   "HTTP response headers leak stack clues.",
   "Recon is passive collection. Headers like Server, X-Powered-By, and custom X-* headers map attack surface without sending exploits.",
   "<p>Inspect these demo headers (imagine a response):</p><pre class='mono'>HTTP/1.1 200 OK\nServer: laden-gw/1.2\nX-Powered-By: ethical-coffee\nX-Laden-Trace: LLZ{headers_tell_stories}\nContent-Type: text/html</pre>",
   "LLZ{headers_tell_stories}", "Look at X-Laden-Trace.", 20),

  ("recon", "robots-redux", "Robots Redux", "easy", 50,
   "robots.txt is a treasure map, not a lock.",
   "Disallow entries are requests to crawlers, not access controls. Hunters always fetch /robots.txt early.",
   "<p>Open <a href='/labs/targets/robots.txt' target='_blank' rel='noopener'>/labs/targets/robots.txt</a> and find the flagged path note.</p>",
   "LLZ{robots_are_hints}", "Follow Disallow comments.", 30),

  ("recon", "hidden-dir", "Hidden Directory", "easy", 60,
   "Guessable paths and backup files.",
   "Common wordlists find .bak, .old, /admin, /.git. Directory brute-forcing must stay in scope.",
   "<p>Try fetching <a href='/labs/targets/backup/index.bak' target='_blank' rel='noopener'>/labs/targets/backup/index.bak</a>.</p>",
   "LLZ{backups_are_loot}", "Classic .bak extension.", 40),

  ("web", "reflect-101", "Reflection 101", "easy", 70,
   "Unescaped reflection → XSS class bugs.",
   "Cross-site scripting runs attacker script in a victim browser. Start by finding where input is echoed.",
   "<p>Use the echo lab: <a href='/labs/targets/echo.html' target='_blank' rel='noopener'>/labs/targets/echo.html</a>. Inject a script that contains <code>alert</code>; the lab reveals the flag.</p>",
   "LLZ{reflect_then_report}", "script + alert in the echo box.", 50),

  ("web", "cookie-jar", "Cookie Jar", "easy", 55,
   "Session cookies without flags.",
   "Secure, HttpOnly, and SameSite reduce theft and CSRF risk. Missing flags are reportable findings.",
   "<p>Demo Set-Cookie line:</p><pre class='mono'>Set-Cookie: session=demo; Path=/; SameSite=None</pre><p>What's missing that hunters mention first? Encode the answer as <code>LLZ{missing_httponly_secure}</code> style — specifically the two flags often cited together.</p>",
   "LLZ{missing_httponly_secure}", "HttpOnly and Secure.", 60),

  ("crypto", "b64-again", "Encoding ≠ Encryption", "easy", 50,
   "Base64 is reversible by design.",
   "Encoding changes representation. Encryption needs a key. Confusing them is a common junior mistake — and a common 'secret' in the wild.",
   "<p>Decode: <code class='mono'>TExae2VuY29kaW5nX2lzX25vdF9jcnlwdG99</code></p>",
   "LLZ{encoding_is_not_crypto}", "echo | base64 -d", 70),

  ("crypto", "rot-warm", "Caesar Warmup", "easy", 45,
   "ROT13 still shows up in jokes and CTFs.",
   "Classical ciphers teach frequency thinking. Production secrets never rely on them.",
   "<p>ROT13: <code class='mono'>YYM{ebg_vf_abg_frpher}</code></p>",
   "LLZ{rot_is_not_secure}", "Apply ROT13 twice to verify.", 80),

  ("crypto", "hash-id", "Hash Identification", "med", 90,
   "Recognize common digests before cracking.",
   "MD5=32 hex, SHA-1=40, SHA-256=64. Identification guides tooling (hashcat modes).",
   "<p>This digest is 64 hex chars of the word <code>laden</code> with SHA-256. Flag wraps the algorithm name:</p><pre class='mono'>e3b0c442... wait, compute sha256('laden') yourself.</pre><p>Flag: <code>LLZ{sha256}</code> style naming the algo used for password 'laden'.</p>",
   "LLZ{sha256}", "64 hex → sha256.", 90),

  ("auth", "jwt-none", "alg=none Nightmares", "med", 120,
   "Accepting alg=none forges identity.",
   "JWT header chooses the algorithm. Libraries that honor 'none' let attackers strip signatures. Always whitelist algs server-side.",
   "<p>Decode the payload of:</p><pre class='mono' style='white-space:pre-wrap;word-break:break-all'>eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4iLCJmbGFnIjoiTExae2p3dF9ub25lX2lzX2Jyb2tlbn0ifQ.</pre>",
   "LLZ{jwt_none_is_broken}", "Base64url decode middle part.", 100),

  ("auth", "idor-desk", "IDOR Desk", "med", 110,
   "Insecure Direct Object Reference.",
   "If changing ?id=5→6 shows another user's data without authz checks, that's IDOR — a top bug-bounty class.",
   "<p>Open <a href='/labs/targets/idor.html' target='_blank' rel='noopener'>/labs/targets/idor.html</a> and browse ticket IDs. Ticket 7 is not yours…</p>",
   "LLZ{idor_check_authz}", "Try id=7.", 110),

  ("auth", "password-reset-poison", "Host Header Trust", "med", 130,
   "Password reset link poisoning concept.",
   "If reset emails use the Host header to build URLs, attackers can point victims to evil domains. Validate Host / use allowlists.",
   "<p>Imagine a reset link built as <code>https://{Host}/reset?token=…</code>. The safe pattern is a fixed canonical host. Flag documents the bug class:</p><p class='mono'>LLZ{host_header_poison}</p>",
   "LLZ{host_header_poison}", "It's in the learn text pattern.", 120),

  ("inject", "sqli-logic", "SQLi Logic Gate", "med", 140,
   "Boolean logic in login queries (conceptual).",
   "SQL injection breaks query structure. Even without a live DB dump, understanding ' OR '1'='1 teaches why parameterized queries matter.",
   "<p>Which payload is the classic tautology used in insecure string-built SQL logins? Submit as flag wrapping the payload with underscores instead of spaces/quotes:</p><p class='mono'>LLZ{or_1_equals_1}</p>",
   "LLZ{or_1_equals_1}", "Classic OR 1=1.", 130),

  ("inject", "cmd-metachar", "Metacharacters", "med", 125,
   "OS command injection primers.",
   "If user input hits a shell, ; | && ` $() break out. Prefer argv arrays, never shell=True.",
   "<p>Dangerous pattern: <code>os.system('ping ' + ip)</code>. Flag the defense mindset:</p><p class='mono'>LLZ{never_shell_user_input}</p>",
   "LLZ{never_shell_user_input}", "Defense-focused flag.", 140),

  ("network", "cors-wild", "CORS Wildcards", "med", 100,
   "Access-Control-Allow-Origin: * with credentials is broken thinking.",
   "CORS is a browser rule. Misconfig can let evil sites read authenticated responses. Never reflect arbitrary Origin with ACAO + credentials.",
   "<p>Bad pair: <code>ACAO: *</code> + <code>ACAC: true</code> (browsers reject, but reflecting Origin is the real bug). Flag:</p><p class='mono'>LLZ{cors_reflect_origin}</p>",
   "LLZ{cors_reflect_origin}", "Reflect Origin carefully.", 150),

  ("network", "open-redirect", "Open Redirect", "easy", 65,
   "Unvalidated next= / url= parameters.",
   "Open redirects aid phishing and OAuth token theft chains. Allowlist internal paths only.",
   "<p>Lab: <a href='/labs/targets/redirect.html?next=https://example.com' target='_blank' rel='noopener'>redirect.html?next=…</a>. The educational flag:</p><p class='mono'>LLZ{allowlist_redirects}</p>",
   "LLZ{allowlist_redirects}", "Defense flag on the lab page.", 160),

  ("cloud", "ssrf-mind", "SSRF Mindset", "hard", 180,
   "Server-side request forgery concepts.",
   "When a server fetches a URL you control, you may hit metadata IPs (169.254.169.254), internal admin panels, or file://. Block schemes + private ranges.",
   "<p>Classic cloud metadata IP for many providers starts with 169.254… Flag:</p><p class='mono'>LLZ{block_link_local_meta}</p>",
   "LLZ{block_link_local_meta}", "Link-local metadata.", 170),

  ("cloud", "path-traversal", "Traversal Taste", "med", 115,
   "../ sequences escape intended directories.",
   "Normalize paths, reject .., chroot/jail file access. Download endpoints are frequent victims.",
   "<p>Lab path pattern <code>/labs/files?name=../../etc/passwd</code> (conceptual). Flag:</p><p class='mono'>LLZ{normalize_and_reject_dotdot}</p>",
   "LLZ{normalize_and_reject_dotdot}", "dotdot defense.", 180),

  ("practice", "report-quality", "Report Like a Pro", "easy", 35,
   "Severity without a clear PoC wastes time.",
   "Great reports: summary, step-by-step PoC, impact, fix advice, scope note. Platforms rank hunters on signal quality.",
   "<p>Order the sections as an acronym FLAG: Findings summary, Log/steps, Adverse impact, Guidance fix — wrap as:</p><p class='mono'>LLZ{flag_report_structure}</p>",
   "LLZ{flag_report_structure}", "FLAG structure.", 190),

  ("practice", "cvss-feel", "CVSS Feel", "med", 80,
   "Score impact honestly.",
   "CVSS is a language for severity. Overscoring burns credibility; underscoring hides risk.",
   "<p>A stored XSS in an authenticated admin panel is usually High, not Critical like unauth RCE. Flag the honesty rule:</p><p class='mono'>LLZ{dont_inflate_cvss}</p>",
   "LLZ{dont_inflate_cvss}", "Honesty in scoring.", 200),

  ("web", "csp-bypass-talk", "CSP Conversations", "hard", 160,
   "Content-Security-Policy raises the bar.",
   "CSP limits script sources. Weak policies ('unsafe-inline', wild CDNs) fail open. Hunters note CSP as defense-in-depth, not a silver bullet.",
   "<p>Flag the dangerous source token often blamed:</p><p class='mono'>LLZ{unsafe_inline}</p>",
   "LLZ{unsafe_inline}", "CSP keyword.", 210),

  ("recon", "js-secrets", "JS Secret Sprawl", "med", 105,
   "Frontend bundles leak API keys and admin URLs.",
   "Always review JavaScript for credentials, hidden routes, and feature flags. Rotate anything found; treat as compromised.",
   "<p>Open <a href='/labs/targets/app.bundle.js' target='_blank' rel='noopener'>/labs/targets/app.bundle.js</a>.</p>",
   "LLZ{rotate_leaked_keys}", "In the bundle comment.", 220),

  ("auth", "rate-limit", "Rate Limit Reality", "easy", 60,
   "Login endpoints without throttling.",
   "Credential stuffing loves quiet logins. Rate limits, lockouts, MFA, and anomaly alerts matter.",
   "<p>Educational flag for missing controls:</p><p class='mono'>LLZ{throttle_auth_endpoints}</p>",
   "LLZ{throttle_auth_endpoints}", "Throttle auth.", 230),

  ("network", "tls-old", "TLS Time Capsule", "easy", 40,
   "Old protocols still appear in scans.",
   "Disable SSLv3/TLS1.0/1.1. Hunters note weak ciphers as findings with clear remediations.",
   "<p>Flag:</p><p class='mono'>LLZ{disable_legacy_tls}</p>",
   "LLZ{disable_legacy_tls}", "Legacy TLS.", 240),
]

def flag_suggest(flag: str) -> str:
    """Public length hint: LLZ{....} with dots matching the keyword."""
    m = re.fullmatch(r"(?i)LLZ\{([^}]+)\}", (flag or "").strip())
    if not m:
        return "LLZ{...}"
    return "LLZ{" + ("." * len(m.group(1))) + "}"


FLAG_SUGGEST = {row[1]: flag_suggest(row[8]) for row in CHALLENGES}


FORUM = [
  ("Welcome to the Gateway", "This is Laden Labs — learn, practice in-scope, report cleanly. Demo accounts welcome.", "gateway,pinned", 1, 12),
  ("How I write bounty reports", "Template: summary → steps → impact → fix → residual risk.", "writeups,practice", 0, 8),
  ("Oslo lab night ideas", "Bring a laptop, leave the ego. Coffee optional, scope mandatory.", "oslo,social", 0, 5),
  ("JWT alg=none still in the wild?", "Share sanitized cases. No live targets in-thread.", "auth,web", 0, 11),
  ("Merch drop feedback", "Hoodie sizing + sticker ideas for the next drop.", "store", 0, 3),
]

PRODUCTS = [
  ("HOODIE-VG", "Laden Hoodie — Void Green", "apparel", 749, "Heavyweight operator layer.", "hoodie"),
  ("TEE-AUTH", "Tee — Authorized Only", "apparel", 329, "Soft print, hard boundaries.", "tee"),
  ("CAP-OPS", "Operator Cap", "apparel", 249, "Low profile L mark.", "cap"),
  ("STICKER-1", "Sticker Pack v1", "gear", 99, "Scope first / claw / grid.", "✦"),
  ("USB-DECOY", "Decoy USB (joke)", "gear", 149, "README says get authorization.", "usb"),
  ("MUG-ROOT", "Mug — Root Preferred", "desk", 199, "Fuel for long recon.", "mug"),
  ("PACK-SCOPE", "Daypack — Scope", "gear", 899, "Quiet branding, laptop sleeve.", "pack"),
  ("PASS-30", "Lab Pass — 30 days", "digital", 449, "Future season voucher (demo).", "pass"),
]

USERS = [
  # username, display_name, password, role, email
  # id 1 → laden (owner / 969-001), id 2 → grok (969-002) when seeded fresh
  ("laden", "Laden", "hunt-ethically", "admin", "laden@laden.no"),
  ("grok", "Grok Bot", "learn-first", "mentor", "grok@laden.no"),
  ("caleb", "Caleb", "openclaw-demo", "mentor", "caleb@laden.no"),
  ("admin", "Gateway Admin", "laden-gateway-demo", "admin", "admin@laden.no"),
]

DUMMY_HANDLES = [
    "packetfox", "scopeling", "flagfinch", "nullnudge", "hexhound",
    "rootling", "burpbee", "jwtjay", "ssrfowl", "xssling",
    "hashhare", "nmapnix", "curlcat", "idorib", "redirabbit",
    "cookiemole", "bannerbat", "robotsrook", "basebadger", "ethicosprey",
]


def ensure_core_identities(conn):
    """Live DB: id1=laden owner, id2=grok bot; seed 20 dummies with random xp/llt if missing."""
    import random
    # Rename operator → laden (keep password hash)
    row = conn.execute("SELECT id, username FROM users WHERE id=1").fetchone()
    if row:
        if (row["username"] or "").lower() == "operator":
            try:
                conn.execute(
                    "UPDATE users SET username=?, display_name=?, role=?, email=COALESCE(NULLIF(email,''), ?) WHERE id=1",
                    ("laden", "Laden", "admin", "laden@laden.no"),
                )
            except sqlite3.IntegrityError:
                # laden username already taken by another row — swap names carefully
                other = conn.execute(
                    "SELECT id FROM users WHERE username=? COLLATE NOCASE", ("laden",)
                ).fetchone()
                if other and other["id"] != 1:
                    conn.execute(
                        "UPDATE users SET username=? WHERE id=?",
                        (f"laden_old_{other['id']}", other["id"]),
                    )
                conn.execute(
                    "UPDATE users SET username=?, display_name=?, role=? WHERE id=1",
                    ("laden", "Laden", "admin"),
                )
        elif (row["username"] or "").lower() != "laden":
            # force id1 to laden if somehow else
            try:
                conn.execute(
                    "UPDATE users SET username=?, display_name=?, role=? WHERE id=1",
                    ("laden", "Laden", "admin"),
                )
            except sqlite3.IntegrityError:
                pass
        else:
            # already laden — ensure display_name + owner role
            conn.execute(
                "UPDATE users SET display_name=CASE WHEN display_name IS NULL OR display_name='' THEN ? ELSE display_name END, role=? WHERE id=1",
                ("Laden", "admin"),
            )

    # id2 → grok / Grok Bot (rename newbie or ensure)
    row2 = conn.execute("SELECT id, username FROM users WHERE id=2").fetchone()
    if row2:
        un = (row2["username"] or "").lower()
        if un in ("newbie", "llc") or un != "grok":
            if un != "grok":
                try:
                    conn.execute(
                        "UPDATE users SET username=?, display_name=?, role=?, email=COALESCE(NULLIF(email,''), ?) WHERE id=2",
                        ("grok", "Grok Bot", "mentor", "grok@laden.no"),
                    )
                except sqlite3.IntegrityError:
                    other = conn.execute(
                        "SELECT id FROM users WHERE username=? COLLATE NOCASE", ("grok",)
                    ).fetchone()
                    if other and other["id"] != 2:
                        conn.execute(
                            "UPDATE users SET username=? WHERE id=?",
                            (f"grok_old_{other['id']}", other["id"]),
                        )
                    conn.execute(
                        "UPDATE users SET username=?, display_name=?, role=? WHERE id=2",
                        ("grok", "Grok Bot", "mentor"),
                    )
    else:
        # no id2 — insert grok if username free (sqlite will assign next id; only if empty gap unlikely)
        pass

    # Email backfill keys for renamed accounts
    for username, email in (("laden", "laden@laden.no"), ("grok", "grok@laden.no")):
        r = conn.execute(
            "SELECT id, email FROM users WHERE username=? COLLATE NOCASE", (username,)
        ).fetchone()
        if r and (r["email"] is None or str(r["email"]).strip() == ""):
            try:
                conn.execute("UPDATE users SET email=? WHERE id=?", (email, r["id"]))
            except sqlite3.IntegrityError:
                pass

    # 20 dummy members with random xp/llt (skip if already present by username)
    existing = {
        (r["username"] or "").lower()
        for r in conn.execute("SELECT username FROM users").fetchall()
    }
    for handle in DUMMY_HANDLES:
        if handle.lower() in existing:
            continue
        xp = random.randint(0, 5000)
        llt = random.randint(10, 500)
        try:
            conn.execute(
                """INSERT INTO users(username, display_name, password_hash, role, email, email_verified, xp, llt)
                   VALUES (?,?,?,?,?,0,?,?)""",
                (
                    handle,
                    handle.replace("-", " ").title(),
                    hash_pw("dummy-" + handle),
                    "member",
                    f"{handle}@laden.no",
                    xp,
                    llt,
                ),
            )
        except sqlite3.IntegrityError:
            pass



LLZ_SEED_POSTS = [
    ("packetfox", "lls", "Just finished the IDOR desk — scope plaque still glowing. Anyone else hunting tonight?"),
    ("scopeling", "lls", "Lab coffee hit different when the flag starts with LLZ{"),
    ("flagfinch", "lls", "🔥 first react goes to whoever drops a clean Burp match-replace tip"),
    ("nullnudge", "lls", "Presence check: if you see this, you're already more social than my nmap scripts."),
    ("hexhound", "lls", "Friends > FOMO. Send a request, keep the spoilers tagged."),
    ("rootling", "lls", "Oslo midnight ops — headphones on, Wireshark filter locked, vibes ethical."),
    ("burpbee", "lls", "Short post energy: Repeater is a love language."),
    ("jwtjay", "lls", "alg=none is never the flex. JWT Jedi title still for sale tho."),
    ("ssrfowl", "lls", "Public LLS + friends-first sort = social as hell. Guests welcome to lurk."),
    ("xssling", "lls", "Tapback rules: 👍 solid · 🔥 spicy tip · 💀 when the lab owns you"),
    ("nmapnix", "lls", "-sn then -sC -sV. Always. Saying it again for the people in the back."),
    ("curlcat", "lls", "curl -I your ego before you curl production. Lab only."),
    ("ethicosprey", "lls", "Authorized targets only. The motto still hits."),
    ("cookiemole", "lls", "Session cookies in match-and-replace = hours saved. You're welcome."),
    ("basebadger", "lls", "Dummy crew seeding LLS so it never feels empty. Join us."),
]


def friend_ids(conn, user_id: int) -> set[int]:
    rows = conn.execute(
        """SELECT CASE WHEN user_a=? THEN user_b ELSE user_a END AS fid
           FROM friendships
           WHERE status='accepted' AND (user_a=? OR user_b=?)""",
        (user_id, user_id, user_id),
    ).fetchall()
    return {int(r["fid"]) for r in rows}


def enrich_posts(conn, rows, viewer_id: int | None = None, friend_set: set | None = None) -> list[dict]:
    out = []
    for r in rows:
        d = dict(r)
        pid = d["id"]
        reacts = conn.execute(
            """SELECT emoji, COUNT(*) AS c FROM post_reactions
               WHERE post_id=? GROUP BY emoji""",
            (pid,),
        ).fetchall()
        d["reactions"] = {row["emoji"]: row["c"] for row in reacts}
        d["comment_count"] = conn.execute(
            "SELECT COUNT(*) AS c FROM post_comments WHERE post_id=?", (pid,)
        ).fetchone()["c"]
        mine = []
        if viewer_id:
            mine = [
                row["emoji"]
                for row in conn.execute(
                    "SELECT emoji FROM post_reactions WHERE post_id=? AND user_id=?",
                    (pid, viewer_id),
                ).fetchall()
            ]
        d["my_reactions"] = mine
        uid = d.get("user_id")
        if friend_set is not None and uid is not None:
            d["from_friend"] = int(uid) in friend_set
        else:
            d["from_friend"] = False
        out.append(d)
    return out


def seed_llz_social(conn):
    """Seed LLZ LabZocial posts + friendships/reactions so Community feels alive."""
    # map username -> id
    users = {
        (r["username"] or "").lower(): r["id"]
        for r in conn.execute("SELECT id, username FROM users").fetchall()
    }
    existing = conn.execute(
        "SELECT COUNT(*) AS c FROM community_posts WHERE topic IN ('llz','feed','lls')"
    ).fetchone()["c"]
    if existing < 8:
        for handle, topic, body in LLZ_SEED_POSTS:
            uid = users.get(handle.lower())
            if not uid:
                continue
            dup = conn.execute(
                "SELECT 1 FROM community_posts WHERE user_id=? AND body=? LIMIT 1",
                (uid, body),
            ).fetchone()
            if dup:
                continue
            conn.execute(
                "INSERT INTO community_posts(user_id, body, topic) VALUES (?,?,?)",
                (uid, body, topic),
            )
    # a few accepted friendships among dummies
    pairs = [
        ("packetfox", "scopeling"),
        ("flagfinch", "nullnudge"),
        ("hexhound", "rootling"),
        ("burpbee", "jwtjay"),
        ("ssrfowl", "xssling"),
        ("nmapnix", "curlcat"),
        ("laden", "caleb"),
        ("grok", "caleb"),
        ("packetfox", "nmapnix"),
        ("ethicosprey", "basebadger"),
    ]
    for a, b in pairs:
        ua, ub = users.get(a), users.get(b)
        if not ua or not ub or ua == ub:
            continue
        lo, hi = (ua, ub) if ua < ub else (ub, ua)
        # store requester as first named
        exists = conn.execute(
            "SELECT 1 FROM friendships WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)",
            (ua, ub, ub, ua),
        ).fetchone()
        if exists:
            continue
        try:
            conn.execute(
                "INSERT INTO friendships(user_a, user_b, status) VALUES (?,?, 'accepted')",
                (ua, ub),
            )
        except sqlite3.IntegrityError:
            pass
    # sprinkle reactions on recent llz posts
    posts = conn.execute(
        "SELECT id FROM community_posts WHERE topic IN ('llz','lls') ORDER BY id DESC LIMIT 40"
    ).fetchall()
    reactors = [users.get(h) for h in ("packetfox", "burpbee", "xssling", "curlcat", "jwtjay", "scopeling") if users.get(h)]
    emojis = ["👍", "🔥", "💀"]
    for i, p in enumerate(posts):
        for j, uid in enumerate(reactors[: 2 + (i % 3)]):
            if not uid:
                continue
            emo = emojis[(i + j) % 3]
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO post_reactions(post_id, user_id, emoji) VALUES (?,?,?)",
                    (p["id"], uid, emo),
                )
            except sqlite3.IntegrityError:
                pass
    # a couple comments
    if posts:
        commenters = [("scopeling", "Solid energy — keep spoilers tagged."), ("jwtjay", "LLZ goes hard."), ("curlcat", "lurk mode: on")]
        for handle, body in commenters:
            uid = users.get(handle)
            if not uid:
                continue
            pid = posts[0]["id"]
            dup = conn.execute(
                "SELECT 1 FROM post_comments WHERE post_id=? AND user_id=? AND body=?",
                (pid, uid, body),
            ).fetchone()
            if dup:
                continue
            conn.execute(
                "INSERT INTO post_comments(post_id, user_id, body) VALUES (?,?,?)",
                (pid, uid, body),
            )



def migrate_challenge_flags():
    """Refresh challenge bodies + flag hashes to LLZ{...} without wiping solves."""
    with db() as conn:
        for track, slug, title, diff, pts, summary, learn, body, flag, hint, order in CHALLENGES:
            row = conn.execute("SELECT id FROM challenges WHERE slug=?", (slug,)).fetchone()
            h = sha256hex(flag)
            if not row:
                conn.execute(
                    """INSERT INTO challenges(slug,title,track,difficulty,points,summary,learn,body_html,flag_hash,hint,sort_order)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                    (slug, title, track, diff, pts, summary, learn, body, h, hint, order),
                )
            else:
                conn.execute(
                    """UPDATE challenges SET title=?, track=?, difficulty=?, points=?, summary=?, learn=?,
                       body_html=?, flag_hash=?, hint=?, sort_order=? WHERE slug=?""",
                    (title, track, diff, pts, summary, learn, body, h, hint, order, slug),
                )
        # Rewrite decoy Z flag file if still on legacy laden{ prefix
        try:
            rows = conn.execute(
                "SELECT user_id, path, content FROM zdrive_nodes WHERE kind='file' AND content LIKE '%laden{%'"
            ).fetchall()
            for r in rows:
                newc = (r["content"] or "").replace("laden{", "LLZ{").replace("Laden{", "LLZ{")
                if newc != r["content"]:
                    conn.execute(
                        "UPDATE zdrive_nodes SET content=?, size_bytes=? WHERE user_id=? AND path=?",
                        (newc, len(newc.encode("utf-8")), r["user_id"], r["path"]),
                    )
        except Exception:
            pass
        conn.commit()


def seed():
    schema = (BASE / "schema.sql").read_text()
    with db() as conn:
        conn.executescript(schema)
        n = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
        if n:
            return
        for u, d, pw, role, email in USERS:
            conn.execute(
                "INSERT INTO users(username, display_name, password_hash, role, email, email_verified) VALUES (?,?,?,?,?,0)",
                (u, d, hash_pw(pw), role, email),
            )
        for track, slug, title, diff, pts, summary, learn, body, flag, hint, order in CHALLENGES:
            conn.execute(
                """INSERT INTO challenges(slug,title,track,difficulty,points,summary,learn,body_html,flag_hash,hint,sort_order)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (slug, title, track, diff, pts, summary, learn, body, sha256hex(flag), hint, order),
            )
        op = conn.execute("SELECT id FROM users WHERE username='laden'").fetchone()["id"]
        for title, body, tags, pinned, replies in FORUM:
            conn.execute(
                "INSERT INTO forum_threads(title,body,author_id,tags,pinned,replies) VALUES (?,?,?,?,?,?)",
                (title, body, op, tags, pinned, replies),
            )
        for sku, name, cat, price, blurb, emoji in PRODUCTS:
            conn.execute(
                "INSERT INTO products(sku,name,category,price_nok,blurb,emoji) VALUES (?,?,?,?,?,?)",
                (sku, name, cat, price, blurb, emoji),
            )
        conn.execute(
            "INSERT INTO activity(kind,message) VALUES ('system', ?)",
            ("Laden gateway online — hunt ethically.",),
        )
        conn.commit()


# ---------- HTTP ----------


# --- LLO / Oracle: GitHub search proxy ---------------------------------
_ORACLE_TOKEN_CACHE = {"token": None, "loaded": False}
_ORACLE_RL = {}  # ip -> [timestamps]
_ORACLE_RL_LOCK = threading.Lock()
_ORACLE_RL_WINDOW = 60.0
_ORACLE_RL_MAX = 20  # gentle per-IP
_ORACLE_Q_RE = re.compile(r"[^\w\s\-\.\:/@#+*=\"'()\[\]{}|,<>!~^$\\]+", re.UNICODE)


def _oracle_github_token() -> str:
    if _ORACLE_TOKEN_CACHE["loaded"]:
        return _ORACLE_TOKEN_CACHE["token"] or ""
    tok = (os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or "").strip()
    if not tok:
        # fallback: gh auth token (dev / box); production should set GITHUB_TOKEN
        try:
            import subprocess
            r = subprocess.run(
                ["gh", "auth", "token"],
                capture_output=True, text=True, timeout=3,
            )
            if r.returncode == 0:
                tok = (r.stdout or "").strip()
        except Exception:
            tok = ""
    _ORACLE_TOKEN_CACHE["token"] = tok
    _ORACLE_TOKEN_CACHE["loaded"] = True
    return tok


def _oracle_client_ip(handler) -> str:
    xff = (handler.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff[:64]
    try:
        return handler.client_address[0]
    except Exception:
        return "unknown"


def _oracle_rate_ok(ip: str) -> bool:
    now = datetime.now(timezone.utc).timestamp()
    with _ORACLE_RL_LOCK:
        bucket = [t for t in _ORACLE_RL.get(ip, []) if now - t < _ORACLE_RL_WINDOW]
        if len(bucket) >= _ORACLE_RL_MAX:
            _ORACLE_RL[ip] = bucket
            return False
        bucket.append(now)
        _ORACLE_RL[ip] = bucket
        return True


def _oracle_sanitize_query(q: str) -> str:
    q = (q or "").strip()
    q = q[:256]
    # strip control chars / odd Unicode punctuation that can break GH search
    q = "".join(ch for ch in q if ord(ch) >= 32 or ch in "\t")
    q = _ORACLE_Q_RE.sub(" ", q)
    q = re.sub(r"\s+", " ", q).strip()
    return q


def _oracle_strip_text(s: str, limit: int = 400) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > limit:
        s = s[: limit - 1] + "…"
    return s


def _oracle_github_search(q: str, stype: str, per_page: int = 12) -> tuple[int, dict]:
    """Call GitHub REST search. Returns (http_code, payload)."""
    import urllib.error
    import urllib.parse
    import urllib.request

    token = _oracle_github_token()
    if not token:
        return 503, {
            "error": "oracle_unconfigured",
            "message": "GITHUB_TOKEN not set on gateway",
        }

    stype = (stype or "code").lower().strip()
    if stype not in ("code", "repositories", "issues"):
        stype = "code"
    per_page = max(1, min(int(per_page or 12), 20))

    endpoint = {
        "code": "https://api.github.com/search/code",
        "repositories": "https://api.github.com/search/repositories",
        "issues": "https://api.github.com/search/issues",
    }[stype]
    params = urllib.parse.urlencode({"q": q, "per_page": str(per_page)})
    url = f"{endpoint}?{params}"
    accept = (
        "application/vnd.github.text-match+json"
        if stype == "code"
        else "application/vnd.github+json"
    )
    headers = {
        "Accept": accept,
        "Authorization": f"Bearer {token}",
        "User-Agent": "LadenLabs-Oracle/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            data = json.loads(raw or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        detail = ""
        try:
            detail = (json.loads(body) or {}).get("message") or body[:200]
        except Exception:
            detail = body[:200]
        code = 429 if e.code == 403 and "rate" in detail.lower() else (502 if e.code >= 500 else e.code)
        if e.code == 401:
            return 502, {"error": "github_auth", "message": "GitHub token rejected"}
        if e.code == 403:
            return 429, {"error": "github_rate_or_forbidden", "message": detail or "GitHub forbidden"}
        return code if code in (400, 404, 422, 429) else 502, {
            "error": "github_error",
            "message": detail or f"GitHub HTTP {e.code}",
        }
    except Exception as e:
        return 502, {"error": "oracle_upstream", "message": str(e)[:200]}

    items_out = []
    for it in (data.get("items") or [])[:per_page]:
        if stype == "code":
            repo = (it.get("repository") or {})
            text_matches = it.get("text_matches") or []
            snippet = ""
            if text_matches:
                snippet = _oracle_strip_text(text_matches[0].get("fragment") or "", 500)
            items_out.append({
                "title": it.get("name") or it.get("path") or "file",
                "repo": repo.get("full_name") or "",
                "path": it.get("path") or "",
                "html_url": it.get("html_url") or "",
                "snippet": snippet,
                "language": repo.get("language") or "",
            })
        elif stype == "repositories":
            items_out.append({
                "title": it.get("full_name") or it.get("name") or "repo",
                "repo": it.get("full_name") or "",
                "path": "",
                "html_url": it.get("html_url") or "",
                "snippet": _oracle_strip_text(it.get("description") or "", 280),
                "language": it.get("language") or "",
                "state": f"★ {it.get('stargazers_count', 0)}",
            })
        else:  # issues (includes PRs)
            repo_url = it.get("repository_url") or ""
            repo_name = ""
            if "/repos/" in repo_url:
                repo_name = repo_url.split("/repos/", 1)[-1]
            items_out.append({
                "title": it.get("title") or f"#{it.get('number', '')}",
                "repo": repo_name,
                "path": f"#{it.get('number', '')}",
                "html_url": it.get("html_url") or "",
                "snippet": _oracle_strip_text(it.get("body") or "", 320),
                "state": it.get("state") or "",
            })

    return 200, {
        "ok": True,
        "type": stype,
        "q": q,
        "total_count": data.get("total_count", len(items_out)),
        "incomplete_results": bool(data.get("incomplete_results")),
        "items": items_out,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "LadenGW/labs"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (datetime.now().isoformat(timespec="seconds"), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "https://laden.no"))
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")

    def _send(self, code, body: bytes, ctype: str):
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode() or "{}")
        except Exception:
            return {}

    def _path(self):
        u = urlparse(self.path)
        path = u.path
        # accept both /v1.2/api/... (via proxy strip) and bare /...
        for prefix in (PUBLIC_PREFIX, "/api", ""):
            if prefix and path.startswith(prefix):
                path = path[len(prefix):] or "/"
                break
        if not path.startswith("/"):
            path = "/" + path
        return path, parse_qs(u.query)

    def do_OPTIONS(self):
        self._send(204, b"", "text/plain")

    def do_GET(self):
        path, qs = self._path()
        user = user_from_auth(self.headers.get("Authorization"))

        if path in ("/", "/health"):
            return self._send(*json_bytes({"ok": True, "service": "laden-gateway", "version": "1.3-llo", "lla": True, "oracle": True}))

        if path == "/oracle/search":
            ip = _oracle_client_ip(self)
            if not _oracle_rate_ok(ip):
                return self._send(*json_bytes({
                    "error": "rate_limited",
                    "message": "Gentle rate limit — wait a moment and ask again.",
                }, 429))
            q = _oracle_sanitize_query((qs.get("q") or [""])[0])
            if len(q) < 2:
                return self._send(*json_bytes({
                    "error": "bad_query",
                    "message": "Query too short — speak at least 2 characters.",
                }, 400))
            stype = ((qs.get("type") or ["code"])[0] or "code").lower()
            try:
                per_page = int((qs.get("per_page") or ["12"])[0])
            except ValueError:
                per_page = 12
            code, payload = _oracle_github_search(q, stype, per_page)
            return self._send(*json_bytes(payload, code))


        if path == "/challenges":
            with db() as conn:
                rows = conn.execute(
                    "SELECT id,slug,title,track,difficulty,points,summary,hint,sort_order FROM challenges ORDER BY sort_order"
                ).fetchall()
                solved = set()
                if user:
                    solved = {
                        r["challenge_id"]
                        for r in conn.execute("SELECT challenge_id FROM solves WHERE user_id=?", (user["id"],))
                    }
                out = []
                for r in rows:
                    d = dict(r)
                    d["solved"] = d["id"] in solved
                    out.append(d)
            return self._send(*json_bytes({"challenges": out}))

        m = re.fullmatch(r"/challenges/([a-z0-9-]+)", path)
        if m:
            slug = m.group(1)
            with db() as conn:
                r = conn.execute("SELECT * FROM challenges WHERE slug=?", (slug,)).fetchone()
                if not r:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                d = dict(r)
                d.pop("flag_hash", None)
                d["flag_suggest"] = FLAG_SUGGEST.get(slug, "LLZ{...}")
                if user:
                    s = conn.execute(
                        "SELECT 1 FROM solves WHERE user_id=? AND challenge_id=?",
                        (user["id"], d["id"]),
                    ).fetchone()
                    d["solved"] = bool(s)
                else:
                    d["solved"] = False
            return self._send(*json_bytes({"challenge": d}))

        if path == "/me":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                try:
                    conn.execute(
                        "UPDATE users SET last_seen=datetime('now') WHERE id=?",
                        (user["id"],),
                    )
                    conn.commit()
                except sqlite3.OperationalError:
                    pass
                row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
                solved = conn.execute(
                    "SELECT COUNT(*) AS c FROM solves WHERE user_id=?", (user["id"],)
                ).fetchone()["c"]
                total = conn.execute("SELECT COUNT(*) AS c FROM challenges").fetchone()["c"]
                u = public_user(row or user, conn)
                try:
                    u["friend_count"] = conn.execute(
                        """SELECT COUNT(*) AS c FROM friendships
                           WHERE status='accepted' AND (user_a=? OR user_b=?)""",
                        (user["id"], user["id"]),
                    ).fetchone()["c"]
                except sqlite3.OperationalError:
                    u["friend_count"] = 0
            u["solved"] = solved
            u["total_challenges"] = total
            return self._send(*json_bytes({"user": u}))

        if path == "/leaderboard":
            with db() as conn:
                rows = conn.execute(
                    """SELECT u.username, u.display_name, u.xp, u.llt,
                              (SELECT COUNT(*) FROM solves s WHERE s.user_id=u.id) AS solves
                       FROM users u ORDER BY u.xp DESC, solves DESC LIMIT 20"""
                ).fetchall()
            return self._send(*json_bytes({"leaders": [dict(r) for r in rows]}))

        if path == "/forum/threads":
            with db() as conn:
                rows = conn.execute(
                    """SELECT t.*, u.username AS author FROM forum_threads t
                       JOIN users u ON u.id=t.author_id
                       ORDER BY t.pinned DESC, t.created_at DESC"""
                ).fetchall()
            return self._send(*json_bytes({"threads": [dict(r) for r in rows]}))

        if path == "/store/products":
            with db() as conn:
                rows = conn.execute("SELECT * FROM products ORDER BY id").fetchall()
            return self._send(*json_bytes({"products": [dict(r) for r in rows]}))

        if path == "/activity":
            with db() as conn:
                rows = conn.execute(
                    "SELECT kind,message,created_at FROM activity ORDER BY id DESC LIMIT 30"
                ).fetchall()
            return self._send(*json_bytes({"activity": [dict(r) for r in rows]}))

        if path == "/tracks":
            with db() as conn:
                rows = conn.execute(
                    "SELECT track, COUNT(*) AS n FROM challenges GROUP BY track ORDER BY track"
                ).fetchall()
            return self._send(*json_bytes({"tracks": [dict(r) for r in rows]}))

        if path == "/llt":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                return self._send(*json_bytes(llt_snapshot(conn, user["id"])))

        if path == "/llt/titles":
            catalog = [
                {
                    "id": tid,
                    "label": meta["label"],
                    "price": meta["price"],
                    "blurb": meta["blurb"],
                }
                for tid, meta in TITLE_CATALOG.items()
            ]
            owned = []
            equipped = ""
            if user:
                with db() as conn:
                    owned = owned_titles(conn, user["id"])
                    try:
                        row = conn.execute(
                            "SELECT title FROM users WHERE id=?", (user["id"],)
                        ).fetchone()
                        equipped = normalize_title((row["title"] if row else None) or "")
                    except sqlite3.OperationalError:
                        equipped = ""
            return self._send(*json_bytes({
                "catalog": catalog,
                "owned": owned,
                "title": equipped,
                "title_label": title_label(equipped) if equipped else "",
            }))

        if path == "/community/posts":
            topic = (qs.get("topic", [None])[0] or "").strip()
            limit = 50
            try:
                limit = min(100, max(1, int((qs.get("limit", ["50"])[0] or "50"))))
            except ValueError:
                limit = 50
            with db() as conn:
                fset = friend_ids(conn, user["id"]) if user else set()
                # friends-first ordering when logged in
                order = "p.created_at DESC, p.id DESC"
                extra_select = ""
                params: list = []
                where = "WHERE COALESCE(p.hidden,0)=0"
                if topic:
                    where += " AND p.topic=?"
                    params.append(topic)
                if user and fset:
                    # CASE puts friend posts first
                    placeholders = ",".join("?" * len(fset))
                    order = f"(CASE WHEN p.user_id IN ({placeholders}) THEN 0 ELSE 1 END), p.created_at DESC, p.id DESC"
                    params.extend(sorted(fset))
                params.append(limit)
                sql = f"""SELECT p.id, p.user_id, p.body, p.topic, p.created_at,
                                 u.username AS author, u.display_name, u.last_seen AS author_last_seen
                          FROM community_posts p
                          JOIN users u ON u.id=p.user_id
                          {where}
                          ORDER BY {order} LIMIT ?"""
                try:
                    rows = conn.execute(sql, params).fetchall()
                except sqlite3.OperationalError:
                    # last_seen column may be missing mid-migrate
                    sql2 = f"""SELECT p.id, p.user_id, p.body, p.topic, p.created_at,
                                      u.username AS author, u.display_name
                               FROM community_posts p
                               JOIN users u ON u.id=p.user_id
                               {where}
                               ORDER BY p.created_at DESC, p.id DESC LIMIT ?"""
                    p2 = ([topic] if topic else []) + [limit]
                    rows = conn.execute(sql2, p2).fetchall()
                    fset = set()
                posts = enrich_posts(conn, rows, user["id"] if user else None, fset)
            return self._send(*json_bytes({"posts": posts}))

        m = re.fullmatch(r"/community/posts/(\d+)/comments", path)
        if m:
            pid = int(m.group(1))
            with db() as conn:
                post = conn.execute("SELECT id FROM community_posts WHERE id=?", (pid,)).fetchone()
                if not post:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                rows = conn.execute(
                    """SELECT c.id, c.body, c.created_at, u.username AS author, u.display_name
                       FROM post_comments c
                       JOIN users u ON u.id=c.user_id
                       WHERE c.post_id=? AND COALESCE(c.hidden,0)=0
                       ORDER BY c.created_at ASC LIMIT 100""",
                    (pid,),
                ).fetchall()
            return self._send(*json_bytes({"comments": [dict(r) for r in rows]}))

        if path == "/community/friends":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                accepted = conn.execute(
                    """SELECT f.id, f.status, f.created_at,
                              CASE WHEN f.user_a=? THEN f.user_b ELSE f.user_a END AS peer_id,
                              u.username, u.display_name, u.last_seen
                       FROM friendships f
                       JOIN users u ON u.id = CASE WHEN f.user_a=? THEN f.user_b ELSE f.user_a END
                       WHERE f.status='accepted' AND (f.user_a=? OR f.user_b=?)
                       ORDER BY u.username COLLATE NOCASE""",
                    (user["id"], user["id"], user["id"], user["id"]),
                ).fetchall()
                incoming = conn.execute(
                    """SELECT f.id, f.status, f.created_at, f.user_a AS from_id,
                              u.username, u.display_name, u.last_seen
                       FROM friendships f
                       JOIN users u ON u.id=f.user_a
                       WHERE f.user_b=? AND f.status='pending'
                       ORDER BY f.created_at DESC""",
                    (user["id"],),
                ).fetchall()
                outgoing = conn.execute(
                    """SELECT f.id, f.status, f.created_at, f.user_b AS to_id,
                              u.username, u.display_name, u.last_seen
                       FROM friendships f
                       JOIN users u ON u.id=f.user_b
                       WHERE f.user_a=? AND f.status='pending'
                       ORDER BY f.created_at DESC""",
                    (user["id"],),
                ).fetchall()
            return self._send(*json_bytes({
                "friends": [dict(r) for r in accepted],
                "incoming": [dict(r) for r in incoming],
                "outgoing": [dict(r) for r in outgoing],
            }))

        # ---------- LabZocial profiles / presence / search ----------
        if path in ("/community/online", "/zocial/online"):
            limit = 40
            try:
                limit = min(80, max(1, int((qs.get("limit") or ["40"])[0] or "40")))
            except ValueError:
                limit = 40
            with db() as conn:
                try:
                    rows = conn.execute(
                        f"""SELECT id, username, display_name, avatar_id, title, labcard_skin,
                                   last_seen, settings_json, role, xp, llt
                            FROM users
                            WHERE COALESCE(disabled,0)=0
                              AND last_seen IS NOT NULL
                              AND datetime(last_seen) >= datetime('now', ?)
                            ORDER BY last_seen DESC LIMIT ?""",
                        (f"-{ONLINE_SECS} seconds", limit),
                    ).fetchall()
                except sqlite3.OperationalError:
                    rows = []
                users_out = []
                for r in rows:
                    d = public_zocial_profile(r, conn)
                    users_out.append({
                        "id": d.get("id"),
                        "username": d.get("username"),
                        "display_name": d.get("display_name"),
                        "avatar_id": d.get("avatar_id") or "",
                        "title": d.get("title") or "",
                        "title_label": d.get("title_label") or "",
                        "labcard_skin": d.get("labcard_skin"),
                        "last_seen": d.get("last_seen"),
                        "online": 1,
                        "zocial": d.get("zocial") or {},
                        "lab_id": d.get("lab_id"),
                    })
            return self._send(*json_bytes({
                "users": users_out,
                "online_window_sec": ONLINE_SECS,
                "count": len(users_out),
            }))

        if path in ("/community/users/search", "/zocial/search", "/community/search"):
            q = ((qs.get("q") or [""])[0] or "").strip()[:64]
            if len(q) < 1:
                return self._send(*json_bytes({"users": [], "q": q}))
            limit = 20
            try:
                limit = min(40, max(1, int((qs.get("limit") or ["20"])[0] or "20")))
            except ValueError:
                limit = 20
            like = f"%{q}%"
            with db() as conn:
                rows = conn.execute(
                    """SELECT id, username, display_name, avatar_id, title, labcard_skin,
                              last_seen, settings_json, role, xp, llt
                       FROM users
                       WHERE COALESCE(disabled,0)=0
                         AND (username LIKE ? COLLATE NOCASE OR display_name LIKE ? COLLATE NOCASE)
                       ORDER BY
                         CASE WHEN username = ? COLLATE NOCASE THEN 0
                              WHEN username LIKE ? COLLATE NOCASE THEN 1
                              ELSE 2 END,
                         username COLLATE NOCASE
                       LIMIT ?""",
                    (like, like, q, f"{q}%", limit),
                ).fetchall()
                users_out = []
                for r in rows:
                    d = public_zocial_profile(r, conn)
                    users_out.append({
                        "id": d.get("id"),
                        "username": d.get("username"),
                        "display_name": d.get("display_name"),
                        "avatar_id": d.get("avatar_id") or "",
                        "title": d.get("title") or "",
                        "title_label": d.get("title_label") or "",
                        "labcard_skin": d.get("labcard_skin"),
                        "last_seen": d.get("last_seen"),
                        "online": d.get("online") or 0,
                        "zocial": d.get("zocial") or {},
                        "lab_id": d.get("lab_id"),
                        "profile_url": f"/community/u/{d.get('username')}/",
                    })
            return self._send(*json_bytes({"users": users_out, "q": q}))

        m_zocial = re.fullmatch(
            r"/(?:community/u|zocial)/(?!search$|online$|me$)([A-Za-z0-9_.-]{2,40})/?",
            path,
        )
        if m_zocial:
            uname = m_zocial.group(1)
            with db() as conn:
                row = conn.execute(
                    """SELECT * FROM users WHERE username=? COLLATE NOCASE AND COALESCE(disabled,0)=0""",
                    (uname,),
                ).fetchone()
                if not row:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                profile = public_zocial_profile(row, conn)
                relation = None
                if user and int(user["id"]) != int(row["id"]):
                    try:
                        fr = conn.execute(
                            """SELECT id, status, user_a, user_b FROM friendships
                               WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)""",
                            (user["id"], row["id"], row["id"], user["id"]),
                        ).fetchone()
                        if fr:
                            relation = {
                                "id": fr["id"],
                                "status": fr["status"],
                                "incoming": fr["status"] == "pending" and fr["user_b"] == user["id"],
                            }
                    except sqlite3.OperationalError:
                        relation = None
                profile["relation"] = relation
                profile["is_self"] = bool(user and int(user["id"]) == int(row["id"]))
            return self._send(*json_bytes({"user": profile, "profile": profile}))

        # ---------- DMs / messaging (read) ----------
        if path == "/messages/unread":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                try:
                    n = conn.execute(
                        """SELECT COUNT(*) AS c FROM dm_messages
                           WHERE recipient_id=? AND read_at IS NULL""",
                        (user["id"],),
                    ).fetchone()["c"]
                except sqlite3.OperationalError:
                    n = 0
            return self._send(*json_bytes({"count": int(n or 0)}))

        if path == "/messages/users":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            q = ((qs.get("q") or [""])[0] or "").strip()[:64]
            with db() as conn:
                if q:
                    like = f"%{q}%"
                    rows = conn.execute(
                        """SELECT id, username, display_name, avatar_id FROM users
                           WHERE id != ? AND COALESCE(disabled,0)=0
                             AND (username LIKE ? COLLATE NOCASE OR display_name LIKE ? COLLATE NOCASE)
                           ORDER BY username COLLATE NOCASE LIMIT 20""",
                        (user["id"], like, like),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """SELECT id, username, display_name, avatar_id FROM users
                           WHERE id != ? AND COALESCE(disabled,0)=0
                           ORDER BY username COLLATE NOCASE LIMIT 20""",
                        (user["id"],),
                    ).fetchall()
            return self._send(*json_bytes({
                "users": [dm_peer_public(r) for r in rows],
            }))

        if path == "/messages/inbox":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            uid = user["id"]
            with db() as conn:
                try:
                    threads = conn.execute(
                        """SELECT t.id, t.user_low, t.user_high, t.updated_at
                           FROM dm_threads t
                           WHERE t.user_low=? OR t.user_high=?
                           ORDER BY datetime(t.updated_at) DESC
                           LIMIT 100""",
                        (uid, uid),
                    ).fetchall()
                except sqlite3.OperationalError:
                    return self._send(*json_bytes({"threads": []}))
                out = []
                for t in threads:
                    peer_id = t["user_high"] if t["user_low"] == uid else t["user_low"]
                    peer = conn.execute(
                        "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                        (peer_id,),
                    ).fetchone()
                    last = conn.execute(
                        """SELECT id, body, kind, created_at, sender_id, recipient_id
                           FROM dm_messages WHERE thread_id=?
                           ORDER BY id DESC LIMIT 1""",
                        (t["id"],),
                    ).fetchone()
                    unread = conn.execute(
                        """SELECT COUNT(*) AS c FROM dm_messages
                           WHERE thread_id=? AND recipient_id=? AND read_at IS NULL""",
                        (t["id"], uid),
                    ).fetchone()["c"]
                    out.append({
                        "id": t["id"],
                        "peer": dm_peer_public(peer) if peer else {"id": peer_id, "username": "?", "display_name": "?", "avatar_id": ""},
                        "last": {
                            "id": last["id"],
                            "body": last["body"],
                            "kind": last["kind"],
                            "created_at": last["created_at"],
                            "sender_id": last["sender_id"],
                        } if last else None,
                        "unread": int(unread or 0),
                        "updated_at": t["updated_at"],
                    })
            return self._send(*json_bytes({"threads": out}))

        # GET /messages/thread?with=user  OR  /messages/thread/<id>
        m = re.fullmatch(r"/messages/thread(?:/(\d+))?", path)
        if m and (m.group(1) or (qs.get("with") or [""])[0] or (qs.get("id") or [""])[0]):
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            tid = int(m.group(1)) if m.group(1) else None
            with_val = ((qs.get("with") or [""])[0] or "").strip()
            if not tid and not with_val:
                id_q = ((qs.get("id") or [""])[0] or "").strip()
                if id_q.isdigit():
                    tid = int(id_q)
            uid = user["id"]
            with db() as conn:
                thread = None
                peer = None
                if tid:
                    thread = conn.execute("SELECT * FROM dm_threads WHERE id=?", (tid,)).fetchone()
                    if not thread:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    if uid not in (thread["user_low"], thread["user_high"]):
                        return self._send(*json_bytes({"error": "forbidden"}, 403))
                    peer_id = thread["user_high"] if thread["user_low"] == uid else thread["user_low"]
                    peer = conn.execute(
                        "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                        (peer_id,),
                    ).fetchone()
                else:
                    peer = dm_resolve_peer(conn, with_val, uid)
                    if not peer:
                        return self._send(*json_bytes({"error": "user_not_found"}, 404))
                    if peer["id"] == uid:
                        return self._send(*json_bytes({"error": "cannot_message_self"}, 400))
                    thread = conn.execute(
                        "SELECT * FROM dm_threads WHERE user_low=? AND user_high=?",
                        dm_pair(uid, peer["id"]),
                    ).fetchone()
                    if not thread:
                        # empty thread stub (not created until first send)
                        return self._send(*json_bytes({
                            "thread": None,
                            "peer": dm_peer_public(peer),
                            "messages": [],
                        }))
                tid = thread["id"]
                conn.execute(
                    """UPDATE dm_messages SET read_at=datetime('now')
                       WHERE thread_id=? AND recipient_id=? AND read_at IS NULL""",
                    (tid, uid),
                )
                conn.commit()
                rows = conn.execute(
                    """SELECT id, thread_id, sender_id, recipient_id, kind, body, meta, created_at, read_at
                       FROM dm_messages WHERE thread_id=?
                       ORDER BY id ASC LIMIT 500""",
                    (tid,),
                ).fetchall()
                if not peer:
                    peer_id = thread["user_high"] if thread["user_low"] == uid else thread["user_low"]
                    peer = conn.execute(
                        "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                        (peer_id,),
                    ).fetchone()
            return self._send(*json_bytes({
                "thread": {"id": tid, "updated_at": thread["updated_at"]},
                "peer": dm_peer_public(peer),
                "messages": [dm_msg_public(r) for r in rows],
            }))


        # ---------- LLA admin (read) ----------
        if path.startswith("/admin/") or path == "/admin":
            denied = require_admin(user)
            if denied:
                return self._send(*denied)

            if path in ("/admin", "/admin/", "/admin/overview"):
                with db() as conn:
                    users_n = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
                    try:
                        online_n = conn.execute(
                            """SELECT COUNT(*) AS c FROM users
                               WHERE last_seen IS NOT NULL
                               AND datetime(last_seen) >= datetime('now', ?)""",
                            (f"-{ONLINE_SECS} seconds",),
                        ).fetchone()["c"]
                    except sqlite3.OperationalError:
                        online_n = 0
                    llt_supply = conn.execute(
                        "SELECT COALESCE(SUM(llt),0) AS s FROM users"
                    ).fetchone()["s"]
                    solves_today = conn.execute(
                        """SELECT COUNT(*) AS c FROM solves
                           WHERE date(solved_at)=date('now')"""
                    ).fetchone()["c"]
                    posts_n = conn.execute("SELECT COUNT(*) AS c FROM community_posts").fetchone()["c"]
                    try:
                        comments_n = conn.execute("SELECT COUNT(*) AS c FROM post_comments").fetchone()["c"]
                    except sqlite3.OperationalError:
                        comments_n = 0
                    try:
                        reactions_n = conn.execute("SELECT COUNT(*) AS c FROM post_reactions").fetchone()["c"]
                    except sqlite3.OperationalError:
                        reactions_n = 0
                    challenges_n = conn.execute("SELECT COUNT(*) AS c FROM challenges").fetchone()["c"]
                    solves_n = conn.execute("SELECT COUNT(*) AS c FROM solves").fetchone()["c"]
                    try:
                        pending_friends = conn.execute(
                            "SELECT COUNT(*) AS c FROM friendships WHERE status='pending'"
                        ).fetchone()["c"]
                    except sqlite3.OperationalError:
                        pending_friends = 0
                    try:
                        disabled_n = conn.execute(
                            "SELECT COUNT(*) AS c FROM users WHERE COALESCE(disabled,0)=1"
                        ).fetchone()["c"]
                    except sqlite3.OperationalError:
                        disabled_n = 0
                    admins_n = conn.execute(
                        """SELECT COUNT(*) AS c FROM users
                           WHERE role='admin' OR COALESCE(is_admin,0)=1
                              OR lower(username) IN ('laden','admin')"""
                    ).fetchone()["c"]
                return self._send(*json_bytes({
                    "ok": True,
                    "service": "laden-gateway",
                    "version": "1.3-lla",
                    "stats": {
                        "users": users_n,
                        "online": online_n,
                        "online_window_sec": ONLINE_SECS,
                        "llt_supply": int(llt_supply or 0),
                        "solves_today": solves_today,
                        "solves_total": solves_n,
                        "posts": posts_n,
                        "comments": comments_n,
                        "reactions": reactions_n,
                        "challenges": challenges_n,
                        "pending_friend_requests": pending_friends,
                        "disabled_users": disabled_n,
                        "admins": admins_n,
                    },
                    "ops": {
                        "restart_hint": "ssh caleb@HOST 'sudo systemctl restart laden-gateway'",
                        "service": "laden-gateway",
                        "note": "Do not restart systemd from this UI.",
                    },
                }))

            if path == "/admin/activity":
                limit = 60
                try:
                    limit = min(200, max(1, int((qs.get("limit", ["60"])[0] or "60"))))
                except ValueError:
                    limit = 60
                items = []
                with db() as conn:
                    for r in conn.execute(
                        "SELECT id, kind, message, created_at FROM activity ORDER BY id DESC LIMIT ?",
                        (limit,),
                    ):
                        items.append({"source": "activity", **dict(r)})
                    for r in conn.execute(
                        """SELECT s.id, u.username, c.slug, c.title, s.solved_at AS created_at
                           FROM solves s
                           JOIN users u ON u.id=s.user_id
                           JOIN challenges c ON c.id=s.challenge_id
                           ORDER BY s.id DESC LIMIT ?""",
                        (min(40, limit),),
                    ):
                        items.append({
                            "source": "solve",
                            "kind": "solve",
                            "message": f"@{r['username']} solved {r['title']} ({r['slug']})",
                            "created_at": r["created_at"],
                            "id": r["id"],
                        })
                    try:
                        for r in conn.execute(
                            """SELECT l.id, l.delta, l.reason, l.created_at, u.username
                               FROM llt_ledger l JOIN users u ON u.id=l.user_id
                               ORDER BY l.id DESC LIMIT ?""",
                            (min(40, limit),),
                        ):
                            sign = "+" if int(r["delta"]) >= 0 else ""
                            items.append({
                                "source": "ledger",
                                "kind": "llt",
                                "message": f"@{r['username']} {sign}{r['delta']} LLT — {r['reason']}",
                                "created_at": r["created_at"],
                                "id": r["id"],
                            })
                    except sqlite3.OperationalError:
                        pass
                    try:
                        for r in conn.execute(
                            """SELECT p.id, p.body, p.topic, p.created_at, u.username,
                                      COALESCE(p.hidden,0) AS hidden
                               FROM community_posts p JOIN users u ON u.id=p.user_id
                               ORDER BY p.id DESC LIMIT ?""",
                            (min(30, limit),),
                        ):
                            body = (r["body"] or "")[:80]
                            items.append({
                                "source": "post",
                                "kind": "community",
                                "message": f"@{r['username']} #{r['topic']}: {body}",
                                "created_at": r["created_at"],
                                "id": r["id"],
                                "hidden": int(r["hidden"] or 0),
                            })
                    except sqlite3.OperationalError:
                        pass
                    try:
                        for r in conn.execute(
                            """SELECT f.id, f.status, f.created_at,
                                      a.username AS from_user, b.username AS to_user
                               FROM friendships f
                               JOIN users a ON a.id=f.user_a
                               JOIN users b ON b.id=f.user_b
                               WHERE f.status='pending'
                               ORDER BY f.id DESC LIMIT ?""",
                            (min(20, limit),),
                        ):
                            items.append({
                                "source": "friend",
                                "kind": "friend_request",
                                "message": f"@{r['from_user']} → @{r['to_user']} (pending)",
                                "created_at": r["created_at"],
                                "id": r["id"],
                            })
                    except sqlite3.OperationalError:
                        pass
                    try:
                        for r in conn.execute(
                            """SELECT id, actor_id, action, target, detail, created_at
                               FROM admin_audit ORDER BY id DESC LIMIT ?""",
                            (min(30, limit),),
                        ):
                            items.append({
                                "source": "audit",
                                "kind": "admin",
                                "message": f"admin#{r['actor_id']} {r['action']} {r['target']} {r['detail']}",
                                "created_at": r["created_at"],
                                "id": r["id"],
                            })
                    except sqlite3.OperationalError:
                        pass
                def _ts(it):
                    return it.get("created_at") or ""
                items.sort(key=_ts, reverse=True)
                return self._send(*json_bytes({"activity": items[:limit]}))

            if path == "/admin/users":
                q = (qs.get("q", [""])[0] or "").strip()
                limit = 100
                offset = 0
                try:
                    limit = min(500, max(1, int((qs.get("limit", ["100"])[0] or "100"))))
                    offset = max(0, int((qs.get("offset", ["0"])[0] or "0")))
                except ValueError:
                    pass
                with db() as conn:
                    if q:
                        like = f"%{q}%"
                        lab_id_match = None
                        mlab = re.fullmatch(r"969-(\d+)", q)
                        if mlab:
                            lab_id_match = int(mlab.group(1))
                        rows = conn.execute(
                            """SELECT * FROM users
                               WHERE username LIKE ? COLLATE NOCASE
                                  OR display_name LIKE ? COLLATE NOCASE
                                  OR IFNULL(email,'') LIKE ? COLLATE NOCASE
                                  OR CAST(id AS TEXT)=?
                                  OR id=?
                               ORDER BY id ASC LIMIT ? OFFSET ?""",
                            (like, like, like, q, lab_id_match if lab_id_match is not None else -1, limit, offset),
                        ).fetchall()
                        total = conn.execute(
                            """SELECT COUNT(*) AS c FROM users
                               WHERE username LIKE ? COLLATE NOCASE
                                  OR display_name LIKE ? COLLATE NOCASE
                                  OR IFNULL(email,'') LIKE ? COLLATE NOCASE
                                  OR CAST(id AS TEXT)=?
                                  OR id=?""",
                            (like, like, like, q, lab_id_match if lab_id_match is not None else -1),
                        ).fetchone()["c"]
                    else:
                        rows = conn.execute(
                            "SELECT * FROM users ORDER BY id ASC LIMIT ? OFFSET ?",
                            (limit, offset),
                        ).fetchall()
                        total = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
                    out = [admin_user_row(r, conn) for r in rows]
                return self._send(*json_bytes({"users": out, "total": total, "limit": limit, "offset": offset}))

            m = re.fullmatch(r"/admin/users/(\d+)", path)
            if m:
                uid = int(m.group(1))
                with db() as conn:
                    row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    return self._send(*json_bytes({"user": admin_user_row(row, conn)}))

            if path == "/admin/challenges":
                with db() as conn:
                    rows = conn.execute(
                        """SELECT c.id, c.slug, c.title, c.track, c.difficulty, c.points,
                                  c.summary, c.sort_order,
                                  (SELECT COUNT(*) FROM solves s WHERE s.challenge_id=c.id) AS solve_count
                           FROM challenges c ORDER BY c.sort_order, c.id"""
                    ).fetchall()
                return self._send(*json_bytes({"challenges": [dict(r) for r in rows]}))

            if path in ("/admin/llz", "/admin/llz/posts"):
                limit = 50
                try:
                    limit = min(200, max(1, int((qs.get("limit", ["50"])[0] or "50"))))
                except ValueError:
                    limit = 50
                include_hidden = (qs.get("all", ["1"])[0] or "1") != "0"
                with db() as conn:
                    where = "" if include_hidden else "WHERE COALESCE(p.hidden,0)=0"
                    rows = conn.execute(
                        f"""SELECT p.id, p.user_id, p.body, p.topic, p.created_at,
                                   COALESCE(p.hidden,0) AS hidden,
                                   u.username AS author, u.display_name,
                                   (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id) AS comments,
                                   (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id=p.id) AS reactions
                            FROM community_posts p
                            JOIN users u ON u.id=p.user_id
                            {where}
                            ORDER BY p.id DESC LIMIT ?""",
                        (limit,),
                    ).fetchall()
                return self._send(*json_bytes({"posts": [dict(r) for r in rows]}))


            # ---------- DM ops monitor (read-only; does NOT mark user read) ----------
            if path == "/admin/messages":
                limit = 50
                offset = 0
                try:
                    limit = min(200, max(1, int((qs.get("limit") or ["50"])[0] or "50")))
                except ValueError:
                    limit = 50
                try:
                    offset = max(0, int((qs.get("offset") or ["0"])[0] or "0"))
                except ValueError:
                    offset = 0
                q = ((qs.get("q") or [""])[0] or "").strip()[:120]
                user_f = ((qs.get("user") or [""])[0] or "").strip()[:64]
                kind_f = ((qs.get("kind") or [""])[0] or "").strip().lower()[:20]
                with db() as conn:
                    clauses = []
                    args = []
                    if kind_f:
                        clauses.append("m.kind=?")
                        args.append(kind_f)
                    if user_f:
                        peer = dm_resolve_peer(conn, user_f)
                        if peer:
                            clauses.append("(m.sender_id=? OR m.recipient_id=?)")
                            args.extend([peer["id"], peer["id"]])
                        else:
                            return self._send(*json_bytes({"messages": [], "total": 0, "limit": limit, "offset": offset}))
                    if q:
                        clauses.append("m.body LIKE ?")
                        args.append(f"%{q}%")
                    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
                    try:
                        total = conn.execute(
                            f"SELECT COUNT(*) AS c FROM dm_messages m {where}",
                            tuple(args),
                        ).fetchone()["c"]
                        rows = conn.execute(
                            f"""SELECT m.id, m.thread_id, m.sender_id, m.recipient_id, m.kind,
                                       m.body, m.meta, m.created_at, m.read_at,
                                       su.username AS sender, ru.username AS recipient
                                FROM dm_messages m
                                LEFT JOIN users su ON su.id=m.sender_id
                                JOIN users ru ON ru.id=m.recipient_id
                                {where}
                                ORDER BY m.id DESC LIMIT ? OFFSET ?""",
                            tuple(args) + (limit, offset),
                        ).fetchall()
                    except sqlite3.OperationalError:
                        return self._send(*json_bytes({"messages": [], "total": 0, "limit": limit, "offset": offset}))
                out = []
                for r in rows:
                    d = dict(r)
                    d["body_preview"] = (d.get("body") or "")[:160]
                    out.append(d)
                return self._send(*json_bytes({
                    "messages": out,
                    "total": int(total or 0),
                    "limit": limit,
                    "offset": offset,
                }))

            if path == "/admin/messages/threads":
                limit = 50
                offset = 0
                try:
                    limit = min(200, max(1, int((qs.get("limit") or ["50"])[0] or "50")))
                except ValueError:
                    limit = 50
                try:
                    offset = max(0, int((qs.get("offset") or ["0"])[0] or "0"))
                except ValueError:
                    offset = 0
                user_f = ((qs.get("user") or [""])[0] or "").strip()[:64]
                q = ((qs.get("q") or [""])[0] or "").strip()[:120]
                with db() as conn:
                    peer_id = None
                    if user_f:
                        peer = dm_resolve_peer(conn, user_f)
                        if not peer:
                            return self._send(*json_bytes({"threads": [], "total": 0}))
                        peer_id = peer["id"]
                    try:
                        if peer_id is not None:
                            threads = conn.execute(
                                """SELECT t.id, t.user_low, t.user_high, t.updated_at
                                   FROM dm_threads t
                                   WHERE t.user_low=? OR t.user_high=?
                                   ORDER BY datetime(t.updated_at) DESC
                                   LIMIT ? OFFSET ?""",
                                (peer_id, peer_id, limit, offset),
                            ).fetchall()
                            total = conn.execute(
                                """SELECT COUNT(*) AS c FROM dm_threads
                                   WHERE user_low=? OR user_high=?""",
                                (peer_id, peer_id),
                            ).fetchone()["c"]
                        else:
                            threads = conn.execute(
                                """SELECT t.id, t.user_low, t.user_high, t.updated_at
                                   FROM dm_threads t
                                   ORDER BY datetime(t.updated_at) DESC
                                   LIMIT ? OFFSET ?""",
                                (limit, offset),
                            ).fetchall()
                            total = conn.execute("SELECT COUNT(*) AS c FROM dm_threads").fetchone()["c"]
                    except sqlite3.OperationalError:
                        return self._send(*json_bytes({"threads": [], "total": 0}))
                    out = []
                    for t in threads:
                        u_low = conn.execute(
                            "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                            (t["user_low"],),
                        ).fetchone()
                        u_high = conn.execute(
                            "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                            (t["user_high"],),
                        ).fetchone()
                        last = conn.execute(
                            """SELECT id, body, kind, created_at, sender_id, recipient_id
                               FROM dm_messages WHERE thread_id=? ORDER BY id DESC LIMIT 1""",
                            (t["id"],),
                        ).fetchone()
                        msg_n = conn.execute(
                            "SELECT COUNT(*) AS c FROM dm_messages WHERE thread_id=?",
                            (t["id"],),
                        ).fetchone()["c"]
                        if q:
                            # filter: either participant username or last body contains q
                            hay = " ".join([
                                (u_low["username"] if u_low else ""),
                                (u_high["username"] if u_high else ""),
                                (last["body"] if last else ""),
                            ]).lower()
                            if q.lower() not in hay:
                                continue
                        out.append({
                            "id": t["id"],
                            "updated_at": t["updated_at"],
                            "message_count": int(msg_n or 0),
                            "participants": [
                                dm_peer_public(u_low) if u_low else {"id": t["user_low"]},
                                dm_peer_public(u_high) if u_high else {"id": t["user_high"]},
                            ],
                            "last": {
                                "id": last["id"],
                                "body": last["body"],
                                "kind": last["kind"],
                                "created_at": last["created_at"],
                                "sender_id": last["sender_id"],
                            } if last else None,
                        })
                return self._send(*json_bytes({"threads": out, "total": int(total or 0), "limit": limit, "offset": offset}))

            m = re.fullmatch(r"/admin/messages/thread/(\d+)", path)
            if m:
                tid = int(m.group(1))
                with db() as conn:
                    thread = conn.execute("SELECT * FROM dm_threads WHERE id=?", (tid,)).fetchone()
                    if not thread:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    u_low = conn.execute(
                        "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                        (thread["user_low"],),
                    ).fetchone()
                    u_high = conn.execute(
                        "SELECT id, username, display_name, avatar_id FROM users WHERE id=?",
                        (thread["user_high"],),
                    ).fetchone()
                    rows = conn.execute(
                        """SELECT id, thread_id, sender_id, recipient_id, kind, body, meta, created_at, read_at
                           FROM dm_messages WHERE thread_id=?
                           ORDER BY id ASC LIMIT 1000""",
                        (tid,),
                    ).fetchall()
                    # audit open — ops visibility
                    admin_audit(
                        conn, user["id"], "dm_monitor_open", f"thread:{tid}",
                        f"msgs={len(rows)} low={thread['user_low']} high={thread['user_high']}",
                    )
                    conn.commit()
                return self._send(*json_bytes({
                    "thread": {
                        "id": tid,
                        "updated_at": thread["updated_at"],
                        "user_low": thread["user_low"],
                        "user_high": thread["user_high"],
                    },
                    "participants": [
                        dm_peer_public(u_low) if u_low else {"id": thread["user_low"]},
                        dm_peer_public(u_high) if u_high else {"id": thread["user_high"]},
                    ],
                    "messages": [dm_msg_public(r) for r in rows],
                    # explicitly do NOT mark read_at
                    "note": "ops_audit_view · read_at unchanged",
                }))


            if path == "/admin/health":
                return self._send(*json_bytes({
                    "ok": True,
                    "service": "laden-gateway",
                    "version": "1.3-lla",
                    "lla": True,
                    "db": str(DB_PATH),
                    "restart_hint": "ssh caleb@VPS 'sudo systemctl restart laden-gateway'",
                }))

            if path == "/admin/audit":
                limit = 50
                try:
                    limit = min(200, max(1, int((qs.get("limit", ["50"])[0] or "50"))))
                except ValueError:
                    limit = 50
                with db() as conn:
                    try:
                        rows = conn.execute(
                            """SELECT a.*, u.username AS actor
                               FROM admin_audit a LEFT JOIN users u ON u.id=a.actor_id
                               ORDER BY a.id DESC LIMIT ?""",
                            (limit,),
                        ).fetchall()
                    except sqlite3.OperationalError:
                        rows = []
                return self._send(*json_bytes({"audit": [dict(r) for r in rows]}))

            return self._send(*json_bytes({"error": "not_found", "path": path}, 404))


        
        if path == "/zdrive/quota":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                zdrive_ensure_root(conn, user["id"], user.get("username"))
                conn.commit()
                used = zdrive_usage(conn, user["id"])
            return self._send(*json_bytes({
                "used": used,
                "quota": ZDRIVE_QUOTA,
                "max_file": ZDRIVE_MAX_FILE,
                "free": max(0, ZDRIVE_QUOTA - used),
                "mount": "/z",
                "home": zdrive_home_path(user.get("username") or ""),
            }))

        if path == "/zdrive/ls":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm((qs.get("path", ["/"])[0] or "/"))
            if zp is None:
                return self._send(*json_bytes({"error": "invalid_path"}, 400))
            with db() as conn:
                zdrive_ensure_root(conn, user["id"], user.get("username"))
                conn.commit()
                uname = user.get("username") or ""
                if zdrive_forbidden_other_home(conn, user["id"], uname, zp):
                    return self._send(*json_bytes({
                        "error": "permission_denied",
                        "message": "Permission denied — that is another operator's home.",
                        "path": zp,
                    }, 403))
                node = zdrive_get(conn, user["id"], zp)
                if not node:
                    # locked peer home stub
                    if zp.startswith("/labz/") and zp.count("/") == 2:
                        return self._send(*json_bytes({
                            "error": "permission_denied",
                            "message": "Permission denied — that is another operator's home.",
                            "path": zp,
                        }, 403))
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                if node["kind"] != "dir":
                    return self._send(*json_bytes({
                        "path": zp,
                        "kind": "file",
                        "size": int(node["size_bytes"] or 0),
                        "shared": bool(node["shared"]),
                        "entries": [],
                        "home": zdrive_home_path(uname),
                    }))
                kids = zdrive_children(conn, user["id"], zp)
                entries = [
                    {
                        "name": zdrive_name(r["path"]),
                        "path": r["path"],
                        "kind": r["kind"],
                        "size": int(r["size_bytes"] or 0),
                        "shared": bool(r["shared"]),
                        "updated_at": r["updated_at"],
                        "locked": False,
                    }
                    for r in kids
                ]
                if zp == "/labz":
                    mine = zdrive_name(zdrive_home_path(uname))
                    have = {e["name"] for e in entries}
                    for peer in zdrive_labz_peers(conn, uname):
                        if peer in have:
                            continue
                        entries.append({
                            "name": peer,
                            "path": f"/labz/{peer}",
                            "kind": "dir",
                            "size": 4096,
                            "shared": False,
                            "updated_at": None,
                            "locked": True,
                        })
                    # keep mine first
                    entries.sort(key=lambda e: (0 if e["name"] == mine else 1, e["name"].lower()))
                used = zdrive_usage(conn, user["id"])
            return self._send(*json_bytes({
                "path": zp,
                "kind": "dir",
                "entries": entries,
                "used": used,
                "quota": ZDRIVE_QUOTA,
                "home": zdrive_home_path(uname),
            }))

        if path == "/zdrive/read":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm((qs.get("path", [""])[0] or ""))
            if zp is None or zp == "/":
                return self._send(*json_bytes({"error": "invalid_path"}, 400))
            with db() as conn:
                zdrive_ensure_root(conn, user["id"], user.get("username"))
                if zdrive_forbidden_other_home(conn, user["id"], user.get("username") or "", zp):
                    return self._send(*json_bytes({"error": "permission_denied"}, 403))
                node = zdrive_get(conn, user["id"], zp)
                if not node:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                if node["kind"] != "file":
                    return self._send(*json_bytes({"error": "is_directory"}, 400))
            return self._send(*json_bytes({
                "path": zp,
                "content": node["content"] or "",
                "size": int(node["size_bytes"] or 0),
                "shared": bool(node["shared"]),
            }))

        if path == "/zdrive/shared":
            # Public listing of community-shared LabDrive files
            limit = 40
            try:
                limit = min(100, max(1, int((qs.get("limit", ["40"])[0] or "40"))))
            except ValueError:
                limit = 40
            with db() as conn:
                zdrive_ensure_schema(conn)
                rows = conn.execute(
                    """SELECT z.path, z.size_bytes, z.updated_at, z.shared,
                              u.username, u.display_name, u.avatar_id
                       FROM zdrive_nodes z
                       JOIN users u ON u.id = z.user_id
                       WHERE z.shared=1 AND z.kind='file'
                         AND COALESCE(u.disabled,0)=0
                       ORDER BY z.updated_at DESC LIMIT ?""",
                    (limit,),
                ).fetchall()
            return self._send(*json_bytes({
                "files": [
                    {
                        "username": r["username"],
                        "display_name": r["display_name"],
                        "avatar_id": r["avatar_id"] or "",
                        "path": r["path"],
                        "size": int(r["size_bytes"] or 0),
                        "updated_at": r["updated_at"],
                    }
                    for r in rows
                ]
            }))


        return self._send(*json_bytes({"error": "not_found", "path": path}, 404))

    def do_POST(self):
        path, qs = self._path()
        data = self._read_json()
        user = user_from_auth(self.headers.get("Authorization"))

        if path == "/auth/login":
            login = (
                data.get("username")
                or data.get("login")
                or data.get("email")
                or ""
            ).strip()
            password = data.get("password") or ""
            with db() as conn:
                row = conn.execute(
                    "SELECT * FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE",
                    (login, login),
                ).fetchone()
            if not row or not check_pw(password, row["password_hash"]):
                return self._send(*json_bytes({"error": "invalid_credentials"}, 401))
            if user_disabled(dict(row)):
                return self._send(*json_bytes({"error": "account_disabled"}, 403))
            token = make_token(row["id"], row["username"])
            with db() as conn:
                conn.execute(
                    "INSERT INTO activity(kind,message) VALUES ('login', ?)",
                    (f"@{row['username']} entered the gateway",),
                )
                conn.commit()
            return self._send(*json_bytes({"token": token, "user": public_user(row)}))

        if path == "/auth/register":
            username = re.sub(r"[^a-zA-Z0-9_-]", "", (data.get("username") or "")[:24])
            password = data.get("password") or ""
            display = (data.get("display_name") or username)[:40]
            email = (data.get("email") or "").strip().lower()
            if len(username) < 3 or len(password) < 8:
                return self._send(*json_bytes({"error": "username_or_password_too_short"}, 400))
            if not valid_email(email):
                return self._send(*json_bytes({"error": "invalid_email"}, 400))
            try:
                with db() as conn:
                    av = random_starter_avatar()
                    conn.execute(
                        "INSERT INTO users(username, display_name, password_hash, email, email_verified, llt, avatar_id) VALUES (?,?,?,?,0,?,?)",
                        (username, display, hash_pw(password), email, STARTER_LLT, av),
                    )
                    conn.commit()
                    row = conn.execute(
                        "SELECT * FROM users WHERE username=? COLLATE NOCASE", (username,)
                    ).fetchone()
            except sqlite3.IntegrityError:
                return self._send(*json_bytes({"error": "username_or_email_taken"}, 409))
            token = make_token(row["id"], row["username"])
            queue_mail(
                email,
                "Welcome to Laden Labs",
                (
                    f"Hi {display},\n\n"
                    f"Welcome to Laden Labs. Your account @{username} is ready.\n"
                    f"Sign in: {PUBLIC_SITE}/account/\n"
                    f"Labs: {PUBLIC_SITE}/labs/\n\n"
                    f"— Laden AS\n"
                ),
            )
            return self._send(*json_bytes({"token": token, "user": public_user(row)}))

        if path == "/auth/forgot":
            email = (data.get("email") or "").strip().lower()
            msg = {
                "ok": True,
                "message": "If that email is registered, a reset link has been sent.",
            }
            if valid_email(email):
                with db() as conn:
                    row = conn.execute(
                        "SELECT * FROM users WHERE email=? COLLATE NOCASE", (email,)
                    ).fetchone()
                    if row:
                        raw = secrets.token_hex(32)
                        th = sha256hex(raw)
                        expires = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                        conn.execute(
                            "INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES (?,?,?)",
                            (row["id"], th, expires),
                        )
                        # also stash on user row for convenience
                        conn.execute(
                            "UPDATE users SET reset_token_hash=?, reset_expires=? WHERE id=?",
                            (th, expires, row["id"]),
                        )
                        conn.commit()
                        link = f"{PUBLIC_SITE}/account/?reset={raw}"
                        queue_mail(
                            email,
                            "Reset your Laden password",
                            (
                                f"Hi {row['display_name']},\n\n"
                                f"Reset your password (expires in 1 hour):\n{link}\n\n"
                                f"If you did not request this, ignore this email.\n\n"
                                f"— Laden AS\n"
                            ),
                        )
            return self._send(*json_bytes(msg))

        if path == "/auth/reset":
            raw = (data.get("token") or "").strip()
            password = data.get("password") or ""
            if not raw or len(password) < 8:
                return self._send(*json_bytes({"error": "invalid_token_or_password"}, 400))
            th = sha256hex(raw)
            now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            with db() as conn:
                pr = conn.execute(
                    """SELECT * FROM password_resets
                       WHERE token_hash=? AND used_at IS NULL AND expires_at > ?
                       ORDER BY id DESC LIMIT 1""",
                    (th, now),
                ).fetchone()
                if not pr:
                    return self._send(*json_bytes({"error": "invalid_or_expired_token"}, 400))
                conn.execute(
                    "UPDATE users SET password_hash=?, reset_token_hash=NULL, reset_expires=NULL WHERE id=?",
                    (hash_pw(password), pr["user_id"]),
                )
                conn.execute(
                    "UPDATE password_resets SET used_at=? WHERE id=?",
                    (now, pr["id"]),
                )
                # clear any other unused tokens for this user
                conn.execute(
                    "UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL",
                    (now, pr["user_id"]),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM users WHERE id=?", (pr["user_id"],)).fetchone()
            token = make_token(row["id"], row["username"])
            return self._send(
                *json_bytes(
                    {
                        "ok": True,
                        "message": "Password updated.",
                        "token": token,
                        "user": public_user(row),
                    }
                )
            )

        m = re.fullmatch(r"/challenges/([a-z0-9-]+)/submit", path)
        if m:
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            slug = m.group(1)
            flag = (data.get("flag") or "").strip()
            fl = re.sub(r"^(laden|llz)\{", "LLZ{", flag, count=1, flags=re.I)
            with db() as conn:
                chal = conn.execute("SELECT * FROM challenges WHERE slug=?", (slug,)).fetchone()
                if not chal:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                ok = sha256hex(fl) == chal["flag_hash"] or sha256hex(flag) == chal["flag_hash"]
                if not ok:
                    return self._send(*json_bytes({"ok": False, "message": "Incorrect flag"}))
                existed = conn.execute(
                    "SELECT 1 FROM solves WHERE user_id=? AND challenge_id=?",
                    (user["id"], chal["id"]),
                ).fetchone()
                if not existed:
                    reward = llt_reward_for_points(chal["points"])
                    conn.execute(
                        "INSERT INTO solves(user_id, challenge_id) VALUES (?,?)",
                        (user["id"], chal["id"]),
                    )
                    conn.execute(
                        "UPDATE users SET xp = xp + ?, llt = llt + ? WHERE id=?",
                        (chal["points"], reward, user["id"]),
                    )
                    ledger_add(conn, user["id"], reward, f"solve:{chal['slug']}")
                    conn.execute(
                        "INSERT INTO activity(kind,message) VALUES ('solve', ?)",
                        (f"@{user['username']} solved {chal['title']} (+{chal['points']} XP / +{reward} LLT)",),
                    )
                    conn.commit()
                    row = conn.execute(
                        "SELECT xp, llt FROM users WHERE id=?", (user["id"],)
                    ).fetchone()
                    return self._send(*json_bytes({
                        "ok": True,
                        "message": "Correct — nice work.",
                        "first_blood_style": True,
                        "xp": row["xp"],
                        "points": chal["points"],
                        "llt": int(row["llt"]),
                        "llt_reward": reward,
                    }))
                row = conn.execute(
                    "SELECT xp, llt FROM users WHERE id=?", (user["id"],)
                ).fetchone()
                return self._send(*json_bytes({
                    "ok": True,
                    "message": "Already solved.",
                    "xp": row["xp"] if row else user.get("xp") or 0,
                    "points": 0,
                    "llt": int(row["llt"]) if row and row["llt"] is not None else int(user.get("llt") or 10),
                    "llt_reward": 0,
                }))

        if path == "/llt/hint":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            slug = re.sub(r"[^a-z0-9-]", "", (data.get("slug") or "")[:64])
            if not slug:
                return self._send(*json_bytes({"error": "invalid_slug"}, 400))
            cost = 3
            with db() as conn:
                already = conn.execute(
                    "SELECT 1 FROM llt_unlocks WHERE user_id=? AND kind='hint' AND ref=?",
                    (user["id"], slug),
                ).fetchone()
                if already:
                    snap = llt_snapshot(conn, user["id"])
                    return self._send(*json_bytes({"ok": True, "already": True, **snap}))
                bal = conn.execute("SELECT llt FROM users WHERE id=?", (user["id"],)).fetchone()["llt"]
                bal = int(bal if bal is not None else 10)
                if bal < cost:
                    snap = llt_snapshot(conn, user["id"])
                    return self._send(*json_bytes({"ok": False, "error": "insufficient_llt", **snap}, 402))
                conn.execute("UPDATE users SET llt = llt - ? WHERE id=?", (cost, user["id"]))
                conn.execute(
                    "INSERT INTO llt_unlocks(user_id, kind, ref) VALUES (?,?,?)",
                    (user["id"], "hint", slug),
                )
                ledger_add(conn, user["id"], -cost, f"hint:{slug}")
                conn.commit()
                snap = llt_snapshot(conn, user["id"])
            return self._send(*json_bytes({"ok": True, **snap}))

        if path == "/llt/merch":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            sku = (data.get("sku") or "").strip()
            if sku != "llt-week-sticker":
                return self._send(*json_bytes({"error": "invalid_sku"}, 400))
            week = int(datetime.now(timezone.utc).timestamp() // 86400 // 7)
            ref = f"{sku}:{week}"
            cost = 49
            with db() as conn:
                already = conn.execute(
                    "SELECT 1 FROM llt_unlocks WHERE user_id=? AND kind='merch' AND ref=?",
                    (user["id"], ref),
                ).fetchone()
                if already:
                    snap = llt_snapshot(conn, user["id"])
                    return self._send(*json_bytes({"ok": True, "already": True, **snap}))
                bal = conn.execute("SELECT llt FROM users WHERE id=?", (user["id"],)).fetchone()["llt"]
                bal = int(bal if bal is not None else 10)
                if bal < cost:
                    snap = llt_snapshot(conn, user["id"])
                    return self._send(*json_bytes({"ok": False, "error": "insufficient_llt", **snap}, 402))
                conn.execute("UPDATE users SET llt = llt - ? WHERE id=?", (cost, user["id"]))
                conn.execute(
                    "INSERT INTO llt_unlocks(user_id, kind, ref) VALUES (?,?,?)",
                    (user["id"], "merch", ref),
                )
                ledger_add(conn, user["id"], -cost, f"merch:{ref}")
                conn.commit()
                snap = llt_snapshot(conn, user["id"])
            return self._send(*json_bytes({"ok": True, "ref": ref, **snap}))

        if path == "/llt/game":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            try:
                payout = int(data.get("payout") or 0)
            except (TypeError, ValueError):
                payout = 0
            payout = max(0, min(128, payout))
            if payout <= 0:
                with db() as conn:
                    snap = llt_snapshot(conn, user["id"])
                return self._send(*json_bytes({"ok": True, "credited": 0, **snap}))
            with db() as conn:
                # rate limit: Tool Drop double-or-nothing (normal 1… / 1337 5… max 128/hit); hour 200 / day 400
                day_sum = conn.execute(
                    """SELECT COALESCE(SUM(delta),0) AS s FROM llt_ledger
                       WHERE user_id=? AND reason LIKE 'game:%'
                         AND created_at >= datetime('now', '-1 day')""",
                    (user["id"],),
                ).fetchone()["s"]
                hour_sum = conn.execute(
                    """SELECT COALESCE(SUM(delta),0) AS s FROM llt_ledger
                       WHERE user_id=? AND reason LIKE 'game:%'
                         AND created_at >= datetime('now', '-1 hour')""",
                    (user["id"],),
                ).fetchone()["s"]
                day_left = max(0, 400 - int(day_sum or 0))
                hour_left = max(0, 200 - int(hour_sum or 0))
                credit = min(payout, day_left, hour_left)
                if credit > 0:
                    conn.execute(
                        "UPDATE users SET llt = llt + ? WHERE id=?",
                        (credit, user["id"]),
                    )
                    ledger_add(conn, user["id"], credit, "game:tool-drop")
                    conn.commit()
                snap = llt_snapshot(conn, user["id"])
            return self._send(*json_bytes({"ok": True, "credited": credit, **snap}))



        # Per-account LLD opt-in (stored in users.settings_json). Default OFF for everyone.
        if path in ("/account/lld", "/me/lld"):
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            if "opt_in" not in data:
                return self._send(*json_bytes({"error": "opt_in_required"}, 400))
            opt_in = bool(data.get("opt_in"))
            with db() as conn:
                settings = merge_user_settings(conn, user["id"], {"lld_opt_in": opt_in})
                conn.commit()
                row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
                u = public_user(row, conn)
            return self._send(*json_bytes({
                "ok": True,
                "lld_opt_in": 1 if settings.get("lld_opt_in") else 0,
                "settings": settings,
                "user": u,
            }))

        if path in ("/community/heartbeat", "/zocial/heartbeat"):
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            with db() as conn:
                try:
                    conn.execute(
                        "UPDATE users SET last_seen=datetime('now') WHERE id=?",
                        (user["id"],),
                    )
                    conn.commit()
                except sqlite3.OperationalError:
                    pass
                row = conn.execute("SELECT last_seen FROM users WHERE id=?", (user["id"],)).fetchone()
            return self._send(*json_bytes({
                "ok": True,
                "last_seen": row["last_seen"] if row else None,
                "online_window_sec": ONLINE_SECS,
            }))

        # LabZocial profile (settings_json.zocial)
        if path in ("/account/zocial", "/me/zocial", "/zocial", "/community/zocial"):
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zpatch = data.get("zocial") if isinstance(data.get("zocial"), dict) else data
            if not isinstance(zpatch, dict):
                return self._send(*json_bytes({"error": "zocial_required"}, 400))
            # Allow nested or flat body
            if "zocial" in zpatch and isinstance(zpatch.get("zocial"), dict):
                zpatch = zpatch["zocial"]
            with db() as conn:
                settings = merge_user_settings(conn, user["id"], {"zocial": zpatch})
                try:
                    conn.execute(
                        "UPDATE users SET last_seen=datetime('now') WHERE id=?",
                        (user["id"],),
                    )
                except sqlite3.OperationalError:
                    pass
                conn.commit()
                row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
                u = public_user(row, conn)
            return self._send(*json_bytes({
                "ok": True,
                "zocial": settings.get("zocial") or {},
                "settings": settings,
                "user": u,
            }))

        # Merge arbitrary allowed account settings (future: language, etc.)
        if path in ("/account/settings", "/me/settings"):
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            patch = data.get("settings") if isinstance(data.get("settings"), dict) else data
            if not isinstance(patch, dict) or not patch:
                return self._send(*json_bytes({"error": "settings_required"}, 400))
            with db() as conn:
                settings = merge_user_settings(conn, user["id"], patch)
                conn.commit()
                row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
                u = public_user(row, conn)
            return self._send(*json_bytes({
                "ok": True,
                "settings": settings,
                "lld_opt_in": 1 if settings.get("lld_opt_in") else 0,
                "zocial": settings.get("zocial") or {},
                "user": u,
            }))

        if path == "/llt/labcard":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            skin = (data.get("skin") or "").strip()
            if skin not in LABCARD_SKINS:
                return self._send(*json_bytes({"error": "invalid_skin", "skins": list(LABCARD_SKINS)}, 400))
            with db() as conn:
                row = conn.execute(
                    "SELECT llt, labcard_skin FROM users WHERE id=?", (user["id"],)
                ).fetchone()
                current = (row["labcard_skin"] if row else None) or "default"
                if current not in LABCARD_SKINS:
                    current = "default"
                bal = int(row["llt"] if row and row["llt"] is not None else 10)
                if skin == current:
                    return self._send(*json_bytes({
                        "ok": True,
                        "balance": bal,
                        "skin": current,
                        "charged": 0,
                    }))
                if bal < LABCARD_COST:
                    return self._send(*json_bytes({
                        "ok": False,
                        "error": "insufficient_llt",
                        "balance": bal,
                        "skin": current,
                        "charged": 0,
                    }, 400))
                conn.execute(
                    "UPDATE users SET llt = llt - ?, labcard_skin = ? WHERE id=?",
                    (LABCARD_COST, skin, user["id"]),
                )
                ledger_add(conn, user["id"], -LABCARD_COST, f"labcard:{skin}")
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO llt_unlocks(user_id, kind, ref) VALUES (?,?,?)",
                        (user["id"], "labcard", skin),
                    )
                except sqlite3.IntegrityError:
                    pass
                conn.commit()
                new_bal = conn.execute(
                    "SELECT llt FROM users WHERE id=?", (user["id"],)
                ).fetchone()["llt"]
            return self._send(*json_bytes({
                "ok": True,
                "balance": int(new_bal),
                "skin": skin,
                "charged": LABCARD_COST,
            }))


        if path == "/llt/avatar":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            avatar = (data.get("avatar") or data.get("avatar_id") or "").strip()
            if not valid_avatar(avatar):
                return self._send(*json_bytes({
                    "error": "invalid_avatar",
                    "avatars": list(AVATAR_IDS),
                }, 400))
            with db() as conn:
                row = conn.execute(
                    "SELECT llt, avatar_id FROM users WHERE id=?", (user["id"],)
                ).fetchone()
                current = ""
                if row:
                    try:
                        current = (row["avatar_id"] or "").strip()
                    except (KeyError, IndexError, TypeError):
                        current = ""
                if current and current not in AVATAR_IDS:
                    current = ""
                bal = int(row["llt"] if row and row["llt"] is not None else 10)
                if avatar == current:
                    return self._send(*json_bytes({
                        "ok": True,
                        "balance": bal,
                        "avatar": current,
                        "avatar_id": current,
                        "charged": 0,
                    }))
                if bal < AVATAR_COST:
                    return self._send(*json_bytes({
                        "ok": False,
                        "error": "insufficient_llt",
                        "balance": bal,
                        "avatar": current,
                        "avatar_id": current,
                        "charged": 0,
                    }, 400))
                conn.execute(
                    "UPDATE users SET llt = llt - ?, avatar_id = ? WHERE id=?",
                    (AVATAR_COST, avatar, user["id"]),
                )
                ledger_add(conn, user["id"], -AVATAR_COST, f"avatar:{avatar}")
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO llt_unlocks(user_id, kind, ref) VALUES (?,?,?)",
                        (user["id"], "avatar", avatar),
                    )
                except sqlite3.IntegrityError:
                    pass
                conn.commit()
                new_bal = conn.execute(
                    "SELECT llt FROM users WHERE id=?", (user["id"],)
                ).fetchone()["llt"]
            return self._send(*json_bytes({
                "ok": True,
                "balance": int(new_bal),
                "avatar": avatar,
                "avatar_id": avatar,
                "charged": AVATAR_COST,
            }))


        if path == "/llt/title/buy":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            tid = normalize_title(data.get("title") or data.get("title_id") or "")
            if not tid:
                return self._send(*json_bytes({
                    "error": "invalid_title",
                    "titles": list(TITLE_CATALOG.keys()),
                }, 400))
            price = int(TITLE_CATALOG[tid]["price"])
            with db() as conn:
                owned = owned_titles(conn, user["id"])
                row = conn.execute(
                    "SELECT llt, title FROM users WHERE id=?", (user["id"],)
                ).fetchone()
                bal = int(row["llt"] if row and row["llt"] is not None else 10)
                equipped = normalize_title((row["title"] if row else None) or "")
                if tid in owned:
                    return self._send(*json_bytes({
                        "ok": True,
                        "balance": bal,
                        "title": equipped,
                        "title_label": title_label(equipped) if equipped else "",
                        "titles": owned,
                        "bought": tid,
                        "charged": 0,
                        "already_owned": True,
                    }))
                if bal < price:
                    return self._send(*json_bytes({
                        "ok": False,
                        "error": "insufficient_llt",
                        "balance": bal,
                        "title": equipped,
                        "title_label": title_label(equipped) if equipped else "",
                        "titles": owned,
                        "charged": 0,
                    }, 400))
                conn.execute(
                    "UPDATE users SET llt = llt - ? WHERE id=?",
                    (price, user["id"]),
                )
                conn.execute(
                    "INSERT OR IGNORE INTO user_titles(user_id, title_id) VALUES (?,?)",
                    (user["id"], tid),
                )
                ledger_add(conn, user["id"], -price, f"title:{tid}")
                try:
                    conn.execute(
                        "INSERT OR IGNORE INTO llt_unlocks(user_id, kind, ref) VALUES (?,?,?)",
                        (user["id"], "title", tid),
                    )
                except sqlite3.IntegrityError:
                    pass
                conn.commit()
                new_bal = conn.execute(
                    "SELECT llt FROM users WHERE id=?", (user["id"],)
                ).fetchone()["llt"]
                owned = owned_titles(conn, user["id"])
            return self._send(*json_bytes({
                "ok": True,
                "balance": int(new_bal),
                "title": equipped,
                "title_label": title_label(equipped) if equipped else "",
                "titles": owned,
                "bought": tid,
                "charged": price,
                "label": TITLE_CATALOG[tid]["label"],
            }))

        if path == "/llt/title/equip":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            raw = data.get("title") if "title" in data else data.get("title_id", "")
            if raw is None:
                raw = ""
            raw = str(raw).strip()
            if raw == "":
                tid = ""
            else:
                tid = normalize_title(raw)
                if not tid:
                    return self._send(*json_bytes({
                        "error": "invalid_title",
                        "titles": list(TITLE_CATALOG.keys()),
                    }, 400))
            with db() as conn:
                owned = owned_titles(conn, user["id"])
                if tid and tid not in owned:
                    return self._send(*json_bytes({
                        "ok": False,
                        "error": "not_owned",
                        "titles": owned,
                    }, 400))
                conn.execute(
                    "UPDATE users SET title = ? WHERE id=?",
                    (tid, user["id"]),
                )
                conn.commit()
                owned = owned_titles(conn, user["id"])
                bal_row = conn.execute(
                    "SELECT llt FROM users WHERE id=?", (user["id"],)
                ).fetchone()
                bal = int(bal_row["llt"] if bal_row and bal_row["llt"] is not None else 10)
            return self._send(*json_bytes({
                "ok": True,
                "balance": bal,
                "title": tid,
                "title_label": title_label(tid) if tid else "",
                "titles": owned,
                "charged": 0,
            }))

        if path == "/store/checkout":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            items = data.get("items") or []
            with db() as conn:
                conn.execute(
                    "INSERT INTO activity(kind,message) VALUES ('store', ?)",
                    (f"@{user['username']} demo-checkout {len(items)} items",),
                )
                conn.commit()
            return self._send(*json_bytes({"ok": True, "message": "Demo checkout only — no charge."}))

        if path == "/community/posts":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized", "hint": "login_required"}, 401))
            body = (data.get("body") or "").strip()
            topic = (data.get("topic") or "general").strip().lower()[:48] or "general"
            if not body or len(body) > 2000:
                return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
            # allowlist common tool topics + general/feed
            allowed = {
                "general", "feed", "llz", "lls", "nmap", "msfconsole", "aircrack-ng", "wireshark",
                "burp", "hydra", "sqlmap", "john", "hashcat", "gobuster", "ffuf",
                "nikto", "responder", "impacket", "oslo",
            }
            if topic not in allowed:
                return self._send(*json_bytes({"error": "invalid_topic", "allowed": sorted(allowed)}, 400))
            with db() as conn:
                cur = conn.execute(
                    "INSERT INTO community_posts(user_id, body, topic) VALUES (?,?,?)",
                    (user["id"], body, topic),
                )
                pid = cur.lastrowid
                conn.execute(
                    "INSERT INTO activity(kind,message) VALUES ('community', ?)",
                    (f"@{user['username']} posted in #{topic}",),
                )
                conn.commit()
                row = conn.execute(
                    """SELECT p.id, p.user_id, p.body, p.topic, p.created_at,
                              u.username AS author, u.display_name, u.last_seen AS author_last_seen
                       FROM community_posts p
                       JOIN users u ON u.id=p.user_id
                       WHERE p.id=?""",
                    (pid,),
                ).fetchone()
                post = enrich_posts(conn, [row], user["id"], friend_ids(conn, user["id"]))[0]
            return self._send(*json_bytes({"ok": True, "post": post}))

        m = re.fullmatch(r"/community/posts/(\d+)/react", path)
        if m:
            if not user:
                return self._send(*json_bytes({"error": "unauthorized", "hint": "login_required"}, 401))
            pid = int(m.group(1))
            emoji = (data.get("emoji") or "").strip()
            allowed_emoji = {"👍", "🔥", "💀", "like", "fire", "skull"}
            alias = {"like": "👍", "fire": "🔥", "skull": "💀"}
            if emoji in alias:
                emoji = alias[emoji]
            if emoji not in {"👍", "🔥", "💀"}:
                return self._send(*json_bytes({"error": "invalid_emoji", "allowed": ["👍", "🔥", "💀"]}, 400))
            with db() as conn:
                post = conn.execute("SELECT id FROM community_posts WHERE id=?", (pid,)).fetchone()
                if not post:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                existing = conn.execute(
                    "SELECT id FROM post_reactions WHERE post_id=? AND user_id=? AND emoji=?",
                    (pid, user["id"], emoji),
                ).fetchone()
                if existing:
                    conn.execute("DELETE FROM post_reactions WHERE id=?", (existing["id"],))
                    toggled = "off"
                else:
                    conn.execute(
                        "INSERT INTO post_reactions(post_id, user_id, emoji) VALUES (?,?,?)",
                        (pid, user["id"], emoji),
                    )
                    toggled = "on"
                conn.commit()
                reacts = {
                    row["emoji"]: row["c"]
                    for row in conn.execute(
                        "SELECT emoji, COUNT(*) AS c FROM post_reactions WHERE post_id=? GROUP BY emoji",
                        (pid,),
                    ).fetchall()
                }
                mine = [
                    row["emoji"]
                    for row in conn.execute(
                        "SELECT emoji FROM post_reactions WHERE post_id=? AND user_id=?",
                        (pid, user["id"]),
                    ).fetchall()
                ]
            return self._send(*json_bytes({"ok": True, "toggled": toggled, "emoji": emoji, "reactions": reacts, "my_reactions": mine}))

        m = re.fullmatch(r"/community/posts/(\d+)/comments", path)
        if m:
            if not user:
                return self._send(*json_bytes({"error": "unauthorized", "hint": "login_required"}, 401))
            pid = int(m.group(1))
            body = (data.get("body") or "").strip()
            if not body or len(body) > 1000:
                return self._send(*json_bytes({"error": "invalid_body", "hint": "1–1000 chars"}, 400))
            with db() as conn:
                post = conn.execute("SELECT id FROM community_posts WHERE id=?", (pid,)).fetchone()
                if not post:
                    return self._send(*json_bytes({"error": "not_found"}, 404))
                cur = conn.execute(
                    "INSERT INTO post_comments(post_id, user_id, body) VALUES (?,?,?)",
                    (pid, user["id"], body),
                )
                cid = cur.lastrowid
                conn.commit()
                row = conn.execute(
                    """SELECT c.id, c.body, c.created_at, u.username AS author, u.display_name
                       FROM post_comments c JOIN users u ON u.id=c.user_id WHERE c.id=?""",
                    (cid,),
                ).fetchone()
            return self._send(*json_bytes({"ok": True, "comment": dict(row)}))

        if path == "/community/friends/request":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            target = (data.get("username") or data.get("to") or "").strip()
            if not target:
                return self._send(*json_bytes({"error": "username_required"}, 400))
            with db() as conn:
                peer = conn.execute(
                    "SELECT id, username FROM users WHERE username=? COLLATE NOCASE", (target,)
                ).fetchone()
                if not peer:
                    return self._send(*json_bytes({"error": "user_not_found"}, 404))
                if peer["id"] == user["id"]:
                    return self._send(*json_bytes({"error": "cannot_friend_self"}, 400))
                existing = conn.execute(
                    """SELECT id, status, user_a, user_b FROM friendships
                       WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)""",
                    (user["id"], peer["id"], peer["id"], user["id"]),
                ).fetchone()
                if existing:
                    if existing["status"] == "accepted":
                        return self._send(*json_bytes({"ok": True, "status": "accepted", "hint": "already_friends"}))
                    # if they already requested us, auto-accept
                    if existing["user_a"] == peer["id"] and existing["status"] == "pending":
                        conn.execute(
                            "UPDATE friendships SET status='accepted' WHERE id=?",
                            (existing["id"],),
                        )
                        conn.commit()
                        return self._send(*json_bytes({"ok": True, "status": "accepted", "hint": "auto_accepted"}))
                    return self._send(*json_bytes({"ok": True, "status": existing["status"], "hint": "already_pending"}))
                conn.execute(
                    "INSERT INTO friendships(user_a, user_b, status) VALUES (?,?, 'pending')",
                    (user["id"], peer["id"]),
                )
                conn.commit()
            return self._send(*json_bytes({"ok": True, "status": "pending", "to": peer["username"]}))

        if path == "/community/friends/accept":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            fid = data.get("id") or data.get("friendship_id")
            from_user = (data.get("username") or data.get("from") or "").strip()
            with db() as conn:
                row = None
                if fid:
                    row = conn.execute(
                        "SELECT * FROM friendships WHERE id=? AND user_b=? AND status='pending'",
                        (int(fid), user["id"]),
                    ).fetchone()
                elif from_user:
                    peer = conn.execute(
                        "SELECT id FROM users WHERE username=? COLLATE NOCASE", (from_user,)
                    ).fetchone()
                    if peer:
                        row = conn.execute(
                            "SELECT * FROM friendships WHERE user_a=? AND user_b=? AND status='pending'",
                            (peer["id"], user["id"]),
                        ).fetchone()
                if not row:
                    return self._send(*json_bytes({"error": "request_not_found"}, 404))
                conn.execute(
                    "UPDATE friendships SET status='accepted' WHERE id=?", (row["id"],)
                )
                conn.commit()
            return self._send(*json_bytes({"ok": True, "status": "accepted", "id": row["id"]}))

        if path == "/community/friends/decline":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            fid = data.get("id") or data.get("friendship_id")
            if not fid:
                return self._send(*json_bytes({"error": "id_required"}, 400))
            with db() as conn:
                row = conn.execute(
                    "SELECT * FROM friendships WHERE id=? AND user_b=? AND status='pending'",
                    (int(fid), user["id"]),
                ).fetchone()
                if not row:
                    return self._send(*json_bytes({"error": "request_not_found"}, 404))
                conn.execute("DELETE FROM friendships WHERE id=?", (row["id"],))
                conn.commit()
            return self._send(*json_bytes({"ok": True, "declined": True}))



        if path == "/messages/send":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            if user_disabled(user):
                return self._send(*json_bytes({"error": "account_disabled"}, 403))
            to_val = data.get("to") or data.get("username") or data.get("user_id")
            body = (data.get("body") or data.get("message") or "").strip()
            if not body or len(body) > 2000:
                return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
            with db() as conn:
                peer = dm_resolve_peer(conn, to_val, user["id"])
                if not peer:
                    return self._send(*json_bytes({"error": "user_not_found"}, 404))
                if peer["id"] == user["id"]:
                    return self._send(*json_bytes({"error": "cannot_message_self"}, 400))
                thread = dm_get_or_create_thread(conn, user["id"], peer["id"])
                tid = thread["id"]
                cur = conn.execute(
                    """INSERT INTO dm_messages(thread_id, sender_id, recipient_id, kind, body)
                       VALUES (?,?,?,?,?)""",
                    (tid, user["id"], peer["id"], "user", body),
                )
                mid = cur.lastrowid
                conn.execute(
                    "UPDATE dm_threads SET updated_at=datetime('now') WHERE id=?",
                    (tid,),
                )
                conn.execute(
                    "INSERT INTO activity(kind,message) VALUES ('dm', ?)",
                    (f"@{user['username']} → @{peer['username']}",),
                )
                conn.commit()
                row = conn.execute("SELECT * FROM dm_messages WHERE id=?", (mid,)).fetchone()
            return self._send(*json_bytes({
                "ok": True,
                "thread_id": tid,
                "message": dm_msg_public(row),
                "peer": dm_peer_public(peer),
            }))


        # ---------- LLA admin (write) ----------
        if path.startswith("/admin/"):
            denied = require_admin(user)
            if denied:
                return self._send(*denied)


            if path == "/admin/messages/send":
                to_val = data.get("to") or data.get("username") or data.get("user_id")
                kind = (data.get("kind") or "admin").strip().lower()
                if kind not in ("admin", "warning", "grant"):
                    return self._send(*json_bytes({"error": "invalid_kind", "allowed": ["admin", "warning", "grant"]}, 400))
                body = (data.get("body") or data.get("message") or "").strip()
                reason = (data.get("reason") or "").strip()[:200]
                llt_delta = data.get("llt_delta", data.get("delta"))
                with db() as conn:
                    peer = dm_resolve_peer(conn, to_val, user["id"])
                    if not peer:
                        return self._send(*json_bytes({"error": "user_not_found"}, 404))
                    if peer["id"] == user["id"] and kind != "grant":
                        # allow self-grant for testing? No — block self for all
                        return self._send(*json_bytes({"error": "cannot_message_self"}, 400))
                    if peer["id"] == user["id"]:
                        return self._send(*json_bytes({"error": "cannot_message_self"}, 400))
                    meta = ""
                    bal_info = None
                    if kind == "grant":
                        try:
                            delta = int(llt_delta)
                        except (TypeError, ValueError):
                            return self._send(*json_bytes({"error": "llt_delta_required"}, 400))
                        if delta == 0:
                            return self._send(*json_bytes({"error": "llt_delta_nonzero"}, 400))
                        cur_bal = int(peer.get("llt") if peer.get("llt") is not None else 0)
                        # re-read fresh
                        prow = conn.execute("SELECT id, username, llt FROM users WHERE id=?", (peer["id"],)).fetchone()
                        cur_bal = int(prow["llt"] if prow["llt"] is not None else 0)
                        new_bal = cur_bal + delta
                        if new_bal < 0:
                            return self._send(*json_bytes({"error": "insufficient_balance"}, 400))
                        conn.execute("UPDATE users SET llt=? WHERE id=?", (new_bal, peer["id"]))
                        grant_reason = reason or "admin_dm_grant"
                        ledger_add(conn, peer["id"], delta, f"admin:{grant_reason}")
                        meta = f"llt_delta={delta}"
                        if not body:
                            sign = "+" if delta > 0 else ""
                            body = f"LLA granted {sign}{delta} LLT. Balance: {cur_bal} → {new_bal}."
                            if reason:
                                body += f" Reason: {reason}"
                        else:
                            sign = "+" if delta > 0 else ""
                            body = body + f"\n\n[grant {sign}{delta} LLT · balance {new_bal}]"
                        bal_info = {"previous": cur_bal, "delta": delta, "balance": new_bal}
                        audit_action = "dm_grant"
                    elif kind == "warning":
                        if not body:
                            return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
                        audit_action = "dm_warn"
                    else:
                        if not body:
                            return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
                        audit_action = "dm_admin"
                    if len(body) > 2000:
                        return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
                    thread = dm_get_or_create_thread(conn, user["id"], peer["id"])
                    tid = thread["id"]
                    cur = conn.execute(
                        """INSERT INTO dm_messages(thread_id, sender_id, recipient_id, kind, body, meta)
                           VALUES (?,?,?,?,?,?)""",
                        (tid, user["id"], peer["id"], kind, body, meta),
                    )
                    mid = cur.lastrowid
                    conn.execute(
                        "UPDATE dm_threads SET updated_at=datetime('now') WHERE id=?",
                        (tid,),
                    )
                    conn.execute(
                        "INSERT INTO activity(kind,message) VALUES ('dm', ?)",
                        (f"[LLA/{kind}] @{user['username']} → @{peer['username']}",),
                    )
                    admin_audit(
                        conn, user["id"], audit_action, f"user:{peer['id']}",
                        f"kind={kind} meta={meta} reason={reason}"[:2000],
                    )
                    conn.commit()
                    row = conn.execute("SELECT * FROM dm_messages WHERE id=?", (mid,)).fetchone()
                out = {
                    "ok": True,
                    "thread_id": tid,
                    "message": dm_msg_public(row),
                    "peer": dm_peer_public(peer),
                    "kind": kind,
                }
                if bal_info:
                    out["llt"] = bal_info
                return self._send(*json_bytes(out))


            m = re.fullmatch(r"/admin/users/(\d+)", path)
            if m:
                uid = int(m.group(1))
                with db() as conn:
                    row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    changes = []
                    if "role" in data or "is_admin" in data:
                        want_admin = None
                        if "is_admin" in data:
                            want_admin = bool(int(data.get("is_admin") or 0))
                        elif "role" in data:
                            want_admin = str(data.get("role") or "").lower() == "admin"
                        if want_admin is not None:
                            if not want_admin and uid == user["id"]:
                                return self._send(*json_bytes({"error": "cannot_demote_self"}, 400))
                            role = "admin" if want_admin else "member"
                            try:
                                conn.execute(
                                    "UPDATE users SET role=?, is_admin=? WHERE id=?",
                                    (role, 1 if want_admin else 0, uid),
                                )
                            except sqlite3.OperationalError:
                                conn.execute("UPDATE users SET role=? WHERE id=?", (role, uid))
                            changes.append(f"admin={int(want_admin)}")
                    if "disabled" in data:
                        dis = 1 if int(data.get("disabled") or 0) else 0
                        if dis and uid == user["id"]:
                            return self._send(*json_bytes({"error": "cannot_disable_self"}, 400))
                        try:
                            conn.execute("UPDATE users SET disabled=? WHERE id=?", (dis, uid))
                            changes.append(f"disabled={dis}")
                        except sqlite3.OperationalError:
                            return self._send(*json_bytes({"error": "disabled_column_missing"}, 500))
                    if "display_name" in data:
                        dn = (data.get("display_name") or "").strip()[:40]
                        if dn:
                            conn.execute("UPDATE users SET display_name=? WHERE id=?", (dn, uid))
                            changes.append("display_name")
                    if "title" in data:
                        tid = normalize_title(data.get("title") or "")
                        conn.execute("UPDATE users SET title=? WHERE id=?", (tid, uid))
                        changes.append(f"title={tid or '-'}")
                    if not changes:
                        return self._send(*json_bytes({"error": "no_changes"}, 400))
                    admin_audit(conn, user["id"], "user_patch", f"user:{uid}", ", ".join(changes))
                    conn.commit()
                    row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
                    return self._send(*json_bytes({"ok": True, "user": admin_user_row(row, conn), "changes": changes}))

            m = re.fullmatch(r"/admin/users/(\d+)/llt", path)
            if m:
                uid = int(m.group(1))
                reason = (data.get("reason") or "admin_adjust").strip()[:200] or "admin_adjust"
                with db() as conn:
                    row = conn.execute("SELECT id, username, llt FROM users WHERE id=?", (uid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    cur = int(row["llt"] if row["llt"] is not None else 0)
                    if "balance" in data and data.get("balance") is not None:
                        try:
                            new_bal = int(data.get("balance"))
                        except (TypeError, ValueError):
                            return self._send(*json_bytes({"error": "invalid_balance"}, 400))
                        if new_bal < 0:
                            return self._send(*json_bytes({"error": "balance_negative"}, 400))
                        delta = new_bal - cur
                    else:
                        try:
                            delta = int(data.get("delta"))
                        except (TypeError, ValueError):
                            return self._send(*json_bytes({"error": "delta_or_balance_required"}, 400))
                        new_bal = cur + delta
                        if new_bal < 0:
                            return self._send(*json_bytes({"error": "insufficient_balance"}, 400))
                    conn.execute("UPDATE users SET llt=? WHERE id=?", (new_bal, uid))
                    if delta != 0:
                        ledger_add(conn, uid, delta, f"admin:{reason}")
                    admin_audit(
                        conn, user["id"], "llt_adjust", f"user:{uid}",
                        f"delta={delta} balance={new_bal} reason={reason}",
                    )
                    conn.commit()
                    return self._send(*json_bytes({
                        "ok": True,
                        "user_id": uid,
                        "username": row["username"],
                        "previous": cur,
                        "delta": delta,
                        "balance": new_bal,
                        "reason": reason,
                    }))

            m = re.fullmatch(r"/admin/users/(\d+)/password", path)
            if m:
                uid = int(m.group(1))
                password = data.get("password") or data.get("temporary_password") or ""
                if len(password) < 8:
                    return self._send(*json_bytes({"error": "password_too_short", "hint": "min 8 chars"}, 400))
                with db() as conn:
                    row = conn.execute("SELECT id, username FROM users WHERE id=?", (uid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    conn.execute(
                        "UPDATE users SET password_hash=?, reset_token_hash=NULL, reset_expires=NULL WHERE id=?",
                        (hash_pw(password), uid),
                    )
                    admin_audit(conn, user["id"], "password_reset", f"user:{uid}", row["username"])
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "user_id": uid, "username": row["username"]}))

            m = re.fullmatch(r"/admin/llz/posts/(\d+)/hide", path)
            if m:
                pid = int(m.group(1))
                hide = 1 if data.get("hidden", data.get("hide", True)) not in (False, 0, "0", "false") else 0
                with db() as conn:
                    row = conn.execute("SELECT id FROM community_posts WHERE id=?", (pid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    try:
                        conn.execute("UPDATE community_posts SET hidden=? WHERE id=?", (hide, pid))
                    except sqlite3.OperationalError:
                        return self._send(*json_bytes({"error": "hidden_column_missing"}, 500))
                    admin_audit(conn, user["id"], "post_hide" if hide else "post_unhide", f"post:{pid}", "")
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "post_id": pid, "hidden": hide}))

            m = re.fullmatch(r"/admin/llz/posts/(\d+)/delete", path)
            if m:
                pid = int(m.group(1))
                with db() as conn:
                    row = conn.execute("SELECT id FROM community_posts WHERE id=?", (pid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    conn.execute("DELETE FROM community_posts WHERE id=?", (pid,))
                    admin_audit(conn, user["id"], "post_delete", f"post:{pid}", "")
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "deleted": pid}))

            m = re.fullmatch(r"/admin/llz/comments/(\d+)/hide", path)
            if m:
                cid = int(m.group(1))
                hide = 1 if data.get("hidden", data.get("hide", True)) not in (False, 0, "0", "false") else 0
                with db() as conn:
                    row = conn.execute("SELECT id FROM post_comments WHERE id=?", (cid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    try:
                        conn.execute("UPDATE post_comments SET hidden=? WHERE id=?", (hide, cid))
                    except sqlite3.OperationalError:
                        return self._send(*json_bytes({"error": "hidden_column_missing"}, 500))
                    admin_audit(conn, user["id"], "comment_hide" if hide else "comment_unhide", f"comment:{cid}", "")
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "comment_id": cid, "hidden": hide}))

            m = re.fullmatch(r"/admin/llz/comments/(\d+)/delete", path)
            if m:
                cid = int(m.group(1))
                with db() as conn:
                    row = conn.execute("SELECT id FROM post_comments WHERE id=?", (cid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    conn.execute("DELETE FROM post_comments WHERE id=?", (cid,))
                    admin_audit(conn, user["id"], "comment_delete", f"comment:{cid}", "")
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "deleted": cid}))

            if path == "/admin/broadcast":
                body = (data.get("body") or data.get("message") or "").strip()
                topic = (data.get("topic") or "labnewz").strip().lower()[:48] or "labnewz"
                if not body or len(body) > 2000:
                    return self._send(*json_bytes({"error": "invalid_body", "hint": "1–2000 chars"}, 400))
                with db() as conn:
                    cur = conn.execute(
                        "INSERT INTO community_posts(user_id, body, topic) VALUES (?,?,?)",
                        (user["id"], body, topic),
                    )
                    pid = cur.lastrowid
                    conn.execute(
                        "INSERT INTO activity(kind,message) VALUES ('system', ?)",
                        (f"[LLA] broadcast #{topic} by @{user['username']}",),
                    )
                    admin_audit(conn, user["id"], "broadcast", f"post:{pid}", f"topic={topic}")
                    conn.commit()
                return self._send(*json_bytes({"ok": True, "post_id": pid, "topic": topic}))

            m = re.fullmatch(r"/admin/challenges/(\d+)/bump", path)
            if m:
                cid = int(m.group(1))
                with db() as conn:
                    row = conn.execute("SELECT * FROM challenges WHERE id=?", (cid,)).fetchone()
                    if not row:
                        return self._send(*json_bytes({"error": "not_found"}, 404))
                    points = row["points"]
                    if "points" in data and data.get("points") is not None:
                        try:
                            points = int(data.get("points"))
                        except (TypeError, ValueError):
                            return self._send(*json_bytes({"error": "invalid_points"}, 400))
                    elif "delta" in data:
                        try:
                            points = int(row["points"]) + int(data.get("delta"))
                        except (TypeError, ValueError):
                            return self._send(*json_bytes({"error": "invalid_delta"}, 400))
                    if points < 0:
                        return self._send(*json_bytes({"error": "points_negative"}, 400))
                    conn.execute("UPDATE challenges SET points=? WHERE id=?", (points, cid))
                    admin_audit(conn, user["id"], "challenge_bump", f"challenge:{cid}", f"points={points}")
                    conn.commit()
                    row = conn.execute(
                        "SELECT id, slug, title, points FROM challenges WHERE id=?", (cid,)
                    ).fetchone()
                return self._send(*json_bytes({"ok": True, "challenge": dict(row)}))

            return self._send(*json_bytes({"error": "not_found", "path": path}, 404))


        
        if path == "/zdrive/mkdir":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm(data.get("path") or "")
            parents = bool(data.get("parents") or data.get("p"))
            if zp is None:
                return self._send(*json_bytes({"error": "invalid_path"}, 400))
            with db() as conn:
                body, code = zdrive_mkdir(conn, user["id"], zp, parents=parents, username=user.get("username"))
            return self._send(*json_bytes(body, code))

        if path == "/zdrive/write":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm(data.get("path") or "")
            content = data.get("content")
            if content is None:
                content = ""
            append = bool(data.get("append"))
            if zp is None:
                return self._send(*json_bytes({"error": "invalid_path"}, 400))
            with db() as conn:
                body, code = zdrive_write(conn, user["id"], zp, content, append=append, username=user.get("username"))
            return self._send(*json_bytes(body, code))

        if path == "/zdrive/rm":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm(data.get("path") or "")
            recursive = bool(data.get("recursive") or data.get("r"))
            if zp is None:
                return self._send(*json_bytes({"error": "invalid_path"}, 400))
            with db() as conn:
                body, code = zdrive_rm(conn, user["id"], zp, recursive=recursive, username=user.get("username"))
            return self._send(*json_bytes(body, code))

        if path == "/zdrive/mv":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            src = zdrive_norm(data.get("src") or data.get("from") or "")
            dst = zdrive_norm(data.get("dst") or data.get("to") or "")
            with db() as conn:
                body, code = zdrive_mv(conn, user["id"], src or "", dst or "")
            return self._send(*json_bytes(body, code))

        if path == "/zdrive/cp":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            src = zdrive_norm(data.get("src") or data.get("from") or "")
            dst = zdrive_norm(data.get("dst") or data.get("to") or "")
            with db() as conn:
                body, code = zdrive_cp(conn, user["id"], src or "", dst or "")
            return self._send(*json_bytes(body, code))

        if path == "/zdrive/share":
            if not user:
                return self._send(*json_bytes({"error": "unauthorized"}, 401))
            zp = zdrive_norm(data.get("path") or "")
            shared = data.get("shared")
            if shared is None:
                shared = True
            with db() as conn:
                body, code = zdrive_set_shared(conn, user["id"], zp or "", bool(shared))
            return self._send(*json_bytes(body, code))


        return self._send(*json_bytes({"error": "not_found"}, 404))



    def do_PATCH(self):
        """Admin PATCH /admin/users/{id} — same body as POST."""
        # Reuse POST by rewriting method dispatch lightly
        return self.do_POST()


def main():
    # seed applies CREATE IF NOT EXISTS; migrate ALTERs live columns then indexes
    seed()
    migrate_challenge_flags()
    migrate()
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Laden gateway API on http://{HOST}:{PORT}  db={DB_PATH}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
