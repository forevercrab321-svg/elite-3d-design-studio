# GROW EVERYTHING — Roblox 版

在 Roblox 上做的"越吃越大"版本：程序生成的城市，从吃易拉罐开始，长大后吃汽车、公交车、整栋楼，最后吃掉城市中心的地标。大的玩家可以吃掉小的玩家。每局 5 分钟，结束时体型最大的人获胜。

## 现状（2026-10-23，v0.1）

- 代码：`src/`（Rojo 项目）。所有数值都在 `src/shared/Config.luau` 里。
- 可以直接打开的文件：`build/GrowEverything.rbxlx`（由 `rojo build` 生成）。
- 已验证：语法编译通过；用 Roblox API 类型定义做了类型检查（luau-lsp analyze），0 错误。
- **未验证**：还没在 Roblox Studio 里真正跑过。成长速度、道具数量、碰撞手感都要在 Studio 里试玩后再调。

| 文件 | 作用 |
| --- | --- |
| `src/shared/Config.luau` | 回合时长、成长曲线、吃东西的判定、城市大小、道具清单、游戏通行证 ID |
| `src/server/City.luau` | 生成城市：道路、人行道、道具、车辆、建筑、中心地标 |
| `src/server/Main.server.luau` | 回合流程、吃东西、长大、玩家互吃、排行榜、外观通行证 |
| `src/client/Hud.client.luau` | 界面：倒计时、体型、吃到东西的提示和特效 |

## 已发布（2026-10-23）

- 游戏：GROW EVERYTHING，Universe ID `10772505605`，Start Place ID `130986109157079`，目前 **Private**。
- 第一次从 Studio 发布（Roblox 规定新游戏只能从 Studio 创建）。之后的更新用 Open Cloud 密钥自动发布：
  - 密钥 grow-publish：只有这个游戏的 universe-places write 权限，2026-11-22 到期（60 天不用也会失效）。保存在用户 Mac 的 `~/.roblox-grow-key`，不进仓库、不进聊天。
  - 发布命令（在用户 Mac 终端）：`curl -fsSL https://raw.githubusercontent.com/forevercrab321-svg/elite-3d-design-studio/claude/gifted-goldberg-mz9n2p/roblox/publish.sh | bash`
  - 流程：改 `src/` → `rojo build default.project.json -o build/GrowEverything.rbxlx` → 推送 → 用户跑上面那行。

## 第一次在 Studio 发布的步骤（已完成，留作记录）

1. 注册或登录 https://www.roblox.com ，下载安装 Roblox Studio（https://create.roblox.com ）。
2. 下载 `build/GrowEverything.rbxlx`，用 Roblox Studio 打开。
3. 点顶部的 **Play**，试玩一局，确认能动、能吃东西、能长大。
4. **File → Publish to Roblox**，起名 GROW EVERYTHING，选择公开。
5. 在 Creator Hub（https://create.roblox.com/dashboard/creations ）里打开这个游戏：
   - 填简介、上传图标和缩略图；
   - 年龄问卷（Experience Questionnaire）如实填写；
   - 公开（Public）。

改代码后：用最新的 `GrowEverything.rbxlx` 再打开一次，然后 Publish 覆盖。

## 赚钱方式

- **Premium Payouts**：Roblox 按 Premium 会员在游戏里的游玩时长自动付钱，不用设置。
- **游戏通行证（只卖外观）**：在 Creator Hub → Monetization → Passes 新建一个 "VIP Trail"，把 ID 填进 `Config.GAMEPASS_VIP_TRAIL`。原则不变：不卖变强。
- **和博主五五分**：把游戏放在一个 Roblox 群组（Group）名下，用群组的 **Recurring Payouts（定期按比例分成）** 每月自动把收入的 50% 分给合作博主。分成协议另签，写清期限和比例。

## 下一步

1. 在 Studio 里试玩，调成长速度和道具数量。
2. 加入我们自己的特色：上海、纽约、巴黎地标，万圣节小镇和 BOSS，大眼珠机器的外观。
3. 加外观商店和通行证；加每日奖励，提高留存。
