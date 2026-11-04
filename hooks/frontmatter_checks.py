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
            # Page urls all end in '/', so a value without the slash is already not a page url.
            if class_page not in urls:
                found.append(f"{url}: class_page must be a page url ending in '/'")
            class_name = meta.get("class_name")
            if not isinstance(class_name, str) or not class_name.strip():
                found.append(f"{url}: class_name must be a non-empty string")
        # MkDocs's url filter turns a missing path into ".", so these would ship <img src=".">.
        for key in ("art", "screenshot"):
            if isinstance(meta.get(key), dict) and not meta[key].get("src"):
                found.append(f"{url}: {key} must have a src")
        roles = meta.get("roles")
        if isinstance(roles, list):
            for index, role in enumerate(roles):
                if not isinstance(role, dict) or not role.get("image"):
                    found.append(f"{url}: roles[{index}] must have an image")
    return found


def on_env(env, *, config, files):
    found = problems((f.url, f.page.meta) for f in files.documentation_pages())
    if found:
        raise PluginError("\n".join(found))
    return env


# The template renders the role ids, so MkDocs's anchor check (Markdown only) can't see them.
def on_page_context(context, *, page, config, nav):
    for role in page.meta.get("roles") or []:
        if isinstance(role, dict) and role.get("id"):
            page.present_anchor_ids.add(role["id"])
    return context
