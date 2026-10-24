import unittest
from pathlib import Path

COURSEWORK = Path(__file__).resolve().parent.parent / "docs" / "coursework"
CLASS_PAGES = ["neti-109", "svad-111", "csia-115", "csia-210", "csia-105", "sdev-120"]


def section(markdown, heading):
    """The text of one `## heading` section, up to the next h2."""
    start = markdown.index(f"\n## {heading}")
    end = markdown.find("\n## ", start + 1)
    return markdown[start:] if end == -1 else markdown[start:end]


class ClassPageTests(unittest.TestCase):
    def pages(self):
        for slug in CLASS_PAGES:
            yield slug, (COURSEWORK / f"{slug}.md").read_text(encoding="utf-8")

    def test_strongest_work_comes_before_labs(self):
        for slug, markdown in self.pages():
            with self.subTest(page=slug):
                self.assertLess(markdown.index("\n## Strongest work"), markdown.index("\n## Labs"))

    def test_lab_rows_point_up_to_strongest_work(self):
        above = 0
        for slug, markdown in self.pages():
            labs = section(markdown, "Labs")
            with self.subTest(page=slug):
                self.assertNotIn("(see below)", labs)
            above += labs.count("(see above)")
        self.assertEqual(above, 19)


if __name__ == "__main__":
    unittest.main()
