--!strict
-- GROW EVERYTHING (Roblox) server: the web arena's rules on the web cities.
-- Actors are players and AI rivals alike (AI fills the room to arena.maxPlayers). Each machine is
-- a Model in workspace.Machines with an invisible Root ball: a player's client drives its own
-- (Play.client, network-owned), the server drives the AI (Bot + shared Movement). The server owns
-- the rules: claims checked here, objects pulled in with the web formula, mass with combo and
-- catch-up, lives and respawns, machines eating machines, landmark lock and bonus, round end.
-- Root attributes: ActorId, Look, Slot, Name, IsBot, Diameter (m), Mass (kg), Lives,
-- InvulnerableUntil, SpeedUntil, MagnetUntil, ShieldUntil (server time).

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local Collision = require(Shared:WaitForChild("Collision"))
local Movement = require(Shared:WaitForChild("Movement"))
local World = require(script.Parent:WaitForChild("World"))
local Models = require(script.Parent:WaitForChild("Models"))
local Bot = require(script.Parent:WaitForChild("Bot"))
local Progress = require(script.Parent:WaitForChild("Progress"))

local K = Config.STUDS_PER_METER
local A = WebConfig.arena
local G = WebConfig.growth
local CC = WebConfig.collection
local BOT_NAMES = { "Rustbucket", "Magna", "Gearjaw", "Scrapper", "Hoover-9", "Chomp" }

-- Remotes ------------------------------------------------------------------------------------
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
for _, name in Config.REMOTES do
	local ev = Instance.new("RemoteEvent")
	ev.Name = name
	ev.Parent = remotes
end
for _, name in Config.FUNCTIONS do
	local fn = Instance.new("RemoteFunction")
	fn.Name = name
	fn.Parent = remotes
end
remotes.Parent = ReplicatedStorage
local ClaimEvent = remotes:WaitForChild("Claim") :: RemoteEvent
local CrashEvent = remotes:WaitForChild("Crash") :: RemoteEvent
local AbsorbedEvent = remotes:WaitForChild("Absorbed") :: RemoteEvent
local RoundEvent = remotes:WaitForChild("RoundState") :: RemoteEvent
local NoticeEvent = remotes:WaitForChild("Notice") :: RemoteEvent
local PickVehicleEvent = remotes:WaitForChild("PickVehicle") :: RemoteEvent
local HornEvent = remotes:WaitForChild("Horn") :: RemoteEvent
local InvitedEvent = remotes:WaitForChild("Invited") :: RemoteEvent
local ShopFunction = remotes:WaitForChild("Shop") :: RemoteFunction

local machinesFolder = Instance.new("Folder")
machinesFolder.Name = "Machines"
machinesFolder.Parent = workspace

-- Actors ---------------------------------------------------------------------------------------
type Actor = {
	id: string,
	kind: string, -- "player" | "bot"
	player: Player?,
	name: string,
	slot: number,
	look: string,
	vehicle: any,
	mass: number,
	diameter: number,
	body: Movement.Body,
	model: Model?,
	root: BasePart?,
	alive: boolean,
	lives: number,
	eliminatedAt: number,
	invulnerableUntil: number,
	combo: number,
	comboAt: number,
	objects: number,
	kills: number,
	deaths: number,
	cls: number,
	tier: number,
	speedUntil: number,
	magnetUntil: number,
	shieldUntil: number,
	bot: any,
	eatCooldown: { [string]: number },
	skin: string,
	hat: string,
	horn: string,
	hornAt: number,
}
local actors: { Actor } = {}
local byPlayer: { [Player]: Actor } = {}
local joined = 0
local phase = "Loading"
local roundStart = 0
local landmarkOpen = false
local climaxTotal = 0
local climaxEaten = 0
local firstBlood = false
local roundsPlayed = 0

local function now(): number
	return workspace:GetServerTimeNow()
end
local function matchTime(): number
	return if phase == "Round" then os.clock() - roundStart else 0
end

local function notice(a: Actor, msg: { [string]: any })
	if a.player then
		NoticeEvent:FireClient(a.player, msg)
	end
end
local function feed(text: string, tone: string?)
	NoticeEvent:FireAllClients({ kind = "feed", text = text, tone = tone or "info" })
