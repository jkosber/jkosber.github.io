from html import escape
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
TABLE_PARTS = {"table", "thead", "tbody", "tfoot", "tr", "th", "td"}
ROLES = {"table": "table", "thead": "rowgroup", "tbody": "rowgroup", "tfoot": "rowgroup", "tr": "row", "td": "cell"}


class Blocks(HTMLParser):
    """The page's top-level elements with their source offsets, and the parts of each table inside them."""

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.html = html
        self.line_offsets = [0]
        self.line_offsets.extend(index + 1 for index, character in enumerate(html) if character == "\n")
        self.blocks = []
        self.open = []
        self.table = None
        self.in_head = False
        self.column = 0
        self.header = None
        self.feed(html)
        self.close()

    def source_offset(self):
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.source_offset()
        tag_end = start + len(self.get_starttag_text())
        attributes = dict(attrs)
        if not self.open:
            self.blocks.append({"tag": tag, "attrs": attributes, "start": start, "tag_end": tag_end, "end": tag_end, "tables": []})
        if tag == "table":
            self.table = {"parts": [], "headers": [], "rows": 0}
            self.blocks[-1]["tables"].append(self.table)
        if self.table is not None and tag in TABLE_PARTS:
            if tag in {"thead", "tbody", "tfoot"}:
                self.in_head = tag == "thead"
            elif tag == "tr":
                self.column = 0
                if not self.in_head:
                    self.table["rows"] += 1
            self.table["parts"].append({
                "tag": tag, "role": attributes.get("role"), "head": self.in_head, "column": self.column,
                # Attributes go just inside the start tag's closing bracket; cell content goes after it.
                "inside": tag_end - 1, "after": tag_end,
            })
            if tag in {"th", "td"}:
                self.column += 1
                if tag == "th" and self.in_head:
                    self.header = []
        if tag not in VOID:
            self.open.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.open.pop()

    def handle_data(self, data):
        if self.header is not None:
            self.header.append(data)

    def handle_endtag(self, tag):
        if tag not in self.open:
            return
        while self.open.pop() != tag:
            pass
        if tag == "th" and self.header is not None:
            self.table["headers"].append(" ".join("".join(self.header).split()))
            self.header = None
        elif tag == "thead":
            self.in_head = False
        elif tag == "table":
            self.table = None
        if not self.open:
            self.blocks[-1]["end"] = self.html.index(">", self.source_offset()) + 1


def items(blocks):
    """A section's h3 items: each h3 with the blocks up to the next h3. Blocks before the first h3 stay put."""
    found = []
    for block in blocks:
        if block["tag"] == "h3":
            found.append((block, []))
        elif found:
            found[-1][1].append(block)
    return found


def classes(block):
    return (block["attrs"].get("class") or "").split()


def start_tag(tag, attrs):
    return f"<{tag}" + "".join(f" {name}" if value is None else f' {name}="{escape(value)}"' for name, value in attrs.items()) + ">"


class ClassSections:
    """Class pages: each Strongest work item becomes a panel, except that two short items in a row
    sit side by side without one; each lab module under Labs folds into a closed details whose
    table stacks on phones."""

    def __init__(self, html):
        self.html = html
        self.edits = []

    def edit(self, start, end, text):
        self.edits.append((start, len(self.edits), end, text))

    def wrap(self, item, before, after):
        heading, content = item
        end = content[-1]["end"] if content else heading["end"]
        self.edit(heading["start"], heading["start"], before)
        self.edit(end, end, after)

    def work(self, blocks):
        found = items(blocks)
        # Brief: one or two paragraphs and nothing else. The first item always leads with a panel.
        brief = [index > 0 and 1 <= len(content) <= 2 and all(block["tag"] == "p" for block in content)
                 for index, (_, content) in enumerate(found)]
        index = 0
        while index < len(found):
            if index + 1 < len(found) and brief[index] and brief[index + 1]:
                self.wrap(found[index], '<div class="work-pair"><section class="work work--brief">', "</section>")
                self.wrap(found[index + 1], '<section class="work work--brief">', "</section></div>")
                index += 2
            else:
                self.wrap(found[index], '<section class="work">', "</section>")
                index += 1

    def labs(self, blocks):
        for heading, content in items(blocks):
            count = sum(table["rows"] for block in content for table in block["tables"])
            # A module without lab rows shows no count rather than "0 labs".
            label = f'<span class="lab-count">{count} lab{"" if count == 1 else "s"}</span>' if count else ""
            self.edit(heading["end"], heading["end"], f"{label}</summary>")
            self.wrap((heading, content), '<details class="lab-module"><summary>', "</details>")
            for block in content:
                if "table-hint" in classes(block):
                    # Lab rows stack on phones, so there is nothing to scroll.
                    self.edit(block["start"], block["end"], "")
                elif "table-scroll" in classes(block):
                    attrs = {**block["attrs"], "class": " ".join(classes(block) + ["lab-table"])}
                    self.edit(block["start"], block["tag_end"], start_tag(block["tag"], attrs))
                    for table in block["tables"]:
                        self.lab_table(table)

    def lab_table(self, table):
        # Stacked rows lose native table semantics in some browsers; explicit roles keep them.
        # The third column's header is hidden on phones, so each row shows it as a visual label.
        label = None
        if len(table["headers"]) > 2:
            label = f'<span class="did-label" aria-hidden="true">{escape(table["headers"][2])}: </span>'
        for part in table["parts"]:
            if part["role"] is None:
                role = ROLES.get(part["tag"]) or ("columnheader" if part["head"] else "rowheader")
                self.edit(part["inside"], part["inside"], f' role="{role}"')
            if label and part["tag"] == "td" and not part["head"] and part["column"] == 2:
                self.edit(part["after"], part["after"], label)

    def render(self):
        blocks = Blocks(self.html).blocks
        bounds = [index for index, block in enumerate(blocks) if block["tag"] in {"h1", "h2"}] + [len(blocks)]
        for begin, finish in zip(bounds, bounds[1:]):
            section = blocks[begin]["attrs"].get("id")
            if section == "strongest-work":
                self.work(blocks[begin + 1:finish])
            elif section == "labs":
                self.labs(blocks[begin + 1:finish])
        # Edit around the source so authored markup, entities and IDs stay byte for byte.
        pieces, cursor = [], 0
        for start, _, end, text in sorted(self.edits):
            pieces += [self.html[cursor:start], text]
            cursor = end
        pieces.append(self.html[cursor:])
        return "".join(pieces)


def on_page_content(html, *, page, config, files):
    if not page.meta.get("code"):
        return html
    return ClassSections(html).render()
