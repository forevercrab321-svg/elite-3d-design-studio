--!strict
-- GROW EVERYTHING (Roblox) — every balance value lives here.
-- Units are studs (a default character is about 5 studs tall at scale 1).

local ModelInfo = require(script.Parent:WaitForChild("ModelInfo"))

local Config = {}

-- Rounds
Config.ROUND_SECONDS = 300
Config.INTERMISSION_SECONDS = 15
Config.MIN_PLAYERS_TO_START = 1

-- Growth: the character's scale is (mass / START_MASS) ^ (1/3), so mass grows like volume.
Config.START_MASS = 10
Config.MAX_SCALE = 40
-- You can eat an object whose size (largest dimension, studs) is at most this × your height.
Config.EAT_REACH = 0.8
Config.CHARACTER_HEIGHT = 5
-- Mass gained from an object of size x: REWARD_FACTOR × x^REWARD_EXP. The exponent is below 3
-- (mass grows like volume), so each bite is worth less relative to you as you grow: early growth
-- is fast, late growth needs buildings.
-- v0.2: 0.5 → 0.3 (the first playtest reached car size in about a minute; target is 1.5–3 min).
Config.REWARD_FACTOR = 0.3
-- v0.3: 2.5 → 2.7. roblox/tests/run.luau simulates a player who always eats the biggest thing in
-- reach: at 2.5 the Pearl Tower needed 74% of the whole city's mass (impossible in a shared 5-minute
-- round); at 2.7 it needs about a third, while early growth (car size after ~5 bites) is unchanged.
Config.REWARD_EXP = 2.7
-- Eating radius around the root part, in character heights.
Config.EAT_RADIUS = 0.55
Config.EAT_TICK = 0.1

-- PvP: a player this many times bigger eats a smaller one and takes this share of its mass.
Config.PVP_RATIO = 1.25
Config.PVP_STEAL = 0.5

-- Movement: speed grows slowly with size, the camera pulls back a lot.
Config.BASE_WALKSPEED = 18
Config.WALKSPEED_PER_SCALE = 1.5
Config.MAX_WALKSPEED = 60
-- Follow camera from the web game (game/src/config/growth.ts camera: distanceBase 1.25 m +
-- 4.2 × machine diameter, heightBase 0.5 m + 2.0 × diameter, FOV 56° + 1.6°/m up to 64°), converted
-- with the machine's 0.9 m = MACHINE_SIZE studs. Zoom is held near that distance: low and close,
-- like the web game, instead of Roblox's default high orbit.
Config.CAMERA_DIST_BASE = 6.95
Config.CAMERA_DIST_PER_SIZE = 4.2
Config.CAMERA_HEIGHT_BASE = 2.8
Config.CAMERA_HEIGHT_PER_SIZE = 2.0
Config.CAMERA_ZOOM_RANGE = 0.35 -- players may zoom ±35% around the web distance
Config.CAMERA_FOV_BASE = 56
Config.CAMERA_FOV_PER_SIZE = 1.6 / 5.56 -- per stud of machine size (1 m = 5.56 studs)
Config.CAMERA_FOV_MAX = 64

-- City layout (procedural): GRID × GRID blocks separated by roads.
Config.GRID = 7
Config.BLOCK = 90
Config.ROAD = 26
-- Landmarks (one per listed block, never respawn). Edible from scale size / (EAT_REACH × height):
-- the Empire State at about 32, the Pearl Tower at about 37.
-- model = the web game's assembled landmark (primitive builder `style` when it is not loaded).
export type Landmark = { name: string, style: string, model: string, size: number, block: { number } }
Config.LANDMARKS = {
	{ name = "Oriental Pearl Tower", style = "pearl", model = "Landmark_PearlTower", size = 150, block = { 3, 3 } },
	{ name = "Empire State Building", style = "empire", model = "Landmark_EmpireState", size = 130, block = { 1, 5 } },
	{ name = "Eiffel Tower", style = "eiffel", model = "Landmark_Eiffel", size = 140, block = { 5, 1 } },
} :: { Landmark }