end

local function sync(a: Actor)
	if a.player then
		local ls = a.player:FindFirstChild("leaderstats")
		local mass = ls and ls:FindFirstChild("Mass") :: IntValue?
		if mass then
			mass.Value = math.floor(a.mass)
		end
		a.player:SetAttribute("Mass", a.mass)
		a.player:SetAttribute("Diameter", a.diameter)
		a.player:SetAttribute("Lives", a.lives)
	end
	local root = a.root
	if root then
		root:SetAttribute("Mass", a.mass)
		root:SetAttribute("Diameter", a.diameter)
		root:SetAttribute("Lives", a.lives)
		root:SetAttribute("SpeedUntil", a.speedUntil)
		root:SetAttribute("MagnetUntil", a.magnetUntil)
		root:SetAttribute("ShieldUntil", a.shieldUntil)
		root.Size = Vector3.one * math.max(0.05, a.diameter * K)
	end
end

-- Set mass; tell a player when growth unlocks a class or a tier (ArenaGame announcements).
local function setMass(a: Actor, mass: number, quiet: boolean?)
	a.mass = math.max(G.startMass, mass)
	a.diameter = Growth.diameterForMass(a.mass)
	local cls = Growth.classForPower(a.diameter)
	local tier = Growth.tierForClass(cls)
	if not quiet and cls > a.cls then
		if tier > a.tier then
			notice(a, { kind = "tier", tier = tier, cls = cls })
		else
			notice(a, { kind = "unlock", cls = cls })
		end
	end
	a.cls = cls
	a.tier = tier
	sync(a)
end

-- Where a machine is: a player's from its (client-driven) root, an AI's from its body.
local function position(a: Actor): (number, number, number, number)
	local root = a.root
	if a.kind == "player" and root then
		local p = root.Position / K
		local look = root.CFrame.LookVector
		a.body.x, a.body.z = p.X, p.Z
		a.body.heading = math.atan2(-look.X, -look.Z)
	end
	return a.body.x, World.ground(a.body.x, a.body.z), a.body.z, a.body.heading
end

-- (Re)create a machine at a spawn point.
local function spawnMachine(a: Actor, x: number, z: number, heading: number)
	if a.model then
		a.model:Destroy()
	end
	a.body = Movement.new(x, z, heading)
	local d = a.diameter
	local m = Instance.new("Model")
	m.Name = a.id
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
	root:SetAttribute("ActorId", a.id)
	root:SetAttribute("UserId", if a.player then a.player.UserId else 0)
	root:SetAttribute("Look", a.look)
	root:SetAttribute("Slot", a.slot)
	root:SetAttribute("Name", a.name)
	root:SetAttribute("IsBot", a.kind == "bot")
	root:SetAttribute("Skin", a.skin)
	root:SetAttribute("Hat", a.hat)
	root:SetAttribute("Horn", a.horn)
	root.Parent = m
	m.PrimaryPart = root
	m.Parent = machinesFolder
	if a.player then
		root:SetNetworkOwner(a.player)
	end
	a.model = m
	a.root = root
	a.alive = true
	a.invulnerableUntil = now() + A.invulnerableSeconds
	root:SetAttribute("InvulnerableUntil", a.invulnerableUntil)
	sync(a)
end

