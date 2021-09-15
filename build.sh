#!/usr/bin/env bash

die() {
  echo "[-] Error: ${1}."
  exit 1
}
BUILD=build
mkdir -p $BUILD || die "could not make destination \"$BUILD\""
cd client
echo "[#] Build client"
npm run build:prod || die "couldn't build client"
echo "[+] Done building client"
cd -

echo "[#] Generate secrets"
length=30
characters="[:graph:]"
read -r -n $length secret < <(LC_ALL=C tr -dc "$characters" < /dev/urandom)
[[ ${#secret} -eq $length ]] || die "could not generate password from /dev/urandom."
echo "JWT_SECRET=${secret}" > $BUILD/.env
echo "[+] Done generating secrets"

deno bundle index.ts $BUILD/bundle.js
echo "[+] Done bundling application"
