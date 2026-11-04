import unittest
from html.parser import HTMLParser

from hooks.reading_accessibility import ReadingRegions


class Pres(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.labels = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == "pre":
            self.labels.append(dict(attrs)["aria-label"])


class CodeNumberingTests(unittest.TestCase):
    def test_two_code_examples_under_one_heading_get_distinct_numbers(self):
        source = "<h2>Setup</h2><pre><code>a</code></pre><pre><code>b</code></pre>"
        result = ReadingRegions(source, "Project").render()
        self.assertEqual(Pres(result).labels, ["Code example 1: Setup", "Code example 2: Setup"])


if __name__ == "__main__":
    unittest.main()
