--!strict
-- GROW EVERYTHING (Roblox) client: the web arena's play feel.
--  * Drives the local machine with the web movement rules (ArenaGame.moveActor): top speed,
--    acceleration and turn rate from mass and vehicle, SPACE dash, camera-relative WASD.
--  * Collides like the web World: circle vs static boxes and vs objects too big to eat.
--  * Claims eligible objects within reach (the server checks and pulls them in).
--  * Follow camera = web CameraRig (distance/height/look-ahead/FOV per metre, drag to look,
--    auto-align behind after 1.2 s).
--  * Draws every machine with the web machine model of its tier, easing size like the web.
-- World units are metres; × STUDS_PER_METER for Roblox.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local Collision = require(Shared:WaitForChild("Collision"))
local Movement = require(Shared:WaitForChild("Movement"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local ClaimEvent = remotes:WaitForChild("Claim") :: RemoteEvent
local CrashEvent = remotes:WaitForChild("Crash") :: RemoteEvent
local templates = ReplicatedStorage:WaitForChild("ModelTemplates")

local K = Config.STUDS_PER_METER
local CC = WebConfig.collection
local CAM = WebConfig.camera
local A = WebConfig.arena
local G = WebConfig.growth
local OBJECTS = WebConfig.objects

local camera = workspace.CurrentCamera
camera.CameraType = Enum.CameraType.Scriptable

local function now(): number
	return workspace:GetServerTimeNow()
end

-- City data -------------------------------------------------------------------------------------
type Rec = { id: number, model: Model, type: string, def: any, req: number, radius: number, x: number, y: number, z: number, yaw: number, state: string, anchored: boolean }
local recs: { [number]: Rec } = {}
local cells: { [number]: { Rec } } = {}
local CELL = 8
local city: any = nil
local ground = function(_x: number, _z: number): number
	return 0
end

local function cellKey(cx: number, cz: number): number
	return (cx + 4096) * 8192 + (cz + 4096)
end
local function addToGrid(r: Rec)
	local k = cellKey(math.floor(r.x / CELL), math.floor(r.z / CELL))
	local list = cells[k]
	if not list then
		list = {}
		cells[k] = list
	end
	table.insert(list, r)
end
local nearBuf: { Rec } = {}
local nearStamp: { [Rec]: number } = {}
local stamp = 0
local function near(x: number, z: number, r: number): { Rec }
	table.clear(nearBuf)
	stamp += 1
	for cx = math.floor((x - r - 6) / CELL), math.floor((x + r + 6) / CELL) do
		for cz = math.floor((z - r - 6) / CELL), math.floor((z + r + 6) / CELL) do
			local list = cells[cellKey(cx, cz)]
			if list then
				for _, rec in list do
					if nearStamp[rec] ~= stamp and recs[rec.id] == rec then
						nearStamp[rec] = stamp
						table.insert(nearBuf, rec)
					end
				end
			end
		end
	end
	return nearBuf
end

local function track(m: Instance)
	if not m:IsA("Model") then
		return
	end
	local id = m:GetAttribute("Id") :: number?
	local typeId = m:GetAttribute("Type") :: string?
	if not id or not typeId then
		return
	end
	local def = OBJECTS[typeId]
	local r: Rec = {
		id = id,
		model = m,
		type = typeId,
		def = def,
		req = Growth.requiredPower(typeId),
		radius = math.sqrt((def.size[1] / 2) ^ 2 + (def.size[3] / 2) ^ 2),
		x = m:GetAttribute("X") :: number? or 0,
		y = m:GetAttribute("Y") :: number? or 0,
		z = m:GetAttribute("Z") :: number? or 0,
		yaw = m:GetAttribute("Yaw") :: number? or 0,
		state = m:GetAttribute("State") :: string? or "idle",
		anchored = m:GetAttribute("Anchored") == true,
	}
	recs[id] = r
	addToGrid(r)
	m.AttributeChanged:Connect(function(name)
		if name == "State" then
			r.state = m:GetAttribute("State") :: string? or "idle"
		elseif name == "Anchored" then
			r.anchored = m:GetAttribute("Anchored") == true
		elseif name == "X" or name == "Z" or name == "Y" or name == "Yaw" then
			r.x = m:GetAttribute("X") :: number? or r.x
			r.y = m:GetAttribute("Y") :: number? or r.y
			r.z = m:GetAttribute("Z") :: number? or r.z
			r.yaw = m:GetAttribute("Yaw") :: number? or r.yaw
			addToGrid(r)
		end
	end)
end

local function bindArena(arena: Instance)
	table.clear(recs)
	table.clear(cells)
	local cityId = arena:GetAttribute("City") :: string?
	if cityId then
		city = require(Shared:WaitForChild("Cities"):WaitForChild(cityId)) :: any
		ground = Collision.groundLookup(city.ground)
	end
	local objects = arena:WaitForChild("Objects")
	for _, m in objects:GetChildren() do
		track(m)
	end
	objects.ChildAdded:Connect(track)
	objects.ChildRemoved:Connect(function(m)
		local id = m:GetAttribute("Id") :: number?
		if id and recs[id] and recs[id].model == m then
			recs[id] = nil
		end
	end)
end
workspace.ChildAdded:Connect(function(c)
	if c.Name == "Arena" then
		bindArena(c)
	end
end)
if workspace:FindFirstChild("Arena") then
	task.spawn(bindArena, workspace:FindFirstChild("Arena") :: Instance)
end

local function landmarkOpen(): boolean
	return workspace:GetAttribute("LandmarkOpen") == true
end
local function phase(): string
	return workspace:GetAttribute("Phase") :: string? or "Loading"
end
local function eligible(r: Rec, power: number): boolean
	if r.state ~= "idle" or r.anchored then
		return false
	end
	if r.def.climax and not landmarkOpen() then
		return false
	end
	return power >= r.req
end
local function solid(r: Rec, power: number): boolean
	if r.state ~= "idle" then
		return false
	end
	if r.y > ground(r.x, r.z) + 2.5 then
		return false
	end
	return r.anchored or not eligible(r, power)
end
local function box(r: Rec): Collision.Box
	return { r.x, r.z, r.def.size[1] / 2, r.def.size[3] / 2, r.yaw }
end

-- Machine visuals (every machine, drawn locally) -------------------------------------------------
type Visual = { model: Model?, tier: number, base: number, shown: number, lastScale: number }
local visuals: { [BasePart]: Visual } = {}
local visualFolder = Instance.new("Folder")
visualFolder.Name = "MachineVisuals"
visualFolder.Parent = workspace

local function updateVisual(root: BasePart, dt: number)
	local v = visuals[root]
	local target = root:GetAttribute("Diameter") :: number? or G.startDiameter
	if not v then
		v = { model = nil, tier = 0, base = 1, shown = target, lastScale = 0 }
		visuals[root] = v
	end
	v.shown += (target - v.shown) * (1 - math.exp(-G.visualGrowthRate * dt))
	local tier = Growth.tierForClass(Growth.classForPower(target))
	if tier ~= v.tier or not v.model then
		local look = root:GetAttribute("Look") :: string? or "collector"
		local template = templates:FindFirstChild(string.format("Machine_%s_T%d", look, tier)) :: Model?
		if template then
			if v.model then
				v.model:Destroy()
			end
			local m = template:Clone()
			v.model = m
			v.tier = tier
			v.base = m:GetScale()
			v.lastScale = 0
			m.Parent = visualFolder
		end
	end
	local m = v.model
	if m then
		if math.abs(v.shown - v.lastScale) / math.max(v.lastScale, 1e-3) > 0.004 then
			v.lastScale = v.shown
			m:ScaleTo(v.base * v.shown)
		end
		m:PivotTo(root.CFrame * CFrame.new(0, -target * K / 2, 0))
		-- Invulnerable after a respawn: blink at 8 Hz.
		local inv = root:GetAttribute("InvulnerableUntil") :: number?
		local hidden = inv ~= nil and now() < inv and math.floor(os.clock() * 16) % 2 == 0
		m.Parent = if hidden then nil else visualFolder
	end
end

local function cleanupVisuals()
	for root, v in visuals do
		if not root.Parent then
			if v.model then
				v.model:Destroy()
			end
			visuals[root] = nil
		end
	end
end

-- Local machine --------------------------------------------------------------------------------
local me = { root = nil :: BasePart?, body = Movement.new(0, 0, 0) }
local cam = { yaw = 0, pitch = 1, idle = 0, pos = nil :: Vector3?, fov = CAM.fovBase }

local function myRoot(): BasePart?
	local machines = workspace:FindFirstChild("Machines")
	local m = machines and machines:FindFirstChild(player.Name)
	local root = m and m:FindFirstChild("Root") :: BasePart?
	return root
end

local keys: { [Enum.KeyCode]: boolean } = {}
local dashPressed = false
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return
	end
	if input.KeyCode == Enum.KeyCode.Space then
		dashPressed = true
	end
	keys[input.KeyCode] = true
end)
UserInputService.InputEnded:Connect(function(input)
	keys[input.KeyCode] = false
end)
-- Drag to look (any mouse button), like the web game.
local dragging = false
UserInputService.InputBegan:Connect(function(input, processed)
	if not processed and (input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.MouseButton2) then
		dragging = true
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.MouseButton2 then
		dragging = false
	end
end)
UserInputService.InputChanged:Connect(function(input: InputObject)
	if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
		cam.yaw -= input.Delta.X * CAM.mouseYawPerPixel
		cam.pitch = math.clamp(cam.pitch + input.Delta.Y * CAM.mousePitchPerPixel, 0.45, 1.8)
		cam.idle = 0
	end
end)

local function axis(pos: { Enum.KeyCode }, neg: { Enum.KeyCode }): number
	local v = 0
	for _, k in pos do
		if keys[k] then
			v += 1
			break
		end
	end
	for _, k in neg do
		if keys[k] then
			v -= 1
			break
		end
	end
	return v
end

local function vehicle(root: BasePart): any
	return WebConfig.vehicles[root:GetAttribute("Look") :: string? or "collector"]
end

local function move(root: BasePart, dt: number): number
	local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
	local mass = root:GetAttribute("Mass") :: number? or G.startMass
	local p = phase()
	local frozen = p == "Countdown" or p == "Results" or p == "Loading"
	-- Camera-relative input.
	local ix = axis({ Enum.KeyCode.D, Enum.KeyCode.Right }, { Enum.KeyCode.A, Enum.KeyCode.Left })
	local iy = axis({ Enum.KeyCode.W, Enum.KeyCode.Up }, { Enum.KeyCode.S, Enum.KeyCode.Down })
	local fx, fz = -math.sin(cam.yaw), -math.cos(cam.yaw)
	local rx, rz = math.cos(cam.yaw), -math.sin(cam.yaw)
	local wx, wz = fx * iy + rx * ix, fz * iy + rz * ix
	local r = d * 0.47
	local solids: { Movement.Solid } = {}
	for _, o in near(me.body.x, me.body.z, r * 2 + 0.5) do
		if solid(o, d) then
			table.insert(solids, { x = o.x, z = o.z, radius = o.radius, box = box(o) })
		end
	end
	local boosted = now() < (root:GetAttribute("SpeedUntil") :: number? or 0)
	local top, crashed = Movement.step(me.body, dt, now(), wx, wz, dashPressed, frozen, mass, d, vehicle(root), boosted, city and city.colliders, city and city.bounds, solids)
	dashPressed = false
	if crashed then
		CrashEvent:FireServer()
	end
	local y = ground(me.body.x, me.body.z)
	local ap = root:FindFirstChildOfClass("AlignPosition")
	local ao = root:FindFirstChildOfClass("AlignOrientation")
	if ap and ao then
		ap.Position = Vector3.new(me.body.x * K, (y + d / 2) * K, me.body.z * K)
		ao.CFrame = CFrame.Angles(0, me.body.heading, 0)
	end
	return top
end

-- Claims: propose every eligible object within reach (ArenaGame.proposeCollection).
local claimedAt: { [number]: number } = {}
local claimClock = 0
local function claim(root: BasePart, dt: number)
	claimClock += dt
	if claimClock < 0.1 or phase() ~= "Round" then
		return
	end
	claimClock = 0
	local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
	local magnet = if now() < (root:GetAttribute("MagnetUntil") :: number? or 0) then A.magnetMul else 1
	local reach = (d / 2 + d * CC.reachFactor + CC.reachFlat) * vehicle(root).reach * magnet
	local ids = {}
	local t = os.clock()
	for _, o in near(me.body.x, me.body.z, reach * math.max(1, CC.vacuumReachMultiplier)) do
		if eligible(o, d) and (not claimedAt[o.id] or t - claimedAt[o.id] > 1.5) then
			local rr = if o.radius * 2 < d * CC.vacuumSizeRatio then reach * CC.vacuumReachMultiplier else reach
			if math.abs(o.x - me.body.x) <= o.radius + rr and math.abs(o.z - me.body.z) <= o.radius + rr and Collision.circleVsObb(me.body.x, me.body.z, rr, box(o)) then
				claimedAt[o.id] = t
				table.insert(ids, o.id)
			end
		end
	end
	if #ids > 0 then
		ClaimEvent:FireServer(ids)
	end
end

-- Follow camera (web CameraRig) on a machine at (x, z) facing heading.
local function updateCamera(dt: number, x: number, z: number, heading: number, speedRatio: number, d: number)
	cam.idle += dt
	if cam.idle > CAM.autoAlignDelay and speedRatio > 0.25 then
		local diff = math.atan2(math.sin(heading - cam.yaw), math.cos(heading - cam.yaw))
		cam.yaw += diff * math.min(1, CAM.autoAlignRate * speedRatio * dt)
	end
	local g = ground(x, z)
	local dist = CAM.distanceBase + CAM.distancePerMetre * d
	local height = (CAM.heightBase + CAM.heightPerMetre * d) * cam.pitch
	local s, c = math.sin(cam.yaw), math.cos(cam.yaw)
	local look = Vector3.new(x - s * CAM.lookAheadPerMetre * d, g + CAM.lookHeightPerMetre * d + 0.1, z - c * CAM.lookAheadPerMetre * d) * K
	local desired = Vector3.new(x + s * dist, g + height, z + c * dist) * K
	local k = 1 - math.exp(-CAM.followSharpness * dt)
	cam.pos = if cam.pos then cam.pos:Lerp(desired, k) else desired
	local fov = math.min(CAM.fovMax, CAM.fovBase + CAM.fovPerMetre * d)
	cam.fov += (fov - cam.fov) * k
	camera.FieldOfView = cam.fov
	camera.CFrame = CFrame.lookAt(cam.pos :: Vector3, look)
end

-- Name tags over other machines: "Name · 1,234 kg" with ⚠ (it can eat you) or ✓ (you can eat it).
local tags: { [BasePart]: BillboardGui } = {}
local function updateTag(root: BasePart, myD: number?)
	local tag = tags[root]
	if not tag then
		local t = Instance.new("BillboardGui")
		tag = t
		t.Name = "NameTag"
		t.Size = UDim2.fromOffset(220, 26)
		t.AlwaysOnTop = true
		t.LightInfluence = 0
		local label = Instance.new("TextLabel")
		label.Name = "Label"
		label.BackgroundTransparency = 1
		label.Size = UDim2.fromScale(1, 1)
		label.Font = Enum.Font.GothamBold
		label.TextSize = 14
		label.TextColor3 = Color3.new(1, 1, 1)
		label.TextStrokeTransparency = 0.5
		label.Parent = t
		local line = Instance.new("Frame")
		line.Name = "Line"
		line.AnchorPoint = Vector2.new(0.5, 1)
		line.Position = UDim2.fromScale(0.5, 1)
		line.Size = UDim2.new(0.5, 0, 0, 2)
		line.BorderSizePixel = 0
		line.Parent = t
		t.Adornee = root
		t.Parent = visualFolder
		tags[root] = t
	end
	assert(tag)
	local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
	tag.StudsOffset = Vector3.new(0, d * K * 0.9 + 1, 0)
	local mass = root:GetAttribute("Mass") :: number? or G.startMass
	local v, u = Growth.massText(mass)
	local mark = ""
	if myD then
		local look = root:GetAttribute("Look") :: string? or "collector"
		local myLook = me.root and me.root:GetAttribute("Look") :: string? or "collector"
		if d >= myD * A.eatRatio * WebConfig.vehicles[look].eatRatio then
			mark = "  ⚠"
		elseif myD >= d * A.eatRatio * WebConfig.vehicles[myLook].eatRatio then
			mark = "  ✓"
		end
	end
	local label = tag:FindFirstChild("Label") :: TextLabel
	label.Text = string.format("%s · %s %s%s", root:GetAttribute("Name") :: string? or "?", v, u, mark)
	local slot = root:GetAttribute("Slot") :: number? or 1
	local line = tag:FindFirstChild("Line") :: Frame
	line.BackgroundColor3 = Config.SLOT_COLORS[(slot - 1) % #Config.SLOT_COLORS + 1]
end

-- Spectating (eliminated or between lives): follow the biggest machine.
local function leaderRoot(): BasePart?
	local best, bestMass = nil, -1
	local machines = workspace:FindFirstChild("Machines")
	if machines then
		for _, m in machines:GetChildren() do
			local root = m:FindFirstChild("Root") :: BasePart?
			local mass = root and root:GetAttribute("Mass") :: number? or 0
			if root and mass > bestMass then
				best, bestMass = root, mass
			end
		end
	end
	return best
end

RunService.RenderStepped:Connect(function(dt: number)
	dt = math.min(dt, 0.05)
	local root = myRoot()
	local myD = if root then root:GetAttribute("Diameter") :: number? else nil
	local machines = workspace:FindFirstChild("Machines")
	if machines then
		for _, m in machines:GetChildren() do
			local r = m:FindFirstChild("Root") :: BasePart?
			if r then
				updateVisual(r, dt)
				if r ~= root then
					updateTag(r, myD)
				end
			end
		end
	end
	cleanupVisuals()
	for r, tag in tags do
		if not r.Parent then
			tag:Destroy()
			tags[r] = nil
		end
	end
	if root ~= me.root then
		me.root = root
		if root then
			-- New machine (spawn / respawn / new round): take its position and face its way.
			local p = root.Position / K
			local lv = root.CFrame.LookVector
			me.body = Movement.new(p.X, p.Z, math.atan2(-lv.X, -lv.Z))
			cam.yaw = me.body.heading
			cam.pos = nil
		end
	end
	if root and root.Parent then
		local top = move(root, dt)
		claim(root, dt)
		local v = visuals[root]
		updateCamera(dt, me.body.x, me.body.z, me.body.heading, math.abs(me.body.speed) / math.max(top, 1e-3), if v then v.shown else (myD or G.startDiameter))
	else
		local target = leaderRoot()
		if target then
			local p = target.Position / K
			local lv = target.CFrame.LookVector
			local v = visuals[target]
			updateCamera(dt, p.X, p.Z, math.atan2(-lv.X, -lv.Z), 1, if v then v.shown else (target:GetAttribute("Diameter") :: number? or G.startDiameter))
		end
	end
end)
