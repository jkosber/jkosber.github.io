import json
import unittest
from pathlib import Path

from hooks import tool_icons
from hooks.tool_icons import tool_icon, tool_slug


class ToolIconTests(unittest.TestCase):
    def test_slugs_for_real_built_with_entries(self):
        cases = {
            "Proxmox VE 9": "proxmox",
            "Proxmox SDN with dnsmasq": "proxmox",
            "Ubuntu 22.04": "ubuntu",
            "Debian LXC containers": "debian",
            "Docker (Homepage, Uptime Kuma, Beszel, Portainer, RustDesk Server)": "docker",
            "a Caddy reverse-proxy pilot": "caddy",
            "OPNsense in progress": "opnsense",
            "Python 3.14 and IDLE": "python",
            "Textual": "textual",
            "GitHub Actions": "githubactions",
            "Cisco IOS": "cisco",
            "Wireshark": "wireshark",
            "Windows 10 in VirtualBox": "virtualbox",
            "Linux Mint and Fedora": "linux",
            "python-docx": None,
            "AWS EC2": None,
            "uv": None,
        }
        for name, slug in cases.items():
            with self.subTest(name=name):
                self.assertEqual(tool_slug(name), slug)

    def test_icon_is_decorative_inline_svg(self):
        svg = str(tool_icon("Wireshark"))
        for part in ('aria-hidden="true"', 'focusable="false"', 'viewBox="0 0 24 24"', '<path d="'):
            self.assertIn(part, svg)
        self.assertNotIn("<title>", svg)

    def test_unmatched_name_gives_empty_markup(self):
        self.assertEqual(tool_icon("uv"), "")

    def test_every_mapped_slug_has_path_data(self):
        data = json.loads(Path(tool_icons.__file__).with_name("tool_icons.json").read_text(encoding="utf-8"))
        for _, slug in tool_icons.TOOL_PATTERNS:
            with self.subTest(slug=slug):
                self.assertIsInstance(data.get(slug), str)
                self.assertTrue(data[slug])


if __name__ == "__main__":
    unittest.main()
