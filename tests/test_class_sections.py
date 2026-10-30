import unittest
from html.parser import HTMLParser
from types import SimpleNamespace

from hooks.class_sections import ClassSections, on_page_content

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
HINT = '<p class="table-hint">Scroll horizontally to read the full table on a narrow screen.</p>'


class Tree(HTMLParser):
    """Every element and text node with the open elements around it, outermost first."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.elements = []
        self.texts = []
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        node = (tag, dict(attrs))
        self.elements.append((node, list(self.stack)))
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.elements.append(((tag, dict(attrs)), list(self.stack)))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if data.strip():
            self.texts.append((data.strip(), list(self.stack)))

    def find(self, tag, **attrs):
        return [(node, around) for node, around in self.elements
                if node[0] == tag and all(node[1].get(key) == value for key, value in attrs.items())]


class SummaryText(HTMLParser):
    """Each summary's text, joined the way a screen reader reads its parts in a row."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.summaries = []
        self.inside = False
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        if tag == "summary":
            self.inside = True
            self.summaries.append("")

    def handle_endtag(self, tag):
        if tag == "summary":
            self.inside = False

    def handle_data(self, data):
        if self.inside:
            self.summaries[-1] += data


def nearest(around, tag):
    return next((node for node in reversed(around) if node[0] == tag), None)


def has_class(node, name):
    return node is not None and name in node[1].get("class", "").split()


def module(heading_id, title, rows, number):
    body = "".join(f"<tr>\n<td>{lab}</td>\n<td>{asked}</td>\n<td>{did}</td>\n</tr>\n" for lab, asked, did in rows)
    return (
        f'<h3 id="{heading_id}">{title}</h3>\n'
        f'<div class="table-scroll" role="region" tabindex="0" aria-label="Table {number}: {title}"><table>\n'
        "<thead>\n<tr>\n<th>Lab</th>\n<th>What it asked</th>\n<th>What I did</th>\n</tr>\n</thead>\n"
        f"<tbody>\n{body}</tbody>\n</table></div>{HINT}\n"
    )


# Shaped like hooks/reading_accessibility.py output for a class page.
LABS = '<h2 id="labs">Labs</h2>\n' + module("m1", "One", [
    ("1.1 First lab", "Asked &amp; answered", "Did <code>ping</code>"),
    ("1.2 Second lab", "Asked again", "Did more"),
], 1) + module("m2", "Two", [
    ("2.1 Third lab", "Asked last", "Did it (see above)"),
], 2)
SKILLS = '<h2 id="skills">Skills</h2>\n<ul>\n<li>Subnetting (1.1, 1.2)</li>\n</ul>\n'
INTRO = '<h1 id="class">Class</h1>\n<p>Intro &amp; overview.</p>\n'
ITEM_A = (
    '<h3 id="a">A item (1.1)</h3>\n<p>A text.</p>\n'
    '<div class="table-scroll" role="region" tabindex="0" aria-label="Table 3: A item (1.1)" data-columns="2">'
    '<table role="table">\n<thead role="rowgroup">\n<tr role="row">\n<th role="columnheader">Check</th>\n'
    '<th role="columnheader">Result</th>\n</tr>\n</thead>\n<tbody role="rowgroup">\n<tr role="row">\n'
    '<td role="cell">Mask</td>\n<td role="cell">/26</td>\n</tr>\n</tbody>\n</table></div>\n'
)
ITEM_B = '<h3 id="b">B item</h3>\n<p>B text.</p>\n'
ITEM_C = '<h3 id="c">C item</h3>\n<p>C text.</p>\n'
ITEM_D = '<h3 id="d">D item</h3>\n<p>D text.</p>\n'
STRONGEST = '<h2 id="strongest-work">Strongest work</h2>\n' + ITEM_A + ITEM_B + ITEM_C + ITEM_D


def item_sections(tree):
    """For each Strongest work h3: the section around it and the div around that section."""
    found = {}
    for node, around in tree.find("h3"):
        section = nearest(around, "section")
        if section is not None:
            found[node[1]["id"]] = (section, nearest(around, "div"))
    return found


