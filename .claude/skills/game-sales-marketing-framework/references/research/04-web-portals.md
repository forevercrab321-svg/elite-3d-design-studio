# 04 — 网页游戏门户发行派（Poki / CrazyGames / itch.io / Newgrounds）

> 调研日期：2026-09-24｜调研 Agent：nuwa Phase 1
> **取证方式说明（重要）**：本会话的网络出口策略屏蔽了 developers.poki.com、sdk.poki.com、docs.crazygames.com、poki.com、medium.com、gamedeveloper.com、pocketgamer.biz 等域名的直接抓取（WebFetch 返回 EGRESS_BLOCKED）。下文信息来自 **WebSearch 返回的搜索引擎摘要**，摘要引用的是官方文档页面的原句。因此：
> - 「一手（摘要）」= 来源是官方文档或官方新闻稿，但经搜索摘要转述，未能逐字打开原页核对。
> - 「一手（原页）」= 直接读到了原页面（仅 GitHub）。
> - 「二手」= 第三方博客或媒体。
> - 「未证实」= 没找到出处，或只有第三方说法。
> 下一轮有网络时应优先打开原页，逐字核对带 ★ 的数字。

---

## 1. 核心论点

1. **首次加载就是第一道转化漏斗。** Poki 的原话大意是：玩家加载超过 10 秒就会换别的游戏，所以首包要 ≤5MB、总量 ≤8MB ★。CrazyGames 的硬上限宽松得多（首包 ≤50MB），但要进移动端首页，首包必须 ≤20MB ★。两家都认为：**加载速度直接决定曝光。**
2. **门户靠「测试漏斗」按数据放量，不靠编辑拍脑袋。** Poki 分三步：Playtest（10 段录像）→ Player Fit Test（500 名玩家）→ Web Fit Test（按品类基准比较 CTR、页面停留时长、C2P）。CrazyGames 分两步：Basic Launch（≥7 天且 ≥500 次游玩）→ 按平均游玩时长、游戏转化率、留存升级到 Full Launch。
3. **收入分成跟「谁带来的玩家」挂钩（Poki），或者不公开（CrazyGames）。** Poki 的 Web Exclusive 协议：Poki 带来的玩家 50/50 分成，开发者自己带来的玩家 100% 归开发者，独占期默认 5 年，只限 Web 端，Steam 和应用商店不受限。CrazyGames 的通用文档不公布分成比例。
4. **广告要节制，激励广告优先。** CrazyGames 由 SDK 强制限频：插屏（midgame）最多每 3 分钟 1 次；激励广告应该是「玩家期待的特别机会」，不能用关卡设计逼玩家看广告。
5. **多人游戏要接入平台的社交层。** CrazyGames 的 Full Launch 要求多人游戏支持 Instant Multiplayer、随时加入房间（或观战）、平台级邀请按钮和好友列表。
6. **社区门户（itch.io / Newgrounds）靠的是社区机制，不是算法漏斗。** itch.io 靠 game jam、devlog 和完整的标签；Newgrounds 靠 Blam/Protect 投票审判制。

## 2. 方法步骤（按门户）

### 2.1 Poki（手工策展 + 三级测试）
1. 在 developers.poki.com 提交游戏，接入 PokiSDK（官方说法是「两行代码」）。
2. **Level 2 Playtest**：Poki 玩家页面上会出现一个「Mystery Tile」，点进去就是一次性试玩。每次测试返回 10 段录像，附按键输入、控制台输出、时长、国家、设备。
3. **Level 3 Player Fit Test**：500 名玩家试玩，约 5 小时出结果。健康标准是**平均游玩时长 > 3 分钟，且至少 25% 的游玩超过 3 分钟** ★。这一步不测 C2P。
4. **Web Fit Test**：需要先看完 ≥5 段录像、通过 Player Fit，并上传缩略图。测 CTR、页面停留时长、C2P（conversion to play）；一处说约 7 天，另一处说 3–5 天（**两个数字互相矛盾，保留不调和**）。参照值：**Poki 平均游戏约 70% 转化、6+ 分钟游玩时长** ★。
5. 最终审核 1–2 周，然后签 Web Exclusive 协议，进入全球发行。上线需要静态和动态两种缩略图。
6. 没通过的游戏有官方「What To Do If My Game Doesn't Make It」指引页（sdk.poki.com/web-fit-help）。

