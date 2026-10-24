--!strict
-- GROW EVERYTHING (Roblox) server: rounds over the web cities, player machines, absorbing
-- (claims checked here, pull animation and mass on the server), growth, combo, landmark lock and
-- bonus, and machines eating machines. Numbers come from the web game (Shared.WebConfig).
--
-- Each machine is a Model in workspace.Machines with an invisible Root ball owned by its player:
-- the client drives it with the web movement rules (Play.client) through AlignPosition /
-- AlignOrientation, and draws the web machine model around it. Root attributes: UserId, Look,
-- Slot, Diameter (m), Mass (kg), Invulnerable, SpeedUntil, MagnetUntil, ShieldUntil (server time).

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local Collision = require(Shared:WaitForChild("Collision"))
local World = require(script.Parent:WaitForChild("World"))
local Models = require(script.Parent:WaitForChild("Models"))

local K = Config.STUDS_PER_METER
local A = WebConfig.arena
local G = WebConfig.growth
local CC = WebConfig.collection

-- Remotes ------------------------------------------------------------------------------------
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
for _, name in Config.REMOTES do
	local ev = Instance.new("RemoteEvent")
	ev.Name = name
	ev.Parent = remotes
end
remotes.Parent = ReplicatedStorage
local ClaimEvent = remotes:WaitForChild("Claim") :: RemoteEvent
local AbsorbedEvent = remotes:WaitForChild("Absorbed") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent
local NoticeEvent = remotes:WaitForChild("Notice") :: RemoteEvent

local machinesFolder = Instance.new("Folder")
machinesFolder.Name = "Machines"
machinesFolder.Parent = workspace

-- Player state -------------------------------------------------------------------------------
type State = {
	player: Player,
	slot: number,
	look: string,
	vehicle: any,
	mass: number,
	diameter: number,
	model: Model?,
	root: BasePart?,
	alive: boolean,
	invulnerableUntil: number,
	combo: number,
	comboAt: number,
	eaten: number,
	kills: number,
	cls: number,
	tier: number,
	speedUntil: number,
	magnetUntil: number,
	shieldUntil: number,
}
local states: { [Player]: State } = {}
local joined = 0
local phase = "Loading"
local roundStart = 0
local landmarkOpen = false
local climaxTotal = 0
local climaxEaten = 0
local firstBlood = false

local function now(): number
	return workspace:GetServerTimeNow()
end

local function updateStats(st: State)
	local ls = st.player:FindFirstChild("leaderstats")
	local mass = ls and ls:FindFirstChild("Mass") :: IntValue?
	if mass then
		mass.Value = math.floor(st.mass)
	end
	st.player:SetAttribute("Mass", st.mass)
	st.player:SetAttribute("Diameter", st.diameter)
	local root = st.root
	if root then
		root:SetAttribute("Mass", st.mass)
		root:SetAttribute("Diameter", st.diameter)
		root.Size = Vector3.one * st.diameter * K
	end
end

-- Set mass, and tell the player when growth unlocks a class or a tier (ArenaGame announcements).
local function setMass(st: State, mass: number, quiet: boolean?)
	st.mass = math.max(G.startMass, mass)
	st.diameter = Growth.diameterForMass(st.mass)
	local cls = Growth.classForPower(st.diameter)
	local tier = Growth.tierForClass(cls)
	if not quiet and cls > st.cls then
		if tier > st.tier then
			NoticeEvent:FireClient(st.player, { kind = "tier", tier = tier, cls = cls })
		else
			NoticeEvent:FireClient(st.player, { kind = "unlock", cls = cls })
		end
	end
	st.cls = cls
	st.tier = tier
	updateStats(st)
end

local function machinePosition(st: State): (number, number, number, number)
	local root = st.root
	if not root then
		return 0, 0, 0, 0
	end
	local p = root.Position / K
	local look = root.CFrame.LookVector
	return p.X, p.Y - st.diameter / 2, p.Z, math.atan2(-look.X, -look.Z)
end

