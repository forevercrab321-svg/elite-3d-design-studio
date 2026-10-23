--!strict
-- The player's machine. The Roblox character stays (it does the walking and the physics) but turns
-- invisible; the machine is welded to the root part inside the character model, so Model:ScaleTo
-- grows the two together. It is the web game's own model (Machine_<look>_T<tier>, swapped for the
-- next tier as the player grows) or, while that model is not uploaded, a primitive googly-eyed one.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Models = require(script.Parent:WaitForChild("Models"))

local Machine = {}

local function weldedPart(parent: Instance, root: BasePart, name: string, size: Vector3, offset: CFrame, color: Color3, material: Enum.Material): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Color = color
	p.Material = material
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Massless = true
	p.Anchored = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CFrame = root.CFrame * offset
	local w = Instance.new("WeldConstraint")
	w.Part0 = root
	w.Part1 = p
	w.Parent = p
	p.Parent = parent
	return p
end

-- Hide the default body (and face/accessories) so only the machine shows.
function Machine.hideBody(char: Model)
	local machine = char:FindFirstChild("Machine")
	for _, d in char:GetDescendants() do
		if d:IsA("BasePart") and d.Name ~= "HumanoidRootPart" and not (machine and d:IsDescendantOf(machine)) then
			d.Transparency = 1
		elseif d:IsA("Decal") then
			d.Transparency = 1
		end
	end
end

local function tierFor(scale: number): number
	local tier = 1
	for n, from in Config.MACHINE_TIER_SCALES do
		if scale >= from then
			tier = n
		end
	end
	return tier
end

-- The web model for this look and scale, welded under the root part with its wheels on the ground.
local function attachModel(char: Model, root: BasePart, look: string, scale: number): boolean
	local hum = char:FindFirstChildOfClass("Humanoid")
	local tier = tierFor(scale)
	local m = Models.clone(string.format("Machine_%s_T%d", look, tier), Config.MACHINE_SIZE * scale)
	if not hum or not m then
		return false
	end
	local ground = hum.HipHeight + root.Size.Y / 2
	m:PivotTo(root.CFrame * CFrame.new(0, -ground, 0) * CFrame.Angles(0, math.rad(Config.MACHINE_YAW), 0))
	for _, p in m:GetDescendants() do
		if p:IsA("BasePart") then
			p.Anchored = false
			p.CanCollide = false
			p.CanQuery = false
			p.CanTouch = false
			p.Massless = true
			local w = Instance.new("WeldConstraint")
			w.Part0 = root
			w.Part1 = p
			w.Parent = p
		end
	end
	m.Name = "Machine"
	m:SetAttribute("Look", look)
	m:SetAttribute("Tier", tier)
	m.Parent = char
	return true
end

-- Build the machine for the character's current scale.
function Machine.attach(char: Model, look: string, color: Color3)
	local root = char:WaitForChild("HumanoidRootPart", 10) :: BasePart?
	if not root or char:FindFirstChild("Machine") then
		return
	end
	if attachModel(char, root, look, char:GetScale()) then
		Machine.hideBody(char)
		return
	end
	local m = Instance.new("Model")
	m.Name = "Machine"
	-- The root part sits about 3 studs above the ground at scale 1; build down from there.
	local dark = Color3.fromRGB(35, 35, 40)
	weldedPart(m, root, "Chassis", Vector3.new(3.6, 2.2, 4.6), CFrame.new(0, -1.6, 0), color, Enum.Material.SmoothPlastic)
	weldedPart(m, root, "Hood", Vector3.new(3.2, 0.6, 1.6), CFrame.new(0, -0.3, -1.2), color:Lerp(Color3.new(1, 1, 1), 0.2), Enum.Material.SmoothPlastic)
	weldedPart(m, root, "Intake", Vector3.new(3.8, 1.2, 0.6), CFrame.new(0, -2.2, -2.5), dark, Enum.Material.Metal)
	for _, sx in { -1, 1 } do
		for _, sz in { -1, 1 } do
			local w = weldedPart(m, root, "Wheel", Vector3.new(0.7, 1.6, 1.6), CFrame.new(sx * 2.05, -2.2, sz * 1.5), dark, Enum.Material.SmoothPlastic)
			w.Shape = Enum.PartType.Cylinder
		end
		-- Googly eyes: big white balls on stalks, pupils looking forward.
		weldedPart(m, root, "Stalk", Vector3.new(0.25, 1.0, 0.25), CFrame.new(sx * 0.8, 0.2, -0.6), dark, Enum.Material.Metal)
		local eye = weldedPart(m, root, "Eye", Vector3.new(1.4, 1.4, 1.4), CFrame.new(sx * 0.8, 0.9, -0.7), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic)
		eye.Shape = Enum.PartType.Ball
		local pupil = weldedPart(m, root, "Pupil", Vector3.new(0.6, 0.6, 0.6), CFrame.new(sx * 0.8, 0.9, -1.3), Color3.new(0, 0, 0), Enum.Material.SmoothPlastic)
		pupil.Shape = Enum.PartType.Ball
	end
	m.Parent = char
	Machine.hideBody(char)
end

-- After the character was scaled: swap in the next tier's model when growth crossed a threshold.
function Machine.update(char: Model, scale: number)
	local current = char:FindFirstChild("Machine")
	local root = char:FindFirstChild("HumanoidRootPart") :: BasePart?
	local look = current and current:GetAttribute("Look") :: string?
	if not current or not root or not look or current:GetAttribute("Tier") == tierFor(scale) then
		return
	end
	current:Destroy()
	if not attachModel(char, root, look, scale) then
		warn("Machine: tier model missing for " .. look)
	end
end

function Machine.look(index: number): string
	local list = Config.MACHINE_LOOKS
	return list[(index - 1) % #list + 1]
end

function Machine.color(index: number): Color3
	local list = Config.MACHINE_COLORS
	return list[(index - 1) % #list + 1]
end

return Machine
