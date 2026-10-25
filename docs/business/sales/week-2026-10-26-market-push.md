# 本周市场推进（2026-10-26 起）

> 用户指令（10/25）：放弃 Roblox 重制版，全力推已部署的平台，继续推进 YouTube。
> 原则：不编数据、不刷量；所有对外发送（邮件、表单、帖子、视频）都等用户说「发送」或「发布」后再做。

## 1. 现状（10/25 查过 Gmail 和仓库记录）

| 平台 | 状态 | 已核实的依据 | 本周动作 |
| --- | --- | --- | --- |
| 自有网站 | 已上线 | https://grow-everything.vercel.app | 所有外部流量都带 utm 链接，按渠道统计 |
| itch.io | Public（rev 8） | 10/4 推进记录 | 上传 rev 10，补截图和封面（提示词 A） |
| CrazyGames | 10/2 被拒；10/22 有登录记录 | Google 登录提醒邮件 | 状态待确认（提示词 B）。**不要点 Remove game** |
| Playgama | 沙盒已上线 | https://playgama.ai/play/tp5qyqvjydddtn | 进审核要 100 次有效游玩、平均 5:00；要真实玩家（第 3 节） |
| Newgrounds | 材料就绪，是否发布待确认 | `release/newgrounds/newgrounds-bundle.zip` | 确认后发布（提示词 C） |
| Armor Games | 回复草稿 10/21 写好，未发送 | Gmail 草稿 | 等用户说「发送 Armor」 |
| 定制版（Drimify、Brame、CataBoom、Gamify、Flarie） | 5 封草稿未发送；只有 Flarie 有收件人 | Gmail 草稿 | 其余 4 家的联系邮箱由 side agent 从官网取（提示词 D），用户确认后发送 |
| GameDistribution | 9/29 被拒 | 拒信 | 等有 Playgama 或 CrazyGames 数据再申请复审 |
| YouTube Playables | 10/5 交了申请表，未回复 | — | 通过发行商申请 + 自有频道发 Shorts（第 2 节） |

## 2. YouTube

### 2.1 自有频道 Shorts（本周发 3 条）

素材用 `tools/capture-clip.mjs` 渲染（竖版、自动驾驶、确定性回放），文件在 `renders/marketing/`：

| # | 文件 | 标题 | 开头字幕（前 2 秒） |
| --- | --- | --- | --- |
| 1 | `short-shanghai-final.mp4` | I started as a tiny car and ate all of Shanghai 🌆 #shorts | Tiny car → eats a whole city? |
| 2 | `short-newyork-final.mp4` | Eating New York until the Empire State falls 🗽 #shorts | Can a car eat New York? |
| 3 | `short-paris-final.mp4` | I ate Paris… even the Eiffel Tower 🗼 #shorts | Start: smaller than a bench |

描述模板（N = 1、2、3）：

```
Play free in your browser, no download: https://grow-everything.vercel.app/game/?utm_source=youtube&utm_campaign=shortsN
Start tiny, eat everything, grow until you can swallow the landmark. 4-player online or solo vs AI.
#gaming #browsergame #io #shorts
```

置顶评论：`Play here 👉 https://grow-everything.vercel.app/game/?utm_source=youtube&utm_campaign=shortsN`

节奏：周一、周三、周五各发 1 条。看 72 小时的播放量和平均观看百分比，最好的那条的开头用在下一批视频上。

### 2.2 通过发行商进 Playables

官方申请没有回复。Mediacube 自称是 Playables 变现试点的发行商之一，这个说法我们没法用 Google 的资料核实。Playgama 的平台列表里有 YouTube，但没查到公开的 Playables 代发说明，所以要直接问。两家都没有公开邮箱，由 side agent 在官网的联系表单或后台支持入口提交（提示词 E）。消息原文：

