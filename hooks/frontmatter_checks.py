from mkdocs.exceptions import PluginError


# Frontmatter the templates read without a fallback: a gap here renders a dead link or drops a page
# from a list while the strict build still passes. Messages name the page and key, never the value.
def problems(pages):
    pages = list(pages)
    urls = {url for url, _ in pages}
    found = []
    for url, meta in pages:
        class_page = meta.get("class_page")
        if class_page:
            if class_page not in urls or not class_page.endswith("/"):
                found.append(f"{url}: class_page must be a page url ending in '/'")
            class_name = meta.get("class_name")
            if not isinstance(class_name, str) or not class_name.strip():
                found.append(f"{url}: class_name must be a non-empty string")
    return found


def on_env(env, *, config, files):
    found = problems((f.url, f.page.meta) for f in files.documentation_pages())
    if found:
        raise PluginError("\n".join(found))
    return env
