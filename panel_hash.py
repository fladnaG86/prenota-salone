#!/usr/bin/env python3
"""Generate a passcode hash for a salon's owner panel.

Usage:
    python3 panel_hash.py <slug> <passcode>

Prints the hash line to put in panel_users.json.
"""
import hashlib
import json
import os
import sys


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    slug, code = sys.argv[1], sys.argv[2]
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", code.encode(), salt.encode(), 120_000).hex()
    print(json.dumps({slug: f"pbkdf2${salt}${digest}"}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
