"""Read-only Dark Souls (Remastered / PtDE) DRAKS0005.sl2 parser.

Python twin of src/lib/save/ds1.ts — keep the two in sync (tests compare their
output on the same fixture). Offsets are ported from darthdemono/sl2-analyzer
(Apache-2.0) and tarvitz/dsfp (MIT). The input bytes are never modified and the
save file is only ever opened for reading.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from typing import Any

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

PARSER_VERSION = "ds1-1.0.2"
DSR_KEY = bytes.fromhex("0123456789ABCDEFFEDCBA9876543210")
MAX_SAVE_BYTES = 16 * 1024 * 1024
HEADER_LEN, ENTRY_LEN = 0x40, 0x20
SLOT_COUNT, MENU_ENTRY = 10, 10

DSR_MAGIC = bytes.fromhex("00FFFFFFFF000000000000000000000000FFFFFFFF")
D = dict(souls=-291, hp=-419, stamina=-391, level=-295, klass=-233, humanity=-307, gender=-237, name=-271, ng=0x1E3A7)
STAT_D = {
    "Vitality": -375, "Attunement": -367, "Endurance": -359, "Strength": -351,
    "Dexterity": -343, "Resistance": -303, "Intelligence": -335, "Faith": -327,
}
CLASSES = ["Warrior", "Knight", "Wanderer", "Thief", "Bandit", "Hunter", "Sorcerer", "Pyromancer", "Cleric", "Deprived"]
CLASS_K = {0: 82, 1: 81, 2: 83, 3: 81, 4: 82, 5: 82, 6: 79, 7: 83, 8: 82, 9: 82}
GENDER = {0: "Female", 1: "Male"}
DEATHS_OFF = {"ptde": 0x1F118, "dsr": 0x1F2D8}
# Some DSR saves place this struct elsewhere, so it is also located by its constant tail.
DEATHS_TAIL = bytes.fromhex("0008000000008000")
DEATHS_TAIL_D = 12
DEATHS_SEARCH = 0x400
FLAG_BASE = {"dsr": 127721, "ptde": 127273}
FLAG_SPAN, FLAG_MAX_DENSITY = 23156, 0.05
MENU_LEVEL_D, MENU_PLAYTIME_D = 36, 40
INV_START = 0x988
INV_ANCHOR = bytes.fromhex("0000000000000000A0BB0D00")
# Fixed-size array. Dropped or used-up items leave empty slots in the middle of it.
INV_SLOTS = 1984
INV_EMPTY = 0xFFFFFFFF
INFUSION = {0: "Normal", 1: "Crystal", 2: "Lightning", 3: "Raw", 4: "Magic", 5: "Enchanted", 6: "Divine", 7: "Occult", 8: "Fire", 9: "Chaos"}
BONFIRE_STATE = {0: "discovered", 10: "lit", 20: "kindled +1", 30: "kindled +2", 40: "kindled +3"}
MANDATORY = [
    "Asylum Demon", "Pinwheel",
    "Bell Gargoyles", "Chaos Witch Quelaag", "Iron Golem", "Dragon Slayer Ornstein", "Executioner Smough",
    "Great Grey Wolf Sif", "The Four Kings", "Seath the Scaleless", "Gravelord Nito", "Bed of Chaos", "Gwyn, Lord of Cinder",
]
NAME_RE = re.compile(r"^[A-Za-z0-9 \-_'.À-ÿЀ-ӿ぀-ヿ一-鿿]+$")


class SaveParseError(Exception):
    pass


def _db_dir() -> str:
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, "ds1db")


def _load(name: str) -> Any:
    with open(os.path.join(_db_dir(), name + ".json"), encoding="utf-8") as f:
        return json.load(f)


def _invert(table: dict) -> dict[int, str]:
    out: dict[int, str] = {}
    for name, v in table.items():
        for i in v if isinstance(v, list) else [v]:
            out.setdefault(int(i), name)
    return out


ITEM_DB = {
    "weapons": _invert(_load("MeleeWeapons")),
    "armors": _invert(_load("Armor")),
    "rings": _invert(_load("Rings")),
    "goods": _invert(_load("Consumables")),
    "spells": _invert(_load("Spells")),
}
BONFIRE_DB = {int(k): v for k, v in _load("bonfires").items()}
BOSS_FLAG_DB = _load("boss_flags")
BOSS_SOUL_DB = _load("boss_souls")
KNOWN_FLAG_DB = _load("known_flags")


def _u(buf: bytes, off: int, size: int):
    if off < 0 or off + size > len(buf):
        return None
    return int.from_bytes(buf[off:off + size], "little")


def u8(b, o): return _u(b, o, 1)
def u16(b, o): return _u(b, o, 2)
def u32(b, o): return _u(b, o, 4)
def u64(b, o): return _u(b, o, 8)


def read_utf16(buf: bytes, off: int, max_chars: int) -> str:
    if off < 0 or off >= len(buf):
        return ""
    s = []
    end = min(len(buf), off + max_chars * 2)
    p = off
    while p + 1 < end:
        c = buf[p] | (buf[p + 1] << 8)
        if c == 0:
            break
        s.append(chr(c))
        p += 2
    return "".join(s)


def is_valid_name(s: str) -> bool:
    return 1 <= len(s) <= 13 and bool(NAME_RE.match(s))


def known(v, note=None):
    d = {"value": v, "certainty": "verified" if v is not None else "unknown"}
    if note:
        d["note"] = note
    return d


def inferred(v, note=None):
    d = {"value": v, "certainty": "inferred"}
    if note:
        d["note"] = note
    return d


def unknown(note=None):
    d = {"value": None, "certainty": "unknown"}
    if note:
        d["note"] = note
    return d


# ---------------------------------------------------------------- container
def parse_bnd4(data: bytes):
    if len(data) > MAX_SAVE_BYTES:
        raise SaveParseError("File too large to be a Dark Souls save.")
    if len(data) < HEADER_LEN or data[:4] != b"BND4":
        raise SaveParseError("Not a BND4 / .sl2 file.")
    count = u32(data, 12)
    if count is None or not (0 < count <= 64):
        raise SaveParseError(f"Implausible BND4 entry count: {count}")
    entries = []
    for i in range(count):
        base = HEADER_LEN + ENTRY_LEN * i
        if base + ENTRY_LEN > len(data):
            raise SaveParseError(f"Truncated entry header #{i}.")
        size, offset = u64(data, base + 8), u32(data, base + 16)
        if size is None or offset is None or size <= 32 or offset + size > len(data):
            raise SaveParseError(f"Entry #{i} points outside the file.")
        entries.append((offset, size))
    return entries


def checksum_ok(blob: bytes) -> bool:
    return len(blob) >= 32 and hashlib.md5(blob[16:]).digest() == blob[:16]


def all_checksums_ok(data: bytes) -> bool:
    try:
        return all(checksum_ok(data[o:o + s]) for o, s in parse_bnd4(data))
    except SaveParseError:
        return False


def decrypt_dsr(blob: bytes):
    if len(blob) < 48:
        return None
    iv = blob[16:32]
    ct = blob[32:32 + (len(blob) - 32) // 16 * 16]
    pt = Cipher(algorithms.AES(DSR_KEY), modes.CBC(iv)).decryptor().update(ct)
    n = u32(pt, 0)
    if n is None or n <= 0 or n > len(pt) - 4:
        return None
    return pt[4:4 + n]


# ---------------------------------------------------------------- slot fields
def _stats(buf, m):
    return [u8(buf, m + d) for d in STAT_D.values()]


def _plausible(buf, m):
    lvl = u16(buf, m + D["level"])
    return lvl is not None and 1 <= lvl <= 838 and all(v is not None and 0 <= v <= 99 for v in _stats(buf, m))


def level_rule_holds(buf, m):
    lvl, k = u16(buf, m + D["level"]), u8(buf, m + D["klass"])
    st = _stats(buf, m)
    if lvl is None or k is None or any(v is None for v in st) or k not in CLASS_K:
        return False
    return sum(st) - CLASS_K[k] == lvl


def find_dsr_anchor(buf):
    o = 0
    while True:
        m = buf.find(DSR_MAGIC, o)
        if m == -1:
            return None
        if _plausible(buf, m):
            return m
        o = m + 1


def find_ptde_anchor(buf):
    for o in range(0, len(buf) - 1):
        if buf[o] == 0 and buf[o + 1] == 0:
            continue
        name = read_utf16(buf, o, 13)
        if len(name) >= 2 and is_valid_name(name):
            m = o - D["name"]
            if _plausible(buf, m) and level_rule_holds(buf, m):
                return m
    return None


def _resolve(cat, iid):
    table = ITEM_DB[cat]
    if cat == "weapons":
        base, path, level = iid - iid % 1000, (iid % 1000) // 100, iid % 100
        bn = table.get(base)
        if bn:
            inf = INFUSION.get(path, "Normal")
            name = bn + (f" +{level}" if level else "") + (f" ({inf})" if inf != "Normal" else "")
            return {"name": name, "baseName": bn, "level": level, "infusion": inf}
        d = table.get(iid)
        return {"name": d, "baseName": re.sub(r"\s*\[.*\]$", "", d)} if d else None
    d = table.get(iid)
    if d:
        return {"name": d, "baseName": d}
    if cat == "rings":
        r = table.get(iid // 1000)
        return {"name": r, "baseName": r} if r else None
    if cat == "armors":
        base, level = iid - iid % 1000, iid % 100
        n = table.get(base)
        return {"name": n + (f" +{level}" if level else ""), "baseName": n, "level": level} if n else None
    return None


def read_inventory(buf):
    items, unk = [], 0
    start = buf.find(INV_ANCHOR, INV_START)
    if start == -1:
        return [], 0
    end = min(start + INV_SLOTS * 28, len(buf))
    o = start
    while o + 28 <= end:
        stype, iid, qty = u32(buf, o + 4), u32(buf, o + 8), u32(buf, o + 12)
        o += 28
        if not iid or stype is None or qty is None:
            continue
        if stype == INV_EMPTY and iid == INV_EMPTY:
            continue
        top = stype & 0xF0000000
        cat = {0: "weapons", 0x10000000: "armors", 0x20000000: "rings", 0x40000000: "goods"}.get(top)
        if cat == "goods" and iid in ITEM_DB["spells"]:
            cat = "spells"
        r = _resolve(cat, iid) if cat else None
        if not r:
            unk += 1
            continue
        items.append({**r, "id": iid, "category": cat, "quantity": qty})
    merged: dict[str, dict] = {}
    for it in items:
        k = f"{it['category']}:{it['name']}"
        if k in merged:
            merged[k]["quantity"] += it["quantity"]
        else:
            merged[k] = dict(it)
    return list(merged.values()), unk


def locate_deaths(buf, game):
    fixed = DEATHS_OFF[game]
    if u32(buf, fixed + 4) == 0xFFFFFFFF:
        return fixed
    for off in range(fixed - DEATHS_SEARCH, fixed + DEATHS_SEARCH + 1):
        tail = off + DEATHS_TAIL_D
        if u32(buf, off + 4) == 0xFFFFFFFF and buf[tail:tail + len(DEATHS_TAIL)] == DEATHS_TAIL:
            return off
    return None


def layout_shift(buf, game):
    """How far this save's death/flag structs sit from the calibrated layout."""
    off = locate_deaths(buf, game)
    return 0 if off is None else off - DEATHS_OFF[game]


