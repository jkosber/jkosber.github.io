import shutil
import tempfile
import unittest
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.exceptions import Abort

ROOT = Path(__file__).resolve().parent.parent


class FrontmatterImageSourceTests(unittest.TestCase):
    def assert_build_fails(self, message, page, old, new):
        """Copy the site, replace old with new once in docs/page, and expect the strict build to log message and abort."""
        with tempfile.TemporaryDirectory() as temp:
            copy = Path(temp) / "repo"
            for name in ("docs", "overrides", "hooks"):
                shutil.copytree(ROOT / name, copy / name, ignore=shutil.ignore_patterns("__pycache__"))
            shutil.copy2(ROOT / "mkdocs.yml", copy / "mkdocs.yml")
            source = copy / "docs" / page
            text = source.read_text(encoding="utf-8")
            self.assertEqual(text.count(old), 1, f"{old!r} in {page}")
            source.write_text(text.replace(old, new), encoding="utf-8")
            config = load_config(config_file=str(copy / "mkdocs.yml"), site_dir=str(Path(temp) / "site"), strict=True)
            with self.assertLogs("mkdocs", level="ERROR") as logs, self.assertRaises(Abort):
                build(config)
        self.assertEqual([record.getMessage() for record in logs.records], [message])

    def test_art_without_src_fails_the_build(self):
        self.assert_build_fails(
            "technical-labs/job-scan-tailor/: art must have a src",
            "technical-labs/job-scan-tailor.md",
            "art: {src: assets/project-resume.svg, width: 600, height: 340}\n",
            "art: {width: 600, height: 340}\n",
        )

    def test_screenshot_without_src_fails_the_build(self):
        self.assert_build_fails(
            "technical-labs/ssh-workbench/: screenshot must have a src",
            "technical-labs/ssh-workbench.md",
            "  src: assets/evidence/ssh-workbench/workbench-main-2026-10-22.webp\n",
            "",
        )

    def test_role_without_image_fails_the_build(self):
        self.assert_build_fails(
            "experience/: roles[0] must have an image",
            "experience/index.md",
            "    image: assets/roles/retail-conversions.svg\n",
            "",
        )


if __name__ == "__main__":
    unittest.main()
