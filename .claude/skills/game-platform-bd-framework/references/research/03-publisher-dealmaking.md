# 03 — Game publishing deal-making (publishers, platform acquisition teams, developer pitching)

Research dimension for the `game-platform-bd-framework` topic skill.
Context: small studio, finished 3D 4-player browser game (GROW EVERYTHING). Selling to web portals now; Steam and other platforms later.

## Method and limits (read first)

- About 43 web searches were run for this file. **Every WebFetch attempt was blocked by the egress proxy** (newsletter.gamediscover.co, gamedeveloper.com, rawfury.com, ltpf.ramiismail.com, akuparagames.com, indiegamepublishing.com, developers.poki.com, docs.crazygames.com). Then the session-wide search cap (200 calls) ran out. **So every claim below comes from a search-engine excerpt ("search excerpt only").** None of it was read from the full primary page. Treat exact wording as paraphrase unless it is in quotation marks, and even quoted wording passed through the search summariser.
- Labels: **[official]** = the organisation's own docs or published policy. **[first-hand]** = the named person's own statement (their blog, talk or interview quote). **[third-party]** = someone else summarising or reporting. **[inferred]** = my own reasoning.
- "Year" is the publication or data year when the excerpt showed it. "year n/c" means the excerpt did not confirm it.
- Blacklisted sources (zhihu, WeChat, Baidu Baike) were not used. Low-credibility aggregators (SEO blogs, Cinevva, Althera, Playgama, game-developers.org) are marked **[third-party, low confidence]** and are never the only basis for a principle.

---

## A. Deal economics: what the numbers say

### A1. Aggregate publishing-agreement data (PC/console indie)

| Claim | Source | Label / year |
|---|---|---|
| Sample: 30 non-mobile indie publishing agreements collected by lawyer Kellen Voyer (Voyer Law), presented at GDC Summer. Average advance $318k, median $270k. Lowest advance with one $100k, highest $2M. 18% had no advance. | https://newsletter.gamediscover.co/p/what-should-a-game-publishing-agreement ; https://www.gamedeveloper.com/business/what-should-a-game-publishing-agreement-look-like-more-2 | [third-party] Carless/GameDiscoverCo summarising Voyer's [first-hand] data, 2020 |
| Average split: dev 60 / pub 40. Dev gets 71% in no-advance deals and 55% in deals with an advance. | same | [third-party] summarising Voyer, 2020 |
| 42% of deals require the advance to be recouped before the developer sees any revenue. 58% recoup while both sides earn. | https://newsletter.gamediscover.co/p/what-should-a-game-publishing-agreement (via search excerpt) | [third-party], 2020 |
| "Good" deal shape: the developer keeps the IP, and the ~$318k advance is paid across milestones (for example alpha). The split is 60/40 to the publisher until recoup, then 60/40 to the developer. Zero-advance deals usually cover near-finished games, where the publisher only does distribution and marketing. | https://www.pcgamer.com/what-a-good-and-bad-indie-game-publishing-deal-looks-like/ | [third-party] PC Gamer, 6 Aug 2020 |
| Voyer Law 2025 report: 100+ agreements signed 2017–2025. Standard term is **6 years, often auto-renewing**. Developers usually keep full IP and get audit rights. Dev share with an advance: average 58.2%, median 50%. Without an advance: average 67.9%, median 70%. Merch: dev about 48.3%. | https://gamedevreports.substack.com/p/voyer-law-publishing-agreements-in ; https://gam3s.gg/news/publishing-agreements-in-2025-voyer-law-analysis/ | [third-party] summaries of Voyer's [first-hand] dataset, 2025 |
| Voyer Law 2026 report: 130+ agreements. Dev share with an advance 57.9%, without 67.9%. Console publishing average 63.1% (median 60%). Range 2.5%–90%. Average advance **$674,861**, median $300k (low $20k, high >$6M). Audit rights appear in 83.3% of advance deals, 69.3% of console deals and 47.1% of no-advance deals. | https://indiegamepublishing.com/ (search excerpt only) | [first-hand] Voyer Law report, 2026 |
| Voyer (GDC 2023): "If a publisher comes to you with a 50/50 deal, push back! You always need to push back." Five clauses to watch: license scope, royalty, marketing, DLC/add-ons, IP. Watch for "double dipping", where the publisher recoups its own internal marketing or QA costs or takes an extra platform-holder cut. | https://media.gdcvault.com/gdc2023/Slides/How+Publishing+Agreements_Voyer-Kellen.pdf ; https://www.gamedeveloper.com/marketing/five-key-publishing-contract-pitfalls-for-indies-to-avoid | [first-hand] talk, via [third-party] report, 2023 |

