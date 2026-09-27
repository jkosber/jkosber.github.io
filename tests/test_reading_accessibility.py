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


if __name__ == "__main__":
    unittest.main()
