# 各平台生成式 AI 政策调研（GROW EVERYTHING）

> 调研日期：**2026-10-25** · 负责人：平台发行 BD · 触发事件：Armor Games 拒稿（"we cannot consider games made with generative AI for the assets."）
>
> **取证方式（重要）**：本环境的代理拒绝直接访问各平台官网（sdk.poki.com、itch.io、partner.steamgames.com、newgrounds.com、docs.crazygames.com 均 `connect_rejected`），以下引文全部来自**搜索引擎对官方页面的摘录**，没有逐字核对原页。标注「官方摘录」= 搜索结果指向官方域名；「二手」= 第三方网站/媒体转述。正式提交前请在浏览器里打开原链接再核一遍措辞。官方页面大多没有标日期，写作「无日期，2026-10-25 检索」。

## 我们要披露的事实（统一口径）

| 项 | 实情 | 属于哪类 |
| --- | --- | --- |
| 代码 | 用 AI 编码助手（Claude）编写，开发者审阅 | AI 辅助代码 |
| 3D 模型 | 代码生成的程序化几何体，**没有**用 image-to-3D / text-to-3D | 不是生成式 AI 资产（但代码本身是 AI 写的，个别平台可能这样理解） |
| 音乐 | 城市主题曲 + 胜利 jingle 用 **Suno** 生成 | **生成式 AI 音频资产**（玩家直接听到） |
| 音效 | 浏览器内实时合成 | 非 AI |
| 图片/贴图 | 无 AI 生成图片或贴图 | 非 AI |

结论：我们唯一明确的「生成式 AI 资产」是 **Suno 音乐**；AI 写代码在多数平台不算资产。

## 汇总表

| 平台 | 立场 | AI 音乐 / AI 代码是否特别对待 | 要求的披露/标签 | 我们的动作 |
| --- | --- | --- | --- | --- |
| **Armor Games** | **禁止（资产）**——依据是我们收到的拒稿邮件；公开政策页**未查到** | 邮件说的是 "for the assets"，Suno 音乐就是资产；代码是否算未说明 | — | 换掉 Suno 后可回信请求重新评估（不保证） |
| **CrazyGames** | **未写明规则**（官方 FAQ 反而把 AI 写代码/做美术音效当作建游戏的方法） | 未区分 | 无 | 照常推进，无需改动 |
| **Playgama** | **允许**，但不能「完全/主要靠生成式 AI 且没有新价值」 | 未区分 | 无专门披露字段 | 照常推进（沙盒已上线） |
| **itch.io** | **允许 + 披露**（Generative AI disclosure 字段；资产包强制，游戏页鼓励） | 字段可勾 Graphics / Sound / Text & Dialog / Code | 选 Yes → 自动打 "AI Generated" 标签及分类子标签 | 发布时选 Yes，勾 **Sound**；Code 建议也勾（诚实口径）；换掉 Suno 后可只勾 Code |
| **Newgrounds** | **不明确 / 高风险**：美术区禁止 AI；「用 AI 提示词生成的游戏」不收（二手）；音频规则**未查到**；社区可举报「AI slop」 | 音乐规则未查到；代码未提 | 美术里少量 AI 元素须注明（二手） | **换掉 Suno 后再上**；否则在描述里如实注明并做好被举报准备 |
| **Poki** | **允许，有条件**：AI 内容要增加价值；「完全由 AI 做的游戏」有 IP 归属风险；须能按要求说明工具和流程 | 未专门提音乐；IP 归属担忧会落到 Suno 音乐上 | 无字段；**被问时**提供工具、流程、提示词与迭代说明 | 准备一页「AI 使用说明」；保留 Suno 付费订阅证明；换掉音乐更稳 |
| **GameDistribution** | **允许**；只管深度伪造（deep fake） | 未区分 | 只有 deep fake 内容须标注 | 无需动作（我们没有深度伪造） |
| **Y8** | **允许**：有权利、且达到质量和内容标准即可用 AI 工具 | 未区分；关键是「有权利」 | 未查到披露要求 | 确认 Suno 曲目是在付费期间生成（有商用权） |
| **GamePix** | **未查到**（官方提交指南只有技术要求） | 未查到 | 未查到 | 照常推进；如被问按统一口径说明 |
| **Steam** | **允许 + 披露**（Content Survey 的 AI 段） | **Suno 音乐须披露**（预生成、玩家可感知）；AI 编码助手属「效率工具」，2026-01 起不需披露 | Content Survey → AI 生成内容（Pre-Generated）；商店页会显示 AI 披露 | 在 Content Survey 填：音乐由 Suno 生成；不写代码 |
| **YouTube Playables** | **未查到 AI 专门规则**；要求内容原创/已授权（含音乐权利，二手） | 音乐须有权利 | 未查到 | 照常推进；保留 Suno 商用授权证明 |
| **Addicting Games** | **未查到** | 未查到 | 未查到 | 联系时按统一口径如实说明 |
| **Kongregate** | **允许 + 披露**（须在玩家可见的游戏描述里说明用了 AI、怎么用的） | 未区分，全部 AI 使用都要写 | 游戏描述里写 AI 使用声明；缺 AI 声明会被视为「未准备好上传」 | 在描述末尾加 AI 使用声明（模板见下文） |