```
Hi, I'm Zhuleli, solo developer of GROW EVERYTHING, a 3D eat-and-grow arena game
(three.js/WebGL, ~8 MB, English + Simplified Chinese).
Live: https://grow-everything.vercel.app — itch.io: https://forevercrab321-svg.itch.io/grow-everything
We'd like to publish on YouTube Playables through a partner. We already have a solo-vs-AI mode
with no network calls, which fits Playables certification; integrating the ytgame SDK
(gameReady, pause/audio, cloud save) takes us 1–2 days.
Could you tell us whether you publish third-party HTML5 games to Playables, what the revenue split is,
and what you need from us to start?
Thanks — Zhuleli, cityhunters2025@gmail.com
```

## 3. Playgama：凑够 100 次真实游玩、平均 5 分钟

- 只发沙盒链接 https://playgama.ai/play/tp5qyqvjydddtn ，因为沙盒里的游玩才算数。不刷量，不请人挂机。
- 渠道：
  - itch.io 发一篇 devlog（「New: play on Playgama」）。
  - Reddit 的 r/WebGames 和 r/playmygame：各发 1 帖，发前先读版规。
  - 用户自己的社交账号和朋友群。
  - Shorts 置顶评论保持指向自有网站，不改。
- 帖子文案：`Made a 3D game where you start as a tiny car and eat a whole city. One round = 5 minutes, free in browser: <沙盒链接>. Feedback welcome!`
- 平均时长靠一局 300 秒撑：在文案里写「play one full round」。

## 4. 给 side agent 的提示词（复制粘贴）

**A · itch.io rev 10**
> 打开 https://itch.io/game/edit/5091958 （用 GitHub 登录 forevercrab321@gmail.com）。在 Uploads 里上传 `release/web-portals/grow-everything-web.zip`（我会把文件发给你），勾选 "This file will be played in the browser"，Viewport 960×540。把旧的 web 文件改为隐藏，不要删除。保存后打开公开页，点开始玩到对局开始，截图发给我。不要改价格和付款设置。

**B · CrazyGames 状态**
> 打开 https://developer.crazygames.com ，用 cityhunters2025@gmail.com 的 Google 账号登录。截图 GROW EVERYTHING 的当前状态，以及页面上所有提示和按钮文字。只看不改，绝对不要点 Remove game。再到 Gmail 搜 crazygames，把 10/2 以后的邮件标题和日期列出来。

**C · Newgrounds**
> 打开 https://www.newgrounds.com/projects/games ，看 GROW EVERYTHING 有没有项目、是否已发布，截图。如果是草稿，列出还缺哪些必填项，先不要点发布。

**D · 定制版收件人**
> 分别打开 drimify.com、brame.io、cataboom.com、gamify.com 的 Contact、Partners 或 Sales 页面，抄下页面上公开写出的商务或合作邮箱（只要页面上写明的，不猜），每家附上页面链接。没有邮箱、只有表单的，写「仅表单」。

**E · Mediacube / Playgama 询问 Playables**（用户说「发送 E」之后再做）
> 1）在 https://mediacube.io 找联系、合作或发行开发者的表单，把第 2.2 节的消息原文填进去提交，截图。2）登录 Playgama 开发者后台（cityhunters2025@gmail.com），找 Support 或聊天入口，发同一段消息，截图。不要接受任何合同，也不要填付款信息。

**F · YouTube 频道和上传**（用户说「发布 Shorts」之后再做）
> 用 cityhunters2025@gmail.com 登录 YouTube，创建频道「GROW EVERYTHING」（头像用 `public/icons/icon-512.png`，横幅用 `release/playgama/cover_16x9_1920x1080.png`）。在 YouTube Studio 上传 Short #1（文件、标题、描述见第 2.1 节），受众选「不是面向儿童的内容」，公开发布，置顶评论填好。上传完把视频链接发给我。

## 5. 需要用户拍板

1. 说「发送 Armor」：发出 Armor Games 的回复草稿。
2. 跑完提示词 D 后，确认 4 家定制版的收件人，再说「发送定制版」。
3. 说「发送 E」：联系 Mediacube 和 Playgama 问 Playables。
4. 看过 3 条 Shorts 成片后说「发布 Shorts」。
