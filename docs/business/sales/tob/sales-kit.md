# 平台销售资料包（Sales Kit）

> 商务资料岗维护。对外文案发送前一律给用户确认。**数字只写实测或可核实的**；上线后用真实埋点替换第 1 节的「数据」一栏。

## 1. 事实表（2026-09-24 实测）

| 项 | 数值 | 怎么得到的 |
| --- | --- | --- |
| 类型 | 3D 多人竞技「吞掉整座城市」（.io 类） | — |
| 一局时长 | 最长 5 分钟，每人 3 条命 | `game/src/config/arena.ts` |
| 人数 | 1–4 人同房间，空位 AI 补上；中途可加入 | 联机测试 `net4`、中途加入 11/11 |
| 城市 / 车型 | 3 座城市（上海、纽约、巴黎）· 4 种车型 | 游戏内容 |
| 外观 | 涂装、帽子、喇叭（金币购买；分享和好友同玩赠送限定款） | `game/src/config/cosmetics.ts` |
| 语言 | 中文、英文（按浏览器自动切换） | — |
| 平台包 | zip 1.6 MB · 解压 3.0 MB · 20 个文件 · 主 JS gzip 387 KB | `npm run build:portal` |
| 设备 | 电脑（键盘 + 鼠标）；手机横屏（虚拟摇杆 + 冲刺键） | 横屏测试 `landscape.mjs` |
| 已接平台 SDK | CrazyGames v3、Poki v2、GameDistribution；另有不带 SDK 的版本 | `game/src/platform/` |
| 广告位 | 激励：复活（保留 75% 质量，每局 1 次）、结算金币翻倍；局间广告至少间隔 3 分钟 | — |
| 变现原则 | 只卖外观，不卖数值 | `docs/business/paid-catalog.md` |
| 服务器 | 自带（Supabase Realtime），平台不用出服务器 | — |
| 数据 | **刚上线，暂无** | 上线后填：平均时长、1 分钟转化率、D1 留存、每次会话局数 |

## 2. 一页纸（英文，给平台看）

**GROW EVERYTHING — eat the city, beat your friends**

Start as a tiny googly-eyed machine and eat everything smaller than you — cans, bins, cars, buses, whole buildings — until you swallow the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to four players share a city, and bigger machines eat smaller ones, so every chase can flip in a second.

- **Instant fun:** first growth within seconds; a full round in 3–5 minutes; AI fills empty seats, so a round always starts.
- **Made for friends:** one-link invites, drop-in join, emotes, horns and burps — highly clippable moments.
- **Web-native:** 1.6 MB zip, three.js, desktop and mobile landscape, English and Chinese.
- **Ready for your SDK:** CrazyGames v3, Poki v2 and GameDistribution integrations built in; rewarded revive and double-coins placements; interstitials only between rounds.
- **Fair monetisation:** cosmetics only — nothing you can buy makes you stronger.
- **No server cost to you:** multiplayer runs on our own backend.

Play: [平台试玩链接] · Trailer: [预告片链接] · Contact: [姓名] · [邮箱]

## 3. 素材清单

| 素材 | 文件 | 说明 |
| --- | --- | --- |
| 游戏截图 1920×1080 | `marketing/press-kit/screenshots/` | 真实游戏画面（英文界面）；用 `tools/capture-stills.mjs` 重新生成 |
| 封面（多尺寸） | `marketing/press-kit/covers/` | 用 `tools/render-covers.mjs` 生成；**上传前以门户上传框提示的尺寸为准**，不对就告诉我改 |
| 竖屏宣传视频 | `renders/marketing/growth-timelapse-shanghai-9x16.mp4` | 城市成长延时 |
| 图标 | `public/icons/icon-512.png` | 512×512 |
| 分享图 | `public/og.png` | 1200×630 |
| 文案（标题、短描述、长描述、玩法、操作、标签） | `../platforms/crazygames.md` 第 6 节 | 各平台共用，中英两版 |

## 4. 邮件模板（发送前给用户确认）

### 4.1 首封：给没有自助提交入口的平台 / 分发商

**Subject:** GROW EVERYTHING — 4-player "eat the city" arena, web-ready with SDK integrations

Hi [Name / team],

I'm [Your name], developer of **GROW EVERYTHING**, a 3D multiplayer arena where you grow from a soda-can-sized machine into one that swallows a whole city — Shanghai, New York or Paris — against up to three friends or AI rivals, in 3–5 minute rounds.

It's built for web portals: a 1.6 MB HTML5 zip, desktop and mobile landscape, English and Chinese, rewarded and between-round ad placements, and cosmetics-only monetisation. Multiplayer runs on our own backend, so there is no server cost on your side.

Play it here: [link] · 30-second clip: [link]

Would it be a fit for [platform]? I'm happy to adapt to your SDK and requirements, and to discuss [revenue share / a non-exclusive licence / sponsorship].

Best,
[Name] · [email]

### 4.2 跟进（首封后第 4 个工作日，仍未回复时）

**Subject:** Re: GROW EVERYTHING — 4-player "eat the city" arena

Hi [Name], a quick follow-up on GROW EVERYTHING. [一句新进展，只写真的，例如：It's now live on [平台] / We've added [功能].] If it isn't a fit right now, a one-line "no" is completely fine — it helps me plan. Thanks!

### 4.3 最后一次跟进（第 10 个工作日）

**Subject:** Closing the loop — GROW EVERYTHING

Hi [Name], I'll close this thread for now so I don't fill your inbox. If you'd like a build or a call later, just reply here. Thanks for your time!

> 节奏：首封 → 第 4 个工作日跟进 → 第 10 个工作日收尾，**最多跟进 2 次**；对方拒绝就停，写进 pipeline。

### 4.4 向平台支持提问（门户里的问题，比如 CrazyGames）

**Subject:** Question about [multiplayer room status / share links] for GROW EVERYTHING

Hi, we're preparing GROW EVERYTHING (4-player online arena) for submission. Two quick questions:
1. [e.g. Which SDK call should we use to report room status for the Multiplayer section?]
2. [e.g. Our invite link uses your SDK's inviteLink; is a system share sheet (navigator.share) with that link allowed?]
Thanks! [Name]

### 4.5 中文首封（国内发行商，暂缓使用）

标题：《GROW EVERYTHING》——四人联机「吞掉整座城市」3D 网页游戏，寻求发行合作

[称呼]您好，我是《GROW EVERYTHING》的开发者 [姓名]。玩家从易拉罐大小的小机器开始，吃掉比自己小的一切，最后吞下东方明珠、帝国大厦或埃菲尔铁塔；最多 4 人同城互吃，空位 AI 补上，一局 3–5 分钟。游戏已适配网页和手机横屏，中英双语，只卖外观、不卖数值。试玩：[链接]。想了解贵方的发行方式和合作条件。[姓名] · [联系方式]

## 5. 平台常见问题（BD 回答口径）

| 问 | 答 |
| --- | --- |
| 服务器谁出？ | 我们自己出（Supabase Realtime），平台不用出。 |
| 单人能玩吗？ | 能，没有联机时自动和 AI 对战。 |
| 有没有付费变强？ | 没有，只有外观。 |
| 有暴力内容吗？ | 没有血腥；机器「吃」掉物体和对手，卡通风格。 |
| 广告会打断游戏吗？ | 不会：局间广告只在回合之间，激励广告由玩家自己选。 |
| 数据怎么样？ | 只报真实数据；没有就说「刚上线，暂无数据」。 |