## 建议

**可以继续推（不需要改动）**：CrazyGames、Playgama、GameDistribution、Y8、GamePix、YouTube Playables。这些平台要么没写 AI 规则，要么只管深度伪造或权利问题。前提是 **Suno 曲目都在 Pro/Premier 付费期间生成**（`docs/business/launch-checklist.md` 第 7 条），因为 Y8、YouTube Playables 和 Poki 都看「是否拥有权利」。

**需要加披露**：
- **itch.io**：Generative AI disclosure 选 Yes，勾 Sound（+ Code）。
- **Steam**：Content Survey 写 Suno 音乐（代码不用写）。
- **Kongregate**：游戏描述里加 AI 声明。
- **Poki**：不用主动填，但提前写好 AI 使用说明，被问时直接给。

**换掉 Suno 音乐（改用 CC0 或已授权的曲目）能解决什么**：
- **Armor Games**：拒稿理由是「资产用了生成式 AI」，我们的资产里只有音乐是 AI 生成的。换掉后有理由回信请对方重新评估。但对方可能把「AI 写的代码生成的模型」也算进去，所以只能说有机会，不能保证。
- **Newgrounds**：去掉最容易被社区举报的部分；剩下的只有 AI 写代码，现有规则里没查到对此的限制。
- **Steam / itch.io**：不再需要 AI 内容披露和 "AI Generated Sounds" 标签（itch 如勾 Code 仍会带 AI 标签）；Steam 商店页不出现 AI 披露。
- **Poki**：消除 IP 归属的主要疑点。
- 其他平台本来就不受影响。

**结论**：换音乐的成本不高（两三首主题曲加一段 jingle），却能同时降低 Armor Games、Newgrounds、Steam、itch.io 和 Poki 的风险。**建议在提交 Steam / Newgrounds 前换掉**；换之前先按上表披露，不要停下正在推进的平台。换曲时注意 CC-BY 需要署名，CC0 不需要，每首都要记下来源和许可证。

---

## 各平台详情与来源

### Armor Games
1. 立场：**禁止生成式 AI 资产**（依据：我们收到的拒稿邮件原文 "we cannot consider games made with generative AI for the assets."）。公开开发者页面（developers.armorgames.com）上的 AI 政策：**未查到**。
2. 音乐 / 代码：邮件只说 "assets"。Suno 音乐属于资产；AI 写代码是否算没有说明。
3. 披露：不适用。
4. 来源：拒稿邮件（本项目收件，2026-10）；多次搜索 "Armor Games generative AI policy" 均无官方页面结果。
5. 动作：换掉 Suno 后，回信说明「音乐已替换为非 AI 曲目（列出来源和许可证），模型是程序化几何体，没有用 AI 生成图片或 3D」，询问能否重新评估。

### CrazyGames
1. 立场：**未写明规则**。
2. 音乐 / 代码：官方 FAQ 把 AI 当作建游戏的工具，列出 "generating code snippets or even entire game mechanics" 和 "creating art and sound"（官方摘录，docs.crazygames.com/faq/）。初审会拒绝 "unoriginal content (e.g. clones or asset flips)"。
3. 披露：无（二手：portalready.world 称截至 2026-09-30，"the requirements, FAQ, and Terms contain no rule about AI-generated code or assets"）。
4. 来源：https://docs.crazygames.com/faq/ （官方摘录，无日期，2026-10-25 检索）；https://portalready.world/portals/crazygames/ （二手，2026-09-30）；https://playgama.com/blog/business-faqs/what-is-the-crazygames-policy-on-publishing-ai-generated-gam/ （二手，Playgama 博客）。
5. 动作：照常推进，不需要披露。

