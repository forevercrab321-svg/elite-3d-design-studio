--!strict
-- GROW EVERYTHING (Roblox) HUD: round timer, your size, bite toasts and a pop effect.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local AteEvent = remotes:WaitForChild("Ate") :: RemoteEvent
local EatenEvent = remotes:WaitForChild("Eaten") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent

local gui = Instance.new("ScreenGui")
gui.Name = "GrowHud"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = false
gui.Parent = player:WaitForChild("PlayerGui")

local function label(name: string, pos: UDim2, anchor: Vector2, size: UDim2, textSize: number): TextLabel
	local l = Instance.new("TextLabel")
	l.Name = name
	l.Position = pos
	l.AnchorPoint = anchor
	l.Size = size
	l.BackgroundTransparency = 0.35
	l.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
	l.TextColor3 = Color3.new(1, 1, 1)
	l.Font = Enum.Font.GothamBold
	l.TextSize = textSize
	l.Text = ""
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 10)
	corner.Parent = l
	l.Parent = gui
	return l
end

local status = label("Status", UDim2.new(0.5, 0, 0, 12), Vector2.new(0.5, 0), UDim2.fromOffset(320, 40), 22)
local sizeLabel = label("Size", UDim2.new(0, 16, 1, -16), Vector2.new(0, 1), UDim2.fromOffset(220, 48), 24)
local toast = label("Toast", UDim2.new(0.5, 0, 0.72, 0), Vector2.new(0.5, 0.5), UDim2.fromOffset(360, 44), 22)
toast.Visible = false

local function fmt(seconds: number): string
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

local function refreshSize()
	local m = player:GetAttribute("Mass") :: number? or 0
	sizeLabel.Text = string.format("Size %s", if m >= 1000 then string.format("%.1fk", m / 1000) else tostring(math.floor(m)))
end
player:GetAttributeChangedSignal("Mass"):Connect(refreshSize)
refreshSize()

local toastToken = 0
local function showToast(text: string, color: Color3?)
	toastToken += 1
	local mine = toastToken
	toast.Text = text
	toast.TextColor3 = color or Color3.new(1, 1, 1)
	toast.Visible = true
	task.delay(1.6, function()
		if toastToken == mine then
			toast.Visible = false
		end
	end)
end

-- A quick expanding bubble where something was eaten (local only, purely visual).
local function pop(position: Vector3, size: number)
	local p = Instance.new("Part")
	p.Shape = Enum.PartType.Ball
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Material = Enum.Material.Neon
	p.Color = Color3.fromRGB(255, 210, 90)
	p.Transparency = 0.3
	local d = math.max(1, size)
	p.Size = Vector3.new(d, d, d) * 0.5
	p.Position = position
	p.Parent = workspace
	local t = TweenService:Create(p, TweenInfo.new(0.35), { Size = Vector3.new(d, d, d) * 1.4, Transparency = 1 })
	t:Play()
	t.Completed:Connect(function()
		p:Destroy()
	end)
end

AteEvent.OnClientEvent:Connect(function(kind: string, gain: number, position: Vector3, size: number)
	pop(position, size)
	if size >= 4 then
		showToast(string.format("Ate %s! +%d", kind, math.floor(gain)), Color3.fromRGB(255, 220, 120))
	end
end)

EatenEvent.OnClientEvent:Connect(function(by: string)
	showToast(string.format("%s ate you! Start small again", by), Color3.fromRGB(255, 120, 120))
end)

RoundEvent.OnClientEvent:Connect(function(msg: { [string]: any })
	local phase = msg.phase
	if phase == "Round" then
		status.Text = "Eat the city  " .. fmt(msg.timeLeft)
	elseif phase == "Intermission" then
		status.Text = "Next round in " .. tostring(msg.timeLeft)
	elseif phase == "Waiting" then
		status.Text = "Waiting for players…"
	elseif phase == "Landmark" then
		showToast(tostring(msg.name) .. " ATE THE LANDMARK!", Color3.fromRGB(255, 200, 60))
	elseif phase == "End" then
		status.Text = if msg.winner ~= "" then string.format("%s wins! (Size %d)", msg.winner, msg.size) else "Round over"
	end
end)
