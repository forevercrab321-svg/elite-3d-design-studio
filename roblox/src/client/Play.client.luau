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
local Pull = require(Shared:WaitForChild("Pull"))
local Feel = require(script.Parent:WaitForChild("Feel"))
local ModelInfo = require(Shared:WaitForChild("ModelInfo"))
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
-- The local machine: its root and the movement body driven by Movement.step.
local me = { root = nil :: BasePart?, body = Movement.new(0, 0, 0) }
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

-- Objects being pulled in, animated locally with the shared web formula (the server only decides
-- when they are absorbed and then removes them).
type Anim = { rec: any, s: Pull.State, base: number }
local pulls: { [Model]: Anim } = {}
local function placeModel(r: any)
	local m = r.model :: Model
	m:PivotTo(CFrame.new(r.x * K, r.y * K, r.z * K) * CFrame.Angles(0, r.yaw, 0))
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
			local before = r.state
			r.state = m:GetAttribute("State") :: string? or "idle"
			local size = math.max(r.def.size[1], r.def.size[2], r.def.size[3])
			local pos = Vector3.new(r.x, r.y + r.def.size[2] / 2, r.z) * K
			local cls = r.def.objectClass
			if r.state == "pulled" then
				pulls[m] = { rec = r, s = { x = r.x, y = r.y, z = r.z, yaw = r.yaw, tilt = 0, vx = 0, vy = 0, vz = 0, pullTime = 0, phase = Pull.phase(r.def) }, base = m:GetScale() }
			elseif before == "pulled" then
				-- Dropped mid-pull (owner gone): back to full size where the server put it.
				local an = pulls[m]
				pulls[m] = nil
				if an then
					m:ScaleTo(an.base)
				end
				placeModel(r)
			end
			if r.state == "pulled" and cls >= 4 then
				-- Destruction beat (ArenaGame.startPull): shards, dust, sparks for crush/collapse.
				local pp = m.PrimaryPart or m:FindFirstChildWhichIsA("BasePart")
				Feel.shards(pos, if pp then pp.Color else Color3.new(0.6, 0.6, 0.6), 12, math.max(0.3, size * 0.09 * K), (2 + size * 0.9) * K)
				Feel.dust(Vector3.new(r.x, r.y, r.z) * K, size * 0.5 * K, if cls >= 6 then 6 else 3)
				if r.def.destructionType == "crush" or r.def.destructionType == "collapse" then
					Feel.sparks(Vector3.new(r.x, r.y + r.def.size[2] * 0.8, r.z) * K, 10, (1.5 + size * 0.6) * K)
				end
				if m:GetAttribute("Owner") == player:GetAttribute("ActorId") then
					Feel.crunch(cls)
					local myD = me.root and me.root:GetAttribute("Diameter") :: number? or G.startDiameter
					local rel = math.min(1.5, size / myD)
					Feel.trauma(math.min(0.45, (0.08 + 0.035 * cls) * math.min(1, 0.25 + 0.6 * rel)))
				end
			elseif before == "falling" and r.state == "idle" then
				-- A landmark part landing: dust and a rumble that fades with distance.
				Feel.dust(Vector3.new(r.x, r.y, r.z) * K, size * 0.6 * K, 12)
				local dist = math.sqrt((r.x - me.body.x) ^ 2 + (r.z - me.body.z) ^ 2)
				if dist < (45 + size * 3) * 2 then
					Feel.play("collapse")
					Feel.traumaAt(math.min(0.5, 0.12 + size * 0.02), dist, size)
				end
			end
		elseif name == "Anchored" then
			r.anchored = m:GetAttribute("Anchored") == true
		elseif name == "X" or name == "Z" or name == "Y" or name == "Yaw" then
			r.x = m:GetAttribute("X") :: number? or r.x
			r.y = m:GetAttribute("Y") :: number? or r.y
			r.z = m:GetAttribute("Z") :: number? or r.z
			r.yaw = m:GetAttribute("Yaw") :: number? or r.yaw
			addToGrid(r)
			if not pulls[m] then
				placeModel(r)
			end
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
type Visual = { hidden: boolean?, model: Model?, name: string, tier: number, base: number, shown: number, lastScale: number, skin: string, hat: Model?, hatId: string, hatBase: number, hatScale: number }

-- Skins recolour the shell and the intake glow (web config/cosmetics.ts SKINS).
local function skinDef(id: string): any
	for _, sk in WebConfig.skins do
		if sk.id == id then
			return sk
		end
	end
	return WebConfig.skins[1]
end
local function hex(n: number): Color3
	return Color3.fromHex(string.format("%06x", n))