**Contradiction or data-quality flag:** one search summary gave the $674,861 average and $300k median for the **2025** report, and another gave the same figures for the **2026** report. Either the figure carried over between reports or one summary mislabelled it. The advance-deal dev share also differs slightly (58.2% in 2025 vs 57.9% in 2026). Cite the figures with the year of the report you actually open.

### A2. Practitioner heuristics on splits

- Rami Ismail: most publishers take **70–100% pre-recoup and 30–50% post-recoup**. The upfront is "a set amount of money spread over a pre-defined list of milestones". If the game fails, the rest of the upfront is the only money the developer will get, so safe margins matter. **Guarantees are more common in platform deals** (for example Game Pass-type deals). They are paid on a deliverable and do not fund development. https://ltpf.ramiismail.com/upfronts-guarantees-recoups/ [first-hand, year n/c]
- Rami Ismail, "The Publisher's Lie": "indies fund indie games". Publishers really take on risk and add portfolio leverage: a steady news tempo, and cheaper event, platform and press access across many titles. https://ltpf.ramiismail.com/the-publishers-lie/ [first-hand, year n/c]
- A Zukowski-associated source says: "bringing existing fans to a developer's game is the whole point of having a publisher, which is why developers give publishers 30%". The source also cites an example deal of 35/65 pub/dev for life, even with an advance. Seen in a search summary pointing to the GameDiscoverCo contracts pieces. The exact author was not isolated. [third-party, attribution uncertain]

### A3. Named publishers' published terms

| Publisher | Term structure | Source | Label / year |
|---|---|---|---|
| **Raw Fury** | Published its full publishing agreement. Split is 50% of net revenue after recoup. **Funding + 15% is recouped at 100%.** External costs (paid marketing, external services) come off net revenue before royalties. The developer keeps the IP. It pays up to $500 toward the developer's legal review. Founder Antonsson: "If the point is to create a relationship where there's trust, don't start by going through negotiations where one side feels that they lost something." | https://rawfury.com/why-we-are-publishing-raw-furys-publishing-agreement/ ; https://virtualeconcast.com/news/raw-fury-pulls-back-curtain-on-publishing-contracts/ ; https://www.gamesradar.com/games/we-are-buying-into-your-vision-blue-prince-publisher-raw-fury-reflects-on-10-years-of-indie-game-magic/ | [official] + [first-hand] quotes; agreement published c. 2020 (year n/c), GamesRadar 2025 |
| **Hooded Horse** | Standard contract has **no recoup, 65% of all revenue to the developer**. When Hooded Horse part-funds a game it takes a larger share "so we make a higher percentage over time that eventually rewards the development funding investment but does not deprive the developers of cash flow". Tim Bender: publishers "should ditch 'horrible' recoup clauses". Also: "Some publishers sign many games anticipating most to fail. Relying on recoup to mitigate their losses on those while making their money on the few successes." | https://www.gamedeveloper.com/business/hooded-horse-co-founder-says-publishers-should-ditch-horrible-recoup-clauses-to-help-devs ; https://premortem.games/2022/09/14/hooded-horse-founder-tim-bender-game-business-is-too-much-in-favor-of-publishers/ | [first-hand] interviews, 2022 (PreMortem, Sep 2022); Game Developer piece year n/c (c. 2023) |
| **Epic Games Publishing** | Funds **up to 100% of dev costs**, including QA, localisation and marketing. Developer gets **at least 50% of profits after recoup**, keeps 100% of the IP and keeps creative control. | https://www.pcgamer.com/is-epics-publishing-deal-good/ ; https://www.forbes.com/sites/erikkain/2020/03/31/fortnite-creator-epic-games-wants-to-make-game-publishing-a-little-less-evil/ | [official] terms via [third-party], 2020 |
| **Kepler Interactive** | Co-ownership model: member studios hold equity and a strategic say, keep creative independence, and share central marketing, finance and publishing services. It grew out of Kowloon Nights and was announced in Oct 2021. | https://naavik.co/digest/inside-kepler-interactives-approach-to-publishing/ ; https://wnhub.io/news/stores-and-publishing/item-48009 | [third-party], 2021–2024 |
| **No More Robots** | Mike Rose mostly signs **concepts or vertical slices, rarely near-finished games**. Won't sign "anything that leaves a developer stranded" or more games than it can promote. | https://www.nme.com/features/gaming-features/boss-level-2022-mike-rose-no-more-robots-3276835 | [first-hand] quotes in [third-party] feature, 2022 |

