#!/bin/bash
# Upload the exported GROW EVERYTHING models (roblox/assets/glb/*.glb) to Roblox as Model assets
# through Open Cloud, then print and copy the name=assetId list (paste it back to Claude).
#   curl -fsSL https://raw.githubusercontent.com/forevercrab321-svg/elite-3d-design-studio/claude/gifted-goldberg-mz9n2p/roblox/upload-assets.sh | bash -s <your Roblox user id>
# Key: ~/.roblox-grow-assets-key (assets read+write). Re-running skips names already uploaded.
set -uo pipefail
USER_ID="${1:-}"
KEY_FILE="$HOME/.roblox-grow-assets-key"
OUT="$HOME/grow-roblox-assets.txt"
BASE="https://raw.githubusercontent.com/forevercrab321-svg/elite-3d-design-studio/claude/gifted-goldberg-mz9n2p/roblox/assets"
if [ -z "$USER_ID" ]; then echo "用法：… | bash -s 你的Roblox用户ID"; exit 1; fi
if [ ! -s "$KEY_FILE" ]; then echo "没找到模型密钥：先在 Roblox 页面点 Copy Key To Clipboard，再运行 pbpaste > ~/.roblox-grow-assets-key"; exit 1; fi
KEY="$(tr -d '\r\n' < "$KEY_FILE")"
touch "$OUT"
TMP="$(mktemp -d)"
NAMES="$(curl -fsSL "$BASE/names.txt")" || { echo "下载清单失败"; exit 1; }
TOTAL=$(printf '%s\n' "$NAMES" | grep -c .)
i=0; ok=0; fail=0
for NAME in $NAMES; do
  i=$((i+1))
  if grep -q "^$NAME=" "$OUT"; then ok=$((ok+1)); continue; fi
  if ! curl -fsSL -o "$TMP/m.glb" "$BASE/glb/$NAME.glb"; then echo "[$i/$TOTAL] $NAME 下载失败"; fail=$((fail+1)); continue; fi
  REQ="{\"assetType\":\"Model\",\"displayName\":\"GE $NAME\",\"description\":\"GROW EVERYTHING model $NAME\",\"creationContext\":{\"creator\":{\"userId\":\"$USER_ID\"}}}"
  RESP="$(curl -sS -X POST "https://apis.roblox.com/assets/v1/assets" -H "x-api-key: $KEY" \
    -F "request=$REQ" -F "fileContent=@$TMP/m.glb;type=model/gltf-binary")"
  OP="$(printf '%s' "$RESP" | grep -o '"path": *"operations/[^"]*"' | head -1 | sed 's/.*"operations\///; s/"$//')"
  ID="$(printf '%s' "$RESP" | grep -o '"assetId": *"[0-9]*"' | head -1 | grep -o '[0-9][0-9]*')"
  tries=0
  while [ -z "$ID" ] && [ -n "$OP" ] && [ $tries -lt 30 ]; do
    sleep 2
    POLL="$(curl -sS "https://apis.roblox.com/assets/v1/operations/$OP" -H "x-api-key: $KEY")"
    ID="$(printf '%s' "$POLL" | grep -o '"assetId": *"[0-9]*"' | head -1 | grep -o '[0-9][0-9]*')"
    tries=$((tries+1))
  done
  if [ -n "$ID" ]; then
    echo "$NAME=$ID" >> "$OUT"; ok=$((ok+1)); echo "[$i/$TOTAL] $NAME → $ID"
  else
    fail=$((fail+1)); echo "[$i/$TOTAL] $NAME 失败：$(printf '%s' "$RESP" | head -c 300)"
  fi
  sleep 1
done
rm -rf "$TMP"
echo
echo "完成：成功 $ok，失败 $fail。结果在 $OUT，已复制到剪贴板，直接粘贴给 Claude。"
pbcopy < "$OUT" 2>/dev/null || true
