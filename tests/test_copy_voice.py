import re
import unittest
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"

# Words that make a page read like an audit report instead of plain, work-led writing.
AUDIT_WORDS = re.compile(
    r"\brecord(s|ed)?\b|\bhistorical\b|\bestablish(es|ed)?\b|\bsupplied\b|\bevidence\b",
    re.IGNORECASE,
)


def visible_copy(markdown):
    """Body text a reader sees: no frontmatter, code, markup, link targets or attribute lists."""
    if markdown.startswith("---"):
        markdown = markdown.split("---", 2)[2]
    markdown = re.sub(r"```.*?```", " ", markdown, flags=re.DOTALL)
    markdown = re.sub(r"`[^`\n]*`", " ", markdown)
    markdown = re.sub(r"<[^>]+>", " ", markdown)
    markdown = re.sub(r"\]\([^)]*\)", "]", markdown)
    return re.sub(r"\{[^}\n]*\}", " ", markdown)


class CopyVoiceTests(unittest.TestCase):
    def test_pages_avoid_audit_vocabulary(self):
        pages = sorted(DOCS.rglob("*.md"))
        self.assertTrue(pages)
        for page in pages:
            copy = visible_copy(page.read_text(encoding="utf-8"))
            with self.subTest(page=page.relative_to(DOCS).as_posix()):
                hits = [match.group(0) for match in AUDIT_WORDS.finditer(copy)]
                self.assertLessEqual(len(hits), 3, hits)
                self.assertNotRegex(copy, re.compile("artifact", re.IGNORECASE))

    def test_visible_copy_keeps_text_and_drops_markup(self):
        page = (
            "---\ntitle: Records\n---\n"
            "## Sources and artifacts {#sources-and-artifacts}\n"
            "I recorded it. `evidence` stays out, as do ```\nhistorical\n``` blocks.\n"
            '<figure class="evidence-figure"><img src="assets/evidence/x.webp"></figure>\n'
            "[a link](assets/evidence/y.png)\n"
        )
        copy = visible_copy(page)
        self.assertEqual([match.group(0) for match in AUDIT_WORDS.finditer(copy)], ["recorded"])
        self.assertIn("Sources and artifacts", copy)
        self.assertNotIn("sources-and-artifacts", copy)
        self.assertIn("a link", copy)


if __name__ == "__main__":
    unittest.main()
