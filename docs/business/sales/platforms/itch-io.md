# itch.io — 平台档案

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**未发布**（可自助即时发布）
>
> 取证方式：本环境屏蔽了 `itch.io`，内容来自**官方文档页（itch.io/docs、itch.io/updates）的搜索引擎摘要**，均注明 URL。

## 1. 提交入口、流程、审核时长

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 提交入口 | 登录后 https://itch.io/game/new （Dashboard → Create new project） | [S1] |
| 流程 | 新建项目 → **Kind of project 选 HTML** → 上传 zip → 勾选「This file will be played in the browser」→ 设置嵌入尺寸/全屏/Mobile friendly → 可见性改 Public → Save | [S2] |
| 审核 | **无上线前审核**：发布后立即可通过主页和 URL 访问。**首次发布的新卖家**会进入审核队列，通常**几个工作日内**完成；期间页面**可能不进搜索和浏览页**，但仍正常可玩。审核队列优先处理**有站外真实流量**的页面 | [S3] |

## 2. 技术要求对照

| 要求（官方） | 来源 | 我们的现状 | 结论 |
| --- | --- | --- | --- |
| zip 解压后 ≤ 1000 个文件、总计 ≤ 500 MB、单文件 ≤ 200 MB、路径名 ≤ 240 字符 | [S2] | 19 个文件、3.6 MB | ✅ 已满足 |
| zip 包作为网页游戏入口（`index.html` 的具体位置要求本次摘要未显示，按通行做法放在 zip 根目录） | [S2] | `dist-web/index.html` 只是跳转到 `./game/`，而 `game/index.html` 用 `/assets/...` 绝对路径——在 itch 的子路径 CDN 上会 404 | ❌ **需要改**：相对路径平台构建（README 技术改动 A） |
| 画布应随窗口缩放；手机上总是点击后全屏启动；只有真机测过才勾 Mobile friendly | [S2][S4] | 画布自适应；手机横屏 + 虚拟摇杆 | ✅ 已满足（勾选 Mobile friendly + Landscape） |
| 广告：不禁止，但须不打扰、不误导，不能挡住游玩；**可能影响浏览页排名**；应提前告知玩家 | [S5] | 激励广告依赖 CrazyGames/Poki SDK，在 itch 上 `WebPlatform` 没有广告 | ✅ 已满足（itch 上本来就无广告） |
| 多人 / 外部服务器 | **未查到**明确限制 | Supabase 实时房间 | ⚠️ 不确定（未见禁止条款）|
| 邀请链接 | — | `fallbackInviteUrl()` 用 `location.origin`：在 itch 的 iframe 里会生成 itch CDN 子域的链接，不是 itch 游戏页 | ❌ **需要改**：给门户构建配置「邀请链接基址」（指向 itch 游戏页或 https://grow-everything.vercel.app/game/ ），README 技术改动 B |

## 3. 收入分成与付款

| 项 | 内容 | 来源 |
| --- | --- | --- |
| 分成 | **开放分成**：开发者自己设 0–100% 给 itch，**默认 10%**；另有支付通道费（PayPal/Stripe 约 $0.30 + 2.9%/笔） | [S6][S7] |
| 付款方式 | 两种：直接打到你的 PayPal/Stripe；或由 itch 代收、之后打款 | [S7] |
| 对我们 | 免费游戏 + 可选「Name your own price / 打赏」。itch 上没有平台广告分成 | — |

## 4. 预计流量

- **无公开数据**（itch.io 未公开单款新游戏的曝光量；官方只说明站外真实流量会让审核更快）。[S3]
- 判断：itch 的价值是「第 1 天就有一个可分享的正式页面 + 开发者社区曝光」，不是大流量来源。

## 5. MEDDIC

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | 页面浏览 → 点击游玩 → `match_start`（带 `?utm_source=itch`）；itch 后台的 views/plays |
| **Economic buyer** | 无（自助发布）。影响曝光的是 itch 的新卖家审核队列和算法 |
| **Decision criteria** | 不违反质量准则（不刷量、不滥用标签、不做扰人图片）[S3] |
| **Decision process** | 发布即上线 → 新卖家审核（几个工作日）→ 进入搜索/浏览 |
| **Identify pain** | itch 需要真实有站外流量的高质量页面；我们需要一个第 1 天就能上线的公开落地页 |
| **Champion** | 可争取：itch 社区 devlog、相关 Game Jam 主办者 |