local function slotSpawn(a: Actor): (number, number, number)
	local spawns = World.city.spawns
	local sp = spawns[(a.slot - 1) % #spawns + 1]
	return sp.x, sp.z, sp.heading
end

-- Respawn at the spawn farthest from the biggest rival (ArenaGame.respawn).
local function farSpawn(a: Actor): (number, number, number)
	local threat: Actor? = nil
	for _, b in actors do
		if b ~= a and b.alive and (not threat or b.mass > threat.mass) then
			threat = b
		end
	end
	if not threat then
		return slotSpawn(a)
	end
	local best, bestD = nil, -1
	for _, sp in World.city.spawns do
		local d = math.sqrt((sp.x - threat.body.x) ^ 2 + (sp.z - threat.body.z) ^ 2)
		if d > bestD then
			best, bestD = sp, d
		end
	end
	return best.x, best.z, best.heading
end

local function newActor(kind: string, player: Player?, name: string, slot: number, look: string): Actor
	local a: Actor = {
		id = if player then tostring(player.UserId) else ("bot" .. slot),
		kind = kind,
		player = player,
		name = name,
		slot = slot,
		look = look,
		vehicle = WebConfig.vehicles[look],
		mass = G.startMass,
		diameter = G.startDiameter,
		body = Movement.new(0, 0, 0),
		model = nil,
		root = nil,
		alive = false,
		lives = A.lives,
		eliminatedAt = 0,
		invulnerableUntil = 0,
		combo = 0,
		comboAt = 0,
		objects = 0,
		kills = 0,
		deaths = 0,
		cls = 0,
		tier = 1,
		speedUntil = 0,
		magnetUntil = 0,
		shieldUntil = 0,
		bot = nil,
		eatCooldown = {},
		skin = "stock",
		hat = "none",
		horn = "clown",
		hornAt = 0,
	}
	return a
end

local function resetForRound(a: Actor, mass: number)
	a.combo, a.comboAt, a.objects, a.kills, a.deaths = 0, 0, 0, 0, 0
	a.speedUntil, a.magnetUntil, a.shieldUntil = 0, 0, 0
	a.lives, a.eliminatedAt = A.lives, 0
	a.cls, a.tier = 0, 1
	a.eatCooldown = {}
	setMass(a, mass, true)
	local x, z, h = slotSpawn(a)
	spawnMachine(a, x, z, h)
end

local function removeActor(a: Actor)
	if a.model then
		a.model:Destroy()
	end
	local i = table.find(actors, a)
	if i then
		table.remove(actors, i)
	end
end

local function medianMass(): number
	local list = {}
	for _, a in actors do
		if a.alive then
			table.insert(list, a.mass)
		end
	end
	table.sort(list)
	return if #list > 0 then list[math.ceil(#list / 2)] else G.startMass
end

-- Cosmetics follow the player's equipped items (Progress publishes them as attributes).
local function applyCosmetics(a: Actor)
	local p = a.player
	if p then
		a.skin = p:GetAttribute("Skin") :: string? or "stock"
		a.hat = p:GetAttribute("Hat") :: string? or "none"
		a.horn = p:GetAttribute("Horn") :: string? or "clown"
	end
	if a.root then
		a.root:SetAttribute("Skin", a.skin)
		a.root:SetAttribute("Hat", a.hat)
		a.root:SetAttribute("Horn", a.horn)
	end
end

local function onPlayerAdded(player: Player)
	Progress.load(player)
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
	-- Take a free seat: replace an AI rival if the room is full of them (web drop-in).
	local slot = #actors + 1
	for _, b in actors do
		if b.kind == "bot" then
			slot = b.slot
			removeActor(b)
			break
		end
	end
	local a = newActor("player", player, player.DisplayName, slot, look)
	player:SetAttribute("ActorId", a.id)
	player:SetAttribute("Look", look)
	applyCosmetics(a)
	for _, attr in { "Skin", "Hat", "Horn" } do
		player:GetAttributeChangedSignal(attr):Connect(function()
			applyCosmetics(a)
		end)
	end
	table.insert(actors, a)
	byPlayer[player] = a
	if World.city then
		if phase == "Round" and matchTime() > Config.ROUND_SECONDS - A.dropInCutoffSeconds then
			a.alive = false -- too late to drop in: watch, play the next round
		else
			resetForRound(a, if phase == "Round" then math.max(G.startMass, medianMass() * A.dropInMassShare) else G.startMass)
			if phase == "Round" then
				feed(a.name .. " joined the match")
			end
		end
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
-- Anyone who joined before this script got here (Studio Play joins immediately).
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

Players.PlayerRemoving:Connect(function(player: Player)
	Progress.unload(player)
	local a = byPlayer[player]
	if a then
		removeActor(a)
		byPlayer[player] = nil
		if phase == "Round" then
			feed(a.name .. " left the match")
		end
	end
end)

-- Rules ------------------------------------------------------------------------------------------

local function canEat(a: Actor, b: Actor): boolean
	local t = now()
	if a == b or not a.alive or not b.alive or t < b.invulnerableUntil or t < a.invulnerableUntil or t < b.shieldUntil then
		return false
	end
	return a.diameter >= b.diameter * A.eatRatio * a.vehicle.eatRatio
end

local function botSkill(): number
	return math.clamp(A.botSkillRookie + (1 - A.botSkillRookie) * roundsPlayed / A.botSkillRounds, 0, 1)
end

-- Training wheels: a rookie AI spares a human worth less than (1 − skill) × 40% of its mass.
local function spares(a: Actor, b: Actor): boolean
	return a.kind == "bot" and b.kind ~= "bot" and b.mass < a.mass * (1 - botSkill()) * A.botRookieHumanPreyShare
end

local function eligible(o: World.Obj, power: number): boolean
	return World.eligible(o, power, landmarkOpen)
end

-- Object gain multiplier: catch-up when behind the leader, drag when far ahead (ArenaGame.catchUp).
local function catchUp(a: Actor): number
	local lead = 0
	for _, b in actors do
		if b.alive and b ~= a then
			lead = math.max(lead, b.mass)
		end
	end
	if lead <= 0 then
		return 1
	end
	if lead > a.mass then
		return 1 + A.catchUpMax * math.min(1, math.log(lead / a.mass) / math.log(A.catchUpFullRatio))
	end
	local ahead = a.mass / (lead * A.leaderDragFrom)
	return if ahead <= 1 then 1 else math.max(A.leaderDragMin, (1 / ahead) ^ A.leaderDragExp)
end

local function reach(a: Actor): number
	local magnet = if now() < a.magnetUntil then A.magnetMul else 1
	return (a.diameter / 2 + a.diameter * CC.reachFactor + CC.reachFlat) * a.vehicle.reach * magnet
end

-- Claim every eligible object in reach for this actor (checked against the server's state).
local function tryClaim(a: Actor, ids: { number }?, slack: number)
	local x, _, z = position(a)
	local r = reach(a) * slack
	local list: { World.Obj } = {}
	if ids then
		for i, id in ids do
			if i > 64 then
				break
			end
			local o = typeof(id) == "number" and World.objects[id] or nil
			if o then
				table.insert(list, o)
			end
		end
	else
		list = World.near(x, z, r * CC.vacuumReachMultiplier)
	end
	for _, o in list do
		if eligible(o, a.diameter) then
			local rr = if o.radius * 2 < a.diameter * CC.vacuumSizeRatio then r * CC.vacuumReachMultiplier else r
			if Collision.circleVsObb(x, z, rr, World.box(o)) then
				World.startPull(o, a)
			end
		end
	end
end

ClaimEvent.OnServerEvent:Connect(function(player: Player, ids: any)
	local a = byPlayer[player]
	if phase ~= "Round" or not a or not a.alive or typeof(ids) ~= "table" then
		return
	end
	tryClaim(a, ids, Config.CLAIM_SLACK)
end)

-- Lobby: pick one of the four web vehicles (between rounds only; it changes stats, not just looks).
PickVehicleEvent.OnServerEvent:Connect(function(player: Player, look: any)
	local a = byPlayer[player]
	if not a or typeof(look) ~= "string" or not WebConfig.vehicles[look] or not table.find(Config.MACHINE_LOOKS, look) then
		return
	end
	if phase ~= "Intermission" and phase ~= "Waiting" and phase ~= "Loading" then
		return
	end
	a.look = look
	a.vehicle = WebConfig.vehicles[look]
	player:SetAttribute("Look", look)
	if a.root then
		a.root:SetAttribute("Look", look)
	end
end)

ShopFunction.OnServerInvoke = function(player: Player, action: any, kind: any, id: any)
	if typeof(action) ~= "string" or typeof(kind) ~= "string" or typeof(id) ~= "string" then
		return false, "Bad request"
	end
	return Progress.shop(player, action, kind, id)
end

-- Horn (H / 📯): everyone hears the machine's equipped horn; at most one per second.
HornEvent.OnServerEvent:Connect(function(player: Player)
	local a = byPlayer[player]
	if a and a.alive and os.clock() - a.hornAt > 1 then
		a.hornAt = os.clock()
		NoticeEvent:FireAllClients({ kind = "horn", actor = a.id, horn = a.horn })
	end
end)

-- An invite sent (SocialService prompt closed with recipients) unlocks the Party Hat.
InvitedEvent.OnServerEvent:Connect(function(player: Player)
	local granted = Progress.gift(player, "share")
	if #granted > 0 then
		NoticeEvent:FireClient(player, { kind = "gift", items = granted })
	end
end)

-- A player's client reports dashing into something too big: the web penalty (3% of mass).
local function crash(a: Actor)
	local lost = math.max(0, (a.mass - G.startMass) * A.crashMassLoss)
	setMass(a, a.mass - lost, true)
	local v, u = Growth.massText(lost)
	notice(a, { kind = "crash", text = "CRASH · −" .. v .. " " .. string.upper(u) })
end
CrashEvent.OnServerEvent:Connect(function(player: Player)
	local a = byPlayer[player]
	if a and a.alive and phase == "Round" then
		crash(a)
	end
end)

local function absorb(a: Actor, o: World.Obj)
	local def = o.def
	local t = now()
	a.combo = if t - a.comboAt <= A.comboWindow then a.combo + 1 else 1
	a.comboAt = t
	local mult = math.min(A.comboMax, 1 + A.comboStep * (a.combo - 1))
	if def.power == "speed" then
		a.speedUntil = t + A.speedSeconds
	elseif def.power == "magnet" then
		a.magnetUntil = t + A.magnetSeconds
	elseif def.power == "shield" then
		a.shieldUntil = t + A.shieldSeconds
	end
	local gain = if def.bonus then math.max(def.rewardMass, a.mass * A.goldCrateShare) else def.rewardMass
	gain *= mult * catchUp(a)
	a.objects += 1
	local ox, oy, oz = o.x, o.y, o.z
	World.remove(o)
	local lastClimax = false
	if def.climax then
		climaxEaten += 1
		workspace:SetAttribute("ClimaxEaten", climaxEaten)
		if climaxEaten >= climaxTotal then
			lastClimax = true
			gain += a.mass * A.landmarkBonus
		end
	end
	setMass(a, a.mass + gain)
	if a.player then
		AbsorbedEvent:FireClient(a.player, {
			label = def.label,
			gain = gain,
			combo = if a.combo >= 2 then mult else nil,
			catchUp = catchUp(a),
			cls = def.objectClass,
			power = def.power,
			bonus = def.bonus,
			position = Vector3.new(ox, oy + def.size[2] / 2, oz) * K,
			size = math.max(def.size[1], def.size[2], def.size[3]),
		})
	end
	if def.bonus then
		local v, u = Growth.massText(gain)
		notice(a, { kind = "feed", text = "Golden crate +" .. v .. " " .. u, tone = "bonus" })
	end
	if lastClimax then
		NoticeEvent:FireAllClients({ kind = "landmarkDown", name = a.name, city = World.city.id })
		feed(a.name .. " ate the last piece of the landmark", "bonus")
	end
end

-- Machines eating machines (ArenaGame.proposeEats / applyEaten).
local function eatActor(a: Actor, b: Actor)
	local first = not firstBlood
	firstBlood = true
	local leader = true
	for _, c in actors do
		if c ~= b and c.alive and c.mass > b.mass then
			leader = false
		end
	end
	local gain = b.mass * A.eatGain * (if first then 1 + A.firstBloodBonus else 1) * (if leader then 1 + A.leaderBounty else 1)
	a.kills += 1
	b.deaths += 1
	b.lives = math.max(0, b.lives - 1)
	b.alive = false
	if b.model then
		b.model:Destroy()
		b.model = nil
		b.root = nil
	end
	setMass(a, a.mass + gain)
	local v, u = Growth.massText(gain)
	notice(a, { kind = "ate", name = b.name, gain = gain, first = first })
	notice(b, { kind = "eaten", name = a.name, lives = b.lives })
	feed(string.format("%s ate %s · +%s %s", a.name, b.name, v, u), "kill")
	local keep = math.max(G.startMass, b.mass * A.respawnMassKeep)
	if b.lives <= 0 then
		b.eliminatedAt = os.clock()
		feed(b.name .. " is out", "bad")
		return
	end
	task.delay(A.respawnDelay, function()
		if table.find(actors, b) and phase == "Round" and not b.alive then
			setMass(b, keep, true)
			local x, z, h = farSpawn(b)
			spawnMachine(b, x, z, h)
			notice(b, { kind = "respawn" })
		end
	end)
end

local function pvp()
	local t = os.clock()
	for _, a in actors do
		for _, b in actors do
			if canEat(a, b) and not spares(a, b) and (a.eatCooldown[b.id] or 0) <= t then
				local ax, _, az = position(a)
				local bx, _, bz = position(b)
				if math.sqrt((ax - bx) ^ 2 + (az - bz) ^ 2) <= (a.diameter / 2) * A.eatReach + b.diameter * 0.2 then
					a.eatCooldown[b.id] = t + 0.6
					eatActor(a, b)
				end
			end
		end
	end
end

-- AI rivals -------------------------------------------------------------------------------------
local function solidsNear(x: number, z: number, r: number, power: number, ignore: any): { Movement.Solid }
	local out: { Movement.Solid } = {}
	for _, o in World.near(x, z, r) do
		if o ~= ignore and World.solid(o, power, landmarkOpen) then
			table.insert(out, { x = o.x, z = o.z, radius = o.radius, box = World.box(o) })
		end
	end
	return out
end

local botGame = {
	time = 0,
	matchTime = 0,
	skill = 0.3,
	actors = actors,
	objects = World.objects,
	canEat = canEat,
	spares = spares,
	eligible = eligible,
	reward = function(o: any): number
		return o.def.rewardMass
	end,
	isBlocked = function(x: number, z: number, r: number, power: number, ignore: any): boolean
		return Movement.blocked(x, z, r, World.colliders, World.city.bounds, solidsNear(x, z, r, power, ignore))
	end,
}

-- Bumper cars for AI machines (players push themselves on their clients).
local function bumpBots()
	for _, a in actors do
		if a.kind == "bot" and a.alive then
			for _, b in actors do
				if b ~= a and b.alive and not ((canEat(a, b) and not spares(a, b)) or (canEat(b, a) and not spares(b, a))) then
					local bx, _, bz = position(b)
					Movement.bump(a.body, a.diameter, bx, bz, b.diameter, math.abs(b.body.speed), if b.kind == "bot" then 0.5 else 1)
				end
			end
		end
	end
end

local function stepBots(dt: number)
	botGame.time = os.clock()
	botGame.matchTime = matchTime()
	botGame.skill = botSkill()
	botGame.objects = World.objects
	local frozen = phase ~= "Round"
	for _, a in actors do
		if a.kind == "bot" and a.alive and a.root then
			local dx, dz, dash = 0, 0, false
			if not frozen then
				dx, dz, dash = a.bot:intents(botGame, a)
			end
			local solids = solidsNear(a.body.x, a.body.z, a.diameter + 1, a.diameter, nil)
			local _, crashed = Movement.step(a.body, dt, now(), dx, dz, dash, frozen, a.mass, a.diameter, a.vehicle, now() < a.speedUntil, World.colliders, World.city.bounds, solids)
			if crashed then
				crash(a)
			end
			local root = a.root :: BasePart
			local ap = root:FindFirstChildOfClass("AlignPosition")
			local ao = root:FindFirstChildOfClass("AlignOrientation")
			local y = World.ground(a.body.x, a.body.z) + a.diameter / 2
			if ap and ao then
				ap.Position = Vector3.new(a.body.x, y, a.body.z) * K
				ao.CFrame = CFrame.Angles(0, a.body.heading, 0)
			end
			if not frozen then
				tryClaim(a, nil, 1)
			end
		end
	end
end

local function fillWithBots()
	local names = table.clone(BOT_NAMES)
	local used: { [number]: boolean } = {}
	for _, a in actors do
		used[a.slot] = true
	end
	for slot = 1, A.maxPlayers do
		if not used[slot] and #actors < A.maxPlayers then
			local name = table.remove(names, math.random(1, #names)) :: string
			local look = Config.MACHINE_LOOKS[slot % #Config.MACHINE_LOOKS + 1]
			local a = newActor("bot", nil, name, slot, look)
			a.bot = Bot.new(slot * 7919 + roundsPlayed)
			-- Web AI rivals: half wear a random shop skin, 40% a buyable hat, a random horn.
			local function pick(list: { any }, chance: number, default: string): string
				local buyable = {}
				for _, it in list do
					if it.price > 0 then
						table.insert(buyable, it.id)
					end
				end
				return if math.random() < chance and #buyable > 0 then buyable[math.random(1, #buyable)] else default
			end
			a.skin = pick(WebConfig.skins, 0.5, "stock")
			a.hat = pick(WebConfig.hats, 0.4, "none")
			a.horn = pick(WebConfig.horns, 1, "clown")
			table.insert(actors, a)
		end
	end
end

-- Simulation tick ------------------------------------------------------------------------------
RunService.Heartbeat:Connect(function(dt: number)
	dt = math.min(dt, 0.1)
	World.stepFalling(dt)
	for _, o in World.objects do
		if o.state == "pulled" then
			local a = o.owner :: Actor?
			if not a or not a.alive or not table.find(actors, a) then
				-- Owner gone: drop back to idle where it is.
				o.state = "idle"
				o.y = World.ground(o.x, o.z)
				o.tilt = 0
				if o.model then
					o.model:SetAttribute("State", "idle")
				end
			else
				local x, y, z, heading = position(a)
				if World.stepPull(o, dt, x, z, y, heading, a.diameter, a.vehicle.pull) then
					absorb(a, o)
				end
			end
		end
	end
	stepBots(dt)
	if phase == "Round" then
		bumpBots()
		pvp()
	end
end)

-- Rounds -----------------------------------------------------------------------------------

local function leaderboard(): { any }
	local rows = {}
	for _, a in actors do
		table.insert(rows, { id = a.id, name = a.name, mass = a.mass, lives = a.lives, slot = a.slot, alive = a.alive or a.lives > 0, objects = a.objects, kills = a.kills, deaths = a.deaths, bot = a.kind == "bot", userId = if a.player then a.player.UserId else 0, eliminatedAt = a.eliminatedAt, look = a.look })
	end
	-- Survivors first by mass; then eliminated (later elimination ranks higher).
	table.sort(rows, function(x, y)
		if x.alive ~= y.alive then
			return x.alive
		end
		if x.alive then
			return x.mass > y.mass
		end
		return x.eliminatedAt > y.eliminatedAt
	end)
	return rows
end

local function broadcast(msg: { [string]: any })
	msg.city = World.city and World.city.id
	msg.climaxEaten = climaxEaten
	msg.climaxTotal = climaxTotal
	msg.board = leaderboard()
	RoundEvent:FireAllClients(msg)
	workspace:SetAttribute("Phase", msg.phase)
end

-- Joke awards on the results card (arena/comedy.ts).
local function awards(rows: { any }): { string }
	local out = {}
	local function top(key: string): any
		local best = nil
		for _, r in rows do
			if not best or r[key] > best[key] then
				best = r
			end
		end
		return best
	end
	local glutton = top("objects")
	if glutton and glutton.objects > 0 then
		table.insert(out, string.format("🍔 Bottomless Pit — %s (%d things eaten)", glutton.name, glutton.objects))
	end
	local shark = top("kills")
	if shark and shark.kills > 0 then
		table.insert(out, string.format("🦈 City Shark — %s (%d rivals eaten)", shark.name, shark.kills))
	end
	local food = top("deaths")
	if food and food.deaths > 0 then
		table.insert(out, string.format("🥡 Takeaway Delivery — %s (eaten %d×)", food.name, food.deaths))
	end
	if #rows > 2 then
		local chill = nil
		for i, r in rows do
			if i > 1 and (not chill or r.mass < chill.mass) then
				chill = r
			end
		end
		if chill then
			table.insert(out, string.format("🐢 Zen Mode — %s (it's the taking part that counts)", chill.name))
		end
	end
	return out
end

local function roundOver(): boolean
	local alive, humans, humansAlive = 0, 0, 0
	for _, a in actors do
		local inGame = a.alive or a.lives > 0
		if inGame then
			alive += 1
		end
		if a.kind == "player" then
			humans += 1
			if inGame then
				humansAlive += 1
			end
		end
	end
	if #actors >= 2 and alive <= 1 then
		return true
	end
	if humans > 0 and humansAlive == 0 then
		return true
	end
	return climaxTotal > 0 and climaxEaten >= climaxTotal
end

-- Machine models for every look and tier (clients clone them from ReplicatedStorage).
task.spawn(function()
	local names = {}
	for _, look in Config.MACHINE_LOOKS do
		for tier = 1, 5 do
			table.insert(names, string.format("Machine_%s_T%d", look, tier))
		end
	end
	for _, h in WebConfig.hats do
		if h.id ~= "none" then
			table.insert(names, "Hat_" .. h.id)
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
		botGame.objects = World.objects
		climaxTotal, climaxEaten, firstBlood = 0, 0, false
		for _, o in World.objects do
			if o.def.climax then
				climaxTotal += 1
			end
		end
		workspace:SetAttribute("ClimaxEaten", 0)
		workspace:SetAttribute("ClimaxTotal", climaxTotal)
		for i = #actors, 1, -1 do
			if actors[i].kind == "bot" then
				removeActor(actors[i])
			end
		end
		for _, a in actors do
			resetForRound(a, G.startMass)
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
		fillWithBots()
		for _, a in actors do
			resetForRound(a, G.startMass)
		end
		phase = "Countdown"
		for t = Config.COUNTDOWN_SECONDS, 1, -1 do
			broadcast({ phase = phase, timeLeft = t })
			task.wait(1)
		end
		phase = "Round"
		roundStart = os.clock()
		broadcast({ phase = phase, timeLeft = Config.ROUND_SECONDS, go = true })
		local refillClock = 0
		while true do
			task.wait(1)
			refillClock += 1
			if refillClock >= A.refillCheckSeconds then
				refillClock = 0
				local machines = {}
				for _, a in actors do
					if a.alive then
						local x, _, z = position(a)
						table.insert(machines, { x, z, a.diameter })
					end
				end
				World.refill(machines)
			end
			local elapsed = os.clock() - roundStart
			local left = math.max(0, math.ceil(Config.ROUND_SECONDS - elapsed))
			if not landmarkOpen and elapsed >= A.landmarkOpenSeconds then
				landmarkOpen = true
				workspace:SetAttribute("LandmarkOpen", true)
				NoticeEvent:FireAllClients({ kind = "landmarkOpen", city = cityId })
				feed("The landmark is open · topple it for the landmark bonus!", "bonus")
			end
			broadcast({ phase = phase, timeLeft = left, landmarkIn = math.max(0, math.ceil(A.landmarkOpenSeconds - elapsed)) })
			if left <= 0 or roundOver() then
				break
			end
		end
		phase = "Results"
		roundsPlayed += 1
		local rows = leaderboard()
		local best = rows[1]
		if best and best.userId ~= 0 then
			local player = Players:GetPlayerByUserId(best.userId)
			local ls = player and player:FindFirstChild("leaderstats")
			local wins = ls and ls:FindFirstChild("Wins") :: IntValue?
			if wins then
				wins.Value += 1
			end
		end
		-- Coins by rank and kills; friend gifts for playing together (web progress / gifts).
		local humans: { Player } = {}
		for _, a in actors do
			if a.player then
				table.insert(humans, a.player)
			end
		end
		for rank, r in rows do
			local a: Actor? = nil
			for _, c in actors do
				if c.id == r.id then
					a = c
				end
			end
			if a and a.player then
				local p = a.player :: Player
				local coins = Progress.roundEnd(p, rank, a.kills, rank == 1)
				local friends = 0
				for _, other in humans do
					if other ~= p then
						local ok, isFriend = pcall(p.IsFriendsWith, p, other.UserId)
						if ok and isFriend then
							friends += 1
						end
					end
				end
				local granted = {}
				if friends >= 1 then
					for _, g in Progress.gift(p, "friend1") do
						table.insert(granted, g)
					end
				end
				if friends >= 3 then
					for _, g in Progress.gift(p, "friend3") do
						table.insert(granted, g)
					end
				end
				NoticeEvent:FireClient(p, { kind = "coins", coins = coins, gifts = granted })
			end
		end
		broadcast({ phase = phase, timeLeft = Config.RESULTS_SECONDS, rows = rows, awards = awards(rows) })
		task.wait(Config.RESULTS_SECONDS)
	end
end)
