--!strict
-- GROW EVERYTHING (Roblox) HUD, after the web game's (ui/Hud.ts + arena/ArenaUi.ts):
--  top centre: round timer, "City · Landmark n/total", landmark lock line; centre: countdown / GO;
--  bottom-left: MASS panel (TIER chip, kg/t, progress bar with ticks, tier name, NEXT · class · mass)
--  with the "+N kg" pop; next to it combo and power-up timers; top banner for unlocks, tiers and
--  landmark moments; toasts; bottom-right controls legend; results card.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local AbsorbedEvent = remotes:WaitForChild("Absorbed") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent
local NoticeEvent = remotes:WaitForChild("Notice") :: RemoteEvent
local Feel = require(script.Parent:WaitForChild("Feel"))

local ORANGE = Color3.fromHex("ffb347")
local ORANGE_DARK = Color3.fromHex("d97a14")
local PANEL = Color3.fromRGB(16, 17, 20)
local DIM = Color3.fromRGB(170, 170, 176)

local CITY_TEXT: { [string]: { city: string, landmark: string } } = {
	shanghai = { city = "Shanghai", landmark = "Oriental Pearl Tower" },
	newyork = { city = "New York", landmark = "Empire State Building" },
	paris = { city = "Paris", landmark = "Eiffel Tower" },
}

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
legend.Position = UDim2.new(1, -20, 1, -18)
legend.Size = UDim2.fromOffset(320, 18)
legend.TextXAlignment = Enum.TextXAlignment.Right
legend.Text = "WASD MOVE · SPACE DASH · DRAG LOOK"
shadow(legend)

-- Results card.
local results = Instance.new("Frame")
results.Name = "Results"
results.AnchorPoint = Vector2.new(0.5, 0.5)
results.Position = UDim2.fromScale(0.5, 0.5)
results.Size = UDim2.fromOffset(560, 340)
results.BackgroundColor3 = PANEL
results.BackgroundTransparency = 0.1
results.Visible = false
results.Parent = gui
corner(results, 14)
local resultsTitle = text(results, "Title", 30, Enum.Font.GothamBlack, ORANGE)
resultsTitle.Size = UDim2.new(1, 0, 0, 60)
resultsTitle.TextSize = 22
local resultsBody = text(results, "Body", 16, Enum.Font.GothamBold)
resultsBody.Position = UDim2.fromOffset(24, 64)
resultsBody.Size = UDim2.new(1, -48, 1, -80)
resultsBody.TextXAlignment = Enum.TextXAlignment.Left
resultsBody.TextYAlignment = Enum.TextYAlignment.Top