## 6. 提交文案（可直接复制）

**标题**：GROW EVERYTHING

**短描述 / Short description（≤150 字符）**
- EN：`Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- 中：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。`

**长描述**（itch 页面正文，建议中英都放）
- EN：GROW EVERYTHING is a 3D arena "eat the city" game made with three.js. Drive a small googly-eyed machine through Shanghai, New York or Paris and swallow everything smaller than you — trash cans, cars, buses, buildings — until you can bring down the Oriental Pearl Tower, the Empire State Building or the Eiffel Tower. Up to 4 players share one city; bigger machines eat smaller ones. Send one invite link to your friends — AI rivals fill empty seats so a round always starts right away. Rounds last up to 5 minutes, 3 lives each. Free to play, no account needed. Cosmetics only — nothing you can buy makes you stronger.
- 中：《GROW EVERYTHING》是一款用 three.js 制作的 3D「吞掉整座城市」竞技游戏。驾驶大眼珠小机器在上海、纽约或巴黎横冲直撞，吃掉比你小的一切——垃圾桶、汽车、公交车、楼房——直到吞下东方明珠、帝国大厦或埃菲尔铁塔。最多 4 人同城，大的吃小的。发一个邀请链接给好友，空位由 AI 补上，随时开局。每局最长 5 分钟，每人 3 条命。免费、免注册；只有外观，花钱买不到变强。

**玩法说明**
- EN：Eat anything smaller than you to grow. Smaller rivals are food too — bigger ones will eat you. Dashing into something too big stuns you and costs mass. Grow big enough to topple the landmark.
- 中：吃比你小的东西长大；小对手也能吃，大对手会吃你。冲刺撞上吃不动的东西会眩晕掉质量。长到够大就能推倒地标。

**操作说明**
- EN：WASD move · mouse look · SPACE dash · 1–6 emotes · H horn · M mute. Mobile (landscape): drag left side to move, DASH bottom-right.
- 中：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音。手机横屏：左侧拖动移动，右下角冲刺。

**标签**：`io`, `multiplayer`, `online-multiplayer`, `3d`, `threejs`, `webgl`, `destruction`, `city`, `casual`, `funny`
- Genre：Action · Made with：three.js · 中文页面可在正文写中文标签：io、多人、3D、吞噬、城市、破坏、休闲、搞笑

## 7. 下一步（用户操作）

1. 注册/登录 https://itch.io → 右上角头像 → **Upload new project**。
2. Title 填 `GROW EVERYTHING`；Project URL 建议 `grow-everything`；Short description 粘第 6 节英文短描述；**Kind of project → HTML**。
3. Pricing 选 **No payments** 或 **$0 or donate**；Uploads → 上传平台构建 zip → 勾 **This file will be played in the browser**。
4. Embed options：Viewport 1280×720，勾 **Mobile friendly**、Orientation 选 **Landscape**、勾 **Fullscreen button**。
5. 粘贴长描述、玩法、操作；Genre 选 Action；填标签；上传封面（按上传框提示的尺寸裁图）和 3–5 张截图。
6. Visibility 选 **Public** → **Save**。把页面链接（带 `?utm_source=itch` 的游戏内链接另行统计）发到社群，帮页面尽快过新卖家审核。

## 来源

- [S1] https://itch.io/docs/creators/getting-started
- [S2] https://itch.io/docs/creators/html5
- [S3] https://itch.io/docs/creators/getting-indexed
- [S4] https://itch.io/updates/better-support-for-mobile-html-games-more ； https://itch.io/updates/more-embed-options-for-html5-games
- [S5] https://itch.io/docs/creators/quality-guidelines
- [S6] https://itch.io/updates/introducing-open-revenue-sharing
- [S7] https://itch.io/docs/creators/payments
