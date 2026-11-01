import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OVERRIDES = ROOT / "overrides"

# Personal pronouns as whole words. First person: "I" and its contractions as a capital, the rest in any case.
# Third person singular for a person (he, she and their other forms): any case.
PRONOUNS = re.compile(
    r"\bI(?:['’](?:m|ve|d|ll))?(?![\w'’])"
    r"|\b(?i:me|my|mine|myself|we|we['’](?:re|ve|d|ll)|our|ours|ourselves|us|let['’]s)\b"
    r"|\b(?i:he|him|his|himself|she|her|hers|herself)\b"
)
# Names that contain a pronoun without meaning a person, such as a Cisco lab title.
NAMES = re.compile(r"\bNetworking I\b|\bI/O\b|\bShows Us\b")
# Attributes a reader or screen reader gets as text.
TEXT_ATTRIBUTES = re.compile(r"""\b(?:alt|aria-label|title)\s*=\s*"([^"]*)\"""")


def keep_lines(match, text=""):
    """Replace a match with text and the newlines it spanned, so later line numbers stay right."""
    return text + "\n" * match.group(0).count("\n")


def tags_to_text(source):
    """Drop HTML tags but keep the text of their alt, aria-label and title attributes."""
    return re.sub(r"<[^>]+>", lambda match: keep_lines(match, " " + " ".join(TEXT_ATTRIBUTES.findall(match.group(0))) + " "), source)


def hits(text):
    found = []
    for number, line in enumerate(text.split("\n"), start=1):
        found += [(number, match.group(0)) for match in PRONOUNS.finditer(NAMES.sub(" ", line))]
    return found


def personal_pronouns(markdown):
    """(line, word) for each personal pronoun a reader sees on a page: frontmatter values whole,
    then body prose without code, double-quoted words, link targets and attribute lists.
    A page whose frontmatter sets `voice: personal` is exempt."""
    frontmatter, body = "", markdown
    if markdown.startswith("---\n"):
        end = markdown.index("\n---", 3)
        frontmatter, body = markdown[:end], markdown[end:]
        if (yaml.safe_load(frontmatter[4:]) or {}).get("voice") == "personal":
            return []
    body = re.sub(r"```.*?```", keep_lines, body, flags=re.DOTALL)
    body = re.sub(r"`[^`\n]*`", " ", body)
    body = tags_to_text(body)
    body = re.sub(r"\]\([^)\n]*\)", "]", body)
    body = re.sub(r"\{[^}\n]*\}", " ", body)
    body = re.sub(r"\"[^\"\n]*\"|“[^”\n]*”", " ", body)
    return hits(frontmatter + body)


def jinja_literals(match):
    """Keep only a Jinja block's quoted strings, such as a fallback description or alt text."""
    found = re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"", match.group(0))
    return keep_lines(match, " " + " ".join(single or double for single, double in found) + " ")


def template_pronouns(html):
    """(line, word) for each personal pronoun in a template's text and Jinja string literals,
    outside Jinja comments."""
    html = re.sub(r"\{#.*?#\}", keep_lines, html, flags=re.DOTALL)
    html = re.sub(r"\{%.*?%\}|\{\{.*?\}\}", jinja_literals, html, flags=re.DOTALL)
    return hits(tags_to_text(html))


class PersonalPronounTests(unittest.TestCase):
    def test_pages_avoid_personal_pronouns(self):
        pages = sorted(DOCS.rglob("*.md"))
        self.assertTrue(pages)
        found = [f"{page.relative_to(DOCS).as_posix()}:{line} {word}"
                 for page in pages for line, word in personal_pronouns(page.read_text(encoding="utf-8"))]
        self.assertEqual(found, [], f"{len(found)} personal pronouns:\n" + "\n".join(found))

    def test_templates_avoid_personal_pronouns(self):
        templates = sorted(OVERRIDES.rglob("*.html"))
        self.assertTrue(templates)
        found = [f"{template.relative_to(ROOT).as_posix()}:{line} {word}"
                 for template in templates for line, word in template_pronouns(template.read_text(encoding="utf-8"))]
        self.assertEqual(found, [], "\n".join(found))

    def test_scan_reports_prose_and_skips_code_quotes_and_personal_pages(self):
        page = (
            "---\n"
            "title: NETI 109 Networking I\n"
            'summary: {role: "I built it."}\n'
            "---\n"
            "# NETI 109 Networking I\n"
            "The host runs. I/O graphs and `my-tool` stay out.\n"
            'The lab says: "so I corrected the interface."\n'
            "See [our notes](https://example.com/my-page) and [Projects](index.md#what-i-did).\n"
            "```text\nMy number is 14.\n```\n"
            "## Lessons {#what-i-have-learned}\n"
            "We tested it on my laptop, and I'm sure I'd do it again.\n"
            '<img src="my.webp" alt="My dashboard" loading="lazy">\n'
            "Let us check it, and let's go.\n"
            "| 1.0.6 Top Hacker Shows Us How It Is Done | Research one hack |\n"
        )
        self.assertEqual(personal_pronouns(page), [
            (3, "I"), (8, "our"), (13, "We"), (13, "my"), (13, "I'm"), (13, "I'd"), (14, "My"),
            (15, "us"), (15, "let's"),
        ])
        post = "---\ntitle: A post\nvoice: personal\n---\n\nI wrote this post about my homelab.\n"
        self.assertEqual(personal_pronouns(post), [])
        self.assertEqual(personal_pronouns(post.replace("voice: personal\n", "")), [(5, "I"), (5, "my")])
        template = (
            "{# My role panel:\n   atop the body. #}\n"
            '<span class="panel-title">Role</span>\n'
            "{% if page.meta %}<p>For my work, see {{ 'experience/' | url }}.</p>{% endif %}\n"
            "{% set social_alt = 'Jadon beside my dashboard' %}{{ \"our page\" | e }}\n"
        )
        self.assertEqual(template_pronouns(template), [(4, "my"), (5, "my"), (5, "our")])

    def test_scan_reports_third_person_pronouns(self):
        page = (
            "---\n"
            'summary: {role: "He built it."}\n'
            "---\n"
            "Jadon set the goals, and he approved his own releases.\n"
            "She ran it; the logs were hers, so her team checked them herself.\n"
            "He's sure of it himself, and so is HIM.\n"
            "The shell, the theme, the hero and others aren't pronouns; `his-tool`, \"he said\" and [notes](his-page.md) are skipped.\n"
        )
        self.assertEqual(personal_pronouns(page), [
            (2, "He"), (4, "he"), (4, "his"), (5, "She"), (5, "hers"), (5, "her"), (5, "herself"),
            (6, "He"), (6, "himself"), (6, "HIM"),
        ])
        post = "---\ntitle: A post\nvoice: personal\n---\n\nHe wrote this post about his homelab.\n"
        self.assertEqual(personal_pronouns(post), [])
        self.assertEqual(personal_pronouns(post.replace("voice: personal\n", "")), [(5, "He"), (5, "his")])
        template = (
            "{# His role panel. #}\n"
            "{% set social_alt = 'Jadon beside his dashboard' %}<p>She checks it.</p>\n"
        )
        self.assertEqual(template_pronouns(template), [(2, "his"), (2, "She")])


if __name__ == "__main__":
    unittest.main()
