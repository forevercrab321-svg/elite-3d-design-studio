# 中国平台 — TapTap / 4399 / 7k7k / 抖音小游戏 / 微信小游戏

> 调研日期：2026-09-24 · 负责人：平台发行 BD · 状态：**全部未开始**
>
> 取证方式：本环境屏蔽了这些域名，内容来自**官方域名页面的搜索引擎摘要**：developer.taptap.cn、open.4399.cn / www.4399.com、developer.open-douyin.com、developers.weixin.qq.com（微信开放社区；只采用标注「官方」的置顶帖和官方文档，普通用户提问帖只作线索并注明）。按要求**未使用知乎、公众号、百度百科**。
>
> **一句话结论**：国内平台都**不能在 7 天内上线**。微信/抖音小游戏需要主体认证、ICP 备案、软著、版号或小游戏备案，且运行环境没有浏览器 DOM，我们的 three.js 网页版要做移植；TapTap 的 H5 小游戏形式最接近我们，但无版号只能「开放试玩」、不能收费；4399 可以上传 H5，但分成和门槛未查到官方数字。

## 总览

| 平台 | 网页 three.js 能直接上吗 | 必需资质（查得到的） | 审核/办理时长 | 分成 | 7 天可行？ |
| --- | --- | --- | --- | --- | --- |
| TapTap | 有 **H5 小游戏** 形式 [T2]；具体接入要求未查到 | 正式上线/内购须 **版号**；无版号只能「开放试玩」；联网游戏测试需 ICP 备案（TapTap 可提供测试备案辅助证明）[T1] | 未查到 | 未查到 | ❌ |
| 4399 | 可上传 H5（活动页要求同时适配 PC 和手机）[F1][F2] | 须为原创或有授权；不得私加外链、广告、外部联系方式 [F1][F3] | 未查到 | 未查到 | ⚠️ 可先投，时长未知 |
| 7k7k | 未查到官方开发者/投稿入口 | 未查到 | 未查到 | 未查到 | ❌（入口未查到）|
| 抖音小游戏 | ❌ 不能直接上：运行环境**没有 BOM/window**，H5 迁移需自己做 window 兼容；官方推荐 WebGL 方案 [D5] | 主体认证 + 基础信息审核；**ICP 备案**；**版号**或（无版号时）**小游戏备案**；软著 [D1][D2][D3] | 未查到 | 广告：投广场景开发者得 **90%**；内购：所有场景至少 **60%** [D4] | ❌ |
| 微信小游戏 | ❌ 不能直接上：没有 window/document，需要 three.js 适配版 [W4]；主包 **≤4 MB**、整包 20 MB（开虚拟支付 30 MB）[W5] | 非个人主体：文化部备案信息、**软著**、游戏自审自查报告；带付费功能须 **版号** [W1] | 官方指南估算：不含虚拟支付 **13–37 个工作日** [W1] | 流量主广告分成见官方政策帖（摘要未显示比例）[W3] | ❌ |

---

## TapTap

1. **入口**：https://developer.taptap.cn/ ；小游戏文档 https://developer.taptap.cn/minigameapidoc/quick-start/guide/minigames-intro/ [T2]
2. **流程**：创建游戏、保存基础信息获得游戏 ID → 商店 → 商店资料 → 完善后提交审核；状态有「敬请期待」「预约」「正式上线（试玩版）」等 [T3]。审核时长：**未查到**。
3. **技术对照**
   - H5 小游戏形式：✅ 形式上匹配网页游戏；⚠️ 具体包体、SDK、联网要求**未查到**。
   - 版号：❌ 我们没有。无版号 → 只能「开放试玩」，**不得收费或内购** [T1]。我们的激励广告是否算收费：**不确定**，需问 TapTap。
   - ICP 备案：❌ 联网游戏需要；TapTap 可为测试游戏提供《测试游戏备案辅助证明》[T1]。
4. **分成**：**未查到**。
5. **流量**：官方称小游戏在首页算法推荐上比 APK 更有优势、iOS 端展示更多 [T2]；**无具体公开数据**。

## 4399

1. **入口**：游戏上传中心 https://www.4399.com/gameupload.htm （上传须知 https://www.4399.com/notice/upknow.htm）；4399 开放平台 https://open.4399.cn/console/ ；小游戏招募令 https://open.4399.cn/static/zhaomu/ [F1][F2]
2. **要求**：作品须原创或获得权利人合法授权、内容合法、无病毒后门 [F3]；招募活动要求 H5 且同时适配 PC 和移动端，**不得私自加入外部链接、广告和外部联系方式**（QQ 群、邮箱、网址等）[F1]。
   - 对照：✅ H5、PC+手机；❌ 我们的分享面板会打开外部网站、设置页链接我们自己的法律页面 → 4399 版本需要去掉（README 技术改动 C）；⚠️ Supabase 外部通讯是否算「外部通讯」**不确定**（条款原意指 QQ 群、邮箱等联系方式）。
