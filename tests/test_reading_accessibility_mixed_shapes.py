import unittest
from html.parser import HTMLParser

from hooks.reading_accessibility import ReadingRegions


class Events(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.events = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.events.append(("start", tag, dict(attrs)))

    def handle_endtag(self, tag):
        self.events.append(("end", tag, {}))


class MixedTableShapeTests(unittest.TestCase):
    def test_each_table_uses_its_own_shape(self):
        pair = ('<table><tr><th>CPU</th><td>i7</td></tr>'
                '<tr><th>RAM</th><td>16 GB</td></tr></table>')
        wide = ('<table><tr><th>A</th><th>B</th><th>C</th></tr>'
                '<tr><td>1</td><td>2</td><td>3</td></tr></table>')
        source = '<h2>Host</h2>' + pair + '<p>Between</p>' + wide
        result = ReadingRegions(source, "Project").render()
        events = Events(result).events

        wrappers = [attrs for kind, tag, attrs in events if kind == "start" and attrs.get("class") == "table-scroll"]
        self.assertEqual([item.get("data-columns") for item in wrappers], ["2", None])
        self.assertEqual([item["aria-label"] for item in wrappers], ["Table 1: Host", "Table 2: Host"])

        tables = [attrs for kind, tag, attrs in events if kind == "start" and tag == "table"]
        self.assertEqual([item.get("role") for item in tables], ["table", None])

        hint = '<p class="table-hint">Scroll horizontally to read the full table on a narrow screen.</p>'
        self.assertEqual(result.count('class="table-hint"'), 1)
        self.assertTrue(result.endswith(wide + '</div>' + hint))
        after_tables = []
        for index, (kind, tag, attrs) in enumerate(events):
            if kind == "end" and tag == "table":
                after_tables.append(events[index + 1:index + 3])
        self.assertEqual(after_tables, [
            [("end", "div", {}), ("start", "p", {})],
            [("end", "div", {}), ("start", "p", {"class": "table-hint"})],
        ])


if __name__ == "__main__":
    unittest.main()
