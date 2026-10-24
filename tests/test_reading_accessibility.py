import unittest
from html.parser import HTMLParser

from hooks.reading_accessibility import ReadingRegions


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


class ReadingAccessibilityTests(unittest.TestCase):
    def test_tables_have_distinct_contextual_names_and_keep_contents(self):
        table = '<table><tr><th>Result</th><td>1 &lt; 2</td></tr></table>'
        source = '<h2 id="checks">Checks &amp; <code>results</code></h2>\n' + table + table
        result = ReadingRegions(source, "Project").render()
        regions = [attrs for tag, attrs in Elements(result).elements if attrs.get("role") == "region"]
        self.assertEqual([item["aria-label"] for item in regions], [
            "Table 1: Checks & results", "Table 2: Checks & results",
        ])
        self.assertTrue(all(item["tabindex"] == "0" for item in regions))
        self.assertEqual(result.count(table), 2)
        self.assertIn('<h2 id="checks">Checks &amp; <code>results</code></h2>', result)

    def test_code_is_a_named_keyboard_group_without_changing_code(self):
        code = '<code class="language-bash">echo &quot;&lt;table&gt;&quot;\n</code>'
        result = ReadingRegions('<h3 id="setup">Server setup</h3><pre>' + code + '</pre>', "Project").render()
        pre = next(attrs for tag, attrs in Elements(result).elements if tag == "pre")
        self.assertEqual(pre, {
            "role": "group", "tabindex": "0", "aria-label": "Code example 1: Server setup",
        })
        self.assertIn(code, result)
        self.assertNotIn('class="table-scroll"', result)

    def test_labels_follow_new_headings_and_escape_attribute_characters(self):
        source = '<table></table><h2>"Storage" &amp; backups</h2>\r\n<table></table><pre></pre>'
        result = ReadingRegions(source, "Project overview").render()
        named = [attrs["aria-label"] for _, attrs in Elements(result).elements if "aria-label" in attrs]
        self.assertEqual(named, [
            "Table 1: Project overview",
            'Table 2: "Storage" & backups',
            'Code example 1: "Storage" & backups',
        ])

    def test_preserves_existing_code_attributes_and_unrelated_markup(self):
        source = '<p><!-- original -->A&nbsp;B</p>\n<pre id="example" aria-labelledby="setup" tabindex="0"><code>a &gt; b</code></pre>'
        result = ReadingRegions(source, "Project").render()
        self.assertEqual(result, source.replace('tabindex="0">', 'tabindex="0" role="group">'))

    def test_non_newline_separators_do_not_shift_insertions(self):
        source = '<p>First\u2028second\rthird</p>\n<h2>Example</h2><pre><code>ok</code></pre>'
        result = ReadingRegions(source, "Project").render()
        self.assertTrue(result.startswith('<p>First\u2028second\rthird</p>\n<h2>Example</h2>'))
        self.assertIn('<pre role="group" tabindex="0" aria-label="Code example 1: Example"><code>ok</code></pre>', result)


    def test_two_column_tables_get_explicit_roles_and_no_hint(self):
        # Narrow screens show two-column tables as stacked blocks, which drops native table
        # semantics in some browsers; explicit roles keep them for screen readers.
        source = ('<h2>Host</h2><table><thead><tr><th>A</th><th>B</th></tr></thead>'
                  '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>')
        result = ReadingRegions(source, "Project").render()
        elements = Elements(result).elements
        wrapper = next(attrs for tag, attrs in elements if attrs.get("class") == "table-scroll")
        self.assertEqual(wrapper["data-columns"], "2")
        self.assertEqual([attrs.get("role") for tag, attrs in elements if tag == "table"], ["table"])
        self.assertEqual([attrs.get("role") for tag, attrs in elements if tag in {"thead", "tbody"}], ["rowgroup", "rowgroup"])
        self.assertEqual([attrs.get("role") for tag, attrs in elements if tag == "tr"], ["row", "row"])
        self.assertEqual([attrs.get("role") for tag, attrs in elements if tag == "th"], ["columnheader", "columnheader"])
        self.assertEqual([attrs.get("role") for tag, attrs in elements if tag == "td"], ["cell", "cell"])
        self.assertNotIn("table-hint", result)

    def test_row_header_cells_in_the_body_become_rowheaders(self):
        source = '<table><tbody><tr><th>CPU</th><td>i7</td></tr><tr><th>RAM</th><td>16 GB</td></tr></tbody></table>'
        result = ReadingRegions(source, "Project").render()
        roles = [attrs.get("role") for tag, attrs in Elements(result).elements if tag in {"th", "td"}]
        self.assertEqual(roles, ["rowheader", "cell", "rowheader", "cell"])

    def test_three_column_tables_keep_hint_and_no_roles(self):
        source = '<h2>Checks</h2><table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td><td>2</td><td>3</td></tr></table>'
        result = ReadingRegions(source, "Project").render()
        elements = Elements(result).elements
        wrapper = next(attrs for tag, attrs in elements if attrs.get("class") == "table-scroll")
        self.assertNotIn("data-columns", wrapper)
        self.assertFalse(any("role" in attrs for tag, attrs in elements if tag in {"table", "tr", "th", "td"}))
        self.assertIn('class="table-hint"', result)


if __name__ == "__main__":
    unittest.main()
