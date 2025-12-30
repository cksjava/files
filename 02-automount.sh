#!/usr/bin/env bash
set -euo pipefail

# Auto-mount your "Crucial X9" exFAT SSD at /mnt/music on plug-in (Raspberry Pi OS / Debian)
# Device details provided:
# UUID="C05F-FCAF"  LABEL="Crucial X9"  TYPE="exfat"

MOUNT_POINT="/mnt/music"
UUID="C05F-FCAF"
FS_TYPE="exfat"
FSTAB_LINE="UUID=${UUID}  ${MOUNT_POINT}  ${FS_TYPE}  nofail,x-systemd.automount,x-systemd.device-timeout=10s,uid=1000,gid=1000,umask=0022,noatime  0  0"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root (use: sudo $0)"
  exit 1
fi

echo "==> Installing exFAT support..."
apt-get update -y
apt-get install -y exfatprogs

echo "==> Creating mount point: ${MOUNT_POINT}"
mkdir -p "${MOUNT_POINT}"

echo "==> Backing up /etc/fstab..."
cp -a /etc/fstab "/etc/fstab.bak.$(date +%Y%m%d-%H%M%S)"

echo "==> Ensuring fstab has an entry for UUID=${UUID} ..."
if grep -qE "^[#[:space:]]*UUID=${UUID}[[:space:]]+" /etc/fstab; then
  echo "    Found existing entry for this UUID; leaving it as-is."
else
  echo "    Adding entry:"
  echo "    ${FSTAB_LINE}"
  echo "${FSTAB_LINE}" >> /etc/fstab
fi

echo "==> Reloading systemd mount units..."
systemctl daemon-reload

echo "==> Triggering automount (safe if drive isn't plugged in)..."
# Accessing the mount point triggers the automount if the drive is present.
ls -la "${MOUNT_POINT}" >/dev/null 2>&1 || true

echo "==> Current status (if drive is plugged in, it should mount now):"
mount | grep -E "on ${MOUNT_POINT} " || echo "    Not mounted yet (plug it in, then: ls ${MOUNT_POINT})"

echo "==> Done. Plug the SSD in; it should appear at ${MOUNT_POINT}."
