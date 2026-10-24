from html import escape
from html.parser import HTMLParser


class TableShapes(HTMLParser):
    """First pass: the cell count of every row, per table, in document order."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self.open = []
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([])
            self.open.append(len(self.tables) - 1)
        elif tag == "tr" and self.open:
            self.tables[self.open[-1]].append(0)
        elif tag in {"th", "td"} and self.open and self.tables[self.open[-1]]:
            self.tables[self.open[-1]][-1] += 1

    def handle_endtag(self, tag):
        if tag == "table" and self.open:
            self.open.pop()


class ReadingRegions(HTMLParser):
    def __init__(self, html, title):
        super().__init__(convert_charrefs=True)
        self.html = html
        self.section = title
        self.heading = None
        self.heading_text = []
        self.counts = {"table": 0, "pre": 0}
        self.insertions = []
        self.line_offsets = [0]
        self.line_offsets.extend(index + 1 for index, character in enumerate(html) if character == "\n")
        # Two-column tables (two or more rows of two cells) stack on narrow screens;
        # explicit roles keep their table semantics. A single row has nothing to stack.
        self.pairs = [len(rows) >= 2 and all(count == 2 for count in rows) for rows in TableShapes(html).tables]
        self.open_tables = []
        self.in_head = False

    def insertion_offset(self):
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def add_to_start_tag(self, addition):
        self.insertions.append((
            self.insertion_offset() + len(self.get_starttag_text()) - 1,
            " " + addition,
        ))

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.heading = tag
            self.heading_text = []
        elif tag == "br" and self.heading:
            self.heading_text.append(" ")

        if tag == "table":
            self.counts[tag] += 1
            pair = self.pairs[self.counts[tag] - 1]
            self.open_tables.append(pair)
            label = escape(f"Table {self.counts[tag]}: {self.section}", quote=True)
            columns = ' data-columns="2"' if pair else ""
            self.insertions.append((
                self.insertion_offset(),
                f'<div class="table-scroll" role="region" tabindex="0" aria-label="{label}"{columns}>',
            ))
            if pair and "role" not in dict(attrs):
                self.add_to_start_tag('role="table"')
        elif tag == "pre":
            self.counts[tag] += 1
            attributes = dict(attrs)
            additions = []
            if "role" not in attributes:
                additions.append('role="group"')
            if "tabindex" not in attributes:
                additions.append('tabindex="0"')
            if not {"aria-label", "aria-labelledby"} & attributes.keys():
                label = escape(f"Code example {self.counts[tag]}: {self.section}", quote=True)
                additions.append(f'aria-label="{label}"')
            if additions:
                self.add_to_start_tag(" ".join(additions))
        elif self.open_tables and self.open_tables[-1] and "role" not in dict(attrs):
            if tag in {"thead", "tbody", "tfoot"}:
                self.in_head = tag == "thead"
                self.add_to_start_tag('role="rowgroup"')
            elif tag == "tr":
                self.add_to_start_tag('role="row"')
            elif tag == "th":
                self.add_to_start_tag('role="columnheader"' if self.in_head else 'role="rowheader"')
            elif tag == "td":
                self.add_to_start_tag('role="cell"')

    def handle_data(self, data):
        if self.heading:
            self.heading_text.append(data)

    def handle_endtag(self, tag):
        if tag == self.heading:
            self.section = " ".join("".join(self.heading_text).split())
            self.heading = None
        if tag == "thead":
            self.in_head = False
        if tag == "table":
            pair = self.open_tables.pop() if self.open_tables else False
            hint = "" if pair else '<p class="table-hint">Scroll horizontally to read the full table on a narrow screen.</p>'
            self.insertions.append((
                self.html.index(">", self.insertion_offset()) + 1,
                "</div>" + hint,
            ))

    def render(self):
        self.feed(self.html)
        self.close()
        # Insert around the source so code, entities, IDs and authored markup stay intact.
        html = self.html
        for offset, addition in sorted(self.insertions, reverse=True):
            html = html[:offset] + addition + html[offset:]
        return html


def on_page_content(html, *, page, config, files):
    return ReadingRegions(html, page.title).render()