### Playgama（playgama.ai / Playgama Bridge）
1. 立场：**允许**。平台主动面向 AI 做的游戏（可以用 Claude Code / Codex 通过 MCP 直接发布），但不能完全/主要靠生成式 AI。
2. 音乐 / 代码：未区分。
3. 披露：无专门字段（我们建档时填过 "AI agent：Claude Code"，见 `playgama.md`）。
4. 引文（官方摘录，wiki.playgama.com）：Content Requirements 页称游戏可以用 AI 资产，但平台会拒绝 "low-quality titles built wholly with generative AI that add nothing fresh to the player experience"；Platform-Specific Requirements 页称游戏不应是 "a title built primarily or entirely with generative AI that adds no meaningful value to the player experience"。
   来源：https://wiki.playgama.com/playgama/game-requirements/content-requirements 、https://wiki.playgama.com/playgama/game-requirements/platform-specific-requirements （无日期，2026-10-25 检索）；https://playgama.com/blog/main/built-a-game-with-ai-get-your-first-players-and-ad-revenue-with-playgama-mcp/ （官方博客）。
   注意：Playgama 会把游戏分发到下游平台，下游平台（如 Poki 风格的门户）规则可能更严。
5. 动作：照常推进。

### itch.io
1. 立场：**允许 + 披露**。资产包强制；游戏页可填，搜索结果没显示对游戏强制。
2. 音乐 / 代码：披露字段专门区分 Graphics、Sound、Text & Dialog、Code。
3. 披露：项目编辑页的 "Generative AI disclosure"。选 Yes 自动加 "AI Generated" 标签和分类子标签（如 "AI Generated Sounds"）；选 No 加 "No AI" 标签。
4. 引文（二手，媒体转述 itch.io 官方公告，2024-11）："Selecting Yes will give your project an 'AI Generated' tag, while selecting No will give it a 'No AI' tag."；资产包："Assets comprised of generative AI (even if modified afterwards) that are not tagged will no longer be eligible for indexing on our browse pages."
   来源：https://www.gamespot.com/articles/itch-io-now-requires-creators-to-disclose-ai-generated-content/1100-6527920/ （2024-11）；https://www.pcgamer.com/software/platforms/indie-distribution-platform-itch-io-now-requires-asset-creators-to-disclose-the-use-of-generative-ai-in-their-work/ （2024-11）；官方指南 https://itch.io/docs/creators/quality-guidelines （无法直接打开，需人工核对）。2025–2026 年没查到改动。
5. 动作：选 Yes，勾 **Sound**（Suno）。Code 是 Claude 写的，建议也勾，免得被举报不诚实。注意部分玩家会按 "No AI" 筛选。换掉 Suno 后只勾 Code。

### Newgrounds
1. 立场：**不明确 / 高风险**。
   - 美术区（Art Portal）：禁止 AI 生成的美术（二手，多来源一致）。
   - 游戏：二手称 "games generated from an AI prompt are not allowed"；游戏须为上传者本人作品。没查到针对「AI 辅助代码 + 人工设计」的条款。
   - 音频区：**未查到** AI 音乐规则。
   - 2024-03 起可把作品举报为 "AI slop"（二手）。
2. 音乐 / 代码：未查到专门条款。社区反 AI 情绪强，Suno 音乐是最容易被举报的部分。
3. 披露：二手称美术中少量 AI 元素（如背景）须注明。
4. 引文（二手）：Art Guidelines "AI-generated art is not allowed in the Art Portal. This includes using tools such as Midjourney, Dall-E, and CrAIyon…"；游戏规则 "you must be the creator and owner of the game you are submitting"。
   来源：https://veilwrightstudio.com/journal/does-newgrounds-allow-nsfw/ （二手）；https://brushwarriors.com/art-websites-that-ban-ai/ （二手）；https://pie.gravitywell.xyz/c/morewrite/p/1032/a-mini-essay-on-newgrounds-resistance-to-ai-slop （二手，2026）；官方 wiki https://www.newgrounds.com/wiki/help-information （无法直接打开）。
