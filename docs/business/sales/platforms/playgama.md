# Playgama — 平台档案

> 2026-10-21 · 负责人：平台发行 BD · 状态：**沙盒已上线**（https://playgama.ai/play/tp5qyqvjydddtn ），未提交正式审核
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

## 记录

- 2026-10-21 · 账号 cityhunters2025 已注册；游戏已创建（引擎 Plain JS，AI agent：Claude Code）；build、简介（145 字符）、玩法说明、设备（Desktop/iOS/Android）、横屏、三张封面已填；已发布到沙盒，后台显示 Live、0/100 plays、还剩 2 个目标。表单里没有类型字段。
- agent 试玩：Quick play vs AI 进入上海对局，驾驶、吃东西正常，页面无报错；没有出现广告（符合设计：插屏只在两局之间且间隔 ≥ 180 秒，激励广告只在复活、双倍金币时）。大厅一直显示 "Connecting…"，待查（可能是平台 CSP 拦截了 Supabase，或 agent 看的时间不到 12 秒）。
- 2026-10-21 · agent 查明：Playgama 给游戏地址加 `csp=sandbox`，CSP 只允许 playgama.com / .net / .ai，Supabase 被拦（`players insert TypeError: Failed to fetch`），大厅 "Lobby unreachable"、建房后另一个标签页看不到。直接打开游戏地址则正常（1 online）。
- 2026-10-21 · 处理：Playgama 包改成只和 AI 对战（构建时去掉 Supabase 配置），不显示大厅、房间、邀请。商店文案不写 "play with friends"。以后 Playgama 放行 `*.supabase.co`（https 和 wss）再恢复联机。
- 沙盒目标（进入审核前）：100 次有效游玩；平均游玩时长 5:00（帮助里的表格写 5:20）；数据每天更新一次。