-- Leaderboard (top-right, 230 px): survivors by mass; ♥ lives; 👑 leader; your row adds detail.
local board = Instance.new("Frame")
board.Name = "Leaderboard"
board.AnchorPoint = Vector2.new(1, 0)
board.Position = UDim2.new(1, -16, 0, 16)
board.Size = UDim2.fromOffset(250, 40)
board.AutomaticSize = Enum.AutomaticSize.Y
board.BackgroundColor3 = PANEL
board.BackgroundTransparency = 0.25
board.Parent = gui
corner(board, 10)
local boardPad = Instance.new("UIPadding")
boardPad.PaddingTop = UDim.new(0, 8)
boardPad.PaddingBottom = UDim.new(0, 8)
boardPad.PaddingLeft = UDim.new(0, 10)
boardPad.PaddingRight = UDim.new(0, 10)
boardPad.Parent = board
local boardList = Instance.new("UIListLayout")
boardList.Padding = UDim.new(0, 4)
boardList.SortOrder = Enum.SortOrder.LayoutOrder
boardList.Parent = board
local SLOT = {
	Color3.fromHex("ffb347"), Color3.fromHex("5ec8ff"), Color3.fromHex("ff6b8a"),
	Color3.fromHex("8be07a"), Color3.fromHex("c89bff"), Color3.fromHex("f5f07a"),
}
local function renderBoard(rows: { any })
	for _, c in board:GetChildren() do
		if c:IsA("Frame") then
			c:Destroy()
		end
	end
	for i, r in rows do
		local row = Instance.new("Frame")
		row.BackgroundTransparency = 1
		row.Size = UDim2.new(1, 0, 0, if r.userId == player.UserId then 34 else 18)
		row.LayoutOrder = i
		row.Parent = board
		local chip = Instance.new("Frame")
		chip.BackgroundColor3 = SLOT[(r.slot - 1) % #SLOT + 1]
		chip.BorderSizePixel = 0
		chip.Position = UDim2.fromOffset(14, 5)
		chip.Size = UDim2.fromOffset(8, 8)
		chip.Parent = row
		local rank = text(row, "Rank", 12, Enum.Font.GothamBold, DIM)
		rank.Text = tostring(i)
		rank.Size = UDim2.fromOffset(12, 18)
		local name = text(row, "Name", 13, Enum.Font.GothamBold)
		name.TextXAlignment = Enum.TextXAlignment.Left
		name.Position = UDim2.fromOffset(28, 0)
		name.Size = UDim2.new(1, -110, 0, 18)
		name.TextTruncate = Enum.TextTruncate.AtEnd
		name.Text = (if i == 1 then "👑 " else "") .. r.name .. (if r.userId == player.UserId then " (you)" else "")
		local v, u = Growth.massText(r.mass)
		local mass = text(row, "Mass", 13, Enum.Font.GothamBlack)
		mass.TextXAlignment = Enum.TextXAlignment.Right
		mass.AnchorPoint = Vector2.new(1, 0)
		mass.Position = UDim2.new(1, 0, 0, 0)
		mass.Size = UDim2.fromOffset(80, 18)
		mass.Text = string.rep("♥", r.lives) .. "  " .. v .. " " .. u
		mass.TextColor3 = if r.userId == player.UserId then ORANGE else Color3.new(1, 1, 1)
		if r.userId == player.UserId then
			local extra = text(row, "Extra", 11, Enum.Font.Gotham, DIM)
			extra.TextXAlignment = Enum.TextXAlignment.Left
			extra.Position = UDim2.fromOffset(28, 17)
			extra.Size = UDim2.new(1, -28, 0, 14)
			extra.Text = string.format("ate %d · %s%s", r.objects, string.upper(string.sub(r.look, 1, 1)) .. string.sub(r.look, 2), if not r.alive then " · out" else "")
		end
		if not r.alive then
			for _, l in row:GetDescendants() do
				if l:IsA("TextLabel") then
					l.TextTransparency = 0.55
				end
			end
		end
	end
end

-- Kill feed (right side, under the leaderboard): at most 5 lines, 5 s each.
local feedFrame = Instance.new("Frame")
feedFrame.Name = "Feed"
feedFrame.BackgroundTransparency = 1
feedFrame.AnchorPoint = Vector2.new(1, 0)
feedFrame.Position = UDim2.new(1, -16, 0, 200)
feedFrame.Size = UDim2.fromOffset(320, 140)
feedFrame.Parent = gui
local feedList = Instance.new("UIListLayout")
feedList.Padding = UDim.new(0, 4)
feedList.HorizontalAlignment = Enum.HorizontalAlignment.Right
feedList.SortOrder = Enum.SortOrder.LayoutOrder
feedList.Parent = feedFrame
local feedOrder = 0
local TONES = { kill = Color3.fromRGB(255, 90, 90), bonus = ORANGE, bad = Color3.fromRGB(255, 120, 180), info = Color3.fromRGB(200, 200, 210) }
local function addFeed(s: string, tone: string?)
	feedOrder += 1
	local l = text(feedFrame, "Line", 13, Enum.Font.GothamBold)
	l.AutomaticSize = Enum.AutomaticSize.X
	l.Size = UDim2.fromOffset(0, 22)
	l.BackgroundTransparency = 0.3
	l.BackgroundColor3 = PANEL
	l.Text = "  " .. s .. "  "
	l.LayoutOrder = feedOrder
	local stroke = Instance.new("UIStroke")
	stroke.Color = TONES[tone or "info"] or TONES.info
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = l
	corner(l, 6)
	local lines = {}
	for _, c in feedFrame:GetChildren() do
		if c:IsA("TextLabel") then
			table.insert(lines, c)
		end
	end
	table.sort(lines, function(a, b)
		return a.LayoutOrder < b.LayoutOrder
	end)
	while #lines > 5 do
		(table.remove(lines, 1) :: TextLabel):Destroy()
	end
	task.delay(5, function()
		l:Destroy()
	end)
end

-- Minimap (184 px, north-up, refreshed every 90 ms; arena/ArenaUi.ts): class ≥ 6 objects and
-- landmark parts (green = you can eat it, landmark orange, grey while locked), crates as dots,
-- machines as slot-colour dots (red ring = can eat you, green = you can eat it, white = you).
local MAP = 184
local minimap = Instance.new("Frame")
minimap.Name = "Minimap"
minimap.AnchorPoint = Vector2.new(1, 1)
minimap.Position = UDim2.new(1, -20, 1, -46)
minimap.Size = UDim2.fromOffset(MAP, MAP)
minimap.BackgroundColor3 = PANEL
minimap.BackgroundTransparency = 0.35
minimap.ClipsDescendants = true
minimap.Parent = gui
corner(minimap, 10)
local mapPool: { Frame } = {}
local mapUsed = 0
local function mapDot(): Frame
	mapUsed += 1
	local f = mapPool[mapUsed]
	if not f then
		local nf = Instance.new("Frame")
		nf.BorderSizePixel = 0
		nf.AnchorPoint = Vector2.new(0.5, 0.5)
		local stroke = Instance.new("UIStroke")
		stroke.Name = "Ring"
		stroke.Thickness = 2
		stroke.Parent = nf
		local c = Instance.new("UICorner")
		c.Name = "Round"
		c.Parent = nf
		nf.Parent = minimap
		mapPool[mapUsed] = nf
		f = nf
	end
	f.Visible = true
	return f
end
local mapCity: any = nil
local mapCityId = ""
local function drawMinimap()
	local arena = workspace:FindFirstChild("Arena")
	local cityId = arena and arena:GetAttribute("City") :: string?
	if not cityId then
		minimap.Visible = false
		return
	end
	minimap.Visible = true
	if cityId ~= mapCityId then
		mapCityId = cityId
		mapCity = require(Shared:WaitForChild("Cities"):WaitForChild(cityId)) :: any
	end
	local b = mapCity.bounds
	local pad = 6
	local k = (MAP - pad * 2) / math.max(b.maxX - b.minX, b.maxZ - b.minZ)
	local function at(x: number, z: number): UDim2
		return UDim2.fromOffset(pad + (x - b.minX) * k, pad + (z - b.minZ) * k)
	end
	mapUsed = 0
	local myD = player:GetAttribute("Diameter") :: number? or WebConfig.growth.startDiameter
	local open = workspace:GetAttribute("LandmarkOpen") == true
	local objects = arena and arena:FindFirstChild("Objects")
	if objects then
		for _, m in objects:GetChildren() do
			local typeId = m:GetAttribute("Type") :: string?
			local def = typeId and WebConfig.objects[typeId]
			if def and m:GetAttribute("State") ~= "pulled" then
				local x, z = m:GetAttribute("X") :: number? or 0, m:GetAttribute("Z") :: number? or 0
				if def.power or def.bonus then
					local f = mapDot()
					f.Size = UDim2.fromOffset(4, 4)
					f.Rotation = 0
					f.BackgroundColor3 = if def.power == "speed" then Color3.fromHex("3fa9ff") elseif def.power == "magnet" then Color3.fromHex("b05cff") elseif def.power == "shield" then Color3.fromHex("3fe0c0") else Color3.fromHex("ffd35a")
					f.BackgroundTransparency = 0
					f.Position = at(x, z)
					;(f:FindFirstChild("Ring") :: UIStroke).Enabled = false
					;(f:FindFirstChild("Round") :: UICorner).CornerRadius = UDim.new(1, 0)
				elseif def.objectClass >= 6 or def.climax then
					local edible = myD >= Growth.requiredPower(typeId :: string) and (open or not def.climax) and m:GetAttribute("Anchored") ~= true
					local f = mapDot()
					f.Size = UDim2.fromOffset(math.max(2, def.size[1] * k), math.max(2, def.size[3] * k))
					f.Rotation = -math.deg(m:GetAttribute("Yaw") :: number? or 0)
					f.Position = at(x, z)
					;(f:FindFirstChild("Ring") :: UIStroke).Enabled = false
					;(f:FindFirstChild("Round") :: UICorner).CornerRadius = UDim.new(0, 0)
					if def.climax then
						f.BackgroundColor3 = if edible then ORANGE elseif not open then Color3.fromRGB(170, 176, 186) else ORANGE
						f.BackgroundTransparency = if edible then 0 elseif not open then 0.5 else 0.45
					else
						f.BackgroundColor3 = if edible then Color3.fromRGB(140, 224, 122) else Color3.fromRGB(210, 214, 220)
						f.BackgroundTransparency = if edible then 0.45 elseif def.objectClass >= 7 then 0.66 else 0.82
					end
				end
			end
		end
	end
	local machines = workspace:FindFirstChild("Machines")
	local myId = tostring(player:GetAttribute("ActorId"))
	if machines then
		for _, m in machines:GetChildren() do
			local root = m:FindFirstChild("Root") :: BasePart?
			if root then
				local p = root.Position / 10
				local d = root:GetAttribute("Diameter") :: number? or 0.35
				local slot = root:GetAttribute("Slot") :: number? or 1
				local f = mapDot()
				f.Size = UDim2.fromOffset(9, 9)
				f.Rotation = 0
				f.BackgroundColor3 = SLOT[(slot - 1) % #SLOT + 1]
				f.BackgroundTransparency = 0
				f.Position = at(p.X, p.Z)
				;(f:FindFirstChild("Round") :: UICorner).CornerRadius = UDim.new(1, 0)
				local ring = f:FindFirstChild("Ring") :: UIStroke
				ring.Enabled = true
				if m.Name == myId then
					ring.Color = Color3.new(1, 1, 1)
				elseif d >= myD * WebConfig.arena.eatRatio then
					ring.Color = Color3.fromRGB(255, 70, 70)
				elseif myD >= d * WebConfig.arena.eatRatio then
					ring.Color = Color3.fromRGB(110, 230, 110)
				else
					ring.Enabled = false
				end
			end
		end
	end
	for i = mapUsed + 1, #mapPool do
		mapPool[i].Visible = false
	end
end
task.spawn(function()
	while true do
		drawMinimap()
		task.wait(0.09)
	end
end)

-- Vehicle picker (between rounds, like the web lobby's "Pick a vehicle" with stat bars).
local PickEvent = remotes:WaitForChild("PickVehicle") :: RemoteEvent
local picker = Instance.new("Frame")
picker.Name = "VehiclePicker"
picker.AnchorPoint = Vector2.new(0.5, 1)
picker.Position = UDim2.new(0.5, 0, 1, -24)
picker.Size = UDim2.fromOffset(4 * 150 + 3 * 10, 150)
picker.BackgroundTransparency = 1
picker.Visible = false
picker.Parent = gui
local pickerList = Instance.new("UIListLayout")
pickerList.FillDirection = Enum.FillDirection.Horizontal
pickerList.Padding = UDim.new(0, 10)
pickerList.Parent = picker
local pickerTitle = text(picker, "Title", 14, Enum.Font.GothamBlack, ORANGE)
pickerTitle.Text = "PICK A VEHICLE"
pickerTitle.Position = UDim2.fromOffset(0, -24)
pickerTitle.Size = UDim2.new(1, 0, 0, 20)
pickerTitle.AnchorPoint = Vector2.new(0, 0)
local cards: { [string]: Frame } = {}
local STATS = { { "speed", "Speed" }, { "accel", "Accel" }, { "reach", "Reach" }, { "pull", "Pull" } }
for _, look in { "collector", "dozer", "racer", "magnet" } do
	local v = WebConfig.vehicles[look]
	local card = Instance.new("TextButton")
	card.Name = look
	card.AutoButtonColor = true
	card.Text = ""
	card.Size = UDim2.fromOffset(150, 150)
	card.BackgroundColor3 = PANEL
	card.BackgroundTransparency = 0.15
	card.Parent = picker
	corner(card, 10)
	local stroke = Instance.new("UIStroke")
	stroke.Name = "Selected"
	stroke.Color = ORANGE
	stroke.Thickness = 2
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = card
	local title = text(card, "Name", 16, Enum.Font.GothamBlack)
	title.Text = string.upper(v.name)
	title.Position = UDim2.fromOffset(0, 8)
	title.Size = UDim2.new(1, 0, 0, 20)
	local blurb = text(card, "Blurb", 11, Enum.Font.Gotham, DIM)
	blurb.Text = v.blurb
	blurb.TextWrapped = true
	blurb.Position = UDim2.fromOffset(8, 28)
	blurb.Size = UDim2.new(1, -16, 0, 28)
	for i, st in STATS do
		local y = 60 + (i - 1) * 20
		local lab = text(card, "L" .. i, 11, Enum.Font.GothamBold, DIM)
		lab.Text = st[2]
		lab.TextXAlignment = Enum.TextXAlignment.Left
		lab.Position = UDim2.fromOffset(10, y)
		lab.Size = UDim2.fromOffset(50, 16)
		local track = Instance.new("Frame")
		track.BackgroundColor3 = Color3.fromRGB(60, 60, 66)
		track.BorderSizePixel = 0
		track.Position = UDim2.fromOffset(58, y + 6)
		track.Size = UDim2.fromOffset(80, 5)
		track.Parent = card
		local fillBar = Instance.new("Frame")
		fillBar.BackgroundColor3 = ORANGE
		fillBar.BorderSizePixel = 0
		-- 0.7 … 1.4 maps to the bar (the four vehicles' range).
		fillBar.Size = UDim2.fromScale(math.clamp((v[st[1]] - 0.7) / 0.7, 0.08, 1), 1)
		fillBar.Parent = track
	end
	card.Activated:Connect(function()
		PickEvent:FireServer(look)
	end)
	cards[look] = card :: any
end
local function refreshPicker()
	local mine = player:GetAttribute("Look") :: string?
	for look, card in cards do
		(card:FindFirstChild("Selected") :: UIStroke).Enabled = look == mine
	end
end
player:GetAttributeChangedSignal("Look"):Connect(refreshPicker)
refreshPicker()

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
	Feel.absorb(info.cls, info.size)
	-- Pop at the intake; big objects (class ≥ 3) burst and shake by size relative to the machine.
	local machines = workspace:FindFirstChild("Machines")
	local m = machines and machines:FindFirstChild(tostring(player:GetAttribute("ActorId")))
	local root = m and m:FindFirstChild("Root") :: BasePart?
	if root then
		local d = root:GetAttribute("Diameter") :: number? or 0.35
		local intake = root.CFrame * CFrame.new(0, 0, -d * 0.3 * 10)
		if info.cls >= 3 then
			Feel.burst(intake.Position, ORANGE, 12, math.max(0.2, d * 2))
			Feel.trauma(WebConfig.feel.largePickupTrauma * math.min(1, info.size / d))
		else
			Feel.burst(intake.Position, Color3.new(1, 1, 1), 4, math.max(0.1, d))
		end
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
		Feel.play("unlock")
		showBanner("UNLOCKED: " .. string.upper(Growth.classLabel(n.cls)), "SIZE CLASS " .. n.cls, 1.6)
	elseif n.kind == "tier" then
		Feel.play("tier")
		Feel.pullBack(0.28, 1.6)
		Feel.trauma(WebConfig.feel.tierUpTrauma)
		showBanner("TIER " .. n.tier, "NOW EATING: " .. string.upper(Growth.classLabel(n.cls)), 2.4)
	elseif n.kind == "landmarkOpen" then
		local t = CITY_TEXT[n.city]
		Feel.play("unlock")
		showBanner("LANDMARK OPEN!", "TOPPLE THE " .. string.upper(t and t.landmark or "LANDMARK"), 2.6)
	elseif n.kind == "landmarkDown" then
		local t = CITY_TEXT[n.city]
		Feel.play("landmark")
		Feel.pullBack(0.35, 2.6)
		showBanner(string.upper(t and t.landmark or "LANDMARK") .. " DOWN!", n.name .. " · LANDMARK BONUS +25%", 3)
	elseif n.kind == "ate" then
		Feel.play("burp")
		Feel.trauma(0.5)
		local v, u = Growth.massText(n.gain)
		showBanner("ATE " .. string.upper(n.name) .. "!", "+" .. v .. " " .. string.upper(u) .. (if n.first then " · FIRST BLOOD" else ""), 2)
	elseif n.kind == "eaten" then
		Feel.play("eaten")
		Feel.trauma(0.7)
		if n.lives and n.lives <= 0 then
			showBanner("ELIMINATED", "Eaten by " .. n.name .. " · spectating", 3)
		else
			showBanner("YOU GOT EATEN", "Eaten by " .. n.name .. " · " .. tostring(n.lives) .. " lives left", 2.4)
			center.Text = tostring(WebConfig.arena.respawnDelay)
			centerSub.Text = "RESPAWNING"
			for t = WebConfig.arena.respawnDelay - 1, 1, -1 do
				task.delay(WebConfig.arena.respawnDelay - t, function()
					if centerSub.Text == "RESPAWNING" then
						center.Text = tostring(t)
					end
				end)
			end
		end
	elseif n.kind == "respawn" then
		center.Text = ""
		centerSub.Text = ""
		showToast("RESPAWN · " .. WebConfig.arena.invulnerableSeconds .. " s INVULNERABLE")
	elseif n.kind == "crash" then
		showToast(n.text, Color3.fromRGB(255, 120, 120))
		addFeed("Dashed into something too big: stunned, mass lost", "bad")
	elseif n.kind == "feed" then
		addFeed(n.text, n.tone)
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
	Feel.music(msg.city)
	Feel.tension(p == "Round" and (msg.timeLeft or 999) <= 30)
	picker.Visible = p == "Intermission" or p == "Waiting"
	if msg.board then
		renderBoard(msg.board)
	end
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
		Feel.play("beep_low")
		center.Text = tostring(msg.timeLeft)
		centerSub.Text = "GET READY"
		timer.Text = fmt(WebConfig.arena.roundSeconds)
		subline.Text = cityLine
		lockLine.Text = ""
	elseif p == "Round" then
		timer.Text = fmt(msg.timeLeft)
		subline.Text = cityLine
		if msg.go then
			Feel.play("beep_high")
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
		if champion and champion.userId == player.UserId then
			Feel.play("win")
			Feel.victory()
		end
		resultsTitle.Text = "Round over"
		local lines = {}
		if champion then
			local v, u = Growth.massText(champion.mass)
			resultsTitle.Text = "👑 Champion · " .. champion.name .. " · " .. v .. " " .. u
		end
		table.insert(lines, "#   Player            Mass        Eats  Eaten  Items")
		for i, r in rows do
			local v, u = Growth.massText(r.mass)
			table.insert(lines, string.format("%d   %-16s  %8s %-2s  %4d  %5d  %5d%s", i, string.sub(r.name, 1, 16), v, u, r.kills, r.deaths, r.objects, if r.alive then "" else " · out"))
			if i >= 8 then
				break
			end
		end
		if msg.awards and #msg.awards > 0 then
			table.insert(lines, "")
			for _, a in msg.awards do
				table.insert(lines, a)
			end
		end
		resultsBody.Text = table.concat(lines, "\n")
		resultsBody.Font = Enum.Font.RobotoMono
		resultsBody.TextSize = 14
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
	local m = machines and machines:FindFirstChild(tostring(player:GetAttribute("ActorId")))
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
