# 提交就绪自检（技术合规 + 素材）

> ✅ 已满足并验证 · 🟡 要用户提供信息或操作 · ⚠️ 条款未核实 / 要在门户里确认 · ❌ 还要做 · — 不适用
> 平台要求的出处见 `../platforms/<平台>.md` 第 2 节。最后更新：2026-09-24。

## 通用项（所有平台）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| 相对路径 zip，`index.html` 在根目录 | ✅ | `npm run build:portal`；已在子路径 `/sub/path/` 下启动验证 |
| 包体积 | ✅ | zip 1.6 MB，解压 3.0 MB，20 个文件；主 JS 1.37 MB（gzip 387 KB） |
| 联机与埋点配置 | 🟡 | 打包前在 `.env.local` 填 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（只填 anon key）；没填时脚本会警告，包只能单人加 AI |
| 隐私政策、用户协议 | 🟡 | `public/legal/*.html` 还有占位信息（运营者、地址、邮箱、数据存储地区）；平台提交都要隐私政策网址 |
| 游客直接开玩，无登录墙 | ✅ | |
| 手机横屏、触屏 | ✅ | |
| 广告只在非游戏时间、播放时静音暂停 | ✅ | 局间广告至少间隔 3 分钟；激励广告写明奖励、可不看 |
| 不把玩家带离平台 | ✅ | 平台包关闭外部分享链接（只保留系统分享和复制邀请链接） |
| 邀请链接 | ⚠️ | CrazyGames、Poki 走平台 SDK 的邀请链接；其他平台的邀请链接指向我们的网站（`VITE_PUBLIC_GAME_URL`）。是否接受，要在各平台条款里确认 |
| 昵称脏词过滤 | ✅ | `game/src/arena/nameFilter.ts`：自己的昵称和所有对手的昵称都过滤，中英文 |
| 内购 | ✅ | 平台包里没有 Stripe；商店只用游戏金币 |

## 分平台

| 项 | CrazyGames | Poki | itch.io | Newgrounds | Y8 | GameDistribution | GamePix | Armor Games |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用哪个包 | `dist-portal.zip` | `dist-portal.zip` | `dist-portal.zip` | `dist-portal.zip` | `dist-portal.zip` | `…-gamedistribution.zip` | `…-nosdk.zip` | iframe 指向网站 |
| 平台 SDK | ✅ v3：加载、游戏开始/停止、激励、局间、邀请 | ✅ v2：同左 + 外链走 SDK | — 不需要 | — 可选 | ⚠️ 注册后才看得到要求 | ✅ 按官方 wiki 接入；模拟 SDK 测试 12/12 | ✅ 不带任何 SDK（官方允许「GamePix SDK 或不带」） | ⚠️ AGI 是否强制未写 |
| SDK 真机验证 | ⚠️ 本地 `?platform=crazygames` 看测试广告 | ⚠️ 本地 debug 模式 | — | — | ⚠️ | 🟡 上传后在 GD 后台 iframe 完整看完一次测试广告才会激活 | — | — |
| 平台账号名 | ✅ 默认昵称用 CrazyGames 用户名 | — | — | — | — | — | — | — |
| 多人专区要求 | ❌ 房间状态上报（官方文档打不开，接口名未核实） | — | — | — | — | — | — | — |
| 特殊要求 | 不交叉推广 | CSP 白名单填 Supabase 域名；隐私政策网址 | 首次发布进审核队列 | 社区评分决定去留 | 送审有冷却期 | 必须有 pre-roll：第一次点「开始」时播放 | 640×480 iframe 下 HUD ❌ 未测 | 邮件策展 |
| 素材 | 🟡 封面按门户尺寸上传 | 🟡 | 🟡 封面 + 3–5 张截图 | 🟡 图标 | 🟡 | 🟡 | 🟡 | — |

## 验证记录

- 2026-09-24：`tools/.wip/gd.mjs` 12/12 通过。GD 包：加载 GD SDK，SDK 加载前已设好 `gameId`；页面加载时不播广告，第一次点「开始」播 pre-roll；广告期间回合不开始，播完才开始；暂停和恢复各一次；不请求其他平台 SDK。无 SDK 包：不请求任何平台 SDK，页面无报错。
- 2026-09-24：功能总测 31/31，中途加入 11/11；昵称过滤实测：`F.u c k`、`傻逼123` 被替换为随机名，`Crusher 99` 保留。
