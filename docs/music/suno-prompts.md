# GROW EVERYTHING — Suno 城市 BGM 提示词包

每座城市一首专属 BGM。在 Suno 里：**Create → Custom 模式 → 打开 Instrumental（纯音乐）**，把下面的 *Style* 粘进「Style of Music」，把 *Structure* 粘进「Lyrics」（纯音乐也可以用结构标签控制段落），*Exclude* 粘进「Exclude styles」（如果你的版本有这个框）。

导出后改名放进 `public/music/`：`shanghai.mp3`、`newyork.mp3`、`paris.mp3`、`scrap.mp3`，游戏会自动用它替换内置的程序音乐（没放文件时用内置音乐，不会出错）。

> **版权提醒**：Suno 只有在**付费订阅（Pro / Premier）期间生成**的歌曲才允许商用。要上架售卖或放广告，请用付费账号生成，并保留生成记录。

整体风格统一：**俏皮、有冲劲、带一点搞笑的"大胃王"感**（游戏是小机器越吃越大），节奏稳定、适合循环，**不要人声**，前 5 秒就要有辨识度。

---

## 1. 上海 Shanghai — 《外滩大胃王》

- **Style**：`playful Chinese electro-funk, guzheng plucks, pipa tremolo, erhu hook, punchy boom-bap drums, slap bass, gong hits, 100 BPM, A minor pentatonic, cheeky and bouncy, arcade game soundtrack, loopable, instrumental`
- **Exclude**：`vocals, singing, sad, slow ballad, lo-fi hiss`
- **Structure**：
  ```
  [Intro: gong hit, guzheng riff]
  [Main Loop: erhu hook over funky bass]
  [Build: pipa tremolo, drums get busier]
  [Drop: full band, brass stabs]
  [Main Loop]
  [Outro: loops back to intro]
  ```
- **标题**：Bund Big Eater / 外滩大胃王

## 2. 纽约 New York — 《黄色出租车狂飙》

- **Style**：`funny swing hip-hop, walking upright bass, muted trumpet stabs, jazzy piano, vinyl scratches, boom-bap drums, taxi horn samples, 92 BPM, G minor, mischievous big-city caper, cartoon heist vibe, loopable, instrumental`
- **Exclude**：`vocals, rap vocals, singing, trap hi-hat rolls, dark`
- **Structure**：
  ```
  [Intro: record scratch, taxi horn]
  [Main Loop: walking bass and piano]
  [Build: trumpet call and response]
  [Drop: big band hits, drums]
  [Main Loop]
  [Outro]
  ```
- **标题**：Yellow Cab Caper / 黄色出租车狂飙

## 3. 巴黎 Paris — 《埃菲尔铁塔下午茶》

- **Style**：`comedic French bal-musette waltz, accordion lead, pizzicato strings, oom-pah-pah bass, glockenspiel, 3/4 time, 132 BPM, C major, cheeky and romantic, cartoon chase, loopable, instrumental`
- **Exclude**：`vocals, singing, slow, melancholic, techno`
- **Structure**：
  ```
  [Intro: accordion pickup]
  [Main Loop: waltz melody]
  [Build: pizzicato strings speed up]
  [Drop: full musette band, glockenspiel sparkles]
  [Main Loop]
  [Outro]
  ```
- **标题**：Tea Time Under the Tower / 埃菲尔铁塔下午茶

## 4. 废料城 Scrap City（加分关）— 《垃圾场摇滚》

- **Style**：`junkyard industrial funk, metal clanks as percussion, distorted bass, robotic synth bleeps, cheeky arcade energy, 104 BPM, A minor, loopable, instrumental`
- **Exclude**：`vocals, singing, horror, ambient`

## 5. 可选：大厅 / 结算音乐

- **大厅 Lobby**：`chill funky lounge, clean electric piano, soft drums, 96 BPM, waiting-room fun, loopable, instrumental`
- **冠军结算 Victory sting（10 秒以内）**：`triumphant silly brass fanfare, cartoon victory, 8 seconds, instrumental`

---

### 导出与剪辑建议

1. 每首生成 2–4 个版本，挑**开头 5 秒最抓耳**、节奏最稳的那个。
2. 用 Suno 编辑器或 Audacity 截出一段 **1:30–3:00**、首尾衔接自然的循环段。
3. 响度统一到约 **−14 LUFS**（和游戏音效平衡）；导出 MP3 192 kbps 以上。
4. 放进 `public/music/`，重新构建发布即可（我可以帮你打包上线）。
