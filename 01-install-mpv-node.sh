#!/usr/bin/env bash
set -euo pipefail

# Installs mpv + Node.js on Raspberry Pi OS (Debian-based).
# You can override Node major version like:
#   NODE_MAJOR=20 ./install_node_mpv.sh
# Or:
#   NODE_MAJOR=22 ./install_node_mpv.sh

NODE_MAJOR="${NODE_MAJOR:-20}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (or: sudo $0)"
  exit 1
fi

echo "==> Updating apt indexes..."
apt-get update -y

echo "==> Installing prerequisites..."
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg apt-transport-https

echo "==> Installing mpv..."
apt-get install -y mpv

echo "==> Setting up NodeSource repo for Node.js ${NODE_MAJOR}.x..."
# This script adds the NodeSource apt repo and installs nodejs
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -

echo "==> Installing Node.js..."
apt-get install -y nodejs

echo "==> Verifying installs..."
echo -n "mpv:   " && mpv --version | head -n 1 || true
echo -n "node:  " && node -v
echo -n "npm:   " && npm -v

echo "==> Done."