3. **授权期**：招募令协议写明许可期 3 年，到期前一个月可通知终止，否则自动顺延 1 年 [F1]。
4. **分成**：4399 广告联盟有「小游戏广告分成让利政策」页面，但摘要**未显示比例**（https://union.4399.cn/message/notice/detail?id=20）。审核时长：**未查到**。
5. **流量**：**无公开数据**。

## 7k7k

- 只查到 7k7k 的游戏列表页，**未查到官方开发者平台或投稿入口**。下一步：用户在 https://www.7k7k.com/ 页脚找「联系我们 / 商务合作」，把联系方式补到本档案。

## 抖音小游戏

1. **入口**：https://developer.open-douyin.com/ （小游戏文档指引 https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/overview）
2. **资质**（官方）
   - 小游戏须完成**主体认证**和**基础信息**审核才能上线 [D1]。
   - 运营主体名须与平台主体一致；版号信息须与官方查询结果完全一致，且版号游戏类型须为移动端 [D1]。
   - 软著：支持电子版软著录入，须先取得国家版权局的软著登记证书 [D1]。
   - **所有小游戏都要 ICP 备案**；无版号的小游戏需做**小游戏备案**（已有版号的不用重复）[D2][D3]。
   - 个人主体最多可建 25 个小游戏 [D3]（来源为开放平台论坛帖，非正式文档）。
3. **技术**：运行环境**没有 BOM API 和 window 对象**，H5 迁移需开发者自行做 window 兼容；官方推荐 WebGL 方案 [D5]。three.js 真机支持情况：开放平台论坛有旧帖（2021）反馈 IDE 正常、真机失败，**现状不确定** [D6]。→ 需要把 DOM UI（HUD、面板、商店）改成 canvas 或官方适配方案，工作量大。
4. **分成**：广告——投广场景（微端广告、直投广告）开发者得 **90%** 现金收益；内购——所有场景开发者至少得 **60%**；结算为半月结或日结；企业开发者须开增值税专用发票 [D4]。
5. **流量**：**无公开数据**。

## 微信小游戏

1. **入口**：https://mp.weixin.qq.com/ 注册小游戏账号；开发文档 https://developers.weixin.qq.com/minigame/dev/guide/
2. **资质**（微信开放社区官方置顶帖）
   - 非个人主体发布需：**文化部备案信息**、**计算机软件著作权登记证书**、**游戏自审自查报告**；棋牌类或带付费功能须另交**版号批文** [W1]。
   - 开通虚拟支付：个体工商户或已认证企业主体 + 接入实名认证系统 + 版号/软著审核通过 [W1]。
   - 资质名称须与小游戏名称一致 [W2]。
   - 官方估算：不含虚拟支付 **7 步、13–37 个工作日** [W1]。
3. **广告（流量主）**：开通条件——累计独立访客 **≥ 1000**、无违规（来源为开放社区问答，非正式文档）[W6]；分成比例见官方政策帖，本次摘要**未显示具体比例** [W3]。
4. **技术**：没有 window/document 等浏览器环境，three.js 需用移植版 [W4]；只有一个 canvas，UI 要画在 canvas 上 [W4]（社区帖）；主包/单个分包 **≤ 4 MB**，整包 20 MB（开通虚拟支付 30 MB）[W5]。→ 我们的 1.3 MB JS 可以进主包，但 DOM UI 全部要重做。
5. **流量**：**无公开数据**。

## MEDDIC（国内合并一张）

| 维度 | 本交易 |
| --- | --- |
| **Metrics** | 小游戏：主体认证/备案/审核通过；上线后 DAU、广告 eCPM；TapTap：预约数、试玩评分 |
| **Economic buyer** | 平台审核团队 + **监管资质**（版号、ICP 备案、软著）——真正的「决策人」是资质流程 |
| **Decision criteria** | 资质齐全、内容合规、名称与资质一致 [W1][W2][D1] |
| **Decision process** | 注册主体 → 软著（前置）→ ICP 备案 → 版号或小游戏备案 → 技术移植 → 提审 |
| **Identify pain** | 平台需要合规且适合短视频传播的小游戏；我们的「吞地标」「四人互吃」素材适合抖音 |
| **Champion** | 暂无；建议以后找有版号的国内发行商代理 |

