# 分平台谈判方案

> 授权与合同岗维护，方法来自 `game-platform-bd-framework`（共识 3、4，分歧 1、2，决策表，合同底线）。
> 数字都来自 `game-platform-bd-framework/references/research/01–03`（2026-09-24，**只看到搜索摘要**），对外引用前要到官方页面或合同里核对。
> 下面的开价和底线都是**推断**，需要用户确认后才能使用；每次谈之前按实际情况更新。

## 总原则

1. **先增加买家，再谈条款。** 自助平台同时上；需要人工挑选的门户同时询价，设一个**真实的**截止日：2026-10-31 之前定下所有站点独占或赞助。
2. **广告分成让对方先报**（它掌握基准），**授权费和独占期由我们给出方案**（我们有依据）。报价用精确数字，并写明理由。
3. **最多给 3 个等值方案**（MESO）。
4. **联机服务器由我们付钱**，所以一次性费用必须配上流量上限、服务器补贴，或者改成分成。
5. **走开线提前写好**，通话中不临时让步；不合适就说「现在还不行，等我们有 CrazyGames 的数据再谈」（reset no）。

## 分平台

### Armor Games（邮件；Gmail 草稿已写好）
- 对方能给：限时站点独占（官方称是报酬最高的方式之一）、冠名、首页推荐 ★01 §10
- 我们问：「What arrangement would make sense for you — a sponsorship, a timed site-exclusive, or a non-exclusive listing?」（让对方先开价）
- 对方开价后，我们用 3 个等值方案回复（推断，金额等对方开价后再定）：
  - A：非独占上架 + 分成（按对方条款）
  - B：短期站点独占（≤ 60 天）+ 一次性赞助费 + 首页推荐
  - C：冠名版本（加载页放 Armor 标志，只在 Armor 站内）+ 赞助费，不独占
- 走开线：独占 > 90 天；一次性费用却不设流量上限；要求转让 IP 或源码

### MSN Games（邮件；Gmail 草稿已写好）
- 对方公开信息很少（广告分成计划是 2007 年公布的）★01 §16
- 我们问：他们需要什么样的构建包和广告 SDK，以及现行条款；不主动报价
- 走开线：要求独占而且没有推广承诺

### CrazyGames（门户自助）
- 标准条款，新开发者几乎谈不动比例；Basic Launch 期间没有广告收入 ★01 §2
- **注意**：官方开发者条款（2025-08-18 版）的摘要写着 Full Launch 后游戏要在 CrazyGames 上「独占 2 个月」，范围只限浏览器网站（★03 A5，只读到摘要）。注册时先读条款 PDF 原文；如果属实，其他网页平台的上线顺序要围绕这 2 个月来排
- 能谈的：据称「2 个月独占换 +50% 分成」（**未核实**）★01 §2；进入多人专区；Full Launch 后的推荐位
- 做法：先上线拿数据；到 Full Launch 时，在门户里问客户经理这两件事
- 走开线：2 个月以上的独占（和多平台路线冲突）

### GameDistribution、GamePix、Playgama、GameMonetize、Yandex、Y8（门户自助）
- 标准分成：GD 约 33%（第三方说法）、GamePix 45%、Playgama 70%→90%（在它的分发网络上）、GameMonetize 45% 以上、Yandex 50%（扣税费后）、Y8 50% ★01 §0
- 能谈的：几乎没有；做法是比较后选择。**注意**：GD、GamePix（勾选分发时）、Playgama 会把游戏分发到大量第三方网站，联机服务器的负载会随之上升
- 推断：先上 GD（SDK 已接好）看服务器负载，再决定要不要加 Playgama

### Poki（已选多平台）
- 只询问一次性非独占授权费（没有分成，金额不公开）★01 §1
- 走开线（推断）：我们的服务器费用随 Poki 带来的流量增长，所以一次性费用必须配上流量上限，或者改为按月续费；否则不接

### Addicting Games（开发者中心上传表单）
- 官方说「为独占游戏付高价」，提供授权、赞助、开发合作 ★01 §17
- 做法：和 Armor Games 同期询价（同样用 10 月底截止日），方案同 Armor

## 通话脚本（英文，按需要取用）

- 开场（先约流程）：「Could we agree on the steps first — you look at the build, we share the numbers, then we talk terms — and pick a date to decide?」
- 指控审计：「You probably see dozens of .io games a month, and we're a small team without a track record on your site.」然后马上接证据（试玩链接、数据）
- 校准式提问：「What would need to be true for a higher share on traffic we bring ourselves?」
- 暂时不接：「That doesn't work for us yet — let us come back once we have our first portal numbers.」
