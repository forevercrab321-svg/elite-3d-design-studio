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
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local ClaimEvent = remotes:WaitForChild("Claim") :: RemoteEvent
local templates = ReplicatedStorage:WaitForChild("ModelTemplates")

local K = Config.STUDS_PER_METER
local MC = WebConfig.movement
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
local me = { root = nil :: BasePart?, x = 0, z = 0, heading = 0, speed = 0, dashTime = 0, dashCooldown = 0, stunUntil = 0 }
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

local function topSpeed(root: BasePart, d: number): number
	local boost = if now() < (root:GetAttribute("SpeedUntil") :: number? or 0) then A.speedMul else 1
	return MC.baseTopSpeed * vehicle(root).speed * boost * (d / G.startDiameter) ^ MC.topSpeedExponent
end

local function move(root: BasePart, dt: number): number
	local d = root:GetAttribute("Diameter") :: number? or G.startDiameter
	local mass = root:GetAttribute("Mass") :: number? or G.startMass
	local veh = vehicle(root)
	local p = phase()
	local frozen = p == "Countdown" or p == "Results" or p == "Loading"
	local massLog = math.log(mass / G.startMass)
	local top = topSpeed(root, d)
	local accel = (top / (MC.accelSeconds * (1 + MC.accelMassDrag * massLog))) * veh.accel
	local turnRate = (MC.baseTurnRate / (1 + MC.turnMassDrag * massLog)) * veh.turn
	local stunned = frozen or now() < me.stunUntil
	-- Camera-relative input.
	local ix = axis({ Enum.KeyCode.D, Enum.KeyCode.Right }, { Enum.KeyCode.A, Enum.KeyCode.Left })
	local iy = axis({ Enum.KeyCode.W, Enum.KeyCode.Up }, { Enum.KeyCode.S, Enum.KeyCode.Down })
	local fx, fz = -math.sin(cam.yaw), -math.cos(cam.yaw)
	local rx, rz = math.cos(cam.yaw), -math.sin(cam.yaw)
	local wx, wz = fx * iy + rx * ix, fz * iy + rz * ix
	local mag = if stunned then 0 else math.min(1, math.sqrt(wx * wx + wz * wz))
	me.dashCooldown = math.max(0, me.dashCooldown - dt)
	me.dashTime = math.max(0, me.dashTime - dt)
	if dashPressed and not stunned and me.dashCooldown <= 0 then
		me.dashTime = MC.dash.duration
		me.dashCooldown = MC.dash.cooldown * veh.dashCooldown
	end
	dashPressed = false
	local targetSpeed = 0
	if mag > 0.05 then
		wx /= mag
		wz /= mag
		local want = math.atan2(-wx, -wz)
		local diff = math.atan2(math.sin(want - me.heading), math.cos(want - me.heading))
		me.heading += math.clamp(diff, -turnRate * dt, turnRate * dt)
		targetSpeed = mag * top * math.clamp(math.cos(diff), 0.25, 1)
	else
		mag = 0
	end
	if me.dashTime > 0 and not stunned then
		targetSpeed = math.max(targetSpeed, top) * MC.dash.speedMultiplier
	end
	local dv = targetSpeed - me.speed
	local rate = accel * (if dv < 0 and mag < 0.05 then 1.6 else 1) * dt
	me.speed += math.sign(dv) * math.min(math.abs(dv), rate)
	local r = d * 0.47
	local nx, nz = me.x - math.sin(me.heading) * me.speed * dt, me.z - math.cos(me.heading) * me.speed * dt
	if city then
		nx, nz = Collision.resolveStatic(nx, nz, r, city.colliders, city.bounds)
	end
	me.x, me.z = nx, nz
	-- Objects too big to eat block the machine; dashing into one stuns (ArenaGame.collideObjects).
	for _, o in near(me.x, me.z, r * 2 + 0.5) do
		if solid(o, d) and math.abs(o.x - me.x) <= o.radius + r and math.abs(o.z - me.z) <= o.radius + r then
			local cx, cz, depth = Collision.circleVsObb(me.x, me.z, r, box(o))
			if cx then
				me.x += cx * (depth :: number)
				me.z += (cz :: number) * (depth :: number)
				if me.dashTime > 0 and me.speed > top * 1.2 and now() > me.stunUntil then
					me.stunUntil = now() + A.crashStunSeconds
					me.speed *= -0.3
				elseif me.speed > top * 0.45 then
					me.speed *= 0.4
				end
			end
		end
	end
	local y = ground(me.x, me.z)
	local ap = root:FindFirstChildOfClass("AlignPosition")
	local ao = root:FindFirstChildOfClass("AlignOrientation")
	if ap and ao then
		ap.Position = Vector3.new(me.x * K, (y + d / 2) * K, me.z * K)
		ao.CFrame = CFrame.Angles(0, me.heading, 0)
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
	for _, o in near(me.x, me.z, reach * math.max(1, CC.vacuumReachMultiplier)) do
		if eligible(o, d) and (not claimedAt[o.id] or t - claimedAt[o.id] > 1.5) then
			local rr = if o.radius * 2 < d * CC.vacuumSizeRatio then reach * CC.vacuumReachMultiplier else reach
			if math.abs(o.x - me.x) <= o.radius + rr and math.abs(o.z - me.z) <= o.radius + rr and Collision.circleVsObb(me.x, me.z, rr, box(o)) then
				claimedAt[o.id] = t
				table.insert(ids, o.id)
			end
		end
	end
	if #ids > 0 then
		ClaimEvent:FireServer(ids)
	end
