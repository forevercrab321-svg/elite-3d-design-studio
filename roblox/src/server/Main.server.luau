--!strict
-- GROW EVERYTHING (Roblox) server: rounds, eating, growth, PvP and the cosmetic game pass.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local City = require(script.Parent:WaitForChild("City"))
local Machine = require(script.Parent:WaitForChild("Machine"))

-- Remotes (server → client only; the client never decides what was eaten).
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
for _, name in Config.REMOTES do
	local ev = Instance.new("RemoteEvent")
	ev.Name = name
	ev.Parent = remotes
end
remotes.Parent = ReplicatedStorage
local AteEvent = remotes:WaitForChild("Ate") :: RemoteEvent
local EatenEvent = remotes:WaitForChild("Eaten") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent

local mass: { [Player]: number } = {}
local colorIndex: { [Player]: number } = {}
local joined = 0
local appliedScale: { [Player]: number } = {}
local roundActive = false
-- Filled by the round loop: City.build waits for the models to load, which must not delay the
-- player handlers below (a player who joins during that wait would get no machine).
local edibles: Folder = Instance.new("Folder")

local function scaleFor(m: number): number
	return math.clamp((m / Config.START_MASS) ^ (1 / 3), 1, Config.MAX_SCALE)
end

local function reach(scale: number): number
	return Config.EAT_REACH * Config.CHARACTER_HEIGHT * scale
end

local function rootOf(player: Player): BasePart?
	local char = player.Character
	return if char then char:FindFirstChild("HumanoidRootPart") :: BasePart? else nil
end

local function updateStats(player: Player)
	local ls = player:FindFirstChild("leaderstats")
	local size = ls and ls:FindFirstChild("Size") :: IntValue?
	if size then
		size.Value = math.floor(mass[player] or 0)
	end
	player:SetAttribute("Mass", mass[player] or 0)
end

-- Scale the character only when it changed noticeably (ScaleTo is not free).
local function applyScale(player: Player, force: boolean?)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not char or not hum then
		return
	end
	local s = scaleFor(mass[player] or Config.START_MASS)
	local last = appliedScale[player] or 1
	if not force and math.abs(s - last) / last < 0.02 then
		return
	end
	appliedScale[player] = s
	pcall(function()
		char:ScaleTo(s)
	end)
	Machine.update(char, s)
	hum.WalkSpeed = math.min(Config.MAX_WALKSPEED, Config.BASE_WALKSPEED + Config.WALKSPEED_PER_SCALE * (s - 1))
	-- Web-game follow distance for this machine size (Config CAMERA_*).
	local size = Config.MACHINE_SIZE * s
	local back = Config.CAMERA_DIST_BASE + Config.CAMERA_DIST_PER_SIZE * size
	local up = Config.CAMERA_HEIGHT_BASE + Config.CAMERA_HEIGHT_PER_SIZE * size
	local zoom = math.sqrt(back * back + up * up)
	player.CameraMaxZoomDistance = zoom * (1 + Config.CAMERA_ZOOM_RANGE)
	player.CameraMinZoomDistance = zoom * (1 - Config.CAMERA_ZOOM_RANGE)
	player:SetAttribute("Scale", s)
end

local function addMass(player: Player, amount: number)
	mass[player] = (mass[player] or Config.START_MASS) + amount
	updateStats(player)
	applyScale(player)
end

local function resetPlayer(player: Player)
	mass[player] = Config.START_MASS
	appliedScale[player] = nil
	updateStats(player)
end

local function placeAtSpawn(player: Player)
	local root = rootOf(player)
	if root then
		root.CFrame = CFrame.new(City.spawnPoint())
	end
end

-- Cosmetic game pass: a trail behind the player. Never affects size or speed.
local function giveTrail(player: Player, char: Model)
	if Config.GAMEPASS_VIP_TRAIL == 0 then
		return
	end
	local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, Config.GAMEPASS_VIP_TRAIL)
	if not ok or not owns then
		return
	end
	local root = char:WaitForChild("HumanoidRootPart", 5) :: BasePart?
	if not root then
		return
	end
	local a0 = Instance.new("Attachment")
	a0.Position = Vector3.new(0, 1, 0)
	a0.Parent = root
	local a1 = Instance.new("Attachment")
	a1.Position = Vector3.new(0, -1, 0)
	a1.Parent = root
	local trail = Instance.new("Trail")
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.6
	trail.Color = ColorSequence.new(Color3.fromRGB(255, 200, 60), Color3.fromRGB(255, 80, 160))
	trail.Parent = root
end

local function onCharacter(player: Player, char: Model)
	local hum = char:WaitForChild("Humanoid", 10) :: Humanoid?
	if not hum then
		return
	end
	-- Fresh character = fresh start (death by falling, being eaten, or a new round).
	resetPlayer(player)
	Machine.attach(char, Machine.look(colorIndex[player] or 1), Machine.color(colorIndex[player] or 1))
	task.defer(function()
		placeAtSpawn(player)
		applyScale(player, true)
	end)
	giveTrail(player, char)
	hum.Died:Connect(function()
		resetPlayer(player)
	end)
end

