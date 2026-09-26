# GROW EVERYTHING · 社区首发方案（第 1 周，免费渠道）

> 岗位：社群与裂变 · 编写日期：2026-09-24 · 状态：**NEEDS REVIEW**（所有帖子发出前都要用户确认，由用户本人账号发出）
> 目标：7 天 1000 名用户（按 `lobby_view` 去重 `player_id` 计）。本文件只处理社区渠道；平台发行、达人合作见其他岗位文件。

## 0. 先读：调研方式与局限（诚实边界）

- 本次调研环境的网络代理**拦截了 reddit.com、news.ycombinator.com、producthunt.com、itch.io、v2ex.com、discord.com**（HTTP 403），规则页无法直接打开。下表的「规则摘要」来自 WebSearch 搜索摘要和能打开的第三方页面，每条都标了出处。
- **因此每个渠道发帖前，发帖人必须亲自打开「规则页」核对一遍**（尤其 Reddit 各版的侧栏规则和必选 flair）。核对后在第 6 节的检查表里打勾。
- 「预期效果」一栏：没有可靠出处的一律写「未知」。第三方文章里的「某人发了多少 upvote」属于个例，不当作预期。
- 成员数来自 GummySearch / subredditstats 等第三方统计，只用来判断受众规模，不代表会带来多少玩家。

### 发帖前的硬前提（不满足就别发）

| # | 前提 | 为什么 | 状态 |
| --- | --- | --- | --- |
| P1 | Supabase 已接通（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 已在 Vercel 配置） | 没有它：没有联机房间（邀请链接无效，好友礼物解锁不了），也没有 `sessions.utm` 和任何埋点，1000 用户的目标无法验证 | 待确认（`docs/business/launch-checklist.md` 第 1 项仍是 🟡） |
| P2 | `https://grow-everything.vercel.app/game/` 在桌面 Chrome/Safari/Firefox 和手机上打开 → 10 秒内进入可操作画面 | 社区玩家点开就走，首屏慢等于白发 | 待确认（本环境访问不到该域名，无法实测） |
| P3 | 准备好 3 个素材：① 8–15 秒 GIF「易拉罐 → 吞掉东方明珠」；② 30–60 秒带声音的 MP4（四人互吃 + 地标倒塌）；③ 3 张静图（可用 `renders/review/arena-shanghai-landmark.png`、`arena-newyork-landmark.png`、`arena-paris-landmark.png`） | Reddit / itch 看图决定点不点；itch Release Announcements 要求至少 1 张截图或视频 | 待制作 |
| P4 | 发帖账号：用开发者个人账号，不用品牌名账号；Reddit 账号最好已有正常的评论历史 | HN 指南要求「以个人而不是品牌身份」出现；Reddit 多数版块对只发自家链接的账号按 spam 处理 | 待确认 |
| P5 | 法律页占位信息已填（`public/legal/*.html`） | 游戏里有隐私政策链接，社区玩家会点 | 待确认（launch-checklist 第 3 项） |

## 1. 渠道清单与规则摘要

图例：✅ 可以发 · ⚠️ 可以发但有条件 · ❌ 不建议 · ❓ 规则未能核实

### 英文渠道

