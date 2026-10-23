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

# Ask for the key on the terminal (reading /dev/tty, since the script itself arrives on stdin).
ask_key() {
  echo "$1"
  printf '粘贴 grow-publish 密钥后按回车（看不到字是正常的）: '
  read -rs k < /dev/tty; echo
  printf '%s' "$k" > "$KEY_FILE"; chmod 600 "$KEY_FILE"
  echo "已保存 ${#k} 个字符"
}
[ -s "$KEY_FILE" ] || ask_key "还没有发布密钥：在 Roblox 的 API Keys 页面找到 grow-publish，点 Regenerate Key → Copy Key To Clipboard。"
TMP="$(mktemp "${TMPDIR:-/tmp}/grow-roblox.XXXXXX")"
curl -fsSL -o "$TMP" "$BUILD_URL"
echo "下载完成：$(wc -c < "$TMP") 字节"
publish() {
  RESP="$(curl -sS -w '\n%{http_code}' -X POST \
    -H "x-api-key: $(tr -d '\r\n' < "$KEY_FILE")" \
    -H "Content-Type: application/xml" \
    --data-binary @"$TMP" \
    "https://apis.roblox.com/universes/v1/$UNIVERSE_ID/places/$PLACE_ID/versions?versionType=Published")"
  CODE="${RESP##*$'\n'}"
  BODY="${RESP%$'\n'*}"
}
publish
if [ "${CODE}" = "401" ] || [ "${CODE}" = "403" ] || printf "%s" "${BODY}" | grep -qi "invalid api key\|not authenticated\|invalid grant"; then
  echo "发布密钥无效（HTTP ${CODE}）：${BODY}"
  ask_key "在 Roblox 的 API Keys 页面找到 grow-publish（权限 universe-places write），点 Regenerate Key → Copy Key To Clipboard，再回到这里粘贴。"
  publish
fi
rm -f "$TMP"
if [ "${CODE}" = "200" ]; then
  echo "发布成功：${BODY}"
else
  echo "发布失败（HTTP ${CODE}）：${BODY}"
  exit 1
fi
