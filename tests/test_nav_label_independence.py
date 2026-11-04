import re
import shutil
import tempfile
import unittest
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config

ROOT = Path(__file__).resolve().parent.parent
# Top-level nav labels and the words they become in the renamed copy.
RENAMES = {"Projects": "Work", "Coursework": "Classes", "Experience": "Professional experience"}
# (built page, marker): one marker per template lookup that finds a nav section or the Experience page.
MARKERS = [
    ("index.html", 'class="feature'),
    ("index.html", 'class="tile '),
    ("index.html", 'class="role-card"'),
    ("technical-labs/index.html", 'class="project-row '),
    ("coursework/index.html", 'class="class-code"'),
    ("experience/index.html", '<article class="role"'),
]


def counts(config_file, site_dir):
    """Build config_file strictly into site_dir and count each marker on its page."""
    build(load_config(config_file=str(config_file), site_dir=str(site_dir), strict=True))
    return {f"{page} {marker}": (site_dir / page).read_text(encoding="utf-8").count(marker) for page, marker in MARKERS}


class NavLabelIndependenceTests(unittest.TestCase):
    maxDiff = None

    def test_sections_survive_a_nav_label_rename(self):
        with tempfile.TemporaryDirectory() as temp:
            copy = Path(temp) / "repo"
            for name in ("docs", "overrides", "hooks"):
                shutil.copytree(ROOT / name, copy / name, ignore=shutil.ignore_patterns("__pycache__"))
            config = copy / "mkdocs.yml"
            shutil.copy2(ROOT / "mkdocs.yml", config)

            expected = counts(config, Path(temp) / "site-labelled")
            self.assertEqual([marker for marker, count in expected.items() if count == 0], [])

            text = config.read_text(encoding="utf-8")
            for label, renamed in RENAMES.items():
                text, replaced = re.subn(rf"^  - {label}:", f"  - {renamed}:", text, flags=re.MULTILINE)
                self.assertEqual(replaced, 1, f"top-level nav label {label!r}")
            config.write_text(text, encoding="utf-8")

            self.assertEqual(counts(config, Path(temp) / "site-renamed"), expected)


if __name__ == "__main__":
    unittest.main()
