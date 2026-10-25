--!strict
-- Game feel on the client, after the web game's systems/Effects.ts and audio/AudioEngine.ts:
--  * sounds: the web's own procedural effects rendered into one sprite (Shared.Sfx, uploaded as
--    AssetIds.GrowSfx) played with Sound.PlaybackRegion; pickup ticks climb a pentatonic ladder
--    while chained, like the web;
--  * camera trauma (shake = trauma², decays 1.4/s, 17 Hz, max 6% of camera distance), a timed
--    pull-back (tier up, landmark) and a dash FOV kick;
--  * particles: burst, shards, dust, sparks and a ground pulse ring.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local WebConfig = require(Shared:WaitForChild("WebConfig"))
local AssetIds = require(Shared:WaitForChild("AssetIds"))
local Sfx = require(Shared:WaitForChild("Sfx"))

local FEEL = WebConfig.feel

local Feel = {}

-- Sounds -----------------------------------------------------------------------------------------
local spriteId = AssetIds.GrowSfx
-- Built-in engine sounds stand in until the sprite is uploaded.
local FALLBACK: { [string]: string } = {
	absorb_tick = "rbxasset://sounds/electronicpingshort.wav",
	absorb_small = "rbxasset://sounds/electronicpingshort.wav",
	tier = "rbxasset://sounds/victory.wav",
	win = "rbxasset://sounds/victory.wav",
	eaten = "rbxasset://sounds/uuhhh.mp3",
	beep_low = "rbxasset://sounds/clickfast.wav",
	beep_high = "rbxasset://sounds/clickfast.wav",
}
local function playSound(name: string, volume: number?, speed: number?)
	local s = Instance.new("Sound")
	s.Volume = volume or 0.8
	s.PlaybackSpeed = speed or 1
	local region = Sfx[name]
	if spriteId and region then
		s.SoundId = "rbxassetid://" .. spriteId
		s.PlaybackRegionsEnabled = true
		s.PlaybackRegion = NumberRange.new(region[1], region[1] + region[2])
	else
		local id = FALLBACK[name]
		if not id then
			s:Destroy()
			return
		end
		s.SoundId = id
	end
	s.Parent = SoundService
	s:Play()
	Debris:AddItem(s, ((region and region[2]) or 3) / (speed or 1) + 0.5)
end

function Feel.play(name: string, volume: number?, speed: number?)
	playSound(name, volume, speed)
end