## 提交文案（中文为主，附英文）

- **标题**：GROW EVERYTHING（国内平台建议中文名另定，并**与软著名称一致**——微信、抖音都要求名称与资质一致 [W2][D1]）
- **短描述（≤150 字符）**：`吃掉比你小的一切，越吃越大，最后吞掉整座城市！最多 4 人联机，好友没到齐就由 AI 补位。` / EN `Eat anything smaller than you, grow, and swallow a whole city. 4-player online rooms with friends, AI fills empty seats.`
- **长描述**：驾驶一台大眼珠小机器，在上海、纽约、巴黎吃掉比你小的一切——垃圾桶、汽车、公交车、楼房——直到吞下东方明珠、帝国大厦、埃菲尔铁塔。最多 4 人同城，大吃小，追逐随时反转；一个链接拉好友，空位 AI 补上。每局最长 5 分钟，每人 3 条命。四种机器任选，外观只好看不变强。 / EN: same as `crazygames.md`.
- **玩法说明**：吃比你小的东西长大；小对手也能吃，大对手会吃你。冲刺撞上吃不动的东西会眩晕掉质量。长到够大就能推倒地标。
- **操作说明**：电脑：WASD 移动 · 鼠标转视角 · 空格冲刺 · 1–6 表情 · H 喇叭 · M 静音。手机横屏：左侧拖动移动，右下角冲刺。
- **标签**：休闲、多人、3D、吞噬、城市、破坏、搞笑、io

## 下一步（用户操作）

1. **7 天冲刺不做国内平台**。国内用户先用 https://grow-everything.vercel.app/game/ 直接玩 + 抖音/小红书短视频引流（注意：vercel.app 在国内的访问情况未验证）。
2. 如果要做国内长期：先申请**软著**（中国版权保护中心，所有平台的前置条件），同时决定用企业还是个体工商户主体。
3. 4399：打开 https://www.4399.com/gameupload.htm → 阅读上传须知 → 注册 4399 账号上传一个去掉外链的 H5 版本（需要工程出「4399 构建」）。
4. 7k7k：在官网页脚找商务联系方式，补进本档案。

## 来源

- [T1] https://developer.taptap.cn/docs/en/store/standardies-operation/ （TapTap 开发者快速入门：版号、试玩、ICP 备案）
- [T2] https://developer.taptap.cn/minigameapidoc/quick-start/guide/minigames-intro/
- [T3] https://developer.taptap.cn/minigameapidoc/quick-start/guide/creation-improvement/ ； https://developer.taptap.cn/docs/en/store/release/publish/create-game/
- [F1] https://open.4399.cn/static/zhaomu/
- [F2] https://www.4399.com/gameupload.htm ； https://open.4399.cn/docs/
- [F3] https://www.4399.com/notice/upknow.htm
- [D1] https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/norms/credential-norms-for-mini-game
- [D2] https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/icp-filings
- [D3] https://developer.open-douyin.com/forum/share/post/647461cda2c591e9aa1ee8f4 （开放平台「小游戏运营类 FAQ」帖）
- [D4] https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/revenue/sharingclause/mini-game ； https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/revenue/sharingclause/pay
- [D5] https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/game-engine/rd-to-SCgame/open-capacity/sc_webgl_overall ； https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/dev-guide/bytedance-mini-game
- [D6] https://developer.open-douyin.com/forum/synthesize/post/600a0931f697ae480b41fe5c （论坛旧帖，仅作线索）
- [W1] https://developers.weixin.qq.com/community/minigame/doc/0002a41828cf9075a2ff631be56c08 （官方置顶「小游戏入驻指南」）
- [W2] https://developers.weixin.qq.com/community/minigame/doc/00008a044985c8d7e1c8ef1035b411 （官方：游戏名称与资质名称需保持一致）
- [W3] https://developers.weixin.qq.com/community/minigame/doc/000ecec6754138a7c2223911d66801 （官方：流量主广告变现分成政策 2024.10 更新）
- [W4] https://developers.weixin.qq.com/community/develop/doc/5c3b5992a9bd226c968a4840975d119b ； https://developers.weixin.qq.com/community/develop/doc/0002ac48b28fa019da2061efb66c00 （社区问答，作线索）
- [W5] https://developers.weixin.qq.com/community/minigame/doc/00088e009103508f3270aaf9c61001 （官方置顶：小游戏代码包大小限制调整）
- [W6] https://developers.weixin.qq.com/community/develop/doc/0008261aa20a680d5321e9cca6ac00 （社区问答，非正式文档）