def read_deaths(buf, game):
    off = locate_deaths(buf, game)
    if off is None:
        return unknown("Death counter structure not at the expected location.")
    return known(u32(buf, off))


def read_bonfires(buf):
    best, o = [], 0
    n = len(buf)
    while o + 20 <= n:
        first = u32(buf, o)
        if first in BONFIRE_DB:
            run, seen, p = [], set(), o
            while p + 20 <= n:
                bid, st = u32(buf, p), u32(buf, p + 4)
                if bid not in BONFIRE_DB or st not in BONFIRE_STATE or bid in seen:
                    break
                seen.add(bid)
                run.append((bid, st))
                p += 20
            if len(run) > len(best):
                best = run
            o = max(p, o + 1)
        else:
            o += 1
    if len(best) < 5:
        return unknown("No believable bonfire list found (fewer than 5 records).")
    return {"value": [{"id": b, "name": BONFIRE_DB[b][0], "area": BONFIRE_DB[b][1], "state": BONFIRE_STATE[s]} for b, s in best], "certainty": "verified"}


def read_flags(buf, game):
    base = FLAG_BASE[game] + layout_shift(buf, game)
    if base + FLAG_SPAN > len(buf):
        return None
    region = buf[base:base + FLAG_SPAN]
    if sum(bin(b).count("1") for b in region) > FLAG_SPAN * 8 * FLAG_MAX_DENSITY:
        return None
    bosses = [name for name, (off, mask) in BOSS_FLAG_DB.items() if (u32(buf, base + off) or 0) & mask]
    world = {cat: [r[2] for r in rows if (u32(buf, base + r[0]) or 0) & r[1]] for cat, rows in KNOWN_FLAG_DB.items()}
    return bosses, world


