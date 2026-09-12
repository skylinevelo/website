#!/usr/bin/env python3
"""Local dev server that mimics GitHub Pages' clean-URL resolution (e.g. /join -> join.html),
since Python's plain `http.server` doesn't do this. Run from the website/ directory:

    python3 scripts/dev_server.py [port]

Defaults to port 8934 to match the rest of this project's docs (setup.md, decisions-log.md).
"""
import sys
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit, unquote

WEBSITE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class CleanUrlHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        split = urlsplit(path)
        clean_path = unquote(split.path)
        if clean_path != "/" and not os.path.splitext(clean_path)[1]:
            candidate = os.path.join(WEBSITE_ROOT, clean_path.lstrip("/") + ".html")
            if os.path.isfile(candidate):
                return candidate
        return super().translate_path(path)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8934
    os.chdir(WEBSITE_ROOT)
    server = HTTPServer(("", port), CleanUrlHandler)
    print(f"Serving {WEBSITE_ROOT} at http://localhost:{port} (GitHub Pages-style clean URLs)")
    server.serve_forever()