5. 动作：**换掉 Suno 后再提交**。如果必须先上，在描述里如实写「音乐由 AI 生成，代码借助 AI 助手编写；模型和音效全部程序生成」。

### Poki
1. 立场：**允许，有条件**。
2. 音乐 / 代码：没专门提。重点是「增加价值」和「IP 归属」；Suno 音乐的版权状态正是 IP 疑点（Suno 在德国被 GEMA 诉讼判侵权，二手）。
3. 披露：无表单字段；**被问时**要能提供工具、流程、提示词和迭代说明。
4. 引文（官方摘录，sdk.poki.com/working-with-ai）："we encourage creative experimentation — and that includes thoughtful use of AI tools"；"AI-generated content must add value rather than replace craft, quality, or originality"；"games (solely) created with the use of AI could create IP ownership issues for Poki"；开发者应能 "demonstrate how and which tools were used and provide an overview of the process upon request"；另有 "no AI watermarks or prompt text" 可见。
   来源：https://sdk.poki.com/working-with-ai （无日期，2026-10-25 检索）；https://sdk.poki.com/poki-quality-guidelines 。
5. 动作：写一页 AI 使用说明（工具清单：Claude 写代码、Suno 生成音乐；模型与音效全部程序生成；人工审阅流程）；保留 Suno 付费订阅凭证；最好在提交 Web Fit Test 前换掉音乐。

### GameDistribution
1. 立场：**允许**；只规定了深度伪造。
2. 音乐 / 代码：未区分。
3. 披露：只有 deep fake 内容须标注。
4. 引文（官方摘录，开发者条款 2.6.11）：开发者须 "clearly disclose AI-created or manipulated content if it is a deep fake"，deep fake 定义为 "AI-generated or manipulated image, audio or video content that resembles existing persons, objects, places, entities or events and would falsely appear to a person to be authentic or truthful"。开发者指南 1.5 节内容相同。
   来源：https://static.gamedistribution.com/terms/developer.html 、https://static.gamedistribution.com/developer/developers-guidelines.html （无日期，2026-10-25 检索）；https://portalready.world/portals/gamedistribution/ （二手）。
5. 动作：无需动作。我们的城市地标是卡通化程序模型，不属于 deep fake。

### Y8
1. 立场：**允许**（有权利 + 达到质量和内容标准）。
2. 音乐 / 代码：未区分；关键是拥有权利。
3. 披露：**未查到**。
4. 引文（官方摘录，developer.y8.com FAQ）：可以用 AI 工具，前提是 "you have the required rights and the final game meets Y8's quality and content rules"；上传页："only upload games/videos/animations that you made, are sponsored by you, or you have the distribution rights over them"。
   来源：https://developer.y8.com/ 、https://www.y8.com/upload （无日期，2026-10-25 检索）。
5. 动作：确认每首 Suno 曲目都在付费期间生成；照常推进。

### GamePix
1. 立场：**未查到**。官方提交指南只有技术要求（音频自动暂停、加载画面、640x480 iframe 测试等），摘录中没有 AI 段落。
2. 音乐 / 代码：未查到。
3. 披露：未查到。
4. 来源：https://partners.gamepix.com/guidelines/submission （官方摘录，无日期）。另有第三方 GitHub 工具称其会在提交时拦截 "assets_ai_generated"，那只是该工具自己的检查，**不是** GamePix 官方规则：https://github.com/dannyking6/gamepix-publish （二手）。
5. 动作：照常推进；如被问按统一口径说明。

### Steam
1. 立场：**允许 + 披露**（Content Survey 的 AI 生成内容段）。
2. 音乐 / 代码：**Suno 音乐须披露**，因为它是随游戏发布、玩家直接听到的预生成内容。2026-01 改版后，AI 编码助手这类「效率工具」**不需要披露**。
3. 披露：Steamworks → Content Survey → AI Generated Content → Pre-Generated（描述用途）。本作没有运行时 AI 生成内容（Live-Generated 不用勾）。披露内容会显示在商店页。
4. 引文（官方摘录，Content Survey 文档）："efficiency gains from AI-powered development tools is not the focus of this section"；本段关注 "the use of AI in creating content that ships with your game, and is consumed by players"。PC Gamer 2026-01-16 报道了这次改版。
   来源：https://partner.steamgames.com/doc/gettingstarted/contentsurvey （无日期，2026-10-25 检索）；https://www.pcgamer.com/software/ai/steam-updates-ai-disclosure-form-to-specify-that-its-focused-on-ai-generated-content-that-is-consumed-by-players-not-efficiency-tools-used-behind-the-scenes/ （二手，2026-01-16）。
