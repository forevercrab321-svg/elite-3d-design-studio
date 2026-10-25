--!strict
-- AI rival, ported from the web arena (arena/ArenaBot.ts). Priorities, re-evaluated every few
-- hundred ms: 1. flee a machine that can eat it, 2. hunt a machine it can eat when one is close,
-- 3. otherwise collect the best nearby object (golden crates and power-ups favoured, squared
-- distance against diminishing reward). Skill (0..1) softens rookie rounds: slower decisions, a
-- shorter hunt radius, rarer dashes and no hunting humans during a grace period.
-- Output: a world direction (metres) and whether to dash, like the player's camera-mapped input.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local WebConfig = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("WebConfig"))

local A = WebConfig.arena

-- What the bot needs from the round (Main builds it).
export type Game = {
	time: number,
	matchTime: number,
	skill: number,
	actors: { any },
	objects: { any },
	canEat: (any, any) -> boolean,
	spares: (any, any) -> boolean,
	eligible: (any, number) -> boolean,
	reward: (any) -> number,
	isBlocked: (number, number, number, number, any) -> boolean,
}

local Bot = {}
Bot.__index = Bot

export type Bot = typeof(setmetatable({} :: {
	target: any,
	prey: any,
	threat: any,
	thinkAt: number,
	checkAt: number,
	lastDist: number,
	blacklist: { [number]: number },
	wanderUntil: number,
	wx: number,
	wz: number,
	nextDash: number,
	huntStart: number,
	spared: { [string]: number },
	rand: Random,
}, Bot))

function Bot.new(seed: number): Bot
	return setmetatable({
		target = nil,
		prey = nil,
		threat = nil,
		thinkAt = 0,
		checkAt = 0,
		lastDist = math.huge,
		blacklist = {},
		wanderUntil = 0,
		wx = 0,
		wz = -1,
		nextDash = 0,
		huntStart = 0,
		spared = {},
		rand = Random.new(seed),
	}, Bot)
end

local function hypot(x: number, z: number): number
	return math.sqrt(x * x + z * z)
end

function Bot.think(self: Bot, g: Game, me: any)
	local skill = math.clamp(g.skill, 0, 1)
	self.thinkAt = g.time + (0.25 + self.rand:NextNumber() * 0.15) * (1 + (1 - skill) * A.botThinkSlow)
	local huntRange = A.botHuntRangeRookie + (1 - A.botHuntRangeRookie) * skill
	local graceOver = g.matchTime >= A.botHumanGraceSeconds * (1 - skill)
	local prevPrey = self.prey
	self.threat = nil
	self.prey = nil
	local bestThreat, bestPrey = math.huge, math.huge
	for _, o in g.actors do
		if o ~= me and o.alive then
			local d = hypot(o.body.x - me.body.x, o.body.z - me.body.z)
			if g.canEat(o, me) and d < 10 + o.diameter * 3 and d < bestThreat then
				bestThreat = d
				self.threat = o
			elseif
				g.canEat(me, o)
				and d < (22 + me.diameter * 3) * huntRange
				and (o.kind == "bot" or graceOver)
				and d < bestPrey
				and (o.mass >= me.mass * A.botPreyMinShare or d < me.diameter)
				and not g.spares(me, o)
				and (self.spared[o.id] or 0) <= g.time
			then
				bestPrey = d
				self.prey = o
			end
		end
	end
	if self.prey ~= prevPrey then
		self.huntStart = g.time
	elseif self.prey and g.time - self.huntStart > A.botHuntGiveUp then
		self.spared[self.prey.id] = g.time + A.botHuntGiveUp
		self.prey = nil
	end
	if self.target and not g.eligible(self.target, me.diameter) then
		self.target = nil
	end
	if not self.target then
		local best, bestScore = nil, math.huge
		for _, o in g.objects do
			if g.eligible(o, me.diameter) and (self.blacklist[o.id] or 0) <= g.time then
				local d = hypot(o.x - me.body.x, o.z - me.body.z)
				-- Worth the trip: diminishing reward, golden crates ×2, power-ups ×6, own class ×1.4.
				local value = math.sqrt(math.max(0.05, g.reward(o))) * (if o.def.bonus then 2 elseif o.def.power then 6 else 1) * (if o.def.objectClass == me.cls then 1.4 else 1)
				local score = (d + 1.5) * (d + 1.5) / value
				if score < bestScore then
					bestScore = score
					best = o
				end
			end
		end
		self.target = best
		self.lastDist = math.huge
		self.checkAt = g.time + 0.8
	end
end

function Bot.avoid(self: Bot, g: Game, me: any, dx: number, dz: number): (number, number)
	local r = me.diameter * 0.5
	local ahead = me.diameter * 0.9 + 0.4
	for _, deg in { 0, 30, -30, 60, -60, 90, -90, 120, -120 } do
		local a = math.rad(deg)
		local cx = dx * math.cos(a) - dz * math.sin(a)
		local cz = dx * math.sin(a) + dz * math.cos(a)
		if not g.isBlocked(me.body.x + cx * ahead, me.body.z + cz * ahead, r, me.diameter, self.target) then
			return cx, cz
		end
	end
	return dx, dz
end

function Bot.intents(self: Bot, g: Game, me: any): (number, number, boolean)
	local t = g.time
	if t >= self.thinkAt then
		self:think(g, me)
	end
	local dx, dz, dash = 0, -1, false
	if t < self.wanderUntil then
		dx, dz = self.wx, self.wz
	elseif self.threat then
		dx = me.body.x - self.threat.body.x
		dz = me.body.z - self.threat.body.z
		dash = t > self.nextDash
	elseif self.prey then
		dx = self.prey.body.x - me.body.x
		dz = self.prey.body.z - me.body.z
		dash = hypot(dx, dz) < 6 + me.diameter * 2 and t > self.nextDash
	elseif self.target then
		dx = self.target.x - me.body.x
		dz = self.target.z - me.body.z
		local dist = hypot(dx, dz)
		if t >= self.checkAt then
			-- Stuck (not getting closer): blacklist the target for 6 s and sidestep.
			if self.lastDist ~= math.huge and self.lastDist - dist < 0.08 * math.max(1, me.diameter) then
				self.blacklist[self.target.id] = t + 6
				self.target = nil
				local side = if self.rand:NextNumber() < 0.5 then 1 else -1
				self.wx = (-dz / math.max(dist, 1e-3)) * side
				self.wz = (dx / math.max(dist, 1e-3)) * side
				self.wanderUntil = t + 0.7
			end
			self.lastDist = dist
			self.checkAt = t + 0.8
		end
		dash = dist > 4 + me.diameter * 3 and t > self.nextDash
	end
	if dash then
		self.nextDash = t + (2.2 + self.rand:NextNumber() * 1.5) * (1 + (1 - g.skill) * A.botThinkSlow)
	end
	local len = hypot(dx, dz)
	if len < 1e-6 then
		len = 1
	end
	dx, dz = self:avoid(g, me, dx / len, dz / len)
	return dx, dz, dash
end

return Bot