-- Pickup tick: chained pickups climb STREAK_STEPS (semitones) within 0.7 s (AudioEngine.tick).
local STREAK_STEPS = { 0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24 }
local streak, lastStreak = 0, -10
function Feel.tick(size: number)
	local t = os.clock()
	streak = if t - lastStreak < 0.7 then math.min(#STREAK_STEPS - 1, streak + 1) else 0
	lastStreak = t
	-- The rendered tick is the base pitch for a 0.1 m object; size lowers it like the web.
	local base = math.max(500, 1150 - size * 700) / math.max(500, 1150 - 0.1 * 700)
	playSound("absorb_tick", 0.6, base * 2 ^ (STREAK_STEPS[streak + 1] / 12))
end

-- Absorb sound by class (AudioEngine.handle 'absorb').
function Feel.absorb(cls: number, size: number)
	if cls <= 2 then
		Feel.tick(size)
	elseif cls == 3 then
		playSound("absorb_3")
	elseif cls == 4 then
		playSound("absorb_4")
	elseif cls <= 6 then
		playSound("absorb_5")
	elseif cls <= 8 then
		playSound("absorb_7")
	else
		playSound("absorb_9")
	end
end

function Feel.crunch(cls: number)
	playSound(if cls >= 8 then "crunch_8" elseif cls >= 6 then "crunch_6" else "crunch_4")
end

-- Camera feel ------------------------------------------------------------------------------------
local trauma = 0
local pull, pullUntil, pullTotal = 0, 0, 1
local fovKick = 0

function Feel.trauma(amount: number)
	trauma = math.min(1, trauma + amount)
end

-- Trauma from something at distance `dist` m (fades past 45 m + 3 × size, like the web).
function Feel.traumaAt(amount: number, dist: number, size: number)
	local falloff = 45 + size * 3
	if dist < falloff * 2 then
		Feel.trauma(amount * math.clamp(1 - dist / (falloff * 2), 0, 1))
	end
end

function Feel.pullBack(amount: number, seconds: number)
	pull = amount
	pullTotal = seconds
	pullUntil = os.clock() + seconds
end

function Feel.kickFov(deg: number)
	fovKick = math.max(fovKick, deg)
end

-- Per frame: returns a camera offset (studs), a distance multiplier and extra FOV degrees.
function Feel.camera(dt: number, distance: number): (Vector3, number, number)
	trauma = math.max(0, trauma - FEEL.traumaDecay * dt)
	local s = trauma * trauma
	local t = os.clock() * 17
	local offset = Vector3.new(math.noise(t, 0.3) * 2, math.noise(t, 4.1) * 2, math.noise(t, 9.7) * 2) * s * FEEL.maxShakeOffset * distance
	local left = pullUntil - os.clock()
	local p = if left > 0 then pull * math.sin(math.clamp(left / pullTotal, 0, 1) * math.pi) else 0
	fovKick = math.max(0, fovKick - 5 * fovKick * dt)
	return offset, 1 + p, fovKick + p * 30
end

-- Particles --------------------------------------------------------------------------------------
local fxFolder = Instance.new("Folder")
fxFolder.Name = "Fx"
fxFolder.Parent = workspace

local function emitter(position: Vector3, props: { [string]: any }, count: number, life: number)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Transparency = 1
	p.Size = Vector3.one * 0.1
	p.Position = position
	local a = Instance.new("Attachment")
	a.Parent = p
	local e = Instance.new("ParticleEmitter")
	e.Enabled = false
	for k, v in props do
		(e :: any)[k] = v
	end
	e.Parent = a
	p.Parent = fxFolder
	e:Emit(count)
	Debris:AddItem(p, life + 0.5)
end

-- Shards: chunky coloured bits flung out and falling (Effects.shards).
function Feel.shards(position: Vector3, color: Color3, count: number, size: number, speed: number)
	emitter(position, {
		Color = ColorSequence.new(color),
		Size = NumberSequence.new(size),
		Speed = NumberRange.new(speed * 0.5, speed),
		SpreadAngle = Vector2.new(180, 180),
		Acceleration = Vector3.new(0, -workspace.Gravity * 0.6, 0),
		Lifetime = NumberRange.new(0.5, 0.9),
		Rotation = NumberRange.new(0, 360),
		RotSpeed = NumberRange.new(-300, 300),
		Texture = "rbxasset://textures/particles/sparkles_main.dds",
		LightEmission = 0,
		Transparency = NumberSequence.new(0, 1),
	}, count, 0.9)
end

function Feel.dust(position: Vector3, radius: number, count: number)
	emitter(position, {
		Color = ColorSequence.new(Color3.fromRGB(190, 180, 165)),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, radius * 0.4), NumberSequenceKeypoint.new(1, radius * 1.4) }),
		Speed = NumberRange.new(radius * 0.4, radius * 1.2),
		SpreadAngle = Vector2.new(90, 20),
		Lifetime = NumberRange.new(0.8, 1.4),
		Texture = "rbxasset://textures/particles/smoke_main.dds",
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.4), NumberSequenceKeypoint.new(1, 1) }),
		Drag = 2,
	}, count, 1.4)
end

function Feel.sparks(position: Vector3, count: number, speed: number)
	emitter(position, {
		Color = ColorSequence.new(Color3.fromRGB(255, 200, 90)),
		Size = NumberSequence.new(0.3, 0),
		Speed = NumberRange.new(speed * 0.5, speed),
		SpreadAngle = Vector2.new(180, 180),
		Acceleration = Vector3.new(0, -workspace.Gravity * 0.4, 0),
		Lifetime = NumberRange.new(0.25, 0.5),
		LightEmission = 1,
		Texture = "rbxasset://textures/particles/sparkles_main.dds",
	}, count, 0.5)
end

-- A small burst (pop at the intake, absorb burst).
function Feel.burst(position: Vector3, color: Color3, count: number, size: number)
	emitter(position, {
		Color = ColorSequence.new(color),
		Size = NumberSequence.new(size, 0),
		Speed = NumberRange.new(size * 4, size * 9),
		SpreadAngle = Vector2.new(180, 180),
		Lifetime = NumberRange.new(0.25, 0.45),
		LightEmission = 0.6,
		Texture = "rbxasset://textures/particles/sparkles_main.dds",
	}, count, 0.45)
end

-- Ground pulse ring (tier up, landmark, being eaten).
function Feel.pulse(position: Vector3, radius: number, color: Color3?)
	local ring = Instance.new("Part")
	ring.Shape = Enum.PartType.Cylinder
	ring.Anchored = true
	ring.CanCollide = false
	ring.CanQuery = false
	ring.CanTouch = false
	ring.Material = Enum.Material.Neon
	ring.Color = color or Color3.fromHex("ffb347")
	ring.Transparency = 0.3
	ring.Size = Vector3.new(0.2, 1, 1)
	ring.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.pi / 2)
	ring.Parent = fxFolder
	game:GetService("TweenService"):Create(ring, TweenInfo.new(0.7, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Size = Vector3.new(0.2, radius * 2, radius * 2), Transparency = 1 }):Play()
	Debris:AddItem(ring, 0.8)
end

return Feel