### A4. Platform deals (subscription, exclusivity, grants)

| Deal type | Evidence | Source | Label / year |
|---|---|---|---|
| **Xbox Game Pass: flat fee** | Microsoft paid Big Cheese Studio a lump sum of **$600,000** to put Cooking Simulator on Game Pass (deal dated 5 Aug 2022). That was about 22% of the prior year's net profit and about 17% of net product revenue. At the time Steam concurrents were only about 200–250, so a back-catalogue sim with modest traffic still earned a meaningful payment. | https://www.trueachievements.com/n50797/cooking-simulator-xbox-game-pass-deal ; https://80.lv/articles/microsoft-paid-usd600-000-to-add-cooking-simulator-to-xbox-game-pass | [third-party] reporting a [official] company filing, 2022 |
| Game Pass: FTC-leak valuations | Leaked FTC v Microsoft documents: Xbox was ready to pay up to $300M for Star Wars Jedi: Survivor and valued a Baldur's Gate 3 deal at $5M. | https://gameworldobserver.com/2024/03/29/game-pass-epic-exclusive-deals-reduced-for-indie-devs | [third-party], documents 2023 |
| **Market cooling** | GDC 2024: Chris Bourassa (Darkest Dungeon) said "The Gold Rush is over", and that Game Pass and Epic deal scope is "significantly diminished". Casey Yano (Mega Crit) said at least five small teams reported cancelled funding. | https://www.pcgamer.com/games/roguelike/the-gold-rush-is-over-slay-the-spire-and-darkest-dungeon-devs-say-that-big-game-pass-and-epic-exclusive-deals-have-dried-up-for-indie-devs/ | [first-hand] quotes via [third-party], 2024 |
| **Epic Store exclusivity MGs** | Epic v Apple trial documents: about $444M committed to exclusives in 2020. First-wave MGs about $210M (2019). Metro Exodus MG $11.5M. Borderlands 3 MG $80M + $15M marketing + $20M non-recoupable. Tier-3 (small) games: only about 20% of MG spend recouped in Q1 2020, vs about 70% for Tier 1. Epic expected at least $330M unrecouped. | https://www.pcgamer.com/epic-games-store-exclusives-apple-lawsuit/ ; https://www.nme.com/news/gaming-news/data-suggests-epic-games-store-is-losing-money-on-indie-games-3125675 ; https://www.pcgamesn.com/borderlands-3/epic-exclusive-deal | [third-party] reporting court exhibits, 2021 |
| Tier-3 MG individual amounts | **Not found.** | — | — |
| **Apple Arcade** | At launch (2019) upfronts were generous and "most games … profitable from day one". Per-play bonus pool payments have declined since about Oct 2020, and upfronts for new titles were cut. The "qualifying sessions" metric is a "black box". Few original games are greenlit unless tied to big family IP. A reported range of "$1–3M advances" appears in one third-party summary and is unverified. | https://mobilegamer.biz/inside-apple-arcade-axed-games-declining-payouts-disillusioned-studios-and-an-uncertain-future/ ; https://www.techradar.com/gaming/report-claims-apple-arcade-payments-have-declined-significantly-leaving-devs-concerned | [third-party] with anonymous [first-hand] dev sources, Feb 2024 |
| **Netflix Games** | Licensing is described as priced on contract length, exclusivity and estimated engagement. Netflix has since pivoted toward evergreen and owned IP and cancelled several indie and AA releases. No deal sizes found. | https://www.layerlicensing.com/post/netflixs-gaming-strategy-ip-trends-and-the-licensed-games-revival | [third-party, low confidence], year n/c |
| **ID@Xbox** | Free to join, with free dev kits. No exclusivity required, but Microsoft historically asked for **day-one parity** with other consoles. Digital split "industry standard" (about 70/30). Games in the program can be considered for Game Pass. Charla on curation: "Not every game can make the cut, even the really great ones… there are always champions for some games." | https://www.digitaltrends.com/gaming/microsofts-idxbox-program-to-gradually-encourage-more-self-publishing/ ; https://www.onmsft.com/feature/interview-microsoft-chris-charla-idxbox-game-pass-melbourne-australia-pax-aussie-dev ; https://www.windowscentral.com/gaming/xbox/id-xbox-chief-chris-charla-talks-to-us-about-microsofts-indie-game-dev-program-we-dont-want-bringing-games-to-xbox-to-be-a-lengthy-painful-process | [official]/[first-hand], 2013 (parity), 2019–2024 (Charla) |
| Epic MegaGrants | Searched indirectly only. **No current terms verified** (gap). | — | — |

