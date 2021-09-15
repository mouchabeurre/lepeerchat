#!/usr/bin/env bash
LOCAL_ROOT=build
REMOTE_ROOT=/home/arch/Projects/lepeerchat
echo "[#] Deploy application"
rsync -varP --delete -e "ssh -p 4980" \
  $LOCAL_ROOT/ \
  "arch@51.178.42.35":$REMOTE_ROOT
echo "[+] Done deploying application"