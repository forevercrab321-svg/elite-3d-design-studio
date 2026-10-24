--!strict
-- GROW EVERYTHING (Roblox) HUD, after the web game's (ui/Hud.ts + arena/ArenaUi.ts):
--  top centre: round timer, "City · Landmark n/total", landmark lock line; centre: countdown / GO;
--  bottom-left: MASS panel (TIER chip, kg/t, progress bar with ticks, tier name, NEXT · class · mass)
--  with the "+N kg" pop; next to it combo and power-up timers; top banner for unlocks, tiers and
--  landmark moments; toasts; bottom-right controls legend; results card.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local AbsorbedEvent = remotes:WaitForChild("Absorbed") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent
local NoticeEvent = remotes:WaitForChild("Notice") :: RemoteEvent

local ORANGE = Color3.fromHex("ffb347")
local ORANGE_DARK = Color3.fromHex("d97a14")
local PANEL = Color3.fromRGB(16, 17, 20)
local DIM = Color3.fromRGB(170, 170, 176)

local CITY_TEXT: { [string]: { city: string, landmark: string } } = {
	shanghai = { city = "Shanghai", landmark = "Oriental Pearl Tower" },
	newyork = { city = "New York", landmark = "Empire State Building" },
	paris = { city = "Paris", landmark = "Eiffel Tower" },
}

-- Built-in engine sounds (no uploaded audio needed yet).
local function sound(id: string, volume: number): Sound
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = volume
	s.Parent = SoundService
	return s
end
local sndPop = sound("rbxasset://sounds/electronicpingshort.wav", 0.3)
local sndBig = sound("rbxasset://sounds/swoosh.wav", 0.6)
local sndTier = sound("rbxasset://sounds/victory.wav", 0.5)
local sndBeep = sound("rbxasset://sounds/clickfast.wav", 0.6)
local sndEaten = sound("rbxasset://sounds/uuhhh.mp3", 0.7)

local gui = Instance.new("ScreenGui")
gui.Name = "GrowHud"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

