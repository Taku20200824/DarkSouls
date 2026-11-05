"""LORDRAN TRACKER — Windows companion.

Watches DRAKS0005.sl2 (read-only), waits until the game has finished writing it,
parses it locally and sends only the parsed progress fields to the website.

Usage:
  python lordran_companion.py pair ABCD2345 --server https://your-site.vercel.app
  python lordran_companion.py run            # watch + sync (Ctrl+C to stop)
  python lordran_companion.py once [--save PATH] [--print]
  python lordran_companion.py status

No administrator rights, no game memory access, no code injection, and the save
file is never written to.
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import platform
import socket
import sys
import time
import urllib.error
import urllib.request

from ds1parser import SaveParseError, all_checksums_ok, parse_save

VERSION = "1.0.0"
POLL_SECONDS = 2.0
STABLE_SECONDS = 3.0  # debounce: file must be unchanged this long before reading
HEARTBEAT_SECONDS = 30.0


# ------------------------------------------------------------------ config
def config_dir() -> str:
    if os.name == "nt":
        base = os.environ.get("APPDATA") or os.path.expanduser("~")
        return os.path.join(base, "LordranTracker")
    return os.path.join(os.path.expanduser("~"), ".config", "lordran-tracker")


def config_path() -> str:
    return os.path.join(config_dir(), "config.json")


def load_config() -> dict:
    try:
        with open(config_path(), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_config(cfg: dict) -> None:
    os.makedirs(config_dir(), exist_ok=True)
    p = config_path()
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    os.replace(tmp, p)
    try:
        os.chmod(p, 0o600)
    except OSError:
        pass


# ------------------------------------------------------------------ save discovery
def default_save_candidates() -> list[str]:
    """Locations from the game's Steam Cloud config (steamdb.info/app/570940/ufs):
    Documents/NBGI/DARK SOULS REMASTERED/<id>, Documents/FromSoftware/DARK SOULS REMASTERED/<id>,
    Documents/NBGI/570940/<id>. Windows may redirect Documents (e.g. OneDrive)."""
    docs_roots = [os.path.join(os.path.expanduser("~"), "Documents")]
    up = os.environ.get("USERPROFILE")
    if up:
        docs_roots += [os.path.join(up, "Documents"), os.path.join(up, "OneDrive", "Documents")]
    proton = os.path.expanduser("~/.local/share/Steam/steamapps/compatdata/570940/pfx/drive_c/users/steamuser")
    docs_roots += [os.path.join(proton, "Documents"), os.path.join(proton, "My Documents")]
    subs = [("NBGI", "DARK SOULS REMASTERED"), ("FromSoftware", "DARK SOULS REMASTERED"), ("NBGI", "570940")]
    out = []
    for root in docs_roots:
        for a, b in subs:
            out.extend(glob.glob(os.path.join(root, a, b, "*", "DRAKS0005.sl2")))
    return sorted(set(out), key=lambda x: os.path.getmtime(x), reverse=True)


def find_save(explicit: str | None) -> str | None:
    if explicit:
        return explicit if os.path.isfile(explicit) else None
    c = default_save_candidates()
    return c[0] if c else None


def read_stable_snapshot(path: str, attempts: int = 8) -> bytes | None:
    """Read the whole file into memory only once it is complete.

    A save is accepted only if (1) size+mtime did not change while reading and
    (2) every BND4 entry's MD5 matches — a partially written file fails (2).
    """
    delay = 0.5
    for _ in range(attempts):
        try:
            st1 = os.stat(path)
            with open(path, "rb") as f:  # read-only
                data = f.read()
            st2 = os.stat(path)
            if (st1.st_size, st1.st_mtime_ns) == (st2.st_size, st2.st_mtime_ns) and len(data) == st2.st_size and all_checksums_ok(data):
                return data
        except (PermissionError, FileNotFoundError, OSError):
            pass
        time.sleep(delay)
        delay = min(delay * 2, 4.0)
    return None


# ------------------------------------------------------------------ HTTP
class Api:
    def __init__(self, server: str, token: str | None):
        self.server = server.rstrip("/")
        self.token = token

    def post(self, path: str, body: dict, timeout: float = 20.0) -> dict:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.server + path, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("User-Agent", f"LordranCompanion/{VERSION}")
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            try:
                detail = json.loads(e.read().decode("utf-8"))
            except Exception:
                detail = {}
            raise ApiError(e.code, detail.get("error", str(e))) from None
        except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
            raise ApiError(0, f"network: {e}") from None


class ApiError(Exception):
    def __init__(self, status: int, msg: str):
        super().__init__(f"{status} {msg}")
        self.status = status


def payload_from(parsed: dict, mtime: float) -> dict:
    return {**parsed, "saveModifiedAt": int(mtime * 1000), "client": "companion", "consent": True}


# ------------------------------------------------------------------ commands
def cmd_pair(args) -> int:
    api = Api(args.server, None)
    try:
        r = api.post("/api/companion/pair", {"code": args.code.strip().upper(), "deviceName": (args.name or platform.node() or "PC")[:60]})
    except ApiError as e:
        print(f"Холбож чадсангүй / Pairing failed: {e}")
        return 1
    cfg = load_config()
    cfg.update({"server": api.server, "token": r["token"], "steamId": r.get("steamId")})
    save_config(cfg)
    print(f"Амжилттай холбогдлоо / Paired with SteamID {r.get('steamId')}. Config: {config_path()}")
    return 0


def cmd_once(args) -> int:
    path = find_save(args.save)
    if not path:
        print("DRAKS0005.sl2 олдсонгүй. --save PATH ашиглана уу.")
        return 2
    data = read_stable_snapshot(path)
    if data is None:
        print("Save файлыг тогтвортой уншиж чадсангүй (бичигдэж байна эсвэл түгжигдсэн).")
        return 3
    parsed = parse_save(data)
    if args.print:
        print(json.dumps(parsed, ensure_ascii=False, indent=2))
        return 0
    cfg = load_config()
    if not cfg.get("token"):
        print("Эхлээд pair хийнэ үү.")
        return 4
    r = Api(cfg["server"], cfg["token"]).post("/api/companion/sync", payload_from(parsed, os.path.getmtime(path)))
    print(json.dumps(r, ensure_ascii=False))
    return 0


def cmd_status(_args) -> int:
    cfg = load_config()
    print(f"Config: {config_path()}")
    print(f"Server: {cfg.get('server', '-')}, paired: {'yes' if cfg.get('token') else 'no'}, SteamID: {cfg.get('steamId', '-')}")
    print("Save candidates:")
    for p in default_save_candidates():
        print("  ", p)
    return 0


def cmd_run(args) -> int:
    cfg = load_config()
    if not cfg.get("token"):
        print("Эхлээд pair хийнэ үү: python lordran_companion.py pair CODE --server URL")
        return 4
    api = Api(cfg["server"], cfg["token"])
    last_sig = None          # (size, mtime_ns) seen
    changed_at = None        # when a change was first noticed (debounce)
    last_sent_digest = None
    pending = None           # payload waiting to be (re)sent
    next_hb = 0.0
    backoff = 0.0
    message = None
    print(f"LORDRAN companion v{VERSION} — {api.server}. Ctrl+C to stop.")
    while True:
        try:
            now = time.time()
            path = find_save(args.save)
            save_mtime = None
            if path:
                st = os.stat(path)
                sig = (st.st_size, st.st_mtime_ns)
                save_mtime = st.st_mtime
                if sig != last_sig:
                    last_sig, changed_at = sig, now
                elif changed_at is not None and now - changed_at >= STABLE_SECONDS:
                    changed_at = None
                    data = read_stable_snapshot(path)
                    if data is None:
                        message = "Save file is being written or locked; will retry."
                        last_sig = None  # force another attempt
                    else:
                        try:
                            parsed = parse_save(data)
                            body = payload_from(parsed, st.st_mtime)
                            digest = hashlib.sha256(json.dumps(parsed, sort_keys=True).encode()).hexdigest()
                            if digest != last_sent_digest:
                                pending = (body, digest)
                            message = None
                        except SaveParseError as e:
                            message = f"Parse error: {e}"
            else:
                message = "DRAKS0005.sl2 not found"

            if pending and now >= backoff:
                try:
                    r = api.post("/api/companion/sync", pending[0])
                    last_sent_digest = pending[1]
                    print(time.strftime("%H:%M:%S"), "synced:", r.get("results"))
                    pending, backoff = None, 0.0
                except ApiError as e:
                    if e.status == 401:
                        print("Token хүчингүй болсон. Дахин pair хийнэ үү.")
                        return 5
                    wait = 5 if e.status == 0 else 15
                    backoff = now + wait
                    message = f"Sync failed ({e}); retrying"
                    print(message)

            if now >= next_hb:
                try:
                    api.post("/api/companion/heartbeat", {"version": VERSION, "saveFound": bool(path), "saveModifiedAt": int(save_mtime * 1000) if save_mtime else None, "message": message})
                except ApiError as e:
                    if e.status == 401:
                        print("Token хүчингүй болсон. Дахин pair хийнэ үү.")
                        return 5
                next_hb = now + HEARTBEAT_SECONDS
            time.sleep(POLL_SECONDS)
        except KeyboardInterrupt:
            print("Stopped.")
            return 0
        except Exception as e:  # keep running through unexpected errors
            print("Error:", e)
            time.sleep(5)


def startup_script_path() -> str:
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    return os.path.join(base, "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "LordranCompanion.vbs")


def launch_command() -> list[str]:
    if getattr(sys, "frozen", False):
        return [sys.executable, "run"]
    pythonw = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
    return [pythonw, os.path.abspath(__file__), "run"]


def startup_script() -> str:
    command = " ".join(f'""{part}""' for part in launch_command())
    return f'CreateObject("WScript.Shell").Run "{command}", 0, False\r\n'


def cmd_autostart(args) -> int:
    if os.name != "nt":
        print("Autostart is only available on Windows.")
        return 2
    path = startup_script_path()
    if args.state == "off":
        if os.path.exists(path):
            os.remove(path)
        print(f"Autostart off: {path}")
        return 0
    if not load_config().get("token"):
        print("Эхлээд pair хийнэ үү: python lordran_companion.py pair CODE --server URL")
        return 4
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-16", newline="") as f:
        f.write(startup_script())
    print(f"Autostart on: {path}")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="lordran-companion", description="LORDRAN TRACKER Windows companion")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pair"); p.add_argument("code"); p.add_argument("--server", required=True); p.add_argument("--name")
    r = sub.add_parser("run"); r.add_argument("--save")
    o = sub.add_parser("once"); o.add_argument("--save"); o.add_argument("--print", action="store_true")
    sub.add_parser("status")
    s = sub.add_parser("autostart"); s.add_argument("state", choices=["on", "off"])
    a = ap.parse_args(argv)
    return {"pair": cmd_pair, "run": cmd_run, "once": cmd_once, "status": cmd_status, "autostart": cmd_autostart}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