### A5. Web portals (most relevant to GROW EVERYTHING now)

| Portal | Terms / selection mechanics | Source | Label / year |
|---|---|---|---|
| **Poki** | Hand-curated, and the team reviews every submission. On exclusive deals Poki asks for **web exclusivity**. Steam and mobile stay free. Split: **100% to the developer for traffic the developer brings, 50% for traffic Poki brings**. Terms are set per title. | https://developers.poki.com/guide/revenue-deal-types ; https://sdk.poki.com/deals | [official] docs (search excerpt only), current 2025–26 |
| Poki testing gates | Player Fit Test: a healthy result is **average playtime over 3 minutes AND at least 25% of 500 plays lasting over 3 minutes**. Web Fit Test compares CTR, time on page and conversion to play against category averages. Poki: the average game reaches about **70% conversion and 6+ minutes**. "3 minutes is the bar to advance, not the target." Fast loading and onboarding (measured as passing the first `gameplayStart()`) are stressed. | https://developers.poki.com/guide/player-fit-test ; https://sdk.poki.com/web-fit-test.html ; https://poki.com/blog/higher-success-rates-with-playtests | [official], current |
| **CrazyGames** | Basic Launch ends after **≥7 days AND ≥500 plays**. Moving to Full Launch (ads on, wider promotion) depends on average playtime, conversion to gameplay and retention, benchmarked against the platform. "Successful titles often see **10+ min** average playtime". "Strong games often achieve **10–15% D1**". Top titles convert **80%+** (conversion = played at least 1 minute). | https://docs.crazygames.com/resources/basic-launch-metrics/ | [official], current |
| CrazyGames exclusivity | Developer Portal Terms (updated 18 Aug 2025): the excerpt reads that the game is "exclusively available on the Portal Site for two (2) months after the Full Launch". Exclusivity means browser sites only, and non-web ports are allowed. **Contradiction:** a third-party guide says "no exclusivity requirement". Treat the official terms PDF as authoritative and read the clause yourself. | https://files.crazygames.com/documents/developer_terms_20250818.pdf ; https://app.cinevva.com/guides/publish-game-crazygames | [official] vs [third-party, low confidence], 2025 |
| CrazyGames jam or publishing bonus | Jam terms: after costs are recouped, **60/40 dev/CG on ads and 70/30 on IAP**. "Publishing Bonus" = fixed fee + rev share, with a timed web exclusive. The general split is not published. | https://crazygames.indiehero.io/cggmwj-jg/ | [official] jam terms, year n/c (c. 2024–25) |
| **GameDistribution** | Third-party figures only: about **33%** ad revenue share to the developer (a three-way split between publisher sites, the developer and GD). Flat HTML5 licenses: roughly $300–800 non-exclusive per platform, exclusives from about $5k to $25k+. | https://www.abratabia.com/web-game-monetization/licensing-to-portals.php ; https://gamedistribution.com/developers/partnership/ | [third-party, low confidence]; GD page [official] but numbers were not seen there |
| **Flash-era precedent** | FGL marketplace: by Dec 2011 about 7,000 deals worth $10M+ (about 3 per day). At its peak, $400k/month. Sponsorships ranged from under $50 to over $6,000. Structure: **primary sponsorship** (sponsor branding on the viral build, developer keeps ads and secondary rights) vs **exclusive**, plus **sitelocked secondary licenses** per domain. | https://gamedev.net/tutorials/industry/interviews/flashgamelicensecom-interview-r2683 ; https://photonstorm.com/game-development/business/insert-coin-to-continue-the-html5-game-sponsorship-market ; https://northwaygames.com/rebuild-selling-a-flash-game-on-flashgamelicense/ | [first-hand] (FGL founders, devs), 2011–2016 |

