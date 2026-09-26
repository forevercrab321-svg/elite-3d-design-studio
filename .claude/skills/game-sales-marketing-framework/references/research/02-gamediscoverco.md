# 02 · Simon Carless（GameDiscoverCo）流派

> 调研日期：2026-09-24
> 调研条件说明：newsletter.gamediscover.co 和 gamedeveloper.com 都被本环境的出口代理拦截（403），
> 所以一手内容全部来自 WebSearch 对原文的索引摘要。GameDiscoverCo 大量内容在 Plus 付费墙后面，免费部分以外的信息本次拿不到。
> 可信度标注：
> - **[一手·摘要]**：Carless 或 GameDiscoverCo 的原文，经搜索索引转述
> - **[二手]**：媒体转述
> - **[推测]**：本文作者的推断

---

## 1. 人物与定位

- Simon Carless 是 GameDiscoverCo 的创始人。这家公司是一家游戏 discoverability 咨询公司，2019 年成立。他写的 newsletter 在 Substack 上，订阅数有「数万」。他早年长期参与 GDC 和 IGF 的运营，这部分信息未能在本次核实。
  来源：https://en.wikipedia.org/wiki/Simon_Carless（搜索摘要）；https://80.lv/articles/gamediscoverco-helping-indie-devs-with-models-and-data ；https://simonowens.substack.com/p/how-the-gamediscoverco-newsletter-launched-a-data-product-for-game-developers [二手]
- 他给自己的业务范围下过定义，原句：
  > "how do players find, buy and enjoy your premium PC and console game?"
  也就是只研究「一次性付费」的 PC 和主机游戏，**不太管 F2P 和移动端**。
  来源：https://newsletter.gamediscover.co/about ；https://www.dicesummit.org/dice_speakers/details.asp?idSpeaker=477 [一手·摘要]
- 数据来源分三块：
  - 公开数据：Steam 页面、CCU、评测数；
  - 开发者自愿提交的私有数据；
  - 付费产品 GameDiscoverCo Plus 的估算模型。
  来源：https://simonowens.substack.com/p/how-the-gamediscoverco-newsletter-launched-a-data-product-for-game-developers [二手]

## 2. 核心论点

### 2.1 Discoverability 是「供需」问题，不只是营销技巧问题
- 他有一篇文章标题是「The hidden levers of game discovery? Supply and demand!」，把可见度放在市场供给和玩家需求的关系里看。
  来源：https://www.gamedeveloper.com/game-platforms/the-hidden-levers-of-game-discovery-supply-and-demand- [一手·标题+摘要]
- 「Three Eras of Game Discoverability」按时代划分可见度：
  1. 零售货架时代：大约 1980s–2005，发行商靠谈货架位置控制曝光；
  2. 早期数字时代；
  3. 当下的平台和算法时代。
  来源：https://newsletter.gamediscover.co/p/the-three-eras-of-game-discoverability ；https://www.gamedeveloper.com/business/the-three-eras-of-game-discoverability [一手·摘要，第 2、3 个时代的细节未能核实]

### 2.2 游戏要「特别」才能被看见
- 《game discovery primer》原句：
  > "Games need to be special to stand out on Steam. Sometimes it's complexity/deepness - or perceived deepness - that really helps."
  来源：https://newsletter.gamediscover.co/p/your-complete-game-discovery-primer [一手·摘要]
- 相关文章：「What traits do 'discoverable' games have in 2022?」、「The only way to discovery success? Escape your filter bubble!」、「Why 'sessionability' radically affects game discovery」（按标题推断，他认为「一局能不能被切成适合直播和切片的片段」会影响传播。正文未核 [推测]）。
  来源：https://www.gamedeveloper.com/game-platforms/what-traits-do-discoverable-games-have-in-2022- ；https://newsletter.gamediscover.co/p/the-only-way-to-discovery-success ；https://newsletter.gamediscover.co/p/why-sessionability-radically-affects [一手·标题]

