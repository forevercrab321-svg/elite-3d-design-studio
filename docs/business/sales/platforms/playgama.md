# Playgama — 平台档案

> 2026-10-21 · 负责人：平台发行 BD · 状态：**包已就绪，等用户注册开发者账号**
> 用户 2026-10-20 批准上 Playgama，接受由此带来的代价：游戏铺到很多网站后，Poki 网页独占基本不可能。

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 入口 | https://developer.playgama.com （开发者后台） | 官方 SDK README |
| SDK | Playgama Bridge（`@playgama/bridge` 2.3.1，github.com/Playgama/bridge）；CDN `https://bridge.playgama.com/v2/stable/playgama-bridge.js`；`playgama-bridge-config.json` 放在 index.html 旁边 | 官方 npm 包 README 和类型定义 |
| 分成 | 合作网站：净收入 $1,000 以内 70%，$1,000–3,000 部分 80%，$3,000 以上 90%；playgama.com 本站和 iframe 合作网络固定 50%；PayPal / Wise / 加密货币 / 银行转账 | Playgama 自家博客（https://playgama.com/blog/?p=14354），**签约前以开发者协议为准** |
| 我们的包 | `release/playgama/grow-everything-playgama.zip`（`node tools/build-portal.mjs playgama`） | — |
| 已验证 | 模拟 Bridge：initialize → game_ready → gameplay_started，对局正常，0 页面错误；激励广告四种结果（拿到奖励 / 没奖励 / 失败 / 无响应）都正确收尾 | `tools/qa-portal-stability.mjs`、`tools/qa-playgama-ads.mjs` |
| 未验证 | 真实 Bridge（沙盒访问不了 bridge.playgama.com）；上传后用后台的沙盒链接试玩一次 | — |

## 下一步（用户）

1. 注册 https://developer.playgama.com （cityhunters2025@gmail.com）。
2. 新建游戏，上传 `grow-everything-playgama.zip`，用后台给的试玩链接玩一局：看广告能不能出、看完能不能复活。
3. 填收款方式（PayPal 或 Wise），提交审核。