end

local function updateCamera(dt: number, root: BasePart, top: number)
	local v = visuals[root]
	local d = if v then v.shown else (root:GetAttribute("Diameter") :: number? or G.startDiameter)
	cam.idle += dt
	local speedRatio = math.abs(me.speed) / math.max(top, 1e-3)
	if cam.idle > CAM.autoAlignDelay and speedRatio > 0.25 then
		local diff = math.atan2(math.sin(me.heading - cam.yaw), math.cos(me.heading - cam.yaw))
		cam.yaw += diff * math.min(1, CAM.autoAlignRate * speedRatio * dt)
	end
	local g = ground(me.x, me.z)
	local dist = CAM.distanceBase + CAM.distancePerMetre * d
	local height = (CAM.heightBase + CAM.heightPerMetre * d) * cam.pitch
	local s, c = math.sin(cam.yaw), math.cos(cam.yaw)
	local look = Vector3.new(me.x - s * CAM.lookAheadPerMetre * d, g + CAM.lookHeightPerMetre * d + 0.1, me.z - c * CAM.lookAheadPerMetre * d) * K
	local desired = Vector3.new(me.x + s * dist, g + height, me.z + c * dist) * K
	local k = 1 - math.exp(-CAM.followSharpness * dt)
	cam.pos = if cam.pos then cam.pos:Lerp(desired, k) else desired
	local fov = math.min(CAM.fovMax, CAM.fovBase + CAM.fovPerMetre * d)
	cam.fov += (fov - cam.fov) * k
	camera.FieldOfView = cam.fov
	camera.CFrame = CFrame.lookAt(cam.pos :: Vector3, look)
end

RunService.RenderStepped:Connect(function(dt: number)
	dt = math.min(dt, 0.05)
	local machines = workspace:FindFirstChild("Machines")
	if machines then
		for _, m in machines:GetChildren() do
			local root = m:FindFirstChild("Root") :: BasePart?
			if root then
				updateVisual(root, dt)
			end
		end
	end
	cleanupVisuals()
	local root = myRoot()
	if root ~= me.root then
		me.root = root
		if root then
			-- New machine (spawn / respawn / new round): take its position and face its way.
			local p = root.Position / K
			local lv = root.CFrame.LookVector
			me.x, me.z = p.X, p.Z
			me.heading = math.atan2(-lv.X, -lv.Z)
			me.speed, me.dashTime, me.dashCooldown, me.stunUntil = 0, 0, 0, 0
			cam.yaw = me.heading
			cam.pos = nil
		end
	end
	if root and root.Parent then
		local top = move(root, dt)
		claim(root, dt)
		updateCamera(dt, root, top)
	end
end)