def read_playtime(menu, name, level):
    if not menu or not name or level is None:
        return unknown("Load-screen roster not readable.")
    want = name.encode("utf-16-le")
    pos = menu.find(want)
    while pos >= 0:
        if u32(menu, pos + MENU_LEVEL_D) == level:
            return known(u32(menu, pos + MENU_PLAYTIME_D))
        pos = menu.find(want, pos + 2)
    return unknown("Roster record matching this character's name and level not found.")


def parse_slot(buf, slot, game, menu):
    m = find_dsr_anchor(buf) if game == "dsr" else find_ptde_anchor(buf)
    if m is None:
        return None
    raw = read_utf16(buf, m + D["name"], 13)
    name = raw if is_valid_name(raw) else None
    level = u16(buf, m + D["level"])
    klass, gender = u8(buf, m + D["klass"]), u8(buf, m + D["gender"])
    items, unk = read_inventory(buf)
    flags = read_flags(buf, game)
    if game != "dsr":
        ng = unknown("NG cycle offset is only calibrated for Remastered saves.")
    elif layout_shift(buf, game) == 0:
        ng = known(u8(buf, m + D["ng"]), "NG+ counter (0 = first journey)")
    else:
        ng = inferred(0, "NG+ counter is not calibrated for this save layout; assuming the first journey.")
    bosses: dict[str, set] = {}
    for it in items:
        if it["category"] == "goods" and it["name"] in BOSS_SOUL_DB:
            bosses.setdefault(BOSS_SOUL_DB[it["name"]], set()).add("soul")
    if (ng["value"] or 0) > 0:
        for b in MANDATORY:
            bosses.setdefault(b, set()).add("ng-clear")
    if flags:
        for b in flags[0]:
            bosses.setdefault(b, set()).add("flag")
    notes = []
    if not level_rule_holds(buf, m):
        notes.append("Soul level does not equal attributes-82; the save may have been edited.")
    notes += [
        "Current location / coordinates are not decoded; area is estimated from progress.",
        "Only 12 bosses have verified defeat flags; others are inferred from boss souls held, NG+ or Steam achievements.",
    ]
    if not flags:
        notes.append("Event-flag region failed its sanity check; boss flags and world state were not read.")
    if unk:
        notes.append(f"{unk} inventory entries could not be identified and were skipped.")
    return {
        "slot": slot,
        "game": game,
        "name": known(name) if name else unknown("Name field did not decode cleanly."),
        "className": known(CLASSES[klass], "Starting class") if klass is not None and klass < len(CLASSES) else unknown(),
        "gender": known(GENDER[gender]) if gender in GENDER else unknown(),
        "level": known(level),
        "souls": known(u32(buf, m + D["souls"])),
        "humanity": known(u8(buf, m + D["humanity"])),
        "hp": known(u32(buf, m + D["hp"])),
        "stamina": known(u32(buf, m + D["stamina"])),
        "stats": {k: known(u8(buf, m + d)) for k, d in STAT_D.items()},
        "deaths": read_deaths(buf, game),
        "playTimeSeconds": read_playtime(menu, name, level),
        "ngCycle": ng,
        "bonfires": read_bonfires(buf),
        "bosses": {k: sorted(v) for k, v in bosses.items()},
        "worldFlags": {"value": flags[1], "certainty": "verified"} if flags else unknown("Event-flag region not verified."),
        "inventory": items,
        "unknownItemCount": unk,
        "notes": notes,
    }


def parse_save(data: bytes) -> dict:
    entries = parse_bnd4(data)
    if len(entries) != 11:
        raise SaveParseError(f"Expected 11 BND4 entries, found {len(entries)}.")
    game = "dsr" if data[24:32] == b"\x00" * 8 else "ptde"
    valid = True

    def dec(i):
        nonlocal valid
        o, s = entries[i]
        blob = data[o:o + s]
        if not checksum_ok(blob):
            valid = False
        return decrypt_dsr(blob) if game == "dsr" else blob[16:]

    menu = dec(MENU_ENTRY)
    chars = []
    for i in range(SLOT_COUNT):
        buf = dec(i)
        if buf is None:
            continue
        c = parse_slot(buf, i, game, menu)
        if c:
            chars.append(c)
    return {"game": game, "checksumsValid": valid, "entryCount": len(entries), "characters": chars, "parserVersion": PARSER_VERSION}


if __name__ == "__main__":
    with open(sys.argv[1], "rb") as f:
        print(json.dumps(parse_save(f.read()), ensure_ascii=False))
