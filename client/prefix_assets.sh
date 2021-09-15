#!/usr/bin/env bash
BUILD_DIR="../dist"
BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${BASEDIR}" || die "cd ${BASEDIR}"

while read -r filename; do
    sed -i 's+/assets/+/static/assets/+g' "$filename"
done < <(ag -l "/assets/" ${BUILD_DIR})
echo "[+] Done prefixing assets"