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
local Pull = require(Shared:WaitForChild("Pull"))
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
	-- refill (ArenaGame refill): home pose, the colours to rebuild it, when it may come back
	home: { number },
	base0: Color3,
	refillAt: number?,
	pullFrom: { number }?,
}

local World = {}
-- Time source for refills (tests run on simulated time).
World.clock = os.clock
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

-- Fallback street scenery from the city data when the scenery model cannot be loaded: the ground
-- grid as asphalt (roads) and raised pavement (kerb height), and the static buildings as boxes.
local BLOCK_COLORS: { [string]: Color3 } = {
	brick = Color3.fromRGB(150, 82, 62), darkBrick = Color3.fromRGB(96, 70, 60), plaster = Color3.fromRGB(196, 186, 166),
	concrete = Color3.fromRGB(150, 150, 146), steel = Color3.fromRGB(120, 130, 140),
}
local BLOCK_MATERIALS: { [string]: Enum.Material } = {
	brick = Enum.Material.Brick, darkBrick = Enum.Material.Brick, plaster = Enum.Material.Concrete,
	concrete = Enum.Material.Concrete, steel = Enum.Material.Metal,
}
local function fallbackScenery(city: any, parent: Instance)
	local folder = Instance.new("Folder")
	folder.Name = "FallbackScenery"
	folder.Parent = parent
	local function slab(x0: number, x1: number, z0: number, z1: number, h: number)
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		local top = math.max(h, 0.001)
		p.Size = Vector3.new((x1 - x0) * K, (top + 0.5) * K, (z1 - z0) * K)
		p.CFrame = CFrame.new((x0 + x1) / 2 * K, (top - 0.5) / 2 * K, (z0 + z1) / 2 * K)
		if h > 0.01 then
			p.Color = Color3.fromRGB(176, 174, 168)
			p.Material = Enum.Material.Pavement
		else
			p.Color = Color3.fromRGB(70, 70, 72)
			p.Material = Enum.Material.Asphalt
		end
		p.Parent = folder
	end
	-- Rows of runs → rectangles, merging identical consecutive rows.
	local g = city.ground
	local prevRow: string? = nil
	local startZ = g.z0
	local function flush(row: string, z0: number, z1: number)
		local x = g.x0
		for h, n in string.gmatch(row, "([%-%d%.]+)%*(%d+)") do
			local count = tonumber(n) :: number
			slab(x, x + count, z0, z1, tonumber(h) :: number)
			x += count
		end
	end
	for i, row in g.rows do
		local z = g.z0 + i - 1
		if row ~= prevRow then
			if prevRow then
				flush(prevRow, startZ, z)
			end
			prevRow = row
			startZ = z
		end
	end
	if prevRow then
		flush(prevRow, startZ, g.z0 + #g.rows)
	end
	for _, b in city.blocks or {} do
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Size = Vector3.new(b[4], b[5], b[6]) * K
		p.CFrame = CFrame.new(b[1] * K, (b[2] + b[5] / 2) * K, b[3] * K)
		p.Color = BLOCK_COLORS[b[7]] or BLOCK_COLORS.concrete
		p.Material = BLOCK_MATERIALS[b[7]] or Enum.Material.Concrete
		p.Parent = folder
	end
end

-- A box of the object's real size and colour when its model could not be loaded, so the object
-- is still visible, claimable and solid for everyone.
function World.placeholder(def: any, color: Color3): Model
	local m = Instance.new("Model")
	local p = Instance.new("Part")
	p.Name = "Placeholder"
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Color = color
	p.Size = Vector3.new(def.size[1], def.size[2], def.size[3]) * K
	p.CFrame = CFrame.new(0, def.size[2] / 2 * K, 0)
	p.Parent = m
	m.WorldPivot = CFrame.new()
	return m
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
		warn("World: scenery " .. city.scenery .. " missing, building the fallback street scenery")
		fallbackScenery(city, root)
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

	-- Street-tree canopies: the web's leaf cards (alpha-tested) cannot be MeshParts, so each crown
	-- is a cluster of leafy balls where the web crown sits (trunk 2.6–3.4 m, crown 1.6–2.2 m above
	-- it, radius 1.9–2.5 m × the city's crown scale, squashed to 0.72 in height).
	local canopies = Instance.new("Folder")
	canopies.Name = "Canopies"
	canopies.Parent = root
	local leafRng = Random.new(1)
	for _, t in city.trees do
		local tx, treeBase, tz = t[1], t[2], t[3]
		local radius = (1.9 + leafRng:NextNumber() * 0.6) * (city.canopyScale or 1)
		local cy = treeBase + 3 + 1.9
		local green = Color3.fromRGB(70 + leafRng:NextInteger(0, 25), 110 + leafRng:NextInteger(0, 30), 55 + leafRng:NextInteger(0, 15))
		for k = 1, 4 do
			local a = k * 2.1 + leafRng:NextNumber()
			local off = if k == 1 then Vector3.zero else Vector3.new(math.cos(a) * radius * 0.45, (leafRng:NextNumber() - 0.3) * radius * 0.3, math.sin(a) * radius * 0.45)
			local r = if k == 1 then radius else radius * (0.6 + leafRng:NextNumber() * 0.2)
			local ball = Instance.new("Part")
			ball.Shape = Enum.PartType.Ball
			ball.Anchored = true
			ball.CanCollide = false
			ball.CanQuery = false
			ball.CanTouch = false
			ball.Material = Enum.Material.LeafyGrass
			ball.Color = green
			ball.Size = Vector3.one * r * 2 * K
			ball.CFrame = CFrame.new((Vector3.new(tx, cy, tz) + off) * K)
			ball.Parent = canopies
		end
	end

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
			home = { x, y, z, yaw },
			pullFrom = nil,
			base0 = base0,
			refillAt = nil,
		}
		local m = Models.clone(typeId, 1, color, base0) or World.placeholder(def, color)
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
	o.pullFrom = { o.x, o.y, o.z, o.yaw }
	o.phase = Pull.phase(o.def)
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

-- Remove an absorbed object and release what it held up. Small and medium props that are not
-- landmark parts and not stacked come back at home later (arena refill).
local A = WebConfig.arena
function World.remove(o: Obj)
	o.state = "gone"
	if o.def.objectClass <= A.refillMaxClass and not o.def.climax and #o.supports == 0 then
		o.refillAt = World.clock() + A.refillDelay + o.def.objectClass * A.refillPerClass
	end
	if o.model then
		o.model:Destroy()
		o.model = nil
	end
	release(o, o)
end

-- Pull simulation (shared Pull, the web formula) for the server's decision only: the server never
-- moves or rescales the pulled model; clients animate their copies. Returns true when absorbed.
function World.stepPull(o: Obj, dt: number, ownerX: number, ownerZ: number, ownerY: number, heading: number, diameter: number, pull: number): boolean
	return Pull.step(o :: any, o.def, o.radius, dt, ownerX, ownerZ, ownerY, heading, diameter, pull)
end

-- The owner died or left mid-pull: the object goes back where it was, idle.
function World.resetPull(o: Obj)
	local from = o.pullFrom
	if from then
		o.x, o.y, o.z, o.yaw = from[1], from[2], from[3], from[4]
	end
	o.state = "idle"
	o.owner = nil
	o.tilt = 0
	o.vx, o.vy, o.vz = 0, 0, 0
	place(o)
	syncAttributes(o)
	addToGrid(o)
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

-- Refill due objects whose home is clear of machines ({x, z, diameter} each); at most
-- refillPerCheck per call. Returns how many came back.
function World.refill(machines: { { number } }): number
	local n = 0
	local t = World.clock()
	local folder = arena and arena:FindFirstChild("Objects")
	for _, o in World.objects do
		if n >= A.refillPerCheck then
			break
		end
		if o.state == "gone" and o.refillAt and t >= o.refillAt then
			local hx, hy, hz, hyaw = o.home[1], o.home[2], o.home[3], o.home[4]
			local clear = true
			for _, m in machines do
				local need = A.refillClearance + math.min(2 * m[3], A.refillClearanceMaxExtra) + o.radius
				if (m[1] - hx) ^ 2 + (m[2] - hz) ^ 2 < need * need then
					clear = false
					break
				end
			end
			if clear then
				o.x, o.y, o.z, o.yaw, o.tilt = hx, hy, hz, hyaw, 0
				o.state = "idle"
				o.refillAt = nil
				o.vx, o.vy, o.vz = 0, 0, 0
				local m = Models.clone(o.type, 1, o.color, o.base0) or World.placeholder(o.def, o.color)
				if m and folder then
					m.Name = tostring(o.id)
					m:SetAttribute("Id", o.id)
					m:SetAttribute("Type", o.type)
					o.model = m
					place(o)
					syncAttributes(o)
					m.Parent = folder
				end
				addToGrid(o)
				n += 1
			end
		end
	end
	return n
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
