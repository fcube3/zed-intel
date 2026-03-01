#!/bin/bash
set -e

PLIST_NAME="com.kai-intel.worker.plist"
SRC="$(dirname "$0")/${PLIST_NAME}"
DEST="$HOME/Library/LaunchAgents/${PLIST_NAME}"

# Unload if already loaded
launchctl bootout gui/$(id -u) "$DEST" 2>/dev/null || true

cp "$SRC" "$DEST"
launchctl bootstrap gui/$(id -u) "$DEST"
echo "Worker installed and running ✓"