-- Colour palettes: buildings and vehicles pick a random one so the city reads as a city.
Config.BUILDING_COLORS = {
	Color3.fromRGB(226, 196, 160), Color3.fromRGB(196, 92, 72), Color3.fromRGB(96, 160, 168),
	Color3.fromRGB(240, 228, 200), Color3.fromRGB(110, 130, 170), Color3.fromRGB(150, 196, 150),
	Color3.fromRGB(232, 168, 96), Color3.fromRGB(170, 120, 160),
}
Config.VEHICLE_COLORS = {
	Color3.fromRGB(220, 60, 60), Color3.fromRGB(60, 110, 220), Color3.fromRGB(245, 245, 245),
	Color3.fromRGB(250, 200, 40), Color3.fromRGB(40, 40, 46), Color3.fromRGB(70, 170, 110),
}
-- Player machines: the web game's four looks (Machine_<look>_T<tier>), one per player in join order.
-- The tier upgrades as you grow: tier n from scale MACHINE_TIER_SCALES[n]. MACHINE_SIZE = largest
-- dimension in studs at scale 1. MACHINE_YAW turns the imported model if it faces the wrong way.
Config.MACHINE_LOOKS = { "collector", "dozer", "racer", "magnet" }
Config.MACHINE_TIER_SCALES = { 1, 2, 4, 8, 16 }
Config.MACHINE_SIZE = 5
Config.MACHINE_YAW = 0
-- Primitive fallback machines: one bright body colour each.
Config.MACHINE_COLORS = {
	Color3.fromRGB(255, 140, 40), Color3.fromRGB(60, 170, 255), Color3.fromRGB(120, 220, 90),
	Color3.fromRGB(255, 90, 160), Color3.fromRGB(170, 110, 255), Color3.fromRGB(255, 215, 60),
}

-- Edible catalog. Each kind uses one of the web game's models (Shared.ModelInfo; drawn by
-- server/Models when its asset id is in Shared.AssetIds, primitives otherwise). size = largest
-- dimension in studs (sets reward and when it becomes edible); dims follow the model's proportions.
-- count = how many per city; respawn = refill after being eaten; where = sidewalk | road | block.
export type PropKind = {
	name: string,
	model: string?,
	size: number,
	dims: Vector3,
	color: Color3,
	material: Enum.Material,
	count: number,
	respawn: boolean,
	where: string,
}

local function kind(name: string, model: string?, size: number, count: number, where: string, color: Color3, material: Enum.Material): PropKind
	local info = if model then ModelInfo[model] else nil
	local dims = if info then info.size * (size / math.max(info.size.X, info.size.Y, info.size.Z)) else Vector3.new(size * 0.55, size, size * 0.55)
	return { name = name, model = model, size = size, dims = dims, color = color, material = material, count = count, respawn = where ~= "block", where = where }
end

