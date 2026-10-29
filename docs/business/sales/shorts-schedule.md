# Shorts 发布排期（YouTube @groweverythinggame；TikTok 登录后同步）

> 发布时间：美东时间晚上 7:30（每天固定）。每条都是真实对局 + VoxCPM2 英文配音。视频文件在 `release/youtube-shorts/`。

> **2026-10-26 用户定调：这段时间全部推 Halloween Town。** 卖点：上头。前半场吃到最大、以为赢定了，后半场被打回原形、被反派追着锤；从要赢到被锤，几秒之内反转。每条都要有这个情绪落差。

| 日期 | 角度（真实对局里挑） | 标题方向 | 状态 |
| --- | --- | --- | --- |
| 10/26 周一 | 最小的活下来，最大的被电倒 | I was the smallest. The villains came for the biggest. 🎃 | 已做好：`v5-halloween-survive.mp4`，今天发 |
| 10/27 周二 | 吃掉对手 → 被三个反派追 → 最后 1 秒反派就在身后，活下来（真实一局，原计划的「0.5 秒被抓」没录到） | ONE second left. He was RIGHT behind me. 🎃 | 已做好：`v6-halloween-one-second.mp4` |
| 10/31 周六 万圣节 | 吃掉 5 个对手 → 419 吨全场第一 → 灯灭缩到 120 kg → 躲了快 3 分钟 → 反派两面夹击 → 0 kg 倒数第一（真实一局） | 419 tonnes → ZERO. Last place. 🎃 | 已做好：`v8-halloween-419-to-zero.mp4`（20 秒）——万圣节主推 |
| 11/1 周日（原 10/28 档） | 第一个被吃 → 复仇吃到 21.9 吨 → 灯灭全员缩小 → 两个反派贴身 → 活下来拿第 3（真实一局，没赢） | I got eaten FIRST. Then the villains came. 🎃 | 已做好：`v7-halloween-eaten-first.mp4`（21.7 秒） |
| 10/29 周四 | 「全是事故」合集：撞墙电晕、被吃、反派差一点扑到 | Everything went wrong. 🎃 | 录制中 |
| 10/30 周五 | 蛋之谷：按喇叭叫醒女孩，隐身躲过反派 | The secret that saved me in Halloween Town 🥚 | 选局中 |
| 10/31 周六 万圣节 | 本周数据最好的那条的「续集」或最强一局 | 按数据定 | 看前几条的完播率 |

巴黎（`v4-playtest-paris.mp4`）先不排，万圣节过后再发。

> **2026-10-29 用户补充：不一定要赢，要拍出所有有趣的事。** 被吃、被反派抓、自己冲刺撞墙被电晕、反派差一点扑到、反派抓走别人，都是素材；输的局一样能做成一条。录制改用 `tools/shorts/moments.mjs`：平时快进，一有危险（比你大的对手靠近、冲刺、反派 10 米内）自动切回实时，所以每个瞬间都能看清。录完用 `tools/shorts/find-moments.mjs <目录>` 列出这一局所有可剪的瞬间和帧号，再挑角度。

**每条标题和字幕的「上头」写法：** 前 1 秒抛出反差（「我是最大的」/「我是最小的」），中间不断加码（倒计时、反派越来越近），结尾给结局，然后问「Would you survive?」引导评论和点进去玩。