local function onPlayerAdded(player: Player)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	local size = Instance.new("IntValue")
	size.Name = "Size"
	size.Parent = ls
	local wins = Instance.new("IntValue")
	wins.Name = "Wins"
	wins.Parent = ls
	ls.Parent = player
	joined += 1
	colorIndex[player] = joined
	resetPlayer(player)
	player.CharacterAdded:Connect(function(char)
		onCharacter(player, char)
	end)
	-- Anything the avatar loads later (hats, faces) is hidden too.
	player.CharacterAppearanceLoaded:Connect(function(char)
		Machine.hideBody(char)
	end)
	if player.Character then
		onCharacter(player, player.Character)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
-- Anyone who joined before this script got here (Studio Play joins immediately).
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

Players.PlayerRemoving:Connect(function(player: Player)
	mass[player] = nil
	appliedScale[player] = nil
	colorIndex[player] = nil
end)

-- Eating ------------------------------------------------------------------------------------

local function respawnLater(kindName: string)
	local kind = City.kind(kindName)
	if not kind or not kind.respawn then
		return
	end
	task.delay(Config.RESPAWN_SECONDS, function()
		if edibles.Parent then
			City.spawn(kind, edibles)
		end
	end)
end

local function eatModel(player: Player, model: Model)
	local size = model:GetAttribute("Size") :: number? or 0
	local gain = model:GetAttribute("Mass") :: number? or 0
	local kind = model:GetAttribute("Kind") :: string? or model.Name
	local respawn = model:GetAttribute("Respawn") == true
	local isLandmark = model:GetAttribute("Landmark") == true
	local pos = model:GetPivot().Position
	model:Destroy()
	addMass(player, gain)
	AteEvent:FireClient(player, kind, gain, pos, size)
	if respawn then
		respawnLater(kind)
	end
	if isLandmark then
		RoundEvent:FireAllClients({ phase = "Landmark", name = player.DisplayName, landmark = kind })
	end
end

local overlap = OverlapParams.new()
overlap.FilterType = Enum.RaycastFilterType.Include

local function eatTick()
	if not roundActive then
		return
	end
	overlap.FilterDescendantsInstances = { edibles }
	for player, m in mass do
		local root = rootOf(player)
		if root then
			local s = scaleFor(m)
			local r = Config.EAT_RADIUS * Config.CHARACTER_HEIGHT * s + 1
			local limit = reach(s)
			local seen: { [Model]: boolean } = {}
			for _, p in workspace:GetPartBoundsInRadius(root.Position, r, overlap) do
				local model = p:FindFirstAncestorOfClass("Model")
				if model and model.Parent == edibles and not seen[model] then
					seen[model] = true
					local size = model:GetAttribute("Size") :: number?
					if size and size <= limit then
						eatModel(player, model)
					end
				end
			end
		end
	end
	-- PvP: a clearly bigger player swallows a smaller one on contact.
	local list = Players:GetPlayers()
	for _, a in list do
		for _, b in list do
			if a ~= b and mass[a] and mass[b] then
				local ra, rb = rootOf(a), rootOf(b)
				local sa, sb = scaleFor(mass[a]), scaleFor(mass[b])
				if ra and rb and sa >= sb * Config.PVP_RATIO and (ra.Position - rb.Position).Magnitude <= Config.EAT_RADIUS * Config.CHARACTER_HEIGHT * sa + 2 then
					local gain = (mass[b] - Config.START_MASS) * Config.PVP_STEAL + Config.START_MASS
					EatenEvent:FireClient(b, a.DisplayName)
					AteEvent:FireClient(a, b.DisplayName, gain, rb.Position, sb * Config.CHARACTER_HEIGHT)
					resetPlayer(b)
					b:LoadCharacter()
					addMass(a, gain)
				end
			end
		end
	end
end

local acc = 0
RunService.Heartbeat:Connect(function(dt)
	acc += dt
	if acc >= Config.EAT_TICK then
		acc = 0
		eatTick()
	end
end)

-- Rounds ------------------------------------------------------------------------------------

local function broadcast(phase: string, timeLeft: number, extra: { [string]: any }?)
	local msg: { [string]: any } = { phase = phase, timeLeft = timeLeft }
	if extra then
		for k, v in extra do
			msg[k] = v
		end
	end
	RoundEvent:FireAllClients(msg)
end

task.spawn(function()
	-- The first city is built straight away so there is something to look at during intermission.
	edibles = City.build()
	while true do
		roundActive = false
		for t = Config.INTERMISSION_SECONDS, 1, -1 do
			broadcast("Intermission", t)
			task.wait(1)
		end
		while #Players:GetPlayers() < Config.MIN_PLAYERS_TO_START do
			broadcast("Waiting", 0)
			task.wait(1)
		end
		edibles = City.build()
		for _, player in Players:GetPlayers() do
			player:LoadCharacter()
		end
		roundActive = true
		for t = Config.ROUND_SECONDS, 1, -1 do
			broadcast("Round", t)
			task.wait(1)
		end
		roundActive = false
		local best: Player? = nil
		for player, m in mass do
			if not best or m > (mass[best] or 0) then
				best = player
			end
		end
		if best then
			local ls = best:FindFirstChild("leaderstats")
			local wins = ls and ls:FindFirstChild("Wins") :: IntValue?
			if wins then
				wins.Value += 1
			end
		end
		broadcast("End", 0, { winner = if best then best.DisplayName else "", size = if best then math.floor(mass[best] or 0) else 0 })
		task.wait(5)
	end
end)
