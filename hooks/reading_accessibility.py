from html import escape
from html.parser import HTMLParser


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

    def insertion_offset(self):
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.heading = tag
            self.heading_text = []
        elif tag == "br" and self.heading:
            self.heading_text.append(" ")

        if tag == "table":
            self.counts[tag] += 1
            label = escape(f"Table {self.counts[tag]}: {self.section}", quote=True)
            self.insertions.append((
                self.insertion_offset(),
                '<div class="table-scroll" role="region" tabindex="0" '
                f'aria-label="{label}">',
            ))
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
                self.insertions.append((
                    self.insertion_offset() + len(self.get_starttag_text()) - 1,
                    " " + " ".join(additions),
                ))

    def handle_data(self, data):
        if self.heading:
            self.heading_text.append(data)

    def handle_endtag(self, tag):
        if tag == self.heading:
            self.section = " ".join("".join(self.heading_text).split())
            self.heading = None
        if tag == "table":
            self.insertions.append((
                self.html.index(">", self.insertion_offset()) + 1,
                '</div><p class="table-hint">Scroll horizontally to read the full table on a narrow screen.</p>',
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
