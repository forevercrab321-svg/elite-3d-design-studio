--!strict
-- One web city in Roblox: the street scenery model, every gameplay object of the arena layout
-- (exported from the web World, Shared.Cities.<id>) and the object life cycle the web World runs:
-- idle → pulled into a machine → absorbed, and supported landmark parts falling when their
-- supports are eaten. Positions are metres (web units); models are placed at × STUDS_PER_METER.
--
-- Clients read each object from its model in workspace.Arena.Objects: attributes Id, Type, X, Y,
-- Z, Yaw (metres), State ("idle" | "pulled" | "falling") and Anchored.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local Growth = require(Shared:WaitForChild("Growth"))
local Collision = require(Shared:WaitForChild("Collision"))
local Models = require(script.Parent:WaitForChild("Models"))

local K = Config.STUDS_PER_METER
local OBJECTS = WebConfig.objects

export type Obj = {
	id: number,
	type: string,
	def: any,
	x: number,
	y: number,
	z: number,
	yaw: number,
	color: Color3,
	model: Model?,
	state: string, -- "idle" | "pulled" | "falling" | "gone"
	anchored: boolean,
	supports: { number },
	requiredPower: number,
	radius: number,
	-- pull
	owner: any,
	pullTime: number,
	phase: number,
	vx: number,
	vy: number,
	vz: number,
	spin: number,
	-- fall
	fallVy: number,
	tilt: number,
}

local World = {}
World.city = nil :: any
World.objects = {} :: { Obj }
World.ground = function(_x: number, _z: number): number
	return 0
end
World.colliders = {} :: { Collision.Box }

local arena: Folder? = nil

-- Broad phase: 8 m cells (World.ts GRID_CELL). Objects that move (fall) are re-added; stale
-- entries are skipped by checking the object's current cell.
local CELL = 8
local grid: { [number]: { Obj } } = {}
local function cellKey(cx: number, cz: number): number
	return (cx + 4096) * 8192 + (cz + 4096)
end
local function addToGrid(o: Obj)
	local k = cellKey(math.floor(o.x / CELL), math.floor(o.z / CELL))
	local list = grid[k]
	if not list then
		list = {}
		grid[k] = list
	end
	table.insert(list, o)
end

-- Objects whose footprint may touch a circle at (x, z, r).
function World.near(x: number, z: number, r: number): { Obj }
	local out: { Obj } = {}
	local seen: { [Obj]: boolean } = {}
	for cx = math.floor((x - r - 6) / CELL), math.floor((x + r + 6) / CELL) do
		for cz = math.floor((z - r - 6) / CELL), math.floor((z + r + 6) / CELL) do
			local list = grid[cellKey(cx, cz)]
			if list then
				for _, o in list do
					if not seen[o] and o.state ~= "gone" then
						seen[o] = true
						table.insert(out, o)
					end
				end
			end
		end
	end
	return out
end

local function place(o: Obj)
	local m = o.model
	if not m then
		return
	end
	m:PivotTo(CFrame.new(o.x * K, o.y * K, o.z * K) * CFrame.Angles(0, o.yaw, 0) * CFrame.Angles(o.tilt, 0, 0))
end

local function syncAttributes(o: Obj)
	local m = o.model
	if not m then
		return
	end
	m:SetAttribute("X", o.x)
	m:SetAttribute("Y", o.y)
	m:SetAttribute("Z", o.z)
	m:SetAttribute("Yaw", o.yaw)
	m:SetAttribute("State", o.state)
	m:SetAttribute("Anchored", o.anchored)
end