local function corner(p: Instance, r: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = p
end
local function text(parent: Instance, name: string, size: number, font: Enum.Font, color: Color3?): TextLabel
	local l = Instance.new("TextLabel")
	l.Name = name
	l.BackgroundTransparency = 1
	l.Font = font
	l.TextSize = size
	l.TextColor3 = color or Color3.new(1, 1, 1)
	l.Text = ""
	l.Parent = parent
	return l
end
local function shadow(l: TextLabel)
	l.TextStrokeTransparency = 0.6
	l.TextStrokeColor3 = Color3.new(0, 0, 0)
end

-- Top centre: timer + sub-lines.
local timer = text(gui, "Timer", 34, Enum.Font.GothamBlack)
timer.AnchorPoint = Vector2.new(0.5, 0)
timer.Position = UDim2.new(0.5, 0, 0, 14)
timer.Size = UDim2.fromOffset(200, 40)
shadow(timer)
local subline = text(gui, "Sub", 14, Enum.Font.GothamBold, Color3.fromRGB(235, 235, 240))
subline.AnchorPoint = Vector2.new(0.5, 0)
subline.Position = UDim2.new(0.5, 0, 0, 54)
subline.Size = UDim2.fromOffset(420, 18)
shadow(subline)
local lockLine = text(gui, "Lock", 14, Enum.Font.GothamBold, ORANGE)
lockLine.AnchorPoint = Vector2.new(0.5, 0)
lockLine.Position = UDim2.new(0.5, 0, 0, 74)
lockLine.Size = UDim2.fromOffset(420, 18)
shadow(lockLine)

-- Centre message (countdown, GO, waiting).
local center = text(gui, "Center", 64, Enum.Font.GothamBlack)
center.AnchorPoint = Vector2.new(0.5, 0.5)
center.Position = UDim2.fromScale(0.5, 0.42)
center.Size = UDim2.fromOffset(600, 80)
shadow(center)
local centerSub = text(gui, "CenterSub", 20, Enum.Font.GothamBold, ORANGE)
centerSub.AnchorPoint = Vector2.new(0.5, 0)
centerSub.Position = UDim2.new(0.5, 0, 0.42, 44)
centerSub.Size = UDim2.fromOffset(600, 26)
shadow(centerSub)

-- Banner (top, 11%): big line, rule, orange sub-line.
local banner = Instance.new("Frame")
banner.Name = "Banner"
banner.BackgroundTransparency = 1
banner.AnchorPoint = Vector2.new(0.5, 0)
banner.Position = UDim2.fromScale(0.5, 0.11)
banner.Size = UDim2.fromOffset(900, 90)
banner.Visible = false
banner.Parent = gui
local bannerBig = text(banner, "Big", 38, Enum.Font.GothamBlack)
bannerBig.Size = UDim2.new(1, 0, 0, 46)
shadow(bannerBig)
local bannerRule = Instance.new("Frame")
bannerRule.BackgroundColor3 = ORANGE
bannerRule.BorderSizePixel = 0
bannerRule.AnchorPoint = Vector2.new(0.5, 0)
bannerRule.Position = UDim2.new(0.5, 0, 0, 52)
bannerRule.Size = UDim2.fromOffset(260, 2)
bannerRule.Parent = banner
local bannerSub = text(banner, "Sub", 16, Enum.Font.GothamBold, ORANGE)
bannerSub.Position = UDim2.fromOffset(0, 60)
bannerSub.Size = UDim2.new(1, 0, 0, 22)
shadow(bannerSub)
local bannerToken = 0
local function showBanner(big: string, sub: string, seconds: number?)
	bannerToken += 1
	local mine = bannerToken
	bannerBig.Text = big
	bannerSub.Text = sub
	banner.Visible = true
	task.delay(seconds or 2.2, function()
		if bannerToken == mine then
			banner.Visible = false
		end
	end)
end

-- Toast (60% height).
local toast = text(gui, "Toast", 20, Enum.Font.GothamBold)
toast.AnchorPoint = Vector2.new(0.5, 0.5)
toast.Position = UDim2.fromScale(0.5, 0.6)
toast.Size = UDim2.fromOffset(600, 30)
shadow(toast)
local toastToken = 0
local function showToast(s: string, color: Color3?)
	toastToken += 1
	local mine = toastToken
	toast.Text = s
	toast.TextColor3 = color or Color3.new(1, 1, 1)
	task.delay(1.5, function()
		if toastToken == mine then
			toast.Text = ""
		end
	end)
end

-- Mass panel (bottom-left, 250 px).
local panel = Instance.new("Frame")
panel.Name = "MassPanel"
panel.AnchorPoint = Vector2.new(0, 1)
panel.Position = UDim2.new(0, 24, 1, -24)
panel.Size = UDim2.fromOffset(250, 132)
panel.BackgroundColor3 = PANEL
panel.BackgroundTransparency = 0.25
panel.Parent = gui
corner(panel, 12)
local pad = Instance.new("UIPadding")
pad.PaddingLeft = UDim.new(0, 14)
pad.PaddingRight = UDim.new(0, 14)
pad.PaddingTop = UDim.new(0, 10)
pad.Parent = panel
local massLabel = text(panel, "Label", 11, Enum.Font.GothamBold, DIM)
massLabel.Text = "MASS"
massLabel.TextXAlignment = Enum.TextXAlignment.Left
massLabel.Size = UDim2.new(1, 0, 0, 14)
local tierChip = text(panel, "Tier", 11, Enum.Font.GothamBlack, Color3.fromRGB(30, 20, 5))
tierChip.BackgroundTransparency = 0
tierChip.BackgroundColor3 = ORANGE
tierChip.AnchorPoint = Vector2.new(1, 0)
tierChip.Position = UDim2.new(1, 0, 0, 0)
tierChip.Size = UDim2.fromOffset(62, 18)
corner(tierChip, 5)
local massNumber = text(panel, "Number", 34, Enum.Font.GothamBlack)
massNumber.TextXAlignment = Enum.TextXAlignment.Left
massNumber.Position = UDim2.fromOffset(0, 18)
massNumber.Size = UDim2.new(1, 0, 0, 38)
local massGain = text(panel, "Gain", 16, Enum.Font.GothamBlack, ORANGE)
massGain.TextXAlignment = Enum.TextXAlignment.Left
massGain.Position = UDim2.fromOffset(0, -22)
massGain.Size = UDim2.new(1, 0, 0, 20)
massGain.TextTransparency = 1
local bar = Instance.new("Frame")
bar.Name = "Bar"
bar.Position = UDim2.fromOffset(0, 62)
bar.Size = UDim2.new(1, 0, 0, 6)
bar.BackgroundColor3 = Color3.fromRGB(60, 60, 66)
bar.BorderSizePixel = 0
bar.Parent = panel
corner(bar, 3)
local fill = Instance.new("Frame")
fill.Size = UDim2.fromScale(0, 1)
fill.BackgroundColor3 = Color3.new(1, 1, 1)
fill.BorderSizePixel = 0
fill.Parent = bar
corner(fill, 3)
local grad = Instance.new("UIGradient")
grad.Color = ColorSequence.new(ORANGE_DARK, ORANGE)
grad.Parent = fill
for _, f in { 0.25, 0.5, 0.75 } do
	local tick = Instance.new("Frame")
	tick.BackgroundColor3 = PANEL
	tick.BorderSizePixel = 0
	tick.Position = UDim2.fromScale(f, 0)
	tick.Size = UDim2.new(0, 2, 1, 0)
	tick.ZIndex = 2
	tick.Parent = bar
end
local tierName = text(panel, "TierName", 12, Enum.Font.GothamBold, DIM)
tierName.TextXAlignment = Enum.TextXAlignment.Left
tierName.Position = UDim2.fromOffset(0, 74)
tierName.Size = UDim2.new(1, 0, 0, 16)
local nextLine = Instance.new("TextLabel")
nextLine.Name = "Next"
nextLine.BackgroundTransparency = 1
nextLine.RichText = true
nextLine.Font = Enum.Font.GothamBold
nextLine.TextSize = 12
nextLine.TextColor3 = Color3.new(1, 1, 1)
nextLine.TextXAlignment = Enum.TextXAlignment.Left
nextLine.TextWrapped = true
nextLine.Position = UDim2.fromOffset(0, 92)
nextLine.Size = UDim2.new(1, 0, 0, 30)
nextLine.Parent = panel

-- Combo / power-up status (next to the mass panel).
local status = text(gui, "Status", 18, Enum.Font.GothamBlack, ORANGE)
status.AnchorPoint = Vector2.new(0, 1)
status.Position = UDim2.new(0, 288, 1, -30)
status.Size = UDim2.fromOffset(220, 80)
status.TextXAlignment = Enum.TextXAlignment.Left
status.TextYAlignment = Enum.TextYAlignment.Bottom
shadow(status)

-- Controls legend (bottom-right).
local legend = text(gui, "Legend", 12, Enum.Font.GothamBold, ORANGE)
legend.AnchorPoint = Vector2.new(1, 1)
legend.Position = UDim2.new(1, -20, 1, -20)
legend.Size = UDim2.fromOffset(320, 18)
legend.TextXAlignment = Enum.TextXAlignment.Right
legend.Text = "WASD MOVE · SPACE DASH · DRAG LOOK"
shadow(legend)

-- Results card.
local results = Instance.new("Frame")
results.Name = "Results"
results.AnchorPoint = Vector2.new(0.5, 0.5)
results.Position = UDim2.fromScale(0.5, 0.5)
results.Size = UDim2.fromOffset(460, 300)
results.BackgroundColor3 = PANEL
results.BackgroundTransparency = 0.1
results.Visible = false
results.Parent = gui
corner(results, 14)
local resultsTitle = text(results, "Title", 30, Enum.Font.GothamBlack, ORANGE)
resultsTitle.Size = UDim2.new(1, 0, 0, 60)
local resultsBody = text(results, "Body", 16, Enum.Font.GothamBold)
resultsBody.Position = UDim2.fromOffset(24, 64)
resultsBody.Size = UDim2.new(1, -48, 1, -80)
resultsBody.TextXAlignment = Enum.TextXAlignment.Left
resultsBody.TextYAlignment = Enum.TextYAlignment.Top

-- Mass panel refresh ----------------------------------------------------------------------------
local shownMass = 0
local function refreshMass()
	local mass = player:GetAttribute("Mass") :: number? or WebConfig.growth.startMass
	local value, unit = Growth.massText(mass)
	massNumber.Text = string.format('%s <font size="16">%s</font>', value, string.upper(unit))
	massNumber.RichText = true
	local cls = Growth.classForPower(Growth.diameterForMass(mass))
	local tier = Growth.tierForClass(cls)
	tierChip.Text = "TIER " .. tier
	tierName.Text = string.upper(Growth.tierName(tier))
	local nextCls, nextMass, frac = Growth.progress(mass)
	fill.Size = UDim2.fromScale(frac, 1)
	if nextCls and nextMass then
		local nv, nu = Growth.massText(nextMass)
		nextLine.Text = string.format('NEXT · <font color="#ffb347">%s</font> · %s %s', string.upper(Growth.classLabel(nextCls)), nv, nu)
	else
		nextLine.Text = "MAX SIZE"
	end
	shownMass = mass
end
player:GetAttributeChangedSignal("Mass"):Connect(refreshMass)
refreshMass()

local gainToken = 0
local function popGain(gain: number)
	gainToken += 1
	local mine = gainToken
	local v, u = Growth.massText(gain)
	massGain.Text = "+" .. v .. " " .. u
	massGain.Position = UDim2.fromOffset(0, -22)
	massGain.TextTransparency = 0
	TweenService:Create(massGain, TweenInfo.new(0.7), { Position = UDim2.fromOffset(0, -40), TextTransparency = 1 }):Play()
	massNumber.TextSize = 39
	TweenService:Create(massNumber, TweenInfo.new(0.16), { TextSize = 34 }):Play()
	task.delay(0.8, function()
		if gainToken == mine then
			massGain.TextTransparency = 1
		end
	end)
end

-- Events -----------------------------------------------------------------------------------
local comboText = ""
local comboUntil = 0
AbsorbedEvent.OnClientEvent:Connect(function(info: { [string]: any })
	popGain(info.gain)
	if info.cls >= 3 then
		sndBig:Play()
	else
		sndPop.PlaybackSpeed = 1 + math.random() * 0.2
		sndPop:Play()
	end
	if info.combo then
		comboText = string.format("Combo ×%.1f", info.combo)
		comboUntil = os.clock() + WebConfig.arena.comboWindow
	end
	if info.power == "speed" then
		showToast("⚡ Speed " .. WebConfig.arena.speedSeconds .. "s", Color3.fromHex("3fa9ff"))
	elseif info.power == "magnet" then
		showToast("🧲 Magnet " .. WebConfig.arena.magnetSeconds .. "s", Color3.fromHex("b05cff"))
	elseif info.power == "shield" then
		showToast("🛡 Shield " .. WebConfig.arena.shieldSeconds .. "s", Color3.fromHex("3fe0c0"))
	end
end)

NoticeEvent.OnClientEvent:Connect(function(n: { [string]: any })
	if n.kind == "unlock" then
		sndBig:Play()
		showBanner("UNLOCKED: " .. string.upper(Growth.classLabel(n.cls)), "SIZE CLASS " .. n.cls, 1.6)
	elseif n.kind == "tier" then
		sndTier:Play()
		showBanner("TIER " .. n.tier, "NOW EATING: " .. string.upper(Growth.classLabel(n.cls)), 2.4)
	elseif n.kind == "landmarkOpen" then
		local t = CITY_TEXT[n.city]
		sndTier:Play()
		showBanner("LANDMARK OPEN!", "TOPPLE THE " .. string.upper(t and t.landmark or "LANDMARK"), 2.6)
	elseif n.kind == "landmarkDown" then
		local t = CITY_TEXT[n.city]
		sndTier:Play()
		showBanner(string.upper(t and t.landmark or "LANDMARK") .. " DOWN!", n.name .. " · LANDMARK BONUS +25%", 3)
	elseif n.kind == "ate" then
		sndBig:Play()
		local v, u = Growth.massText(n.gain)
		showBanner("ATE " .. string.upper(n.name) .. "!", "+" .. v .. " " .. string.upper(u) .. (if n.first then " · FIRST BLOOD" else ""), 2)
	elseif n.kind == "eaten" then
		sndEaten:Play()
		showBanner("YOU GOT EATEN", "Eaten by " .. n.name .. " · respawning", 2.4)
	end
end)

local function fmt(seconds: number): string
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

local lastPhase = ""
RoundEvent.OnClientEvent:Connect(function(msg: { [string]: any })
	local p = msg.phase
	local t = CITY_TEXT[msg.city or ""]
	local cityLine = if t then string.format("%s · %s %d/%d", t.city, t.landmark, msg.climaxEaten or 0, msg.climaxTotal or 0) else ""
	results.Visible = p == "Results"
	if p == "Intermission" then
		timer.Text = fmt(msg.timeLeft)
		subline.Text = "Next round in " .. tostring(msg.timeLeft) .. " · " .. (if t then t.city else "")
		lockLine.Text = "Drive around — eating starts with the round"
		center.Text = ""
		centerSub.Text = ""
	elseif p == "Waiting" then
		timer.Text = ""
		subline.Text = "Waiting for players…"
		lockLine.Text = ""
	elseif p == "Countdown" then
		sndBeep.PlaybackSpeed = 1
		sndBeep:Play()
		center.Text = tostring(msg.timeLeft)
		centerSub.Text = "GET READY"
		timer.Text = fmt(WebConfig.arena.roundSeconds)
		subline.Text = cityLine
		lockLine.Text = ""
	elseif p == "Round" then
		timer.Text = fmt(msg.timeLeft)
		subline.Text = cityLine
		if msg.go then
			sndBeep.PlaybackSpeed = 1.6
			sndBeep:Play()
			center.Text = "GO"
			centerSub.Text = "EAT!"
			task.delay(1.2, function()
				if center.Text == "GO" then
					center.Text = ""
					centerSub.Text = ""
				end
			end)
		end
		if msg.landmarkIn and msg.landmarkIn > 0 then
			lockLine.Text = "🔒 Landmark opens in " .. fmt(msg.landmarkIn)
		elseif msg.landmarkIn == 0 and lastPhase == "Round" then
			lockLine.Text = if workspace:GetAttribute("LandmarkOpen") then "🔓 Topple it now!" else ""
		end
	elseif p == "Results" then
		center.Text = ""
		centerSub.Text = ""
		lockLine.Text = ""
		local rows = msg.rows or {}
		local champion = rows[1]
		resultsTitle.Text = if champion then "👑 " .. champion.name else "Round over"
		local lines = {}
		for i, r in rows do
			local v, u = Growth.massText(r.mass)
			table.insert(lines, string.format("%d.  %s   %s %s · ate %d", i, r.name, v, u, r.eaten))
			if i >= 8 then
				break
			end
		end
		resultsBody.Text = table.concat(lines, "\n")
	end
	lastPhase = p
end)

-- Combo and power-up timers.
RunService.Heartbeat:Connect(function()
	local lines = {}
	if os.clock() < comboUntil and comboText ~= "" then
		table.insert(lines, comboText)
	end
	local machines = workspace:FindFirstChild("Machines")
	local m = machines and machines:FindFirstChild(player.Name)
	local root = m and m:FindFirstChild("Root")
	if root then
		local t = workspace:GetServerTimeNow()
		for _, p in { { "SpeedUntil", "⚡ Speed" }, { "MagnetUntil", "🧲 Magnet" }, { "ShieldUntil", "🛡 Shield" } } do
			local untilT = root:GetAttribute(p[1]) :: number? or 0
			if untilT > t then
				table.insert(lines, string.format("%s %ds", p[2], math.ceil(untilT - t)))
			end
		end
	end
	status.Text = table.concat(lines, "\n")
	local _ = shownMass
end)