### 2.3 wishlist 的价值是真的，但转化率比很多人以为的低
- 2023 年开发者调查：首周每个 wishlist 平均带来 0.36 份销量，**中位数 0.2**。
  来源：https://newsletter.gamediscover.co/p/steam-survey-do-wishlists-and-sales [一手·摘要]
- 2024 年 8–10 月发售、launch wishlist 不少于 5,000 的游戏：首周转化中位数 **10.5%**，只有 10% 的游戏超过 1.9x。媒体转述的标题写的是「1.9%」，和正文的 1.9x 对不上，这里存疑，保留原样。
  来源：https://newsletter.gamediscover.co/p/steam-the-new-wishlists-to-first ；https://gameworldobserver.com/2024/12/06/wishlist-to-sales-ratio-steam-gamediscoverco-benchmark [一手·摘要+二手]
- 2024 年 9 月到 2025 年 8 月、launch wishlist 不少于 25,000 的游戏：中位数 **0.15x**。其中高于 10 美元的全价游戏约 0.10x；NSFW 游戏转化偏高，排除后中位数约 0.14x。
  - 他**没有**观察到转化率在长期下滑；他的判断是 wishlist 本身越来越难攒。
  - 转化倍数最高的几款：**Peak 29.29x**、Mage Arena 8.67x、R.E.P.O. 7.51x，全是低价的多人 friendslop。
  来源：https://newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions ；https://gamedevreports.substack.com/p/gamediscoverco-the-state-of-steam ；https://automaton-media.com/en/news/steam-wishlist-to-sales-study-shows-how-genre-release-timing-and-reviews-affect-success-nsfw-games-show-unusually-high-conversion-rate/ [一手·摘要+二手]

### 2.4 用评测数估算销量（Boxleiter number）
- GameDiscoverCo 拿到 237 款游戏的真实销量，算出终身销量约为评测数的 58 倍（中位数）；2020 年发售的游戏只有 38 倍，建议规划时用 20–60 倍。新作在热门时期可能接近 60 倍。
  来源：https://gameworldobserver.com/2022/11/15/how-to-count-game-sales-steam-2022-review-multiplier ；https://newsletter.gamediscover.co/p/steam-sales-estimates-why-game-popularity [一手·摘要+二手]
- 这个方法最早来自 Mike Boxleiter、Jake Birkett 等人。Carless 的贡献是把它系统化，并指出倍数会随「游戏热度」变化。[二手]

### 2.5 市场是头部化的，但独立游戏之间分得相对平均
- 2025 年 Steam 收入前 20 的新作，每款毛收入都超过 5,000 万美元，其中 13 款超过 1 亿美元；几乎每款都卖了 200 万份以上，7 款超过 500 万份。
  来源：https://newsletter.gamediscover.co/p/revealed-the-top-new-pc-and-console-58f ；https://gamedevreports.substack.com/p/gamediscoverco-most-successful-new [一手·摘要+二手]
- PlayStation 玩家最集中在少数作品上，Steam 玩家更分散。AAA 和 AA 的收入集中在少数大作，独立游戏之间的收入分布相对平均。[二手，gamedevreports 对 GDCo 的转述]
- 玩家的时间大量被少数长青游戏占走，所以新游戏争夺的是剩下那部分 playtime。相关文章：「Which game genres get the most playtime?」、「How many games do PC/console players own, & do they 'main' just one?」、「How many PC games get bought - but not played?」。
  来源：https://newsletter.gamediscover.co/p/which-game-genres-get-the-most-playtime ；https://newsletter.gamediscover.co/p/how-many-games-do-pcconsole-players ；https://newsletter.gamediscover.co/p/how-many-pc-games-get-bought-but [一手·标题+摘要]