end
local function applySkin(m: Model, name: string, skinId: string)
	local info = ModelInfo[name]
	local sk = skinDef(skinId)
	if not info or not sk.shell then
		return
	end
	for _, p in m:GetDescendants() do
		if p:IsA("BasePart") then
			local mi = info.meshes[p.Name]
			local role = mi and mi.r
			if role == "Player_Shell" then
				p.Color = hex(sk.shell)
				p.Material = if (sk.metalness or 0) >= 0.6 then Enum.Material.Metal else Enum.Material.SmoothPlastic
			elseif role == "Player_IntakeGlow" and sk.glow then
				p.Color = hex(sk.glow)
			end
		end
	end
end
local visuals: { [BasePart]: Visual } = {}
local visualFolder = Instance.new("Folder")
visualFolder.Name = "MachineVisuals"
visualFolder.Parent = workspace

local function updateVisual(root: BasePart, dt: number)
	local v = visuals[root]
	local target = root:GetAttribute("Diameter") :: number? or G.startDiameter
	if not v then
		v = { model = nil, name = "", tier = 0, base = 1, shown = target, lastScale = 0, skin = "", hat = nil, hatId = "none", hatBase = 1, hatScale = 0 }
		visuals[root] = v
	end
	v.shown += (target - v.shown) * (1 - math.exp(-G.visualGrowthRate * dt))
	local tier = Growth.tierForClass(Growth.classForPower(target))
	local look = root:GetAttribute("Look") :: string? or "collector"
	local skin = root:GetAttribute("Skin") :: string? or "stock"
	local name = string.format("Machine_%s_T%d", look, tier)
	if name ~= v.name or skin ~= v.skin or not v.model then
		local template = templates:FindFirstChild(name) :: Model?
		if template then
			if v.model then
				v.model:Destroy()
			end
			local m = template:Clone()
			applySkin(m, name, skin)
			v.model = m
			v.name = name
			v.tier = tier
			v.skin = skin
			v.base = m:GetScale()
			v.lastScale = 0
			m.Parent = visualFolder
		end
	end
	-- Hat on the roof, behind the eyes (web Hat.place): re-seated from this tier's bounds.
	local hatId = root:GetAttribute("Hat") :: string? or "none"
	if hatId ~= v.hatId then
		if v.hat then
			v.hat:Destroy()
			v.hat = nil
		end
		local template = templates:FindFirstChild("Hat_" .. hatId) :: Model?
		if template then
			local h = template:Clone()
			v.hat = h
			v.hatBase = h:GetScale()
			v.hatScale = 0
			h.Parent = visualFolder
		end
		v.hatId = if template or hatId == "none" then hatId else v.hatId
	end
	local m = v.model
	if m then
		if math.abs(v.shown - v.lastScale) / math.max(v.lastScale, 1e-3) > 0.004 then
			v.lastScale = v.shown
			m:ScaleTo(v.base * v.shown)
		end
		local pivot = root.CFrame * CFrame.new(0, -target * K / 2, 0)
		m:PivotTo(pivot)
		-- Invulnerable after a respawn: blink at 8 Hz.
		local inv = root:GetAttribute("InvulnerableUntil") :: number?
		local hidden = inv ~= nil and now() < inv and math.floor(os.clock() * 16) % 2 == 0
		if hidden ~= (v.hidden == true) then
			v.hidden = hidden
			for _, part in m:GetDescendants() do
				if part:IsA("BasePart") then
					part.LocalTransparencyModifier = if hidden then 1 else 0
				end
			end
		end
		local h = v.hat
		local info = ModelInfo[v.name]
		if h and info then
			if math.abs(v.shown - v.hatScale) / math.max(v.hatScale, 1e-3) > 0.004 then
				v.hatScale = v.shown
				h:ScaleTo(v.hatBase * v.shown)
			end
			local top = info.min.Y + info.size.Y
			local back = info.min.Z + info.size.Z
			h:PivotTo(pivot * CFrame.new(0, (top - 0.01) * v.shown * K, back * 0.35 * v.shown * K))
		end
	end
end

local function cleanupVisuals()
	for root, v in visuals do
		if not root:IsDescendantOf(workspace) then
			if v.model then
				v.model:Destroy()
			end
			if v.hat then
				v.hat:Destroy()
			end
			visuals[root] = nil
		end
	end
end

-- Local machine --------------------------------------------------------------------------------
local cam = { yaw = 0, pitch = 1, idle = 0, pos = nil :: Vector3?, fov = CAM.fovBase }

local function myRoot(): BasePart?
	local machines = workspace:FindFirstChild("Machines")
	local m = machines and machines:FindFirstChild(tostring(player:GetAttribute("ActorId")))
	local root = m and m:FindFirstChild("Root") :: BasePart?
	return root
end

