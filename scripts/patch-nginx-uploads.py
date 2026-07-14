#!/usr/bin/env python3
from pathlib import Path

BLOCK = """
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 7d;
        add_header Cache-Control "public";
    }

"""

FILES = [
    Path("/etc/nginx/sites-available/test.hatiraniyarat.com"),
    Path("/etc/nginx/sites-available/admintest.hatiraniyarat.com.conf"),
]

for path in FILES:
    text = path.read_text()
    if "location /uploads/" in text:
        print(f"skip (already present): {path}")
        continue

    # Insert before the main location / { (exact indent match after api block)
    needle = "\n    location / {\n"
    idx = text.find(needle)
    if idx < 0:
        raise SystemExit(f"Could not find location / in {path}")

    text = text[:idx] + "\n" + BLOCK + text[idx + 1 :]
    path.write_text(text)
    print(f"patched: {path}")
