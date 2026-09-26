# GROW EVERYTHING — Suno 音乐提示词包（可爱洗脑版，2026-09-26）

**风格方向**：游戏很可爱（大眼珠小机器越吃越大），所以音乐也要**可爱、明亮、洗脑**。要点：
- 大调、每分钟约 120 拍，一段 **2 小节的「一问一答」旋律反复出现**，听两遍就会哼；
- 音色像玩具：玩具钢琴、马林巴、八音盒、口哨、尤克里里、会「嘣」一下的弹簧贝斯；
- 前 3 秒就进主旋律，**不要人声**（第 6 首除外），适合无缝循环。

游戏里已经有同样思路的程序音乐（`game/src/audio/themes.ts`，试听：`renders/audio/`）。Suno 版是它的「高配替身」：导出后按文件名放进 `public/music/`，游戏会自动替换内置音乐。

## 在 Suno 里怎么操作

1. **Create → Custom**，打开 **Instrumental**（纯音乐）。
2. 把 **Style** 粘进「Style of Music」，**Structure** 粘进「Lyrics」（纯音乐也能用结构标签控制段落），**Exclude** 粘进「Exclude styles」。
3. 每条提示词生成 2–4 个版本，**挑前 5 秒最抓耳的那个**。
4. 导出 MP3 → 改名 → 放进 `public/music/` → 提交代码，下次部署就生效。
5. **版权**：只有**付费订阅（Pro / Premier）期间**生成的曲子才能商用。游戏要上平台赚钱，必须用付费账号生成，并截图保存生成记录。

---

## 1. 上海 — 《外滩大胃王》 → `shanghai.mp3`

- **Style**：`cute kawaii Chinese pop instrumental, toy guzheng plucks, bouncy pentatonic earworm hook, marimba, music box, springy boing bass, handclaps, bright C major, 120 BPM, playful arcade game music, super catchy, loopable, instrumental`
- **Exclude**：`vocals, singing, sad, dark, dramatic, slow, lo-fi hiss, heavy drums`
- **Structure**：
  ```
  [Intro: toy guzheng plays the hook alone]
  [Hook: call and answer, 2 bars, repeat]
  [Hook: add marimba and handclaps]
  [Bridge: music box sparkles, bass bounces]
  [Hook: full band, happy]
  [Outro: hook once more, clean loop point]
  ```

## 2. 纽约 — 《嘀嘀出租车》 → `newyork.mp3`

- **Style**：`cute cartoon swing instrumental, toy piano and ukulele, "honk honk" bicycle horn hits, bouncy walking bass with boing slides, finger snaps, whistling hook, F major, 116 BPM, playful big city adventure, catchy earworm, loopable, instrumental`
- **Exclude**：`vocals, rap, singing, dark, trap hi-hats, aggressive`
- **Structure**：
  ```
  [Intro: two horn honks, then the toy piano hook]
  [Hook: whistled melody, call and answer]
  [Hook: snaps and walking bass join]
  [Bridge: ukulele strums, playful stop-time]
  [Hook: everyone together]
  [Outro: honk honk, loop]
  ```

## 3. 巴黎 — 《铁塔下午茶华尔兹》 → `paris.mp3`

- **Style**：`cute music box waltz, accordion and glockenspiel, pizzicato strings, oom-pah-pah bouncy bass, 3/4 time, bright C major, 138 BPM, whimsical cartoon café, sweet and catchy earworm melody, loopable, instrumental`
- **Exclude**：`vocals, singing, sad, melancholic, slow, techno`
- **Structure**：
  ```
  [Intro: music box plays the waltz hook]
  [Hook: accordion, call and answer]
  [Hook: pizzicato strings and glockenspiel]
  [Bridge: playful little chase, speeds up slightly]
  [Hook: full, twinkly]
  [Outro: music box, loop]
  ```

## 4. 废料城（加分关） — 《哔啵垃圾场》 → `scrap.mp3`

- **Style**：`cute robot chiptune pop, 8-bit bleeps and bloops, toy synth lead, clanky metal toy percussion, bouncy square bass, happy G major, 124 BPM, adorable little robot, catchy earworm hook, arcade, loopable, instrumental`
- **Exclude**：`vocals, singing, dark, industrial noise, distortion, scary`
- **Structure**：
  ```
  [Intro: robot beep-boop call]
  [Hook: chiptune melody, call and answer]
  [Hook: clanky toy drums join]
  [Bridge: bleep solo]
  [Hook: full]
  [Outro: power-down beep, loop]
  ```

## 5. 胜利音乐 — 《大胃王冠军》 → `victory.mp3`

第 1 名时播放。游戏只需要**开头 4–6 秒**。Suno 生成的曲子会更长，导出后用任意剪辑工具（剪映、Audacity）**只留开头的「哒哒哒——当！」**，末尾做 0.5 秒淡出。

- **Style**：`short triumphant cute victory fanfare jingle, toy brass and glockenspiel, rising arpeggio then big happy final chord, sparkly music box run, handclaps, C major, cartoon game win sound, joyful, instrumental`
- **Exclude**：`vocals, singing, long intro, sad, epic orchestral, dark`
- **Structure**：
  ```
  [Intro: da-da-da-DAAA fanfare]
  [Final chord with sparkles]
  [End]
  ```

## 6.（可选）短视频主题歌 — 《长大长大》（带人声，不进游戏）

留给以后 TikTok / 抖音用：一段洗脑的可爱合唱，一个 8–10 秒的循环片段就够。**现在是 ToB 阶段，这首可以先不做。**

- **Style**：`cute kawaii bubblegum pop, chipmunk-style cute vocals, toy piano, handclaps, bouncy, super catchy chant, 124 BPM, C major`
- **Lyrics**：
  ```
  [Chorus]
  Nom nom nom, I'm getting big!
  Eat the can, eat the car, eat the city!
  Grow grow grow, grow everything!
  Nom nom nom — one more bite!
  ```

---

## 放进游戏

| 文件 | 用在哪 |
| --- | --- |
| `public/music/shanghai.mp3` | 上海 |
| `public/music/newyork.mp3` | 纽约 |
| `public/music/paris.mp3` | 巴黎 |
| `public/music/scrap.mp3` | 废料城 |
| `public/music/victory.mp3` | 第 1 名的胜利音乐（替换内置合成号角） |

BGM 建议 1:30–3:00、响度约 −14 LUFS；胜利音乐 4–6 秒。