local HornEvent = remotes:WaitForChild("Horn") :: RemoteEvent
local NoticeEvent = remotes:WaitForChild("Notice") :: RemoteEvent
local HORN_SOUND: { [string]: string } = { clown = "horn", duck = "horn_duck", bike = "horn_bike", trombone = "horn_trombone", air = "horn_air" }
-- Horns: louder the closer the machine (everyone hears everyone's equipped horn).
NoticeEvent.OnClientEvent:Connect(function(n: { [string]: any })
	if n.kind ~= "horn" then
		return
	end
	local machines = workspace:FindFirstChild("Machines")
	local m = machines and machines:FindFirstChild(tostring(n.actor))
	local r = m and m:FindFirstChild("Root") :: BasePart?
	local dist = if r then (r.Position / K - Vector3.new(me.body.x, 0, me.body.z)).Magnitude else 0
	Feel.play(HORN_SOUND[n.horn] or "horn", math.clamp(1 - dist / 120, 0.15, 1))
end)

local keys: { [Enum.KeyCode]: boolean } = {}
local dashPressed = false
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return
	end
	if input.KeyCode == Enum.KeyCode.Space then
		dashPressed = true
	elseif input.KeyCode == Enum.KeyCode.H then
		HornEvent:FireServer()
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

-- Touch (web touch layout): drag on the left half to steer, drag on the right half to look,
-- DASH button bottom-right.
local touchMove = Vector2.zero
local moveTouch: InputObject? = nil
local moveOrigin = Vector2.zero
local lookTouch: InputObject? = nil
if UserInputService.TouchEnabled then
	local touchGui = Instance.new("ScreenGui")
	touchGui.Name = "TouchControls"
	touchGui.ResetOnSpawn = false
	touchGui.Parent = player:WaitForChild("PlayerGui")
	local dash = Instance.new("TextButton")
	dash.Name = "Dash"
	dash.AnchorPoint = Vector2.new(1, 1)
	dash.Position = UDim2.new(1, -28, 1, -200)
	dash.Size = UDim2.fromOffset(84, 84)
	dash.Text = "DASH"
	dash.Font = Enum.Font.GothamBlack
	dash.TextSize = 16
	dash.TextColor3 = Color3.fromRGB(30, 20, 5)
	dash.BackgroundColor3 = Color3.fromHex("ffb347")
	dash.Parent = touchGui
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(1, 0)
	c.Parent = dash
	dash.Activated:Connect(function()
		dashPressed = true
	end)
	local horn = dash:Clone()
	horn.Name = "Horn"
	horn.Text = "📯"
	horn.TextSize = 26
	horn.Size = UDim2.fromOffset(56, 56)
	horn.Position = UDim2.new(1, -124, 1, -200)
	horn.Parent = touchGui
	horn.Activated:Connect(function()
		HornEvent:FireServer()
	end)
	UserInputService.TouchStarted:Connect(function(input: InputObject, processed: boolean)
		if processed then
			return
		end
		local p = Vector2.new(input.Position.X, input.Position.Y)
		if p.X < camera.ViewportSize.X / 2 and not moveTouch then
			moveTouch = input
			moveOrigin = p
		elseif not lookTouch then
			lookTouch = input
		end
	end)
	UserInputService.TouchMoved:Connect(function(input: InputObject)
		if input == moveTouch then
			local delta = Vector2.new(input.Position.X, input.Position.Y) - moveOrigin
			local r = 70
			touchMove = if delta.Magnitude > r then delta.Unit else delta / r
		elseif input == lookTouch then
			cam.yaw -= input.Delta.X * CAM.mouseYawPerPixel
			cam.pitch = math.clamp(cam.pitch + input.Delta.Y * CAM.mousePitchPerPixel, 0.45, 1.8)
			cam.idle = 0
		end
	end)
	UserInputService.TouchEnded:Connect(function(input: InputObject)
		if input == moveTouch then
			moveTouch = nil
			touchMove = Vector2.zero
		elseif input == lookTouch then
			lookTouch = nil
		end
	end)
end

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

local lastBoing = 0
local function move(root: BasePart, dt: number): number
	local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
	local mass = root:GetAttribute("Mass") :: number? or G.startMass
	local p = phase()
	local frozen = p == "Countdown" or p == "Results" or p == "Loading"
	-- Camera-relative input.
	local ix = axis({ Enum.KeyCode.D, Enum.KeyCode.Right }, { Enum.KeyCode.A, Enum.KeyCode.Left }) + touchMove.X
	local iy = axis({ Enum.KeyCode.W, Enum.KeyCode.Up }, { Enum.KeyCode.S, Enum.KeyCode.Down }) - touchMove.Y
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
	local cooling = me.body.dashCooldown > 0
	local dashBefore = me.body.dashTime
	local top, crashed = Movement.step(me.body, dt, now(), wx, wz, dashPressed, frozen, mass, d, vehicle(root), boosted, city and city.colliders, city and city.bounds, solids)
	dashPressed = false
	if me.body.dashTime > dashBefore then
		-- Dash: whoosh, FOV kick, dust at the wheels.
		Feel.play("dash")
		Feel.kickFov(7)
		Feel.dust(Vector3.new(me.body.x, ground(me.body.x, me.body.z), me.body.z) * K, d * 0.6 * K, 4)
	elseif cooling and me.body.dashCooldown <= 0 then
		Feel.play("dashReady", 0.5)
	end
	if crashed then
		CrashEvent:FireServer()
		Feel.play("stun")
		Feel.trauma(0.35)
		Feel.sparks(Vector3.new(me.body.x, ground(me.body.x, me.body.z) + d * 0.5, me.body.z) * K, 14, (3 + d) * K)
	end
	-- Bumper cars against machines neither side can eat (push only ours; theirs is driven elsewhere).
	local machines = workspace:FindFirstChild("Machines")
	if machines and not frozen then
		local myLook = root:GetAttribute("Look") :: string? or "collector"
		for _, m in machines:GetChildren() do
			local other = m:FindFirstChild("Root") :: BasePart?
			if other and other ~= root then
				local od = other:GetAttribute("Diameter") :: number? or G.startDiameter
				local oLook = other:GetAttribute("Look") :: string? or "collector"
				local t = now()
				local safe = t < (other:GetAttribute("InvulnerableUntil") :: number? or 0) or t < (root:GetAttribute("InvulnerableUntil") :: number? or 0)
				local iEat = d >= od * A.eatRatio * WebConfig.vehicles[myLook].eatRatio and t >= (other:GetAttribute("ShieldUntil") :: number? or 0)
				local theyEat = od >= d * A.eatRatio * WebConfig.vehicles[oLook].eatRatio and t >= (root:GetAttribute("ShieldUntil") :: number? or 0)
				if safe or not (iEat or theyEat) then
					local op = other.Position / K
					if Movement.bump(me.body, d, op.X, op.Z, od, other.AssemblyLinearVelocity.Magnitude / K, 1) and os.clock() - lastBoing > 0.8 then
						lastBoing = os.clock()
						Feel.play("boing")
						Feel.trauma(0.15)
					end
				end
			end
		end
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
	-- Feel: trauma shake, timed pull-back (tier up, landmark), dash FOV kick (systems/Effects.ts).
	local shake, distMul, fovExtra = Feel.camera(dt, dist * K)
	desired = look + (desired - look) * distMul
	local k = 1 - math.exp(-CAM.followSharpness * dt)
	cam.pos = if cam.pos then cam.pos:Lerp(desired, k) else desired
	local fov = math.min(CAM.fovMax, CAM.fovBase + CAM.fovPerMetre * d)
	cam.fov += (fov - cam.fov) * k
	camera.FieldOfView = cam.fov + fovExtra
	camera.CFrame = CFrame.lookAt((cam.pos :: Vector3) + shake, look + shake * 0.5)
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

local function animatePulls(dt: number)
	local machines = workspace:FindFirstChild("Machines")
	for m, an in pulls do
		if not m:IsDescendantOf(workspace) then
			pulls[m] = nil
			continue
		end
		local owner = m:GetAttribute("Owner")
		local om = owner ~= nil and machines and machines:FindFirstChild(tostring(owner))
		local root = om and om:FindFirstChild("Root") :: BasePart?
		if root then
			local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
			local p = root.Position / K
			local lv = root.CFrame.LookVector
			local look = root:GetAttribute("Look") :: string? or "collector"
			Pull.step(an.s, an.rec.def, an.rec.radius, dt, p.X, p.Z, p.Y - d / 2, math.atan2(-lv.X, -lv.Z), d, WebConfig.vehicles[look].pull)
		end
		local st = an.s
		m:PivotTo(CFrame.new(st.x * K, st.y * K, st.z * K) * CFrame.Angles(0, st.yaw, 0) * CFrame.Angles(st.tilt, 0, 0))
		local scale = an.base * Pull.scale(st)
		if math.abs(m:GetScale() - scale) > 1e-3 then
			m:ScaleTo(scale)
		end
	end
end

local function frame(dt: number)
	dt = math.min(dt, 0.05)
	-- The default camera scripts may reset the camera; this game drives it every frame.
	camera = workspace.CurrentCamera
	camera.CameraType = Enum.CameraType.Scriptable
	animatePulls(dt)
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
		if not r:IsDescendantOf(workspace) then
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
	if root and root:IsDescendantOf(workspace) then
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
end
-- After the default camera scripts (Camera priority) so nothing overrides this camera.
RunService:BindToRenderStep("GrowFrame", Enum.RenderPriority.Camera.Value + 1, frame)