### 2.2 CrazyGames（开放提交 + 数据升级）
1. 在 developer.crazygames.com 提交。**Basic Launch 可以不接 SDK，但没有变现**。首包 ≤50MB，文件数 ≤1,500。
2. Basic Launch 满足「上线 ≥7 天」和「≥500 次游玩」两个条件后结束。仪表盘每天更新，自动统计 KPI。
3. 以平均游玩时长、游戏转化率（「开始游戏后至少玩了 1 分钟的玩家比例」）、留存为依据，与平台同类游戏对比，决定能否进入 Full Launch。参照值：「成功的游戏平均游玩时长常在 10 分钟以上」；「表现强的游戏 D1 留存通常 10–15%」 ★。
4. Full Launch 必须接 SDK，之后才解锁广告分成与平台功能。多人游戏还要满足多人要求（见 §1.5）。
5. 内购（IGP）**仅限受邀游戏**，必须走 CrazyGames 自己的 Xsolla 账户。
6. 月结付款，经 Tipalti 支付，起付额 €100（二手）。

### 2.3 itch.io（自带流量的社区店）
- 上传可在浏览器运行的 HTML5 版本，定价用「pay-what-you-want + 建议价」。流量要靠自己带：devlog、jam、社交媒体（二手，Cinevva 指南）。
- Jam 是「杠杆最高的推广路径」：一个普通 jam 作品，光 jam 页面就能带来数百次游玩（二手）。
- 曝光渠道：搜索（看标签、标题、描述）、Popular（看下载、评分、新近度）、New、合集、devlog、编辑推荐。「标签稀少的游戏很少被看到」（二手）。
- 学术旁证：阿尔伯塔大学有一项基于 itch.io 数据的研究（ualberta.scholaris.ca），摘要提到高排名 jam 作品多为 Windows/macOS 平台，品类多为解谜、平台跳跃、互动小说、动作（一手学术，摘要级）。

### 2.4 Newgrounds（投票审判制）
- 2000 年起实行 Blam/Protect 投票：作品要在 100、150、200 票三个节点分别达到 1.0、1.25、1.6/5 分才能永久保留；投票结果与最终判定一致的用户会得到积分（二手，Wikigrounds 社区 wiki）。
- 创始人 Tom Fulp 至今仍亲自参与运营（二手）。
- 对今天的意义：适合拿来**获取硬核社区反馈、做 IP 早期口碑**，不是大规模变现渠道（推断）。

## 3. 关键指标（汇总）

| 指标 | Poki | CrazyGames | 来源可信度 |
|---|---|---|---|
| 首包大小 | ≤5MB（总 ≤8MB） | ≤50MB；进移动端首页需 ≤20MB | 一手（摘要） |
| 加载时长 | >10 秒玩家流失 | 未见明确数字 | 一手（摘要） |
| 游玩时长 | Player Fit 平均 >3 分钟；平台均值 6+ 分钟 | 成功游戏常 10 分钟以上 | 一手（摘要） |
| C2P / 转化 | 平台均值约 70% | 定义为「玩满 1 分钟的比例」 | 一手（摘要） |
| D1 留存 | 未公开 | 强游戏 10–15% | 一手（摘要） |
| 插屏频率 | 未查到 | 最多每 3 分钟 1 次（SDK 强制） | 一手（摘要） |
| 分成 | 50/50（Poki 带来的流量）；自带流量 100% 归开发者 | 通用文档未公开；2026 GameMaker web jam 条款为广告 60% / 内购 70% 归开发者 | Poki 一手（摘要）；CG 二手（Playgama 博客转述） |
| 独占 | Web 独占，默认 5 年 | 「无独占要求」 | Poki 一手（摘要）；CG 二手 |

## 4. 成功案例与规模数据

- **Poki 平台规模**：2025 年 12 月获 Dutch Game Awards「Best in Business」。单月游玩次数 10 亿，月活玩家 1 亿（2020 年为 1,000 万）；1,000+ 款策展游戏来自 600+ 独立工作室。新闻稿称头部工作室收入「提升十倍」，**部分工作室年收入可达 100 万美元（此前约 5 万美元）**。来源：Poki 官方新闻稿，经 PRNewswire / Benzinga / Dealroom 转载（一手新闻稿，属自述，存在利益相关）。
- **Poki《2026 State of Web Gaming》报告**：Poki 委托 Atomik Research 调研，样本为美英 2,000 名玩家和 400 名开发者，2026 年 5 月实地调研。主要数据：37% 的玩家每天玩网页游戏多次；典型单次时长 11–20 分钟（29%）；49% 的玩家一次会话试玩 2–3 款游戏；46% 的玩家因加载太慢放弃过手游，28% 因下载包太大放弃过（一手，但为平台委托调研）。
- **Poki netlib**（GitHub 原页，一手）：官方开源的 WebRTC P2P 网络库，自称「Steam Networking Library for the web」，卖点是「No server costs」「No double implementation」「Lower latency」。README 说明它「still under development and considered a beta」，但「actively used in production by some games」。说明 Poki 正在主动为多人网页游戏降低服务器成本。
- CrazyGames 具体爆款及其营收数字：**未证实**（本轮没查到可引用的一手数据）。