### 2.6 Friendslop 与「audience format」
- Carless 在讨论 2025 年榜单时指出，Peak、R.E.P.O. 这类 friendslop 是当年 Steam 最畅销的游戏之一。
  来源：https://kotaku.com/steam-top-selling-2025-friendslop-rpgs-sales-2000654157 [二手]
- 他分析了 Oro Interactive 发行的两款游戏。Super Battle Golf 售价 8 美元，发售 9 天卖出 50 万份，之后接近 80 万份，日峰值 CCU 在 1.5 万到 2 万之间。他的看法是：这类便宜的多人游戏，本质上是在「theme and format to have fun in」上下的精准押注，和传统单人游戏设计是两个不同的分支。
  来源：https://newsletter.gamediscover.co/p/how-two-friendslop-hits-got-the-audience [一手·摘要]

## 3. 自创或推广的术语

| 术语 | 含义 | 来源 |
|---|---|---|
| Game discoverability | 玩家怎么「找到、买下、玩上」一款游戏 | about 页 [一手·摘要] |
| Three eras of discoverability | 零售时代 → 早期数字时代 → 平台算法时代 | 同名文章 [一手·摘要] |
| Wishlist-to-first-week-sales ratio | 首周销量除以发售时的 wishlist 数 | 多篇 [一手·摘要] |
| Reviews multiplier / Boxleiter number | 销量约等于评测数 × N | 同上 |
| Sessionability | 一局游戏能否被切成适合直播、分享的片段（基于标题推断含义）| 同名文章 [一手·标题，含义为推测] |
| Audience format | 让一群人一起玩得开心的主题加形式 | friendslop 文 [一手·摘要] |
| Post-release discovery boost | 发售后因为更新、打折、主播等出现的第二波曝光 | https://newsletter.gamediscover.co/p/why-games-get-big-post-release-discovery [一手·标题] |

## 4. 方法（从他的建议中整理，偏「看数据再决策」）

1. **先看市场形状**：拿同类型近期作品的评测数估算销量，判断这个类型的天花板有多高。[一手·摘要，2.4]
2. **用 wishlist 验证需求，但做保守预期**：首周销量按 wishlist 的 0.1–0.2x 做预算，不要按 0.3x 以上去算。[一手·摘要，2.3]
3. **在发售前把社区建起来**：primer 专门讨论了 pre-launch community，目标是发售时有足够多的核心粉丝。[一手·摘要]
4. **关注发售后的第二波**：更新、折扣、主播都能带来 post-release boost。[一手·标题]
5. **主动跳出「filter bubble」**：开发者自己的圈子（开发者 Twitter、行业媒体）不代表真正的玩家。[一手·标题，正文未核]

## 5. 关键指标

| 指标 | 数值 | 来源 |
|---|---|---|
| 首周 wishlist 转化中位数（2023 调查） | 0.2（平均 0.36） | steam-survey-do-wishlists-and-sales [一手·摘要] |
| 首周转化中位数（2024 年 8–10 月，≥5k WL） | 10.5% | steam-the-new-wishlists-to-first [一手·摘要] |
| 首周转化中位数（2024 年 9 月–2025 年 8 月，≥25k WL） | 0.15x；全价 >10 美元的约 0.10x | the-state-of-steam-wishlist-conversions [一手·摘要] |
| 转化倍数最高的游戏 | Peak 29.29x / Mage Arena 8.67x / R.E.P.O. 7.51x | 同上 |
| 评测倍数 | 中位数 58x（2020 年发售为 38x），规划区间 20–60x | GWO 2022 [二手] |
| 2025 年 Steam 收入前 20 门槛 | 毛收入 5,000 万美元以上 | GDCo 2025 年榜 [一手·摘要] |

## 6. 成功案例（他分析过的）