-- Build a city; returns its module. Yields while models load.
function World.build(cityId: string)
	if arena then
		arena:Destroy()
	end
	local city = require(Shared:WaitForChild("Cities"):WaitForChild(cityId)) :: any
	World.city = city
	World.ground = Collision.groundLookup(city.ground)
	World.colliders = city.colliders
	World.objects = {}
	table.clear(grid)

	local names: { string } = { city.scenery }
	local seen: { [string]: boolean } = {}
	for _, row in city.objects do
		if not seen[row[1]] then
			seen[row[1]] = true
			table.insert(names, row[1])
		end
	end
	Models.preload(names)

	local root = Instance.new("Folder")
	root.Name = "Arena"
	root:SetAttribute("City", cityId)
	local scenery = Models.clone(city.scenery)
	if scenery then
		scenery.Name = "Scenery"
		scenery:PivotTo(CFrame.new())
		for _, p in scenery:GetDescendants() do
			if p:IsA("BasePart") then
				p.CastShadow = true
			end
		end
		scenery.Parent = root
	else
		warn("World: scenery " .. city.scenery .. " missing")
	end
	-- Fallback ground so machines never fall through when the scenery did not load.
	local base = Instance.new("Part")
	base.Name = "Ground"
	base.Anchored = true
	base.Size = Vector3.new((city.bounds.maxX - city.bounds.minX) * K + 400, 2, (city.bounds.maxZ - city.bounds.minZ) * K + 400)
	base.CFrame = CFrame.new(0, -1.05, 0)
	base.Color = Color3.fromRGB(80, 79, 78)
	base.Material = Enum.Material.Asphalt
	base.Parent = root

	local folder = Instance.new("Folder")
	folder.Name = "Objects"
	folder.Parent = root

	for i, row in city.objects do
		local typeId, x, y, z, yaw, colorHex, supports, anchored = row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]
		local def = OBJECTS[typeId]
		local color = Color3.fromHex(colorHex)
		local base0 = Color3.fromHex(string.format("%06x", def.colors[1]))
		local o: Obj = {
			id = i,
			type = typeId,
			def = def,
			x = x,
			y = y,
			z = z,
			yaw = yaw,
			color = color,
			model = nil,
			state = "idle",
			anchored = anchored,
			supports = supports or {},
			requiredPower = Growth.requiredPower(typeId),
			radius = math.sqrt((def.size[1] / 2) ^ 2 + (def.size[3] / 2) ^ 2),
			owner = nil,
			pullTime = 0,
			phase = 0,
			vx = 0,
			vy = 0,
			vz = 0,
			spin = 0,
			fallVy = 0,
			tilt = 0,
		}
		local m = Models.clone(typeId, 1, color, base0)
		if m then
			m.Name = tostring(i)
			m:SetAttribute("Id", i)
			m:SetAttribute("Type", typeId)
			o.model = m
			place(o)
			syncAttributes(o)
			m.Parent = folder
		end
		World.objects[i] = o
		addToGrid(o)
	end
	root.Parent = workspace
	arena = root
	-- Self-check in the Output window: what loaded, where the scenery sits, what is missing.
	local withModel, missing = 0, {}
	for _, o in World.objects do
		if o.model then
			withModel += 1
		else
			missing[o.type] = true
		end
	end
	local missingList = {}
	for t in missing do
		table.insert(missingList, t)
	end
	local sceneryInfo = "missing"
	if scenery then
		local box, size = scenery:GetBoundingBox()
		sceneryInfo = string.format("centre %s size %s studs (expected size %s)", tostring(box.Position), tostring(size), tostring(Models.expectedSize(city.scenery)))
	end
	print(string.format("[GrowEverything] %s: scenery %s; %d/%d objects with models; missing types: %s", cityId, sceneryInfo, withModel, #World.objects, if #missingList > 0 then table.concat(missingList, ", ") else "none"))
	return city
end

-- Absorbable by a machine of this power right now (web World.isEligible + the landmark lock).
function World.eligible(o: Obj, power: number, landmarkOpen: boolean): boolean
	if o.state ~= "idle" or o.anchored then
		return false
	end
	if o.def.climax and not landmarkOpen then
		return false
	end
	return power >= o.requiredPower
end

-- Start pulling an object into a machine (the server granted the claim).
function World.startPull(o: Obj, owner: any)
	o.state = "pulled"
	o.owner = owner
	o.pullTime = 0
	o.vx, o.vy, o.vz = 0, 0, 0
	o.spin = 0
	local cls = o.def.objectClass
	-- Destruction beat for big objects: longer the bigger the class (collection.heavyPhasePerClass).
	o.phase = if cls >= 4 then 0.25 * (1 + math.max(0, cls - 5) * WebConfig.collection.heavyPhasePerClass) else 0
	if o.model then
		o.model:SetAttribute("State", "pulled")
		o.model:SetAttribute("Owner", owner.id)
	end
end

-- What an absorbed object held up may fall (web World.releaseDependents): a spanning "collapse"
-- member fails as soon as any support goes; a stacked object only once every support is gone
-- (absorbed or itself falling). Tall "topple" parts fly toward the support that failed. Cascades.
local function release(removed: Obj, from: Obj)
	for _, o in World.objects do
		if o.state == "idle" and table.find(o.supports, removed.id) then
			local fall = o.def.destructionType == "collapse"
			if not fall then
				fall = true
				for _, sid in o.supports do
					local s = World.objects[sid]
					if s and s.state ~= "gone" and s.state ~= "falling" then
						fall = false
						break
					end
				end
			end
			if fall then
				o.state = "falling"
				o.fallVy = 0
				o.vx, o.vz = 0, 0
				local dx, dz = from.x - o.x, from.z - o.z
				local len = math.sqrt(dx * dx + dz * dz)
				local drop = o.y - World.ground(o.x, o.z)
				if o.def.topple and drop > 3 then
					local reach = math.min(drop * 0.45, 22)
					local t = math.sqrt(2 * drop / 9.8)
					local nx, nz
					if len > 0.5 then
						nx, nz = dx / len, dz / len
					else
						nx, nz = math.cos((o.id - 1) * 2.4), math.sin((o.id - 1) * 2.4)
					end
					o.vx = nx * reach / t
					o.vz = nz * reach / t
				end
				syncAttributes(o)
				release(o, from)
			end
		end
	end
end

-- Remove an absorbed object and release what it held up.
function World.remove(o: Obj)
	o.state = "gone"
	if o.model then
		o.model:Destroy()
		o.model = nil
	end
	release(o, o)
end

-- Pull simulation for one object toward its owner's intake; returns true when absorbed.
local CC = WebConfig.collection
function World.stepPull(o: Obj, dt: number, ownerX: number, ownerZ: number, ownerY: number, heading: number, diameter: number, pull: number): boolean
	o.pullTime += dt
	if o.pullTime < o.phase then
		-- Destruction beat: crush/collapse objects squash, rip objects tilt up.
		local k = o.pullTime / math.max(0.001, o.phase)
		if o.def.destructionType == "rip" then
			o.tilt = -0.5 * k
		end
		place(o)
		return false
	end
	-- Fly to the intake: 0.3·d ahead of the machine at 0.32·d height.
	local tx = ownerX - math.sin(heading) * diameter * 0.3
	local tz = ownerZ - math.cos(heading) * diameter * 0.3
	local ty = ownerY + diameter * 0.32
	local cy = o.y + o.def.size[2] * 0.5
	local dx, dy, dz = tx - o.x, ty - cy, tz - o.z
	local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
	local arrived = dist < diameter * CC.absorbDistanceFactor + o.radius * 0.25 or o.pullTime > CC.maxPullSeconds / pull + o.phase
	if arrived then
		return true
	end
	local accel = CC.pullAcceleration * (0.4 + diameter) * pull
	local damp = math.exp(-5 * dt)
	local inv = 1 / math.max(dist, 1e-3)
	o.vx = o.vx * damp + dx * inv * accel * dt
	o.vy = o.vy * damp + dy * inv * accel * dt + 2.5 * diameter * dt
	o.vz = o.vz * damp + dz * inv * accel * dt
	o.x += o.vx * dt
	o.y += o.vy * dt
	o.z += o.vz * dt
	local t = o.pullTime - o.phase
	o.spin += (6 + 10 * t) * dt
	o.yaw += (6 + 10 * t) * dt
	local m = o.model
	if m then
		local s = math.max(0.3, 1 - 0.8 * t)
		local base = m:GetAttribute("BaseScale") :: number?
		if not base then
			base = m:GetScale()
			m:SetAttribute("BaseScale", base)
		end
		m:ScaleTo((base :: number) * s)
	end
	place(o)
	return false
end

-- Falling parts (web World.updateFalling): gravity, drift from a topple, slump; on landing they
-- become idle, unanchored objects on the ground. Returns the ones that landed this step.
function World.stepFalling(dt: number): { Obj }
	local landed: { Obj } = {}
	local b = World.city and World.city.bounds
	for _, o in World.objects do
		if o.state == "falling" then
			o.fallVy -= 9.8 * dt
			o.y += o.fallVy * dt
			if (o.vx ~= 0 or o.vz ~= 0) and b then
				o.x = math.clamp(o.x + o.vx * dt, b.minX + o.radius, b.maxX - o.radius)
				o.z = math.clamp(o.z + o.vz * dt, b.minZ + o.radius, b.maxZ - o.radius)
			end
			o.tilt += dt * 0.35 * (if o.id % 2 == 0 then 1 else -1) -- slump as it drops (web ids are 0-based)
			local g = World.ground(o.x, o.z)
			if o.y <= g then
				o.y = g
				o.state = "idle"
				o.anchored = false
				o.fallVy, o.vx, o.vz = 0, 0, 0
				o.tilt = math.clamp(o.tilt, -0.12, 0.12)
				syncAttributes(o)
				addToGrid(o)
				table.insert(landed, o)
			end
			place(o)
		end
	end
	return landed
end

-- Solid for a machine of this power (web World.isSolid): held up in the air = pass underneath.
function World.solid(o: Obj, power: number, landmarkOpen: boolean): boolean
	if o.state ~= "idle" then
		return false
	end
	if o.y > World.ground(o.x, o.z) + 2.5 then
		return false
	end
	return o.anchored or not World.eligible(o, power, landmarkOpen)
end

function World.box(o: Obj): Collision.Box
	return { o.x, o.z, o.def.size[1] / 2, o.def.size[3] / 2, o.yaw }
end

return World
