import importlib
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from types import SimpleNamespace

import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG = yaml.safe_load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"))
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


def extensions():
    """The mkdocs.yml Markdown extensions as names and their settings."""
    names, settings = [], {}
    for entry in CONFIG["markdown_extensions"]:
        if isinstance(entry, dict):
            (name, options), = entry.items()
            names.append(name)
            settings[name] = options or {}
        else:
            names.append(entry)
    return names, settings


def page_content_hooks():
    """Each configured hook's on_page_content, in the order mkdocs.yml runs them."""
    hooks = []
    for path in CONFIG["hooks"]:
        module = importlib.import_module("hooks." + Path(path).stem)
        if hasattr(module, "on_page_content"):
            hooks.append((Path(path).name, module.on_page_content))
    return hooks


def build(slug):
    """A docs page rendered the way MkDocs renders it: Markdown, then every page-content hook in order."""
    source = (ROOT / "docs" / "coursework" / f"{slug}.md").read_text(encoding="utf-8")
    match = FRONTMATTER.match(source)
    meta = yaml.safe_load(match.group(1))
    names, settings = extensions()
    html = markdown.markdown(source[match.end():], extensions=names, extension_configs=settings)
    page = SimpleNamespace(title=meta["title"], meta=meta)
    for _, hook in page_content_hooks():
        html = hook(html, page=page, config=CONFIG, files=None)
    return html


class Page(HTMLParser):
    """Lab modules, their counts, lab tables, phone labels and scroll hints in a built page."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.modules = []
        self.counts = []
        self.lab_tables = 0
        self.did_labels = 0
        self.hints_in_modules = 0
        self.in_count = False
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        names = (attributes.get("class") or "").split()
        if tag == "details" and "lab-module" in names:
            self.modules.append(attributes)
        if "lab-table" in names:
            self.lab_tables += 1
        if tag == "span" and "did-label" in names:
            self.did_labels += 1
        if tag == "span" and "lab-count" in names:
            self.in_count = True
            self.counts.append("")
        if "table-hint" in names and any(node == "details" for node in self.stack):
            self.hints_in_modules += 1
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag == "span":
            self.in_count = False
        if tag in self.stack:
            while self.stack.pop() != tag:
                pass

    def handle_data(self, data):
        if self.in_count:
            self.counts[-1] += data
        # The hint's text as well as its class, so a renamed class still counts.
        if "Scroll horizontally" in data and "details" in self.stack:
            self.hints_in_modules += 1


class ComposedClassPageTests(unittest.TestCase):
    def test_reading_accessibility_runs_before_class_sections(self):
        order = [name for name, _ in page_content_hooks()]
        self.assertEqual(order, ["reading_accessibility.py", "class_sections.py"])

    def test_neti_109_labs_fold_and_stack_after_both_hooks(self):
        page = Page(build("neti-109"))
        self.assertEqual(page.modules, [{"class": "lab-module"}] * 4)
        self.assertEqual(page.counts, ["12 labs", "6 labs", "13 labs", "5 labs"])
        self.assertEqual(sum(int(count.split()[0]) for count in page.counts), 36)
        self.assertEqual(page.lab_tables, 4)
        self.assertEqual(page.did_labels, 36)
        self.assertEqual(page.hints_in_modules, 0)


if __name__ == "__main__":
    unittest.main()
