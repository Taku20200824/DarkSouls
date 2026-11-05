"""Companion unit tests (python -m unittest discover -s companion)."""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ds1parser import SaveParseError, all_checksums_ok, parse_save  # noqa: E402
import lordran_companion as lc  # noqa: E402

FIXTURE = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures", "ptde-dsfp.sl2")


class ParserTests(unittest.TestCase):
    def test_fixture(self):
        with open(FIXTURE, "rb") as f:
            data = f.read()
        s = parse_save(data)
        self.assertEqual([c["name"]["value"] for c in s["characters"]], ["Карл", "Максимилиантр"])
        self.assertEqual(s["characters"][0]["deaths"]["value"], 155)
        self.assertTrue(all_checksums_ok(data))

    def test_garbage(self):
        with self.assertRaises(SaveParseError):
            parse_save(b"\x00" * 100)


class AutostartTests(unittest.TestCase):
    def test_script_runs_hidden_and_quotes_paths(self):
        script = lc.startup_script()
        self.assertTrue(script.startswith('CreateObject("WScript.Shell").Run "'))
        self.assertIn('lordran_companion.py"" ""run""", 0, False', script)


class SnapshotTests(unittest.TestCase):
    def test_partial_file_rejected(self):
        with open(FIXTURE, "rb") as f:
            data = bytearray(f.read())
        data[500000] ^= 0xFF  # corrupt one entry => MD5 mismatch, like a half-written save
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "DRAKS0005.sl2")
            with open(p, "wb") as f:
                f.write(data)
            self.assertIsNone(lc.read_stable_snapshot(p, attempts=2))

    def test_complete_file_accepted_and_untouched(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "DRAKS0005.sl2")
            with open(FIXTURE, "rb") as f, open(p, "wb") as g:
                g.write(f.read())
            before = os.stat(p).st_mtime_ns
            self.assertIsNotNone(lc.read_stable_snapshot(p))
            self.assertEqual(before, os.stat(p).st_mtime_ns)

    def test_missing_file(self):
        self.assertIsNone(lc.read_stable_snapshot("/nonexistent/DRAKS0005.sl2", attempts=1))


if __name__ == "__main__":
    unittest.main()
