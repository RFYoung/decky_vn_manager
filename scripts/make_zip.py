#!/usr/bin/env python3
"""Create a distributable zip archive that mirrors the plugin directory structure."""
from __future__ import annotations

import os
import zipfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
STAGING_DIR = os.path.join(REPO_ROOT, "artifacts", "visual-novel-manager")
OUTPUT_ZIP = os.path.join(REPO_ROOT, "artifacts", "visual-novel-manager.zip")
ZIP_ROOT = "visual-novel-manager"

if not os.path.isdir(STAGING_DIR):
    raise SystemExit(f"Staging directory not found: {STAGING_DIR}")

with zipfile.ZipFile(OUTPUT_ZIP, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(STAGING_DIR):
        for filename in files:
            filepath = os.path.join(root, filename)
            arcname = os.path.join(ZIP_ROOT, os.path.relpath(filepath, STAGING_DIR))
            zf.write(filepath, arcname)