| 渠道 | 能否发 | 规则摘要（出处） | 规则页（发帖前必须人工核对） | 受众规模（第三方统计） | 最佳形式 | 建议时间 | 预期 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **r/WebGames** | ✅ | 定位「无需下载、注册、插件的网页游戏」；需要可直接玩的网页链接；自己做的免费网页游戏发这里属于原创内容，但只发自家内容不参与社区也会被当作 spam（[GummySearch](https://gummysearch.com/r/WebGames/)、搜索摘要引用 [abhisundu.com](https://abhisundu.com/posts/marketing-free-games/)） | https://www.reddit.com/r/WebGames/about/rules | 144k 成员（[GummySearch](https://gummysearch.com/r/WebGames/)） | **链接帖**（直接指向游戏），标题写清玩法；首条评论补 GIF/说明 | 未知（无可靠出处） | 未知 |
| **r/playmygame** | ✅ | 游戏必须可免费玩；发帖前读版规（搜索摘要，[GummySearch](https://gummysearch.com/r/playmygame/)）；flair 要求未能核实 | https://www.reddit.com/r/playmygame/about/rules | 131k 成员（[GummySearch](https://gummysearch.com/r/playmygame/)） | 视频/GIF 帖 + 正文放链接，明确求反馈 | 未知 | 未知 |
| **r/IndieGaming** | ⚠️ | 对开发者帖较友好；很多独立游戏版执行「约 10% 自推广」和强制 flair（[gamedeveloper.com](https://www.gamedeveloper.com/business/don-t-get-downvoted-some-tips-for-promoting-your-indie-game-on-reddit)、[impress.games](https://impress.games/blog/how-to-promote-your-indie-game-on-reddit)）；本版具体条款未能核实 | https://www.reddit.com/r/IndieGaming/about/rules | 526k 成员（[GummySearch](https://gummysearch.com/r/IndieGaming/)） | **原生视频/GIF**（不是外链），链接放评论或正文 | 未知 | 未知 |
| **r/indiegames** | ⚠️ | 同上，开发者帖被接受；flair 未能核实（[impress.games](https://impress.games/blog/how-to-promote-your-indie-game-on-reddit)） | https://www.reddit.com/r/indiegames/about/rules | 见 [GummySearch](https://gummysearch.com/r/indiegames/) | 原生视频/GIF | 未知 | 未知 |
| **r/IoGames** | ⚠️ | 定位「发现 .io 游戏」；是否允许开发者自发未能核实（[GummySearch](https://gummysearch.com/r/IoGames/)） | https://www.reddit.com/r/IoGames/about/rules | 约 5k 成员（[GummySearch](https://gummysearch.com/r/IoGames/)） | 链接帖 + GIF | 未知 | 未知 |
| **r/BrowserGames** | ❓ | 存在，约 1,885 订阅（[subbed.org](https://www.subbed.org/r/browsergames)）；规则未能核实；规模小、活跃度未知 | https://www.reddit.com/r/BrowserGames/about/rules | ~1.9k | 链接帖 | 未知 | 未知（优先级最低） |
| **r/threejs** | ✅（待核实） | three.js 社区，常有 demo 发布（[discoverthreejs.com](https://discoverthreejs.com/book/introduction/get-help/)）；具体版规未能核实 | https://www.reddit.com/r/threejs/about/rules | 未知 | 视频 + 技术说明（怎么做的） | 未知 | 未知 |
| **r/gamedev 周帖**（Screenshot Saturday / 反馈周帖） | ⚠️ | r/gamedev 有每周截图/反馈类帖；只丢链接不参与讨论会被嫌弃（搜索摘要，出处为 itch 社区讨论 [itch.io/post/3419](https://itch.io/post/3419)）；**本次未能确认当前周帖的名称和日期**（Feedback Friday 在 r/gamedev 是否仍在办，待核实） | https://www.reddit.com/r/gamedev/about/rules | 未知 | 只在周帖里评论：1 张 GIF + 1 句话 + 链接；**不要单独开帖推游戏** | 周帖当天 | 未知 |
| **Hacker News · Show HN** | ✅ | 必须是能直接试用的东西，最好免注册；标题以 `Show HN:` 开头；URL 填网站、正文留空，另发一条评论讲来龙去脉和不同之处；不用营销腔；不能让朋友来刷评论/投票；用个人账号不用公司名（[Show HN 指南](https://news.ycombinator.com/showhn.html)，内容经 [gist 转录](https://gist.github.com/tzmartin/88abb7ef63e41e27c2ec9a5ce5d9b5f9) 核对） | https://news.ycombinator.com/showhn.html | — | 纯链接 + 首条长评论（技术细节：Three.js、四人同步、host 迁移、手机横屏） | 第三方分析：工作日美国上午到午后，约 14:00–17:00 UTC（[alcazarsec](https://blog.alcazarsec.com/tech/posts/best-time-to-post-on-hacker-news)、[HN 讨论](https://news.ycombinator.com/item?id=39251799)）；并注明「标题和话题匹配比时间更重要」 | 未知 |
| **Product Hunt** | ✅ | Games 分类欢迎小型独立游戏，含网页游戏（[PH Games 介绍](https://medium.com/@RussFrushtick/introducing-product-hunt-games-caafe0125802)、[PH Games 分类](https://www.producthunt.com/categories/games)）；PH 日榜从太平洋时间 00:01 开始（[PH 官方准备指南](https://www.producthunt.com/launch/preparing-for-launch)） | https://www.producthunt.com/launch/preparing-for-launch | — | 画廊：GIF + 3 张图 + 30 秒视频；Maker 首评 | **太平洋时间 00:01**（= 北京时间 15:01，夏令时期间） | 未知 |
| **itch.io** | ✅ | 自推只能发在 **Release Announcements** 版；帖子至少 1 张截图或视频；禁止拉票刷票；在其他版块发自推会被锁或移走；社区讨论中普遍理解为「每个游戏一次发布帖」（[Release Announcements](https://itch.io/board/10022/release-announcements)、[社区规则](https://itch.io/docs/general/community-rules)、[讨论](https://itch.io/t/4322776/can-you-post-more-than-once-in-release-announcements)） | https://itch.io/board/10022/release-announcements | — | 需先在 itch.io 建游戏页（HTML5 嵌入或外链）→ 发布帖 | 未知 | 未知 |
| **three.js 官方论坛 Showcase** | ✅ | 用来展示用 three.js 做的项目；**需要版主审核**才显示；优秀作品可能被选上 three.js 官网首页（[About the Showcase category](https://discourse.threejs.org/t/about-the-showcase-category/25)） | https://discourse.threejs.org/c/showcase/7 | — | 技术向图文 + 视频 | 任意（审核有延迟） | 未知 |
| **three.js 官方 Discord** | ✅（待核实频道规则） | 官方服务器，适合展示作品（[discoverthreejs.com](https://discoverthreejs.com/book/introduction/get-help/)）；约 18k 成员（搜索摘要）；具体展示频道名称未能核实 | 公开邀请：https://discord.com/invite/three-js-685241246557667386 | ~18k | 在展示频道发 1 条：视频 + 链接 | 任意 | 未知 |

说明：Reddit 官方 spam 政策禁止在多个社区重复发布相同或相似内容（[Reddit Help · Spam](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)）。所以**每个版一个不同的标题和正文，而且隔天发**（见第 3 节日程）。

没列入的：r/gaming（大版，自推限制严，未核实）、r/IndieDev（dinogame.gg 提到适合新游戏，但本次没查到规则，放到第 2 周再评估）。

### 中文渠道

| 渠道 | 能否发 | 规则摘要（出处） | 规则页 | 最佳形式 | 建议时间 | 预期 |
| --- | --- | --- | --- | --- | --- | --- |
| **V2EX ·「分享创造」节点** | ✅ | 「分享创造」用于发布自己的新作品；**厂商营销内容应发「推广」节点**，发错会被管理员移动，多次违规影响账号（[/go/create](https://www.v2ex.com/go/create)、[/go/promotions](https://www.v2ex.com/go/promotions)、[讨论：推广和分享创造的区别](https://global.v2ex.com/t/1058300)）。个人开发者、免费、求反馈 → 属于分享创造 | https://www.v2ex.com/go/create | 文字帖 + 1–2 张动图，写技术和开发故事 | 未知 | 未知 |
| **B站 · 动态 + 专栏** | ⚠️ | 须遵守社区规范与创作公约（[社区规范](https://www.bilibili.com/blackboard/blackroom.html)、[创作公约](http://member.bilibili.com/studio/creative-treaty/q1)、[协议汇总](https://www.bilibili.com/blackboard/topic/activity-cn8bxPLzz.html)）；动态中外链能否点击、是否限流**未能核实** | 同左 | **视频优先**（B站主阵地是视频）；动态放 GIF+一句话；专栏写开发日志；链接放简介/评论置顶，若外链不可点就写「浏览器搜 grow-everything.vercel.app」 | 未知 | 未知 |
| **小红书** | ⚠️（不放链接） | 2026 年小红书对站外导流从严：禁止在图片/私信里放联系方式、用变体词规避等，违规限流或封号（[解放日报：小红书禁止引导站外交易](https://www.jfdaily.com/wx/detail.do?id=874347)、[青瓜传媒 2026 新规盘点](https://www.opp2.com/379738.html)；官方规范 PDF：[品牌号社区运营规范](https://dc.xhscdn.com/file/c947aa537be9e80d802226374b5c710f/%E5%93%81%E7%89%8C%E5%8F%B7%E7%A4%BE%E5%8C%BA%E8%BF%90%E8%90%A5%E8%A7%84%E8%8C%83.pdf)）。网页游戏链接是否算「导流」**未能核实** → 保守做法：**正文不放链接**，只写游戏名，让人自己搜 | 同左 | 竖版 15 秒视频 / 4 张图文（「吃掉东方明珠」的前后对比），以个人开发者日记口吻 | 未知 | 未知（且无法用 utm 追踪，只能看 `referrer` 为空的自然流量变化） |
| **TapTap** | ❓ | TapTap 支持 H5 游戏的测试功能和 H5 小游戏上架（[TapTap PC/H5 测试计划](https://developer.taptap.cn/docs/en/pc-store/guide/pc-test/)、[小游戏介绍](https://developer.taptap.cn/minigameapidoc/quick-start/guide/minigames-intro/)）；**论坛里发外部网页游戏链接的规则未能核实**；正式上架属于平台 BD 岗位 | https://developer.taptap.cn/docs/store/release/publish/agree/ | 交给平台 BD 岗位评估建档，第 1 周不在论坛发 | — | 未知 |

---

## 2. 可直接复制的帖子

所有链接都带 `?utm_source=<渠道>&utm_campaign=launch`，`telemetry.ts` 会把 `utm_source / utm_campaign` 写进 `sessions.utm`（前提 P1）。
不写任何未核实的数字（在线人数、玩家数、评分）。发帖人如需改写，保持「个人开发者、求反馈」的语气。

### 2.1 r/WebGames（链接帖）

**Title:**
```
GROW EVERYTHING — start as a soda can, eat your way up to the Eiffel Tower (4-player, no signup)
```
**URL:** `https://grow-everything.vercel.app/game/?utm_source=reddit_webgames&utm_campaign=launch`

**First comment (by OP):**
```
Hi r/WebGames — I made this. You're a tiny recycling machine in Shanghai, New York or Paris. Eat things smaller than you, grow, and eventually swallow the landmark (Oriental Pearl Tower, Empire State Building, Eiffel Tower).

- Runs in the browser, no download, no account
- Up to 4 players per room; AI fills empty seats and friends can join mid-round via the invite link
- Works on phones in landscape
- No ads and no real-money purchases on this build; the shop only has cosmetics you buy with in-game coins

It's my first public release, so I'd really like to know: how long did it take to load for you, and at what point did you get bored (if you did)?
```

### 2.2 r/playmygame（视频帖）

**Title:**
```
I made a browser game where you start as a soda can and end up eating a whole city — looking for feedback on the first 2 minutes
```
**Body:**
```
[attach 30–60s video]

Play (free, browser, no signup): https://grow-everything.vercel.app/game/?utm_source=reddit_playmygame&utm_campaign=launch

What it is: a 3D "eat everything smaller than you" game. Three cities (Shanghai, New York, Paris), each ends with you swallowing the landmark. Up to 4 players per room, AI fills the rest.

What I'd love feedback on:
1. Did you understand the controls without reading anything?
2. Does growing feel good, or is there a stretch where nothing happens?
3. Phone players: is the joystick OK in landscape?

Built with Three.js. Solo dev. Every comment gets read.
```

### 2.3 r/IndieGaming（原生视频帖）

**Title:**
```
From soda can to swallowing the Empire State Building — my browser game's growth curve in 30 seconds
```
**Body:**
```
[native video upload]

This is GROW EVERYTHING, a free browser game I've been building. The whole design is about scale: things you couldn't touch 30 seconds ago become snacks.

Link in case you want to try it (desktop or phone, no account): https://grow-everything.vercel.app/game/?utm_source=reddit_indiegaming&utm_campaign=launch

Honest question for this sub: does the landmark at the end read as a payoff in the video, or does it need a bigger moment?
```
> 发前核对：本版是否要求特定 flair（如 Self Promo / Video），是否要求链接放评论而非正文。

### 2.4 r/indiegames（原生 GIF 帖）

**Title:**
```
Four players, one Paris, and whoever gets big first eats the Eiffel Tower
```
**Body:**
```
[GIF: 4 players racing, ending in the Eiffel Tower collapse]

GROW EVERYTHING — free browser game, 4-player rooms with AI filling empty seats.
https://grow-everything.vercel.app/game/?utm_source=reddit_indiegames&utm_campaign=launch

I'm a solo dev and this is the first public version. I'm especially looking for feedback on multiplayer: did you get matched quickly, did anything desync?
```

### 2.5 r/IoGames

**Title:**
```
New .io-style game: eat-to-grow in 3D cities, 4 players per room, drop-in via link
```
**Body:**
```
Made this one myself: https://grow-everything.vercel.app/game/?utm_source=reddit_iogames&utm_campaign=launch

Classic eat-smaller-things-to-grow loop, but in 3D city maps (Shanghai / New York / Paris) and each match climaxes when someone is big enough to swallow the landmark. Rooms are 4 players; AI takes empty seats and a friend can take over an AI seat mid-round via your invite link.

Would love to hear how it compares to the .io games you play — what's missing?
```

### 2.6 r/threejs

**Title:**
```
Made a 4-player browser game in Three.js where you eat a whole city — notes on keeping a destructible city in sync across 4 clients
```
**Body:**
```
[video]

Play: https://grow-everything.vercel.app/game/?utm_source=reddit_threejs&utm_campaign=launch

Some things that took the most work:
- One client is the host and decides who gets each object; others propose and apply grants. Late joiners reconcile against a bitset of what's already eaten.
- Host migration: if the host leaves, AI rivals move to the new host's simulation.
- Mobile landscape with a virtual joystick and quality settings for weaker devices.

Happy to go deeper on any of these. And if it runs badly on your GPU, I'd really like to know which device/browser.
```

### 2.7 r/gamedev 周帖评论（Screenshot Saturday 或当周反馈帖）

```
GROW EVERYTHING — eat-to-grow in 3D cities, 4 players, browser.
[GIF]
This week: added friend gifts (finish a match with a friend → exclusive paint).
Playable: https://grow-everything.vercel.app/game/?utm_source=reddit_gamedev&utm_campaign=launch
```
> 同一天在周帖里给至少 3 个别人的作品写认真反馈（社区对「只丢链接」的反感见第 1 节出处）。

### 2.8 Hacker News · Show HN

**Title（URL 字段填链接，文本留空）:**
```
Show HN: Grow Everything – a 4-player browser game where you eat a city
```
**URL:** `https://grow-everything.vercel.app/game/?utm_source=hn&utm_campaign=launch`

**First comment（发完立刻补）：**
```
Hi HN. This is a browser game I built with Three.js: you start as a small machine the size of a soda can and grow by eating anything smaller than you, until you can swallow the city's landmark (Oriental Pearl Tower, Empire State Building or Eiffel Tower).

No signup and no ads on this build. Rooms hold 4 players; AI takes empty seats and friends can take over an AI seat mid-round through an invite link.

Technical bits that might interest people here:
- The "host" client arbitrates object ownership; other clients propose and apply grants, and late joiners reconcile against a bitset of eaten objects. Host migration hands the AI rivals to the new host.
- Rooms are a thin layer on Supabase Realtime; there's no dedicated game server.
- Runs on phones in landscape.

I'd especially like to hear about load time and performance on your machine, and whether the growth pacing holds up after the first round.
```
> HN 指南：不要让朋友来刷评论或投票；用个人账号。

### 2.9 Product Hunt

**Name:** `GROW EVERYTHING`
**Tagline（≤60 字符）:** `Start as a soda can. Eat the city. 4 players, in a browser.`
**Link:** `https://grow-everything.vercel.app/game/?utm_source=producthunt&utm_campaign=launch`
**Categories:** Games · Free Games · Indie Games
**Description:**
```
GROW EVERYTHING is a free 3D browser game. You're a tiny recycling machine; eat anything smaller than you, grow, and finish by swallowing the landmark: the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Rooms hold 4 players, AI fills the empty seats, and friends join from an invite link. No download, no account, cosmetics only.
```
**Maker first comment:**
```
Hey Product Hunt — solo maker here. I wanted a game you can send to three friends in a group chat and be playing together in seconds, on phones or laptops. Playing with friends unlocks free cosmetics (a party hat, a friends-only paint, a squad crown); nothing in the game makes you stronger if you pay.

I'm most interested in feedback on first-minute clarity and on phone controls. Thanks for trying it!
```

### 2.10 itch.io · Release Announcements

**Title:**
```
GROW EVERYTHING — free 4-player browser game: start as a can, eat the Eiffel Tower
```
**Body:**
```
[GIF + 2 screenshots — required: at least one screenshot or video]

Play free in the browser: https://grow-everything.vercel.app/game/?utm_source=itch&utm_campaign=launch
(itch page: <填 itch.io 游戏页地址>)

- Eat-to-grow in 3D Shanghai, New York and Paris
- 4 players per room, AI fills empty seats, drop-in via invite link
- Desktop and phone (landscape)

Solo dev, first release. Feedback in the comments is very welcome.
```
> 前提：先建好 itch.io 游戏页（交给平台 BD 岗位，`game/src/platform/` 已有 Web 版本，可用 HTML5 上传 `dist-web/`）。每个游戏大概只有一次发布帖机会，别浪费在素材没准备好的时候。

### 2.11 three.js 论坛 Showcase

**Title:** `GROW EVERYTHING – 4-player eat-the-city game (Three.js + Supabase Realtime)`
**Body:** 用 2.6 的正文，链接改为 `?utm_source=threejs_forum&utm_campaign=launch`，并加一段：
```
Stack: three.js, TypeScript, Vite, Supabase Realtime for rooms. Happy to share details on the host-authoritative object grants or the mobile quality settings.
```

### 2.12 three.js Discord（展示频道，一条消息）

```
Made a 4-player browser game with three.js — you start as a soda can and end up eating the Eiffel Tower. Would love perf reports from different GPUs/phones 🙏
https://grow-everything.vercel.app/game/?utm_source=discord_threejs&utm_campaign=launch
[video]
```

### 2.13 V2EX · 分享创造

**标题：**
```
[分享创造] 做了个浏览器里的 4 人联机小游戏：从易拉罐吃到东方明珠
```
**正文：**
```
大家好，独立开发，第一次公开。

玩法：你是一台易拉罐大小的回收机器，吃掉比你小的东西就会变大，最后吞掉城市地标（上海东方明珠 / 纽约帝国大厦 / 巴黎埃菲尔铁塔）。一个房间 4 人，空位由 AI 补，好友点邀请链接可以中途顶替 AI 加入。

链接（免注册，电脑和手机横屏都能玩）：
https://grow-everything.vercel.app/game/?utm_source=v2ex&utm_campaign=launch&lang=zh

技术栈：Three.js + TypeScript + Supabase Realtime。房间里一个客户端当 host 裁决「这块东西归谁」，其他人提议、host 批准；host 掉线会迁移，AI 跟着搬家。

商业化：网页版没有广告，没有真钱付费，商店里只有用金币换的外观；和好友一起玩能解锁免费的限定外观。

想请教大家：
1. 你那边加载要多久？卡不卡？（方便的话附上设备/浏览器）
2. 前一分钟能不能看懂怎么玩？
3. 有没有哪一段让你想关掉？

每条回复我都会看。
```

### 2.14 B站 动态（配 GIF）+ 专栏

**动态：**
```
做了一个浏览器小游戏：从易拉罐开始，一路吃到把东方明珠吞下去 🗼
4 人联机，拉朋友点链接就能进，空位 AI 补。免费、免下载、手机横屏也能玩。
第一次公开，求大家试玩吐槽👇（链接在评论区置顶）
#独立游戏 #游戏开发 #Three.js
```
**置顶评论：** `https://grow-everything.vercel.app/game/?utm_source=bilibili&utm_campaign=launch&lang=zh`

**专栏标题：** `【开发日志】我做了一个「越吃越大」的 4 人网页游戏：从易拉罐到东方明珠`
**专栏正文提纲（发帖人按真实经历写，不要编）：**
```
1. 为什么做这个：想做一个发到群里、朋友点开就能一起玩的游戏
2. 核心体验：「30 秒前碰不动的东西，现在一口吃掉」——配 3 张 上海/纽约/巴黎 地标图
3. 技术踩坑：4 人同步、host 迁移、手机横屏
4. 不卖数值：只有外观，和好友玩送限定外观
5. 求反馈：加载速度、上手难度、哪一段无聊
链接：https://grow-everything.vercel.app/game/?utm_source=bilibili&utm_campaign=launch&lang=zh
```

### 2.15 小红书（图文 / 竖版视频，**正文不放链接**）

**标题：** `一个人做的网页游戏｜从易拉罐吃到东方明珠🗼`
**正文：**
```
独立开发第一次公开作品～
你是一台易拉罐大小的小机器，吃掉比你小的东西就会长大，最后能把东方明珠整个吞下去😂
纽约和巴黎也能玩（帝国大厦、埃菲尔铁塔）

✅ 浏览器直接玩，不用下载
✅ 4 个人一起玩，拉朋友进同一个房间
✅ 手机横屏也可以

想要链接的姐妹在浏览器里搜「GROW EVERYTHING」～
求真实试玩感受，哪里不好玩直接说！
#独立游戏 #小游戏推荐 #游戏开发 #和朋友一起玩的游戏
```
> 不写「评论区扣 1 发链接」「私信领取」——这属于诱导私信，和 2026 年规则风险相关（见第 1 节出处）。小红书流量无法用 utm 追踪，记录为「未追踪渠道」。

---

## 3. 7 天发布日程

原则：**每天最多 2 个主渠道**；同一平台（Reddit）每天最多 1 个版，且标题、正文、素材都不同；每次发帖后作者本人留守 2–3 小时回复评论。
建议 D1 = 工作日周二。下面以 **2026-09-29（周二）** 为 D1 举例；注意 10-01 至 10-07 是国内国庆假期，中文渠道受众作息会和平时不同（效果未知）。

| 天 | 日期（示例） | 渠道 | 时间（北京时间） | 目的 |
| --- | --- | --- | --- | --- |
| D0 | 09-28 周一 | 内测：发给 5–10 个真朋友，跑通「邀请链接 → 4 人局 → 皇冠」 | — | 验证 P1/P2，确认 `share_click` / `gift_unlock` 在 Supabase 里有数据 |
| D1 | 09-29 周二 | **Show HN** | 22:00–23:00（≈14:00–15:00 UTC） | 技术受众，反馈质量高 |
| D1 | 09-29 周二 | three.js 论坛 Showcase（需审核，提前提交） | 白天 | 与 HN 同一技术叙事 |
| D2 | 09-30 周三 | **r/WebGames** | 21:00–23:00（美东上午，时间效果未知） | 最对口的网页游戏受众 |
| D2 | 09-30 周三 | **V2EX 分享创造** | 10:00 左右 | 中文技术受众 |
| D3 | 10-01 周四 | **Product Hunt** | 15:01（PT 00:01） | 利用完整 24 小时榜单窗口 |
| D3 | 10-01 周四 | B站 动态 + 专栏 | 20:00 左右 | 国庆第一天 |
| D4 | 10-02 周五 | **r/playmygame** | 21:00–23:00 | 明确求反馈 |
| D4 | 10-02 周五 | three.js Discord | 任意 | 小范围、技术向 |
| D5 | 10-03 周六 | r/gamedev Screenshot Saturday 周帖评论 | 周帖出现后 | 顺带展示好友礼物更新 |
| D5 | 10-03 周六 | 小红书 图文 | 20:00 左右 | 国庆假期休闲时间 |
| D6 | 10-04 周日 | **r/IndieGaming**（原生视频） | 21:00–23:00 | 大版，视频先行 |
| D7 | 10-05 周一 | r/threejs + itch.io Release Announcements | 分开 3 小时以上 | 收尾 + 长尾 |
| 第 2 周 | — | r/indiegames、r/IoGames、r/BrowserGames、r/IndieDev（核实规则后） | — | 根据第 1 周哪个版转化高再决定 |

- 如果 D1 的 HN 或 D2 的 r/WebGames 暴露了严重问题（加载慢、联机失败），**暂停后续发帖，先修**；把后面的日程顺延，不要带着已知问题继续发。
- 不在 Reddit 同一天发两个版；不在不同版复制粘贴同一段文字（[Reddit Spam 政策](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)）。

## 4. 评论区回复准则

1. **2 小时内回复每一条评论**，前 3 小时本人在线。先感谢，再回应具体内容。
2. **批评**：先承认（"You're right, the first 20 seconds are slow"），说清楚接下来怎么处理（"I'm cutting the intro to one sentence"），**不辩解、不争论、不删评论**。有人说「这就是 agar.io/Hole.io 换皮」：坦然承认灵感来源，说明不同点（3D 城市、地标收尾、4 人好友局），不贬低别的游戏。
3. **Bug 报告**：追问设备 / 浏览器 / 房间码，回复「已记录」，修好后回原评论说「已修复，谢谢」。
4. **不做**：不用小号点赞或留言，不让朋友来刷（HN 指南明确禁止，Reddit 属于投票操纵）；不删差评；不承诺没排期的功能；不编造玩家数。
5. **不回应的**：纯人身攻击——不回，必要时举报。
6. **反馈收集**：每天把评论整理到一张表（渠道 · 原话链接 · 类别[加载/上手/手感/联机/手机/其他] · 严重度 · 处理状态），每周例会给数据运营岗位和工程师。同一问题被 3 个以上不同的人提到 → 进入当周修复清单。
7. **结尾问题固定化**：每个帖子都以 1–2 个具体问题结尾（加载时间、哪一段无聊），比「求反馈」更容易得到能用的回答。

## 5. 衡量

- 按 `sessions.utm->>'utm_source'` 分渠道统计：新 `player_id` 数、`match_start` 率、`match_end` 率、`share_click` 率。
- 用于决策的只有这些 Supabase 数字；社区里的 upvote / 评论数只作参考。
- 1000 用户目标需要把本渠道、达人渠道和平台渠道的数字合并看；本文件不预测本渠道能贡献多少（无可靠出处 → 未知）。

## 6. 发帖前检查表（每个渠道一份）

- [ ] 已亲自打开该渠道规则页并核对（记录核对日期）
- [ ] 已选对 flair / 节点 / 分类
- [ ] 链接带正确的 `utm_source`，手机和电脑点开都能进游戏
- [ ] 帖子里没有未核实的数字
- [ ] 素材（GIF/视频）已上传且能播放
- [ ] 发帖人接下来 2–3 小时有空回复
- [ ] **用户已确认可以发**
