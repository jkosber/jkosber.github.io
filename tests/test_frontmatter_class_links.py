import shutil
import tempfile
import unittest
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.exceptions import Abort

ROOT = Path(__file__).resolve().parent.parent


class FrontmatterClassLinkTests(unittest.TestCase):
    def build_copy(self, temp, page=None, old=None, new=None):
        """Copy the site into temp, replace old with new once in docs/page, and build the copy strictly."""
        copy = Path(temp) / "repo"
        for name in ("docs", "overrides", "hooks"):
            shutil.copytree(ROOT / name, copy / name, ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copy2(ROOT / "mkdocs.yml", copy / "mkdocs.yml")
        if page:
            source = copy / "docs" / page
            text = source.read_text(encoding="utf-8")
            self.assertEqual(text.count(old), 1, f"{old!r} in {page}")
            source.write_text(text.replace(old, new), encoding="utf-8")
        build(load_config(config_file=str(copy / "mkdocs.yml"), site_dir=str(Path(temp) / "site"), strict=True))

    def assert_build_fails(self, message, page, old, new):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertLogs("mkdocs", level="ERROR") as logs, self.assertRaises(Abort):
                self.build_copy(temp, page, old, new)
        self.assertEqual([record.getMessage() for record in logs.records], [message])

    def test_class_page_without_trailing_slash_fails_the_build(self):
        self.assert_build_fails(
            "technical-labs/aws-linux-infrastructure/: class_page must be a page url ending in '/'",
            "technical-labs/aws-linux-infrastructure.md",
            "class_page: coursework/svad-111/\n",
            "class_page: coursework/svad-111\n",
        )

    def test_missing_class_name_fails_the_build(self):
        self.assert_build_fails(
            "technical-labs/snort-firewall-lab/: class_name must be a non-empty string",
            "technical-labs/snort-firewall-lab.md",
            "class_name: CSIA 115 Cyber Ops\n",
            "",
        )

    def test_unmodified_site_builds_without_warnings(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertNoLogs("mkdocs", level="WARNING"):
                self.build_copy(temp)
            index = (Path(temp) / "site" / "coursework" / "index.html").read_text(encoding="utf-8")
        cell = '<td role="cell"><a href="../technical-labs/aws-linux-infrastructure/">AdventureWorks on AWS</a></td>'
        self.assertEqual(index.count(cell), 1)


if __name__ == "__main__":
    unittest.main()
