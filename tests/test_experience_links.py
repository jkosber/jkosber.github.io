import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
LINK = re.compile(r"\[([^\]\n]+)\]\(([^)\s]+)\)")
EXPERIENCE = "../experience/index.md"


def roles():
    """The roles in the Experience page's frontmatter."""
    source = (DOCS / "experience" / "index.md").read_text(encoding="utf-8")
    return yaml.safe_load(FRONTMATTER.match(source).group(1))["roles"]


def experience_links(page):
    """(text, fragment) for each Markdown link in docs/page whose target starts with the Experience page."""
    source = (DOCS / page).read_text(encoding="utf-8")
    return [(text, target.partition("#")[2]) for text, target in LINK.findall(source) if target.startswith(EXPERIENCE)]


class ExperienceLinkTests(unittest.TestCase):
    def test_about_page_employer_links_land_on_their_role(self):
        role_by_employer = {role["organization"]: role["id"] for role in roles()}
        links = [(text, fragment) for text, fragment in experience_links("credentials/index.md") if text in role_by_employer]
        self.assertEqual(links, [(text, role_by_employer[text]) for text, _ in links])
        self.assertEqual({fragment for _, fragment in links}, {"ladd-dental", "verizon-conversions"})


if __name__ == "__main__":
    unittest.main()