- **Peak**：29.29x 的 wishlist 转化，说明它的销量绝大部分来自发售后的病毒传播。[一手·摘要]
- **R.E.P.O.、Mage Arena**：同属低价 co-op，同样是高倍转化。[一手·摘要]
- **Super Battle Golf**：8 美元，9 天卖出 50 万份。[一手·摘要]
- 他在 newsletter 里也提到过 Roblox 上的 Plants Vs. Brainrots，形容为「Grow A Garden 加 Plants Vs. Zombies 再加融合机制」。说明他开始关注 UGC 平台，不再只看 Steam。[二手·搜索摘要]

## 7. 批评与局限

1. **只看付费 PC 和主机**：他明确说不太管 F2P 和移动端，网页游戏门户（Poki、CrazyGames）几乎不在他的数据范围里。本次搜索没有找到他对网页门户的系统分析。[一手·摘要 + 检索结果为空]
2. **数据口径在变，结论相互矛盾**：同一家机构，2023 年说中位数 0.2，2024 年说 10.5%，2025 年说 0.15x。样本门槛（≥5k 还是 ≥25k WL）、时间窗和是否含 NSFW 都不一样。**保留矛盾，不调和**。
3. **估算模型本身有误差**：评测倍数可以在 20x 到 60x 之间浮动，对单款游戏的估算误差可能到 3 倍左右。[二手，推导]
4. **付费墙和私有数据**：大量结论依赖付费产品和开发者私下提交的数据，外部无法复核。[推测]
5. **幸存者偏差**：newsletter 的叙事大多围绕「top 20」「surprise hits」展开，读者容易把爆款的特征当成普遍规律。[推测]
6. **描述多，处方少**：他擅长告诉你市场是什么样，但给单个开发者的可执行战术比 Zukowski 少。[推测]

## 8. 与其他流派的分歧

- **和 Zukowski**：
  - 转化率：Zukowski 说 15–20%，Carless 在 2024–2025 年给出 10–15%。
  - 视角：Zukowski 是战术手册，Carless 是市场分析；Zukowski 强调「讨好 Steam 算法」，Carless 更强调供需和类型天花板。[推测]
- **和爆款派**：Carless 用数据证明，friendslop 爆款的销量不依赖发售前的 wishlist（Peak 29x），这一点削弱了「先攒 7,000 wishlist」的普遍性。不过他给出的解释是「audience format 押注」，并不认为这是靠运气。
- **和 F2P/网页派**：他的框架里基本没有 CPI、LTV、留存曲线这些 F2P 核心指标。

## 9. 对 GROW EVERYTHING 的适用性（全部为推断 [推测]）

1. **Audience format 这个视角最有用**：
   - GROW EVERYTHING 是「四人一起吞城市 + 搞笑音效」，天然是 friendslop 那种「一起胡闹的主题加形式」。
   - 设计上应该优先保证：四人同屏的混乱感、容易被切成片段的高光时刻（一口吞掉地标、集体打嗝），以及开一局的门槛足够低。
   - 这正好对应他提的 sessionability：一局 3–5 分钟、随时能结束、每局都有截图时刻，对网页门户和短视频传播都更友好。
2. **数据习惯可以借用**：
   - 在网页端建类似的漏斗：门户曝光 → 点击 → 首局完成 → 次日回访 → 付费或看激励广告。
   - 把「wishlist 转化」换成「门户 CTR / D1 留存」来当验证指标。
3. **进 Steam 前先估市场**：
   - 用评测倍数估算同类作品（.io 吞噬、co-op friendslop）的真实销量，决定要不要上 Steam、定什么价。
   - 参考 Super Battle Golf 和 Peak 这类 8 美元档作品：低价加多人，转化倍数高。
4. **不适用的部分**：
   - 他的数据不覆盖 CrazyGames/Poki，网页阶段的决策需要别的信源，比如门户的开发者文档和收入分成数据。
   - 另外，他的数据都来自付费游戏；GROW EVERYTHING 是免费游戏加内购，Steam 版要想清楚是 F2P 还是付费。这个选择会直接改变能用他哪部分框架。