5. 动作：Content Survey 的 Pre-Generated 填 "The city theme music and victory jingle were generated with Suno. All 3D models are procedural geometry built in code, sound effects are synthesized at runtime, and no AI-generated images or textures are used."；不写代码。换掉 Suno 后可取消披露。

### YouTube Playables
1. 立场：**未查到 AI 专门规则**。
2. 音乐 / 代码：二手称 Trust & Safety 要求内容原创或已授权，包括音乐权利。
3. 披露：未查到。YouTube 的 GenAI 披露规则针对视频上传，二手称 Playables 文档没说适用于游戏。
4. 引文（二手，portalready.world）："the Playables requirements do not mention AI"。官方认证页：https://developers.google.com/youtube/gaming/playables/certification/requirements （摘录不完整）。
   来源：https://portalready.world/portals/youtube-playables/ （二手，2026）。
5. 动作：照常推进；保留 Suno 商用授权证明以应对音乐权利审核。

### Addicting Games
1. 立场：**未查到**（搜索结果里没有官方开发者条款或提交页）。
2. 音乐 / 代码：未查到。
3. 披露：未查到。
4. 来源：无。
5. 动作：联系时按统一口径如实说明；如对方有类似 Armor Games 的态度，再看换音乐后的版本。

### Kongregate
1. 立场：**允许 + 披露**。
2. 音乐 / 代码：未区分。所有 AI 使用都要写明用途；开发者对 AI 内容的合法性负责（不侵权、训练数据合法取得）。
3. 披露：玩家可见的游戏描述里写 AI 使用声明；提交清单把缺少 AI 声明列为不能上传的原因。
4. 引文（官方摘录，Kongregate 开发者帮助中心）："Kongregate require developers to declare use of AI and what it was used for in a game, as part of the game description that is shown to players"；另一 FAQ 措辞较软："does not mandate a specific disclosure… Kongregate does request that the player-facing game description includes a disclosure that AI has been used, and how it has been used"。
   来源：https://blog.kongregate.com/hc/en-us/articles/44273865068557-AI-Do-I-need-to-disclose-when-my-game-uses-AI-generated-content 、https://blog.kongregate.com/hc/en-us/articles/44202499794445-STANDARDS-Developer-Content-Standards 、https://blog.kongregate.com/hc/en-us/articles/44215514279693-SUBMISSION-Checklist-review-before-uploading-a-game （无日期，约 2026 年上半年发布，2026-10-25 检索）。
5. 动作：描述末尾加声明（见下）。

## 披露文案模板（EN，可直接用）

> **AI disclosure:** Code was written with the help of an AI coding assistant (Claude) and reviewed by the developer. The city theme music and victory jingle were generated with Suno. All 3D models are procedural geometry built in code (no image-to-3D or text-to-3D), sound effects are synthesized in the browser, and no AI-generated images or textures are used.

换掉 Suno 后删掉第二句，并在致谢里列出曲目来源和许可证。

## 待办

- [ ] 人工在浏览器里核对 Poki、itch.io、Steam、Newgrounds、Kongregate 原页措辞（本次只看到搜索摘录）。
- [ ] 确认所有 Suno 曲目都在 Pro/Premier 付费期间生成，截图存档。
- [ ] 决定是否替换 Suno（建议：Steam / Newgrounds 提交前替换），替换后回信 Armor Games。
- [ ] GamePix、Addicting Games、YouTube Playables：提交时直接问对方 AI 政策，并把回复补进本文件。

## 用户决定（2026-10-25）

- 保留 Suno 音乐，不做「无 AI 音乐」版本。理由：全部曲目在用户长期续费的 Suno 付费会员期间生成，商用版权归我们（见 `public/music/README.md`）。
- 版权和平台的 AI 政策是两回事：要求声明的平台照实声明（itch.io 勾 Sound 和 Code，Steam 问卷申报音乐，Kongregate 在介绍里写明）。
- 明确排斥 AI 素材的平台（Armor Games 已拒，Newgrounds 风险高）暂不投。
- 平台问到版权时，出示 Suno 付费会员的账单或订阅记录作为证明。
