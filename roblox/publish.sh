#!/bin/bash
# Publish the latest GROW EVERYTHING Roblox build (roblox/build/GrowEverything.rbxlx on GitHub) to
# the live place through Roblox Open Cloud. Run on the Mac that holds the API key:
#   curl -fsSL https://raw.githubusercontent.com/forevercrab321-svg/elite-3d-design-studio/claude/gifted-goldberg-mz9n2p/roblox/publish.sh | bash
# The key (grow-publish: universe-places write, this experience only) is read from ~/.roblox-grow-key
# and never leaves this machine except in the request to apis.roblox.com.
set -euo pipefail
UNIVERSE_ID=10772505605
PLACE_ID=130986109157079
KEY_FILE="$HOME/.roblox-grow-key"
BUILD_URL="https://raw.githubusercontent.com/forevercrab321-svg/elite-3d-design-studio/claude/gifted-goldberg-mz9n2p/roblox/build/GrowEverything.rbxlx"

if [ ! -s "$KEY_FILE" ]; then
  echo "没找到密钥：请先在 Roblox 页面点 Copy Key To Clipboard，再运行：pbpaste > ~/.roblox-grow-key && chmod 600 ~/.roblox-grow-key"
  exit 1
fi
TMP="$(mktemp -t grow-roblox).rbxlx"
curl -fsSL -o "$TMP" "$BUILD_URL"
echo "下载完成：$(wc -c < "$TMP") 字节"
RESP="$(curl -sS -w '\n%{http_code}' -X POST \
  -H "x-api-key: $(tr -d '\r\n' < "$KEY_FILE")" \
  -H "Content-Type: application/xml" \
  --data-binary @"$TMP" \
  "https://apis.roblox.com/universes/v1/$UNIVERSE_ID/places/$PLACE_ID/versions?versionType=Published")"
CODE="${RESP##*$'\n'}"
BODY="${RESP%$'\n'*}"
rm -f "$TMP"
if [ "$CODE" = "200" ]; then
  echo "发布成功：$BODY"
else
  echo "发布失败（HTTP $CODE）：$BODY"
  exit 1
fi
