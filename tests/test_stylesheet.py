import re
import unittest
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "docs" / "stylesheets" / "portfolio.css"

# The design tokens from the visual upgrade spec, written as the stylesheet writes them.
TOKENS = {
    "--bg": "#091827",
    "--band": "#0f2b48",
    "--surface": "#15365a",
    "--raised": "#1d4570",
    "--inset": "#0b2238",
    "--line": "#2c5379",
    "--line-strong": "#4a7aa6",
    "--text": "#d1deed",
    "--heading": "#f2f7ff",
    "--muted": "#afc2d8",
    "--accent": "#80c5ff",
    "--warm": "#ffc36b",
    "--on-warm": "#10233a",
    "--s1": ".5rem",
    "--s2": "1rem",
    "--s3": "1.5rem",
    "--s4": "2.5rem",
    "--s5": "4rem",
    "--s6": "6rem",
    "--s7": "9rem",
    "--t-small": ".875rem",
    "--t-body": "1.0625rem",
    "--t-lead": "1.3125rem",
    "--t-h3": "1.625rem",
    "--t-h2": "2.125rem",
    "--t-h1": "2.75rem",
    "--t-name": "4.5rem",
    "--r-s": "6px",
    "--r-m": "12px",
    "--r-l": "20px",
    "--overhang": "3.5rem",
}


def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)


def block_end(css, open_index):
    """Index just past the brace that closes the one at open_index."""
    depth = 0
    for index in range(open_index, len(css)):
        if css[index] == "{":
            depth += 1
        elif css[index] == "}":
            depth -= 1
            if depth == 0:
                return index + 1
    raise ValueError(f"unbalanced brace at {open_index}")


def strip_blocks(css, prelude):
    """Remove every block whose prelude matches the pattern, nested blocks included."""
    pattern = re.compile(prelude + r"\s*\{")
    while match := pattern.search(css):
        css = css[: match.start()] + css[block_end(css, match.end() - 1):]
    return css


def first_root_properties(css):
    css = strip_comments(css)
    match = re.search(r":root\s*\{", css)
    if not match:
        return {}
    body = css[match.end(): block_end(css, match.end() - 1) - 1]
    return dict(re.findall(r"(--[\w-]+)\s*:\s*([^;]+?)\s*;", body))


class StylesheetTests(unittest.TestCase):
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        cls.css = CSS.read_text(encoding="utf-8")

    def test_tokens_have_design_values(self):
        properties = first_root_properties(self.css)
        self.assertEqual({name: properties.get(name) for name in TOKENS}, TOKENS)

    def test_no_raw_hex_outside_tokens_print_and_forced_colors(self):
        rest = strip_blocks(self.css, r"@media\s+print")
        rest = strip_blocks(rest, r"@media\s*\(\s*forced-colors\s*:\s*active\s*\)")
        rest = strip_blocks(rest, r":root")
        self.assertEqual(re.findall(r"#[0-9a-fA-F]{3,8}\b", rest), [])

    def test_focus_rules_set_no_radius(self):
        rules = re.findall(r"([^{}]+)\{([^{}]*)\}", strip_comments(self.css))
        offenders = [
            " ".join(selector.split())
            for selector, body in rules
            if ":focus-visible" in selector and re.search(r"\bborder(?:-[a-z]+)*-radius\s*:", body)
        ]
        self.assertEqual(offenders, [])

    def test_no_transition_on_all(self):
        self.assertNotRegex(self.css, r"transition[^;]*\ball\b")

    def test_important_only_with_reason(self):
        unexplained = [line.strip() for line in self.css.splitlines() if "!important" in line and "anti-slop-allow:" not in line]
        self.assertEqual(unexplained, [])


if __name__ == "__main__":
    unittest.main()
