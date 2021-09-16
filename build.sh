#!/usr/bin/env bash
die() {
  echo "[-] Error: ${1}." >&2
  exit 1
}

command -v deno &> /dev/null || die "deno not installed"
command -v npm &> /dev/null || die "npm not installed"

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${BASEDIR}"

BUILD_DIR="build"
SERVER_DIR="server"
CLIENT_DIR="client"

if [[ -d "${BUILD_DIR}" ]]; then
  rm -r "${BUILD_DIR}"/* || die "could not clear build directory [${BUILD_DIR}]"
  echo "[+] Cleared build directory"
else
  mkdir -p "${BUILD_DIR}" || die "could not create build directory [${BUILD_DIR}]"
  echo "[+] Created build directory"
fi

cd "${CLIENT_DIR}"
echo "[#] Building client..."
npm run build:prod || die "couldn't build client"
cd - > /dev/null
ln -s "$(readlink -f "${CLIENT_DIR}/dist")" "${BUILD_DIR}/"
echo "[+] Done building client"

cd "${SERVER_DIR}"
echo "[#] Bundling server..."
deno bundle index.ts "../${BUILD_DIR}/bundle.js" || die "couldn't bundle server"
cd - > /dev/null
echo "[+] Done bundling server"
echo "[#] Built files are in [${BUILD_DIR}] directory"