## 5. 批评与局限（必须保留）

1. **数据都来自平台自己。** 「收入十倍」「年入百万」「92% 认为 HTML5 游戏高质量」全部出自 Poki 的新闻稿或委托调研，属于幸存者叙事，没有披露分布或中位数（批评立场：推断，基于利益相关）。
2. **5 年 Web 独占代价很高。** 它锁死了开发者在其他门户（CrazyGames、GameDistribution 等）的分发，也限制了未来网页端的议价空间；「自带流量拿 100%」在实际操作中如何归因、能否审计，**未证实**。
3. **首包 5MB 对 3D 游戏几乎是硬伤。** 3D 模型、贴图、音频很难压进这个数字，必须做渐进加载，这会推高工程成本（推断）。
4. **CrazyGames 分成不透明。** 通用条款不公布比例，唯一的公开数据点来自一次 jam 活动，而且是第三方博客转述（二手）。
5. **测试漏斗偏向「前 3 分钟好玩」。** 500 人、几小时的测试奖励上手快的游戏，慢热、社交驱动（要等朋友上线）的多人游戏可能被低估（推断）。
6. **内购受限。** CrazyGames 的 IGP 只对受邀游戏开放，所以「外观内购 + VIP」这类模式在门户上**不能默认可用**。Poki 内购政策**未证实**（本轮未查到）。
7. **流量不归开发者所有。** 门户玩家的身份和数据留在平台内，开发者难以建立直接关系（推断，与 §6 的社区派形成对比）。
8. **Poki 的 Web Fit Test 周期文档自相矛盾**（约 7 天 vs 3–5 天），说明文档在迭代，引用前应重新核对。

## 6. 与其他流派的分歧

- **vs 自有渠道 / 社区派（itch.io、Discord、Steam 愿望单）**：门户派认为分发和流量是稀缺资源，应该用独占换曝光；社区派认为用户关系才是资产，应该自带流量。Poki 的「自带流量 100% 归开发者」条款，某种程度上承认了自有流量的价值。
- **vs .io 自托管病毒派（见 05）**：Agar.io、Slither.io 时代靠自有域名加 YouTuber 传播，不依赖门户审核；今天门户掌握了首页流量入口，两条路线在「要不要独占」上存在直接冲突。
- **vs 短视频达人派（见 06）**：门户派主张先用数据验证留存再放量；达人派主张先制造可传播的时刻，靠流量反推留存。门户的测试漏斗不看「可传播性」这一维度。
- **Poki vs CrazyGames 内部分歧**：Poki 是策展、独占、首包 5MB 的精品路线；CrazyGames 是开放提交、非独占、首包 50MB，按数据升级。对 3D 游戏来说，CrazyGames 的门槛明显更友好。

## 7. 来源清单

| # | URL | 类型 | 可信度 |
|---|---|---|---|
| 1 | https://developers.poki.com/guide/requirements-quality | Poki 官方文档 | 一手（摘要） |
| 2 | https://developers.poki.com/guide/revenue-deal-types | Poki 官方文档 | 一手（摘要） |
| 3 | https://sdk.poki.com/deals ｜ https://sdk.poki.com/bonus | Poki 官方文档 | 一手（摘要） |
| 4 | https://developers.poki.com/guide/how-testing-works ｜ /player-fit-test | Poki 官方文档 | 一手（摘要） |
| 5 | https://sdk.poki.com/web-fit-test.html ｜ https://sdk.poki.com/playtesting ｜ https://sdk.poki.com/web-fit-help | Poki 官方文档 | 一手（摘要） |
| 6 | https://www.prnewswire.com/news-releases/poki-wins-best-in-business-at-dutch-game-awards-302633566.html | Poki 新闻稿 | 一手（自述） |
| 7 | https://techfundingnews.com/browser-gaming-website-poki-won-big-at-the-dutch-game-awards-celebrating-hitting-1-billion-monthly-plays/ | 媒体 | 二手 |
| 8 | https://hub.poki-cdn.com/The_2026_State_of_Web_Gaming_Report_4ee6fdc260.pdf ｜ https://poki.com/blog/state-of-web-gaming-report-2026 | Poki 委托报告 | 一手（利益相关） |
| 9 | https://github.com/poki/netlib | Poki 开源仓库 | 一手（原页） |
| 10 | https://docs.crazygames.com/requirements/technical/ | CrazyGames 文档 | 一手（摘要） |
| 11 | https://docs.crazygames.com/resources/basic-launch-metrics/ ｜ /requirements/intro/ | CrazyGames 文档 | 一手（摘要） |
| 12 | https://docs.crazygames.com/requirements/ads/ ｜ /resources/midgame-ads-pacing/ | CrazyGames 文档 | 一手（摘要） |
| 13 | https://docs.crazygames.com/resources/monetizing-hypercasual-io/ | CrazyGames 文档 | 一手（摘要） |
| 14 | https://docs.crazygames.com/requirements/multiplayer/ | CrazyGames 文档 | 一手（摘要） |
| 15 | https://docs.crazygames.com/sdk/in-game-purchases/ | CrazyGames 文档 | 一手（摘要） |
| 16 | https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/ | 竞品平台博客 | 二手（有利益相关） |
| 17 | https://app.cinevva.com/guides/publish-game-crazygames ｜ /itch-io-launch-guide | 第三方指南 | 二手 |
| 18 | https://ualberta.scholaris.ca/items/539e37b8-8100-4c82-b6ee-1c22bcf50c13 | 学术论文 | 一手（摘要级） |
| 19 | https://newgrounds.wiki.gg/wiki/Voting ｜ https://en.wikipedia.org/wiki/Tom_Fulp | 社区 wiki / 维基 | 二手 |