class ClassSectionsTests(unittest.TestCase):
    maxDiff = None

    def test_each_module_becomes_a_closed_details(self):
        result = ClassSections(LABS + SKILLS).render()
        tree = Tree(result)
        modules = tree.find("details")
        self.assertEqual([node[1] for node, _ in modules], [{"class": "lab-module"}, {"class": "lab-module"}])
        self.assertIn('<summary><h3 id="m1">One</h3> <span class="lab-count">2 labs</span></summary>', result)
        self.assertIn('<summary><h3 id="m2">Two</h3> <span class="lab-count">1 lab</span></summary>', result)
        regions = {node[1]["aria-label"]: nearest(around, "details") for node, around in tree.find("div", role="region")}
        self.assertIs(regions["Table 1: One"], modules[0][0])
        self.assertIs(regions["Table 2: Two"], modules[1][0])
        hints = [around for node, around in tree.elements if has_class(node, "table-hint")]
        self.assertEqual([nearest(around, "details") for around in hints if nearest(around, "details")], [])

    def test_a_module_without_lab_rows_shows_no_count(self):
        source = '<h2 id="labs">Labs</h2>\n<h3 id="m0">Zero</h3>\n<p>Nothing of mine survived.</p>\n' + module("m1", "One", [
            ("1.1 First lab", "Asked", "Did"),
        ], 1)
        result = ClassSections(source).render()
        self.assertIn('<details class="lab-module"><summary><h3 id="m0">Zero</h3></summary>', result)
        self.assertIn('<summary><h3 id="m1">One</h3> <span class="lab-count">1 lab</span></summary>', result)
        self.assertNotIn("0 labs", result)

    def test_the_lab_count_reads_as_a_separate_word(self):
        # The count sits apart from the heading only through CSS; without whitespace in the markup
        # a screen reader can run them together ("One2 labs").
        source = '<h2 id="labs">Labs</h2>\n<h3 id="m0">Zero</h3>\n<p>Nothing of mine survived.</p>\n' + LABS.split("\n", 1)[1]
        summaries = SummaryText(ClassSections(source).render()).summaries
        self.assertEqual([" ".join(text.split()) for text in summaries], ["Zero", "One 2 labs", "Two 1 lab"])

    def test_lab_tables_get_roles_and_a_visual_label(self):
        result = ClassSections(LABS).render()
        tree = Tree(result)
        self.assertEqual([node[1] for node, _ in tree.find("div", role="region")], [
            {"class": "table-scroll lab-table", "role": "region", "tabindex": "0", "aria-label": "Table 1: One"},
            {"class": "table-scroll lab-table", "role": "region", "tabindex": "0", "aria-label": "Table 2: Two"},
        ])
        roles = lambda *tags: [node[1].get("role") for node, _ in tree.elements if node[0] in tags]
        self.assertEqual(roles("table"), ["table", "table"])
        self.assertEqual(roles("thead", "tbody"), ["rowgroup"] * 4)
        self.assertEqual(roles("tr"), ["row"] * 5)
        self.assertEqual(roles("th"), ["columnheader"] * 6)
        self.assertEqual(roles("td"), ["cell"] * 9)
        label = '<span class="did-label" aria-hidden="true">What I did: </span>'
        self.assertIn(f'<td role="cell">{label}Did <code>ping</code></td>', result)
        self.assertIn(f'<td role="cell">{label}Did more</td>', result)
        self.assertIn(f'<td role="cell">{label}Did it (see above)</td>', result)
        self.assertEqual(result.count(label), 3)
        self.assertIn('<td role="cell">1.1 First lab</td>', result)
        self.assertIn('<td role="cell">Asked &amp; answered</td>', result)

    def test_sections_after_labs_stay_outside(self):
        tree = Tree(ClassSections(LABS + SKILLS).render())
        (skills, around), = tree.find("h2", id="skills")
        self.assertIsNone(nearest(around, "details"))
        after = [around for text, around in tree.texts if text in {"Skills", "Subnetting (1.1, 1.2)"}]
        self.assertEqual(len(after), 2)
        self.assertEqual([nearest(around, "details") for around in after], [None, None])
        (_, labs_around), = tree.find("h2", id="labs")
        self.assertIsNone(nearest(labs_around, "details"))

    def test_strongest_work_panels_and_brief_pairs(self):
        tree = Tree(ClassSections(INTRO + STRONGEST + LABS + SKILLS).render())
        items = item_sections(tree)
        self.assertEqual(sorted(items), ["a", "b", "c", "d"])
        self.assertEqual({key: section[1] for key, (section, _) in items.items()}, {
            "a": {"class": "work"},
            "b": {"class": "work work--brief"},
            "c": {"class": "work work--brief"},
            "d": {"class": "work"},
        })
        pairs = tree.find("div", **{"class": "work-pair"})
        self.assertEqual(len(pairs), 1)
        self.assertIs(items["b"][1], pairs[0][0])
        self.assertIs(items["c"][1], pairs[0][0])
        self.assertFalse(has_class(items["a"][1], "work-pair"))
        self.assertFalse(has_class(items["d"][1], "work-pair"))
        # Each item's text and table sit inside its own section; the h2 and the intro sit outside.
        texts = {text: nearest(around, "section") for text, around in tree.texts}
        for key, text in {"a": "A text.", "b": "B text.", "c": "C text.", "d": "D text."}.items():
            self.assertIs(texts[text], items[key][0])
        self.assertIs(texts["Mask"], items["a"][0])
        self.assertIsNone(texts["Strongest work"])
        self.assertIsNone(texts["Intro & overview."])
        self.assertIsNone(texts["Labs"])

    def test_intro_paragraph_before_the_first_item_stays_outside(self):
        source = '<h2 id="strongest-work">Strongest work</h2>\n<p>Lead-in.</p>\n' + ITEM_B + ITEM_C + ITEM_D
        tree = Tree(ClassSections(source).render())
        texts = {text: nearest(around, "section") for text, around in tree.texts}
        self.assertIsNone(texts["Lead-in."])
        self.assertEqual({key: section[1]["class"] for key, (section, _) in item_sections(tree).items()},
                         {"b": "work", "c": "work work--brief", "d": "work work--brief"})

    def test_first_item_is_never_brief(self):
        source = '<h2 id="strongest-work">Strongest work</h2>\n<h3 id="x">X</h3>\n<p>One.</p>\n<h3 id="y">Y</h3>\n<p>Two.</p>\n'
        tree = Tree(ClassSections(source).render())
        self.assertEqual({key: section[1] for key, (section, _) in item_sections(tree).items()},
                         {"x": {"class": "work"}, "y": {"class": "work"}})
        self.assertEqual(tree.find("div", **{"class": "work-pair"}), [])

    def test_brief_means_at_most_two_paragraphs_only(self):
        lead = '<h2 id="strongest-work">Strongest work</h2>\n<h3 id="lead">Lead</h3>\n<p>Lead text.</p>\n'
        follow = '<h3 id="next">Next</h3>\n<p>Next text.</p>\n'
        not_brief = {
            "three paragraphs": "<p>1.</p>\n<p>2.</p>\n<p>3.</p>\n",
            "a list": "<p>1.</p>\n<ul>\n<li>Item</li>\n</ul>\n",
            "code": '<p>1.</p>\n<pre role="group" tabindex="0" aria-label="Code example 1: X"><code>ls\n</code></pre>\n',
            "a figure": '<p>1.</p>\n<figure class="evidence-figure"><img src="x.webp" alt="X"></figure>\n',
            "a quote": "<p>1.</p>\n<blockquote>\n<p>Quoted.</p>\n</blockquote>\n",
        }
        for name, body in not_brief.items():
            with self.subTest(item=name):
                tree = Tree(ClassSections(lead + '<h3 id="x">X</h3>\n' + body + follow).render())
                self.assertEqual({key: section[1]["class"] for key, (section, _) in item_sections(tree).items()},
                                 {"lead": "work", "x": "work", "next": "work"})
                self.assertEqual(tree.find("div", **{"class": "work-pair"}), [])
        tree = Tree(ClassSections(lead + '<h3 id="x">X</h3>\n<p>1.</p>\n<p>2.</p>\n' + follow).render())
        self.assertEqual({key: section[1]["class"] for key, (section, _) in item_sections(tree).items()},
                         {"lead": "work", "x": "work work--brief", "next": "work work--brief"})
        self.assertEqual(len(tree.find("div", **{"class": "work-pair"})), 1)

    def test_text_and_ids_survive(self):
        source = INTRO + STRONGEST + LABS + SKILLS
        before, after = Tree(source), Tree(ClassSections(source).render())
        ids = lambda tree: [node[1]["id"] for node, _ in tree.elements if "id" in node[1]]
        self.assertEqual(ids(after), ids(before))
        # The hook adds the lab counts and the phone label, and drops the sideways-scroll hint:
        # lab rows stack on phones instead of scrolling.
        added = {"2 labs", "1 lab", "What I did:"}
        hint = "Scroll horizontally to read the full table on a narrow screen."
        self.assertEqual([text for text, _ in after.texts if text not in added],
                         [text for text, _ in before.texts if text != hint])

    def test_pages_without_code_are_unchanged(self):
        html = INTRO + STRONGEST + LABS + SKILLS
        self.assertEqual(on_page_content(html, page=SimpleNamespace(meta={}), config={}, files=None), html)

    def test_class_pages_get_the_sections(self):
        html = INTRO + STRONGEST + LABS + SKILLS
        result = on_page_content(html, page=SimpleNamespace(meta={"code": "NETI 109"}), config={}, files=None)
        self.assertEqual(result, ClassSections(html).render())
        self.assertEqual(result.count('<details class="lab-module">'), 2)


if __name__ == "__main__":
    unittest.main()