---

## B. How evaluators decide (publisher and platform side)

### B1. What they ask for in a pitch

- **Raw Fury [official, year n/c]:** a deck that shows "who's building the game, why you're building it, when you think it'll be done", plus a high-level description. **A build is essential. "It's unlikely you'll get signed on concept art alone."** Send the build you are most proud of. If the build runs over 10 minutes, add checkpoints. Show clear player **verbs**, articulated **USPs**, and **what you need from a publisher and how they fit**. They can't promise to play any build twice. https://rawfury.com/how-to-pitch-to-raw-fury/
- **Devolver [official]:** the pitch form asks for a demo, a gameplay video and a **financial roadmap**, and only considers games releasing next year or later. https://pitch.devolverdigital.com/
- **Devolver, Daniel Lucic, PAX Australia [first-hand via third-party, year n/c]:** "you can have the best pitch deck in the world", but undercooked core mechanics leave you fighting uphill. Publishers want to "feel the hook when they play the actual build". The Cult of the Lamb signing came down to a fast emotional connection with the team: "sometimes you get a pitch and you know immediately." He also admits Devolver has missed games it would have liked to sign because of visibility. https://www.gamedeveloper.com/business/devolver-digital-breaks-down-the-pitching-essentials-at-pax-australia
- **No More Robots, Mike Rose [first-hand, 2022]:** a gut "wow factor": "Oh, what the heck is this?!" If he doesn't feel it, he assumes players won't either. The game should do something not done before. https://www.nme.com/features/gaming-features/boss-level-2022-mike-rose-no-more-robots-3276835
- **Annapurna [third-party]:** found Stray in 2016 through GIFs the developer tweeted. Scouting happens in public channels, not only through pitch inboxes. https://en.wikipedia.org/wiki/Annapurna_Interactive ; https://variety.com/vip/how-annapurna-and-stray-stand-out-from-hollywoods-gaming-efforts-1235320559
- **Zukowski ("The biggest gap in game success", 2025) [first-hand]:** "Ideas are cheap". The industry is realising that a good pitch alone isn't enough, and the gap is getting from idea to a playable demo. https://howtomarketagame.com/2025/04/21/the-biggest-gap-in-game-success/

### B2. Metrics evaluators look at

