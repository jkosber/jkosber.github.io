import json
import re
from pathlib import Path

from markupsafe import Markup

# First match wins. Python is case-sensitive so "python-docx" gets no logo.
TOOL_PATTERNS = [
    (re.compile(r"^Proxmox\b"), "proxmox"),
    (re.compile(r"^Ubuntu\b"), "ubuntu"),
    (re.compile(r"^Debian\b"), "debian"),
    (re.compile(r"^Docker\b"), "docker"),
    (re.compile(r"\bCaddy\b"), "caddy"),
    (re.compile(r"^OPNsense\b"), "opnsense"),
    (re.compile(r"^Python\b"), "python"),
    (re.compile(r"^Textual$"), "textual"),
    (re.compile(r"^GitHub Actions$"), "githubactions"),
    (re.compile(r"^Cisco\b"), "cisco"),
    (re.compile(r"^Wireshark$"), "wireshark"),
    (re.compile(r"\bVirtualBox\b"), "virtualbox"),
    (re.compile(r"^Linux\b"), "linux"),
]

PATHS = json.loads(Path(__file__).with_name("tool_icons.json").read_text(encoding="utf-8"))


def tool_slug(name):
    for pattern, slug in TOOL_PATTERNS:
        if pattern.search(name):
            return slug
    return None


def tool_icon(name):
    slug = tool_slug(name)
    if slug is None:
        return Markup("")
    return Markup(
        '<svg class="tool-icon" viewBox="0 0 24 24" width="18" height="18" '
        'aria-hidden="true" focusable="false"><path d="{}"/></svg>'
    ).format(PATHS[slug])


def on_env(env, *, config, files):
    env.globals["tool_icon"] = tool_icon
    return env
