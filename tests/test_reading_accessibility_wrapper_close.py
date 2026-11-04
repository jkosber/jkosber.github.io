import unittest

from hooks.reading_accessibility import ReadingRegions


class WrapperCloseTests(unittest.TestCase):
    def test_wrapper_closes_after_its_own_table_not_after_later_content(self):
        table = ('<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>'
                 '<tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody></table>')
        source = '<h2>Host</h2>\n' + table + '\n<p>After.</p>\n'
        result = ReadingRegions(source, "Project").render()
        self.assertEqual(result, (
            '<h2>Host</h2>\n'
            '<div class="table-scroll" role="region" tabindex="0" aria-label="Table 1: Host">'
            + table
            + '</div><p class="table-hint">Scroll horizontally to read the full table on a narrow screen.</p>'
            '\n<p>After.</p>\n'
        ))


if __name__ == "__main__":
    unittest.main()