统计：共 19 组来源，其中一手 14 组（含 13 组仅经搜索摘要读到）、二手 5 组，一手占比约 74%。

---

## 8. 对 GROW EVERYTHING 的适用性（全部为推断）

> 游戏设定：浏览器 3D 多人 .io，「越吃越大、吞掉整座城市」，四人联机，地图为上海、纽约、巴黎，走搞笑路线。发行路径：自有网页 + CrazyGames / Poki → 后期 Steam。收入来源：外观内购、VIP、激励广告。

1. **先 CrazyGames，后评估 Poki（推断）。** 3D 城市资产很难压进 Poki 的 5MB 首包；CrazyGames 首包 ≤50MB 可以上线，**若想进移动端首页要 ≤20MB**。建议首包只含一张地图（例如上海）的低 LOD 版本，另外两张地图和高精度建筑改为渐进加载。
2. **Poki 5 年 Web 独占与「自有网页」路线冲突。** 如果签了 Poki，自有网站很可能也算 Web 分发（具体解释**未证实**，需在谈判中书面确认）。Steam 不受影响，因为独占只限 Web。决策点：等 CrazyGames Basic Launch 数据出来后再谈 Poki。
3. **把平台测试指标当开发里程碑：**
   - 前 1 分钟必须「吃到东西并变大」，对应 CrazyGames 的转化定义（玩满 1 分钟）和 Poki 的 C2P（平台均值约 70%）。
   - 单局设计在 3–5 分钟，对应 Poki Player Fit 的平均 >3 分钟、25% 超过 3 分钟。
   - 用多局循环和解锁城市拉长会话，目标平均时长 ≥10 分钟，对齐 CrazyGames 的「成功游戏」参照值。
   - 设 D1 留存目标 10–15%，作为是否加大投入的门槛。
4. **四人联机要对齐 CrazyGames 的多人规范**：Instant Multiplayer（队长直接开私房）、邀请按钮、中途加入或观战，这些是 Full Launch 的前置条件。技术上可以评估 Poki netlib（WebRTC P2P）来降低服务器成本，但它还是 beta，**且 P2P 对「全城物理吞噬」的权威同步和防作弊不友好**，需要技术评审。
5. **变现与门户规则的冲突点：**
   - **外观内购、VIP 在 CrazyGames 仅限受邀游戏，且必须走其 Xsolla**。早期只能靠激励广告，内购放在自有网页和 Steam 版。
   - 激励广告按 CrazyGames .io 指南设计：「看广告复活」每局最多 1 次；「看广告解锁搞笑皮肤」（例如变成一只巨型小笼包或自由女神像）符合平台推荐的「funny cosmetic change」。
   - 插屏放在死亡或结算页，平台 SDK 自动限频（≤1 次/3 分钟），不要自己叠加。
6. **itch.io / Newgrounds 用作早期口碑与反馈池**：发 jam 版或原型版，收集搞笑片段反馈，不追求收入。
7. **风险**：门户测试偏好「前 3 分钟」，而四人联机的乐趣依赖凑齐好友，单人匹配体验必须足够好（AI 填充或快速匹配），否则测试样本中大部分单人玩家会低估游戏潜力。
