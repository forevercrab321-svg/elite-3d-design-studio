# GROW EVERYTHING — Press kit / 平台提交素材包

Everything a portal's submission form asks for, in one place. Regenerate from the current build; never retouch gameplay shots.

| Folder / file | What | How to regenerate |
| --- | --- | --- |
| `screenshots/<city>-<t>s.png` | 1920×1080 gameplay stills, English UI, real HUD | `CAPTURE_BASE=<static build url> node tools/capture-stills.mjs` |
| `covers/cover-<w>x<h>.png` | Cover / thumbnail art in common portal sizes | `node tools/render-covers.mjs [background still]` |
| `../../public/icons/icon-512.png` | 512×512 icon | `node tools/render-icons.mjs` |
| `../../public/og.png` | 1200×630 social image | `node tools/render-og.mjs` |
| Texts (title, short/long description, how to play, controls, tags; EN + 中文) | — | `docs/business/sales/platforms/crazygames.md` §6 |
| One-pager, fact sheet, e-mail templates | — | `docs/business/sales/tob/sales-kit.md` |

Portal sizes differ and change: upload what the portal's form asks for. If a size is missing, add it to `SIZES` in `tools/render-covers.mjs`.

中文：各平台上传框要求的尺寸不同，**以上传框提示为准**；缺哪个尺寸，在 `tools/render-covers.mjs` 的 `SIZES` 里加一行重新生成。截图必须是真实游戏画面，不修图。
