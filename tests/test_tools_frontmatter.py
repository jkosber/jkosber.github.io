import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
CONFIG = yaml.safe_load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"))
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)


def projects_pages():
    """The docs paths in the nav section whose first child is technical-labs/index.md, the section
    the homepage lists as Projects."""
    for entry in CONFIG["nav"]:
        (_, children), = entry.items()
        if isinstance(children, list):
            paths = [next(iter(child.values())) if isinstance(child, dict) else child for child in children]
            if paths[0] == "technical-labs/index.md":
                return set(paths)
    return set()


def frontmatter(path):
    match = FRONTMATTER.match(path.read_text(encoding="utf-8"))
    return (yaml.safe_load(match.group(1)) or {}) if match else {}


class ToolsFrontmatterTests(unittest.TestCase):
    def test_tools_only_on_projects_pages_with_a_screenshot(self):
        """Only the homepage feature panel reads `tools`: a Projects page with a `screenshot`."""
        projects = projects_pages()
        self.assertIn("technical-labs/index.md", projects)
        offending = []
        for path in sorted(DOCS.rglob("*.md")):
            page = path.relative_to(DOCS).as_posix()
            meta = frontmatter(path)
            if "tools" in meta and (page not in projects or "screenshot" not in meta):
                offending.append(page)
        self.assertEqual(offending, [], f"tools frontmatter that no template renders: {offending}")


if __name__ == "__main__":
    unittest.main()