- **Wishlist velocity (Steam):** Tavrox's "ugly truths" post, discussed by GameDiscoverCo: daily organic wishlists matter most to publishers. "100 wishlists/day is crazy good… 50/day very interesting… 20/day is an average good indie." Publishers "play safe 90% of the time" and are "late to trends". https://newsletter.gamediscover.co/p/are-these-really-the-ugly-truths ; https://tavroxgames.medium.com/the-ugly-truths-of-indie-publishers-f6416289fbce — [first-hand] (Tavrox, a developer) plus [third-party] commentary (Carless), 2021. **Carless's headline asks whether these really are the truths, so this is contested and not endorsed.**
- **Zukowski [first-hand, year n/c]:** publishers aim for **30,000+ wishlists at launch** "as a buffer against things going wrong". His separate floor for self-publishing is about 7,000. https://howtomarketagame.com/ (search excerpt; exact post not isolated)
- **Web portals [official]:** CTR, conversion to play, average playtime, the share of long sessions and D1 retention (see A5). These are the portal-side equivalent of wishlist velocity, and they are measured on the platform's own traffic, not on the developer's claims.
- **Apple Arcade [third-party via devs, 2024]:** pays on engagement ("qualifying sessions": launch, duration, return).
- **Netflix [third-party, low confidence]:** licensing is reportedly priced on expected engagement hours.
- **Steam Next Fest benchmarks** (median demo playtime, wishlist conversion): only from low-confidence aggregators (for example https://altheragames.com/en/blog/steam-next-fest-strategy). Zukowski keeps a demo-playtime benchmark at https://howtomarketagame.com/2022/10/26/what-is-a-good-median-play-time-for-a-demo-benchmark/ but its figures were not confirmed in the excerpt. **Treat as not verified.**

### B3. Timing and leverage

- Zukowski [first-hand, via howtomarketagame search excerpt; page likely a GDC 2021 write-up, year n/c]: "Later in your project life you have more room to negotiate because you are a less risky bet." Also: "If a publisher won't negotiate, that is a warning sign."
- No More Robots signs early (concept or slice), which is the opposite of the leverage-later advice. See disagreements.
- GameDiscoverCo, "Do you need a publisher to 'make your game sell'?" [third-party/first-hand editorial, Jan 2023]: don't sign just because a publisher is interested. Ask their other developers whether they were responsive and fair and actually grew wishlists. You need a publisher mainly if you lack people or time for community and marketing around launch. https://newsletter.gamediscover.co/p/do-you-need-a-publisher-to-make-your

---

## C. Contract checklist (lawyers and developer-publishers)

Grouped by clause. Sources: Zukowski/HTMAG, Voyer, Rami Ismail (LTPF), Akupara (Feb 2026), Strebeck/Legal Moves (2025), Carless/GameDiscoverCo, Jakefriend case (2021).

| Clause | Risk / red flag | Sources |
|---|---|---|
| **IP** | Assignment instead of license. "All rights, title, and interest"; "including sequels, prequels, and derivative works"; "in perpetuity throughout the universe". Carve out your code, tools and tech. | HTMAG [first-hand] https://howtomarketagame.com/ ; LTPF [first-hand] https://ltpf.ramiismail.com/publisher-contracts-red-flags/ ; Akupara [first-hand, 2026] https://www.akuparagames.com/2026/02/17/publisher-red-flags-what-to-look-for-in-contracts-and-negotiations/ |
| **License scope** | License the game only, not the characters or universe, or sequels get swept in. | Voyer [first-hand, 2023] |
| **Term** | Perpetual or auto-renewing terms. Typical is 5–10 years (Ismail). The Voyer 2025 median is 6 years with frequent auto-renewal. | LTPF; Voyer 2025 [third-party summary] |
| **Territory and platforms** | Don't give a Steam-only publisher future-platform rights. Offer a first-look option instead. | HTMAG [first-hand] |
| **Future games / ROFR** | Options or first refusal on future or unrelated IP, or on sequels and DLC they won't fund. | LTPF [first-hand] |
| **Net revenue definition** | Needs an enumerated list of deductions (platform fee, payment processing, refunds, taxes, licensing), not "any costs related to publishing". | GameDiscoverCo [third-party] https://newsletter.gamediscover.co/p/what-makes-for-a-good-game-publishing (year n/c) |
| **Recoupable costs** | Internal marketing, porting or QA charged as recoupable ("double dipping"). Ask for invoices. Watch for a recoup multiplier (Raw Fury openly uses funding + 15%). | Voyer 2023; HTMAG; Raw Fury [official] |
| **Recoup structure** | 100% pre-recoup shifts the risk onto the party least able to carry it. Alternatives: recoup from only part of revenue, or no recoup with a fixed split (Hooded Horse). | Carless "One step beyond" [first-hand editorial, c. 2023] https://newsletter.gamediscover.co/p/one-step-beyond-how-game-contracts ; Bender [first-hand] |
| **Audit rights** | Needed. Present in 83% of advance deals but only 47% of no-advance deals (Voyer 2026). | Voyer [first-hand] |
| **Marketing commitment** | No minimum marketing spend is a red flag. | Strebeck/Legal Moves [first-hand, 2025] https://legalmoveslawfirm.com/state-game-publishing-agreements/ |
| **DLC** | Write down payment obligations for DLC. If the developer funds DLC, negotiate a different royalty. | Voyer 2023 |
| **Breach / takeover** | Takeover clauses. In the Jakefriend case (2021), on an ambiguous breach the publisher would keep the IP and 100% of revenue, and the developer would repay all funding plus uncapped completion costs. He turned down about $500k. | https://www.pcgamer.com/indie-publishing-contracts/ ; https://gameworldobserver.com/2021/08/16/indie-developer-on-exploitative-terms-of-publishing-contracts [first-hand via third-party, 2021]; Strebeck (takeover provisions) |
| **Delay liability** | The developer should not be liable for delays the publisher causes. | HTMAG |
| **Reversion** | You need a reversion clause if the publisher shelves the game. Publisher insolvency can leave games "in perpetual limbo". | LTPF; Akupara 2026 |
| **Negotiation behaviour** | Anger, pressure or combative negotiation is itself a red flag. Always have an entertainment lawyer review. Raw Fury pays $500 toward that review. | Strebeck; Akupara; Raw Fury |
| **Exclusivity (platform/web)** | Web-only exclusivity (Poki), or a timed 2-month browser exclusivity (CrazyGames terms). Check the length, the scope (web vs all platforms) and what you get in return (featuring, higher share). | Poki [official]; CrazyGames [official] |

Strebeck's full 15-point checklist PDF was not reached. **Gap.**

---

## D. Ten core principles (each recurs in ≥2 independent sources)

1. **A playable build beats a deck.** Evaluators decide on the hook they feel in play. Sources: Raw Fury [official], Devolver/Lucic [first-hand], Devolver pitch form [official], Zukowski 2025 [first-hand], Poki and CrazyGames test gates [official].
2. **Evaluators buy evidence of demand, measured on their own funnel.** Publishers look at wishlist velocity or totals. Portals look at CTR, conversion, playtime and D1. Platforms pay on engagement. Sources: Tavrox/GameDiscoverCo, Zukowski (30k), Poki, CrazyGames, Apple Arcade report.
3. **An advance costs you split points.** Dev share is about 55–58% with an advance vs about 68–71% without. Sources: Voyer 2020 (via GameDiscoverCo/PC Gamer), Voyer 2025, Voyer 2026, Hooded Horse (a larger share when it funds).
4. **Recoup terms decide the real deal more than the headline split.** Sources: Carless "One step beyond", Bender, Ismail (70–100% pre-recoup), Raw Fury (funding + 15% at 100%), GameDiscoverCo (42% full-recoup).
5. **License, never assign, the IP; narrow the licensed scope; carve out your tech.** Sources: Zukowski, Voyer, Ismail, Akupara, Epic Publishing and Raw Fury (both leave the IP with the developer).
6. **Limit the term, territory and platforms, and require reversion.** Sources: Ismail, Zukowski, Voyer 2025 (6-year and auto-renew data), Akupara.
7. **Define net revenue and recoupable costs item by item, and keep audit rights.** Sources: GameDiscoverCo, Voyer (double-dipping, audit stats), Zukowski ("ask for invoices").
8. **Always negotiate. A partner who won't negotiate or who pressures you is the red flag.** Sources: Voyer ("always push back"), Zukowski, Strebeck, Akupara, Raw Fury/Antonsson (trust framing).
9. **Pay for what the partner uniquely delivers (audience, featuring, marketing commitment), and get it in writing.** Sources: Zukowski (a back catalogue that brings fans justifies 30%), Strebeck (minimum marketing spend), Poki (50% only on traffic Poki brings), Ismail (portfolio leverage).
10. **Platform money is cyclical. Price it when it's available and don't plan around it.** Sources: GDC 2024 Bourassa/Yano, Epic MG losses 2021, Apple Arcade declining payouts 2024, Netflix pivot, Flash sponsorship collapse (FGL).

## E. Disagreements between schools (kept, not resolved)

1. **Recoup or no recoup.** Hooded Horse (Bender) says recoup clauses are "horrible" and prefers a clean 65/35. Raw Fury recoups funding + 15% at 100%, then splits 50/50, and calls that fair and transparent. Ismail and the Voyer data describe recoup as the industry norm. Carless argues for partial-recoup reform.
2. **When to approach publishers.** No More Robots signs concepts and slices. Zukowski says leverage grows later and that you may not need a publisher at all. Devolver only takes titles releasing next year or later. Raw Fury wants a build, not concept art.
3. **Do you need a publisher?** The GameDiscoverCo/Zukowski camp says only if you lack marketing capacity, and not to sign just because someone is interested. Tavrox says publishers are risk-averse and late to trends, so a self-publisher can move faster. Ismail's view is that publishers are a risk-transfer and portfolio-leverage service with real value.
4. **Is 50/50 fair?** Voyer says "always push back" on 50/50. Raw Fury's post-recoup 50/50 is presented as developer-friendly. Epic Publishing's "at least 50%" is framed as the benchmark.
5. **How curation works.** Devolver and No More Robots rely on gut feel and emotional connection. Poki and CrazyGames use gated tests against category benchmarks, and Tavrox describes publishers screening on metrics. Xbox (Charla) describes internal "champions" plus hard cuts. That is a mixed model.
6. **Exclusivity on web.** Poki wants ongoing web exclusivity for its exclusive deals. The CrazyGames terms give 2 months of browser exclusivity. Third-party guides even claim CrazyGames has none. Non-exclusive licensing (GameDistribution, Flash-era sitelocks) is the opposite model.

## F. Inferred implications for GROW EVERYTHING [inferred]

- Your portal "pitch" is mostly the build's first 60 seconds: load time, conversion to play, and >3 min / 10 min playtime. Poki and CrazyGames publish the gates, so treat them as the qualification criteria in the deal.
- Before accepting any web exclusivity, price it. Compare the exclusive share (Poki: 100% of your own traffic, 50% of Poki's) plus featuring against the non-exclusive reach you give up. Check that Steam and mobile rights stay carved out. Both Poki and CrazyGames say they do.
- For a later Steam or publisher deal, the finished game is leverage. Aim for a no-advance, marketing-only deal (historically about 68–71% to the developer). Insist on a license only, a web or other platform carve-out, an itemised net revenue definition, a written marketing commitment, audit rights and reversion.
- A 4-player browser game fits engagement-priced deals (subscriptions, portals) better than story games do, because session length and return play are what these deals pay for (Apple Arcade and Netflix engagement pricing, portal metrics).

## G. Gaps (not found or not verified)

- Full primary text of every page (all fetches were blocked). Re-verify key numbers before quoting them externally.
- Actual Poki deal numbers beyond the 100/50 rule, and whether Poki pays upfront fees or MGs. **Not found.**
- CrazyGames' general revenue split outside jams. **Not published / not found.**
- Individual Epic Tier-3 MG amounts, and Epic's current (post-2024) exclusivity terms. **Not found.**
- Current Game Pass indie deal sizes (only the 2022 Cooking Simulator figure). **Not found.**
- Epic MegaGrants current terms, Netflix Games deal sizes, and Annapurna's formal pitch process. **Not found.**
- Strebeck's 15-point checklist details. The Zukowski page with his "contract killers" list was not isolated.
- Sources on how web-portal BD teams (Poki, CrazyGames, GamePix, Armor Games) negotiate bespoke deals for high-performing multiplayer titles. **Not found.**
- Hard evidence on MG sizes for HTML5 exclusives. Only low-confidence third-party ranges ($5k–25k+).

## Source count

About 45 distinct URLs cited above. Mix: about 12 official, about 14 first-hand, about 19 third-party (6 of them flagged low confidence). All are search excerpts only.