local function spawnPoint(st: State): (number, number, number)
	local city = World.city
	local spawns = city.spawns
	local sp = spawns[(st.slot - 1) % #spawns + 1]
	return sp.x, sp.z, sp.heading
end

-- (Re)create a player's machine at a spawn. The client drives it; the server owns the rules.
local function spawnMachine(st: State, x: number, z: number, heading: number)
	if st.model then
		st.model:Destroy()
	end
	local d = st.diameter
	local m = Instance.new("Model")
	m.Name = st.player.Name
	local root = Instance.new("Part")
	root.Name = "Root"
	root.Shape = Enum.PartType.Ball
	root.Size = Vector3.one * d * K
	root.Transparency = 1
	root.CanCollide = false
	root.CanQuery = false
	root.CanTouch = false
	root.CFrame = CFrame.new(x * K, (World.ground(x, z) + d / 2) * K, z * K) * CFrame.Angles(0, heading, 0)
	local att = Instance.new("Attachment")
	att.Parent = root
	local ap = Instance.new("AlignPosition")
	ap.Mode = Enum.PositionAlignmentMode.OneAttachment
	ap.Attachment0 = att
	ap.RigidityEnabled = true
	ap.Position = root.Position
	ap.Parent = root
	local ao = Instance.new("AlignOrientation")
	ao.Mode = Enum.OrientationAlignmentMode.OneAttachment
	ao.Attachment0 = att
	ao.RigidityEnabled = true
	ao.CFrame = root.CFrame.Rotation
	ao.Parent = root
	root:SetAttribute("UserId", st.player.UserId)
	root:SetAttribute("Look", st.look)
	root:SetAttribute("Slot", st.slot)
	root:SetAttribute("Name", st.player.DisplayName)
	root.Parent = m
	m.PrimaryPart = root
	m.Parent = machinesFolder
	root:SetNetworkOwner(st.player)
	st.model = m
	st.root = root
	st.alive = true
	st.invulnerableUntil = now() + A.invulnerableSeconds
	root:SetAttribute("InvulnerableUntil", st.invulnerableUntil)
	updateStats(st)
end

local function resetForRound(st: State, mass: number)
	st.combo, st.comboAt, st.eaten, st.kills = 0, 0, 0, 0
	st.speedUntil, st.magnetUntil, st.shieldUntil = 0, 0, 0
	st.cls, st.tier = 0, 1
	setMass(st, mass, true)
	local x, z, h = spawnPoint(st)
	spawnMachine(st, x, z, h)
end

local function medianMass(): number
	local list = {}
	for _, st in states do
		if st.alive then
			table.insert(list, st.mass)
		end
	end
	table.sort(list)
	return if #list > 0 then list[math.ceil(#list / 2)] else G.startMass
end

local function onPlayerAdded(player: Player)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	local mass = Instance.new("IntValue")
	mass.Name = "Mass"
	mass.Parent = ls
	local wins = Instance.new("IntValue")
	wins.Name = "Wins"
	wins.Parent = ls
	ls.Parent = player
	joined += 1
	local look = Config.MACHINE_LOOKS[(joined - 1) % #Config.MACHINE_LOOKS + 1]
	local st: State = {
		player = player,
		slot = joined,
		look = look,
		vehicle = WebConfig.vehicles[look],
		mass = G.startMass,
		diameter = G.startDiameter,
		model = nil,
		root = nil,
		alive = false,
		invulnerableUntil = 0,
		combo = 0,
		comboAt = 0,
		eaten = 0,
		kills = 0,
		cls = 0,
		tier = 1,
		speedUntil = 0,
		magnetUntil = 0,
		shieldUntil = 0,
	}
	states[player] = st
	if World.city then
		-- Drop in: a third of the field's median mass during a round (arena dropInMassShare).
		resetForRound(st, if phase == "Round" then math.max(G.startMass, medianMass() * A.dropInMassShare) else G.startMass)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
-- Anyone who joined before this script got here (Studio Play joins immediately).
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

Players.PlayerRemoving:Connect(function(player: Player)
	local st = states[player]
	if st and st.model then
		st.model:Destroy()
	end
	states[player] = nil
end)

-- Absorbing ------------------------------------------------------------------------------------

local function reach(st: State): number
	local magnet = if now() < st.magnetUntil then A.magnetMul else 1
	return (st.diameter / 2 + st.diameter * CC.reachFactor + CC.reachFlat) * st.vehicle.reach * magnet
end

ClaimEvent.OnServerEvent:Connect(function(player: Player, ids: any)
	local st = states[player]
	if phase ~= "Round" or not st or not st.alive or typeof(ids) ~= "table" then
		return
	end
	local x, _, z = machinePosition(st)
	local r = reach(st) * Config.CLAIM_SLACK
	for i, id in ids do
		if i > 64 then
			break
		end
		local o = typeof(id) == "number" and World.objects[id] or nil
		if o and World.eligible(o, st.diameter, landmarkOpen) then
			local rr = if o.radius * 2 < st.diameter * CC.vacuumSizeRatio then r * CC.vacuumReachMultiplier else r
			if Collision.circleVsObb(x, z, rr, World.box(o)) then
				World.startPull(o, player)
			end
		end
	end
end)

local function absorb(st: State, o: World.Obj)
	local def = o.def
	local base = def.rewardMass
	if def.bonus then
		base = math.max(base, st.mass * A.goldCrateShare)
	end
	local t = now()
	if t - st.comboAt <= A.comboWindow then
		st.combo += 1
	else
		st.combo = 1
	end
	st.comboAt = t
	local mult = math.min(A.comboMax, 1 + A.comboStep * (st.combo - 1))
	local gain = base * mult
	st.eaten += 1
	if def.power == "speed" then
		st.speedUntil = t + A.speedSeconds
	elseif def.power == "magnet" then
		st.magnetUntil = t + A.magnetSeconds
	elseif def.power == "shield" then
		st.shieldUntil = t + A.shieldSeconds
	end
	if st.root then
		st.root:SetAttribute("SpeedUntil", st.speedUntil)
		st.root:SetAttribute("MagnetUntil", st.magnetUntil)
		st.root:SetAttribute("ShieldUntil", st.shieldUntil)
	end
	local ox, oy, oz = o.x, o.y, o.z
	World.remove(o)
	setMass(st, st.mass + gain)
	AbsorbedEvent:FireClient(st.player, {
		label = def.label,
		gain = gain,
		combo = if st.combo >= 2 then mult else nil,
		cls = def.objectClass,
		power = def.power,
		position = Vector3.new(ox, oy + def.size[2] / 2, oz) * K,
		size = math.max(def.size[1], def.size[2], def.size[3]),
	})
	if def.climax then
		climaxEaten += 1
		workspace:SetAttribute("ClimaxEaten", climaxEaten)
		if climaxEaten >= climaxTotal then
			local bonus = st.mass * A.landmarkBonus
			setMass(st, st.mass + bonus)
			NoticeEvent:FireAllClients({ kind = "landmarkDown", name = st.player.DisplayName, city = World.city.id, bonus = bonus })
		end
	end
end

-- Machines eating machines (ArenaGame PvP rule: 1.25× diameter, centres overlapping).
local function pvp()
	local t = now()
	local list: { State } = {}
	for _, st in states do
		if st.alive and st.root then
			table.insert(list, st)
		end
	end
	for _, a in list do
		for _, b in list do
			if a ~= b and a.alive and b.alive and t > a.invulnerableUntil and t > b.invulnerableUntil and t > b.shieldUntil then
				if a.diameter >= b.diameter * A.eatRatio * a.vehicle.eatRatio then
					local ax, _, az = machinePosition(a)
					local bx, _, bz = machinePosition(b)
					if math.sqrt((ax - bx) ^ 2 + (az - bz) ^ 2) <= (a.diameter / 2) * A.eatReach + 0.2 * b.diameter then
						local gain = b.mass * A.eatGain * (if firstBlood then 1 else 1 + A.firstBloodBonus)
						local first = not firstBlood
						firstBlood = true
						a.kills += 1
						b.alive = false
						if b.model then
							b.model:Destroy()
							b.model = nil
							b.root = nil
						end
						setMass(a, a.mass + gain)
						NoticeEvent:FireClient(a.player, { kind = "ate", name = b.player.DisplayName, gain = gain, first = first })
						NoticeEvent:FireClient(b.player, { kind = "eaten", name = a.player.DisplayName })
						local keep = math.max(G.startMass, b.mass * A.respawnMassKeep)
						task.delay(A.respawnDelay, function()
							if states[b.player] == b and phase == "Round" then
								setMass(b, keep, true)
								local x, z, h = spawnPoint(b)
								spawnMachine(b, x, z, h)
							end
						end)
					end
				end
			end
		end
	end
end

RunService.Heartbeat:Connect(function(dt: number)
	World.stepFalling(dt)
	for _, o in World.objects do
		if o.state == "pulled" then
			local owner = o.owner
			local st = owner and states[owner]
			if not st or not st.alive or not st.root then
				-- Owner gone: drop back to idle where it is.
				o.state = "idle"
				o.y = World.ground(o.x, o.z)
				o.tilt = 0
				if o.model then
					o.model:SetAttribute("State", "idle")
				end
			else
				local x, y, z, heading = machinePosition(st)
				if World.stepPull(o, dt, x, z, y, heading, st.diameter, st.vehicle.pull) then
					absorb(st, o)
				end
			end
		end
	end
	if phase == "Round" then
		pvp()
	end
end)

-- Rounds -----------------------------------------------------------------------------------

local function broadcast(msg: { [string]: any })
	msg.city = World.city and World.city.id
	msg.climaxEaten = climaxEaten
	msg.climaxTotal = climaxTotal
	RoundEvent:FireAllClients(msg)
	workspace:SetAttribute("Phase", msg.phase)
end

-- Cosmetic game pass trail (never affects size or speed).
local function hasTrailPass(player: Player): boolean
	if Config.GAMEPASS_VIP_TRAIL == 0 then
		return false
	end
	local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, Config.GAMEPASS_VIP_TRAIL)
	return ok and owns == true
end
local _ = hasTrailPass

-- Machine models for every look and tier (clients clone them from ReplicatedStorage).
task.spawn(function()
	local names = {}
	for _, look in Config.MACHINE_LOOKS do
		for tier = 1, 5 do
			table.insert(names, string.format("Machine_%s_T%d", look, tier))
		end
	end
	Models.preload(names)
end)

task.spawn(function()
	local cityIndex = 0
	while true do
		cityIndex = cityIndex % #Config.CITIES + 1
		local cityId = Config.CITIES[cityIndex]
		phase = "Loading"
		workspace:SetAttribute("Phase", phase)
		landmarkOpen = false
		workspace:SetAttribute("LandmarkOpen", false)
		World.build(cityId)
		climaxTotal, climaxEaten, firstBlood = 0, 0, false
		for _, o in World.objects do
			if o.def.climax then
				climaxTotal += 1
			end
		end
		workspace:SetAttribute("ClimaxEaten", 0)
		workspace:SetAttribute("ClimaxTotal", climaxTotal)
		for _, st in states do
			resetForRound(st, G.startMass)
		end
		-- Lobby: drive around the new city; nothing can be eaten yet.
		phase = "Intermission"
		for t = Config.INTERMISSION_SECONDS, 1, -1 do
			broadcast({ phase = phase, timeLeft = t })
			task.wait(1)
		end
		while #Players:GetPlayers() < Config.MIN_PLAYERS_TO_START do
			broadcast({ phase = "Waiting", timeLeft = 0 })
			task.wait(1)
		end
		for _, st in states do
			resetForRound(st, G.startMass)
		end
		phase = "Countdown"
		for t = Config.COUNTDOWN_SECONDS, 1, -1 do
			broadcast({ phase = phase, timeLeft = t })
			task.wait(1)
		end
		phase = "Round"
		roundStart = os.clock()
		broadcast({ phase = phase, timeLeft = Config.ROUND_SECONDS, go = true })
		while true do
			task.wait(1)
			local elapsed = os.clock() - roundStart
			local left = math.max(0, math.ceil(Config.ROUND_SECONDS - elapsed))
			if not landmarkOpen and elapsed >= A.landmarkOpenSeconds then
				landmarkOpen = true
				workspace:SetAttribute("LandmarkOpen", true)
				NoticeEvent:FireAllClients({ kind = "landmarkOpen", city = cityId })
			end
			broadcast({ phase = phase, timeLeft = left, landmarkIn = math.max(0, math.ceil(A.landmarkOpenSeconds - elapsed)) })
			if left <= 0 or (climaxTotal > 0 and climaxEaten >= climaxTotal) then
				break
			end
		end
		phase = "Results"
		local ranking: { State } = {}
		for _, st in states do
			table.insert(ranking, st)
		end
		table.sort(ranking, function(a, b)
			return a.mass > b.mass
		end)
		local rows = {}
		for i, st in ranking do
			rows[i] = { name = st.player.DisplayName, mass = st.mass, eaten = st.eaten, kills = st.kills }
		end
		local best = ranking[1]
		if best then
			local ls = best.player:FindFirstChild("leaderstats")
			local wins = ls and ls:FindFirstChild("Wins") :: IntValue?
			if wins then
				wins.Value += 1
			end
		end
		broadcast({ phase = phase, timeLeft = Config.RESULTS_SECONDS, rows = rows })
		task.wait(Config.RESULTS_SECONDS)
	end
end)