local rgb = Color3.fromRGB
local M = Enum.Material
Config.PROPS = {
	-- Sidewalk litter and street furniture.
	kind("Can", "CAN", 0.8, 160, "sidewalk", rgb(200, 60, 50), M.Metal),
	kind("Bottle", "BOTTLE", 1.1, 120, "sidewalk", rgb(70, 160, 90), M.Glass),
	kind("Brick", "BRICK", 1.0, 70, "sidewalk", rgb(170, 80, 60), M.Brick),
	kind("Box", "CARDBOARD_SMALL", 1.4, 100, "sidewalk", rgb(180, 140, 90), M.Cardboard),
	kind("Trash Bag", "TRASH_BAG", 2.0, 60, "sidewalk", rgb(40, 40, 45), M.Plastic),
	kind("Hydrant", "FIRE_HYDRANT", 2.2, 50, "sidewalk", rgb(200, 40, 40), M.Metal),
	kind("Chair", "CHAIR", 2.6, 50, "sidewalk", rgb(120, 80, 50), M.Wood),
	kind("Trash Can", "TRASH_CAN", 3.0, 60, "sidewalk", rgb(60, 90, 70), M.Metal),
	kind("Cafe Table", "CAFE_TABLE", 3.2, 40, "sidewalk", rgb(60, 60, 64), M.Metal),
	kind("Shopping Cart", "SHOPPING_CART", 3.4, 30, "sidewalk", rgb(180, 185, 190), M.Metal),
	kind("Tree", nil, 9, 60, "sidewalk", rgb(80, 160, 80), M.Grass),
	kind("Bench", "BENCH", 4.5, 50, "sidewalk", rgb(120, 80, 50), M.Wood),
	kind("Bicycle", "BICYCLE", 5.5, 40, "sidewalk", rgb(40, 110, 200), M.Metal),
	kind("Scooter", "SCOOTER", 5.5, 30, "sidewalk", rgb(220, 60, 60), M.SmoothPlastic),
	kind("Vending Machine", "VENDING_MACHINE", 6.5, 30, "sidewalk", rgb(200, 40, 40), M.SmoothPlastic),
	kind("Dumpster", "DUMPSTER", 7, 30, "sidewalk", rgb(40, 110, 70), M.Metal),
	kind("Food Cart", "FOOD_CART", 8, 16, "sidewalk", rgb(240, 200, 60), M.SmoothPlastic),
	kind("Advertising Column", "MORRIS_COLUMN", 9, 16, "sidewalk", rgb(40, 90, 60), M.Metal),
	kind("Kiosk", "KIOSK", 10, 14, "sidewalk", rgb(40, 90, 60), M.Metal),
	kind("Subway Entrance", "SUBWAY_ENTRANCE", 11, 10, "sidewalk", rgb(40, 90, 60), M.Metal),
	-- Traffic.
	kind("Cone", "TRAFFIC_CONE", 1.8, 90, "road", rgb(240, 120, 30), M.Plastic),
	kind("Motorcycle", "MOTORCYCLE", 6, 24, "road", rgb(40, 40, 46), M.Metal),
	kind("Car", "CAR_COMPACT", 11, 40, "road", rgb(60, 110, 200), M.SmoothPlastic),
	kind("Taxi", "TAXI_NY", 12, 30, "road", rgb(250, 200, 40), M.SmoothPlastic),
	kind("Van", "VAN", 14, 20, "road", rgb(235, 235, 235), M.SmoothPlastic),
	kind("Delivery Truck", "DELIVERY_TRUCK", 18, 14, "road", rgb(235, 235, 235), M.SmoothPlastic),
	kind("Bus", "BUS_NY", 26, 12, "road", rgb(230, 180, 40), M.SmoothPlastic),
	-- Buildings from the three cities: 174 of the 184 block quadrants, so every street has a wall of
	-- buildings like the web game (one per quadrant; never respawn).
	kind("Shikumen House", "B_SHIKUMEN", 28, 26, "block", rgb(150, 150, 155), M.Brick),
	kind("Brownstone", "B_BROWNSTONE", 34, 26, "block", rgb(140, 80, 60), M.Brick),
	kind("Paris Cafe", "B_PARIS_CAFE", 34, 26, "block", rgb(230, 220, 200), M.Limestone),
	kind("Haussmann Building", "B_HAUSSMANN", 52, 24, "block", rgb(230, 220, 200), M.Limestone),
	kind("Shanghai Apartments", "B_SH_MID", 58, 20, "block", rgb(200, 200, 205), M.Concrete),
	kind("New York Loft", "B_NY_LOFT", 72, 18, "block", rgb(170, 100, 80), M.Brick),
	kind("Peace Hotel", "PEACE_HOTEL", 80, 10, "block", rgb(200, 190, 170), M.Limestone),
	kind("Customs House", "CUSTOMS_HOUSE", 56, 8, "block", rgb(200, 190, 170), M.Limestone),
	kind("Flatiron Building", "FLATIRON", 40, 8, "block", rgb(220, 210, 190), M.Limestone),
	kind("Times Square Tower", "TIMES_TOWER", 100, 8, "block", rgb(110, 130, 160), M.Glass),
} :: { PropKind }

-- Monetization (create these in the Creator Hub, then paste the ids). 0 = not set up yet.
-- Cosmetics only: nothing you can buy makes you bigger or faster.
Config.GAMEPASS_VIP_TRAIL = 0

-- Remote names (created by the server in ReplicatedStorage.Remotes).
Config.REMOTES = { "Ate", "Eaten", "RoundState" }

-- Respawning props come back this long after being eaten, somewhere else in the city.
Config.RESPAWN_SECONDS = 20

return Config
