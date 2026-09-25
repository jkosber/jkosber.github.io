from hashlib import sha256
from pathlib import Path


def on_env(env, *, config, files):
    docs_dir = Path(config["docs_dir"])
    env.globals["portfolio_asset_versions"] = {
        name: sha256((docs_dir / path).read_bytes()).hexdigest()[:12]
        for name, path in {
            "css": "stylesheets/portfolio.css",
            "js": "javascripts/portfolio.js",
        }.items()
    }
    return env
