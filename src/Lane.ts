import * as PIXI from "pixi.js";
import {createBox} from "./Box";
import {Crate, CrateType, CrateTypes, createCrate} from "./Crate";
import {Boat} from "./Boat";
import {GameState} from "./GameState";
import {weightedSample} from "./random";
import {Features} from "./Features";
import {AbilityType} from "./AbilityBar";
import {tick} from "./tick";
import {addCrate, Slot} from "./Slot";

export interface ActionButton {
	action: Action;
	graphics: PIXI.Graphics;
}

export interface Lane {
	slots: Slot[];
	graphics: PIXI.Container;
	addBoatButton: PIXI.Graphics;
	boat?: Boat;
	lockTurnsLeft: number;
	button: LaneButton;
}

export function incrementScore(state: GameState, value: number) {
	setScore(state, state.score.value + value);
}

export function setScore(state: GameState, value: number) {
	state.score.value = value;
	state.score.graphics.text = `Score: ${value}`;
}

export function setLives(state: GameState, value: number) {
	state.lives.value = value;
	state.lives.graphics.text = `Lives: ${value}`;
}

export function decrementLives(state: GameState, value: number = 1) {
	setLives(state, state.lives.value - value);
}

function createRandomCrate(features: Features, requestPool: Record<CrateType, number>): Crate | null {
	if (features.enableJokerCrates && Math.random() < features.jokerCrateChance) {
		return createCrate(CrateType.Joker)
	}

	return createCrate(
		weightedSample(
			Object.entries(requestPool)
				.map(([type, weight]) => [weight, parseInt(type) as CrateType])
		) ?? weightedSample([
			[1, CrateType.Circle],
			[1, CrateType.Square],
			[1, CrateType.Triangle],
			[features.enableFourthItem ? 1 : 0, CrateType.Cross],
		]) ?? CrateType.Circle
	);
}

export function spawnCrateLine(gameState: GameState, slots: Slot[]) {
	const cratePool = gameState.boatManager?.getUpcomingCratePool()
	if (!cratePool) {
		return
	}


	const slotCrates = gameState.lanes?.map(
		lane => lane.slots
			.map(s => s.crate?.type)
			.filter(t => t != null))
		.flat()
		.reduce((total, next) => {
			total[next!] ??= 0
			total[next!]++
			return total
		}, {} as Record<CrateType, number>) ?? []


	for (const key of CrateTypes) {
		cratePool[key] = Math.max(0, cratePool[key] - (slotCrates[key] ?? 0))
	}

	const minCrates = 0;
	const maxCrates = 2;
	let crateCount = (minCrates + Math.floor(Math.random() * (maxCrates - minCrates + 1)));
	for (let i = 0; i < crateCount; i++) {
		if (slots.length === 0) break;
		const slot = slots[Math.floor(Math.random() * slots.length)];
		slots.splice(slots.indexOf(slot), 1); // del slot
		if (slot.crate === null) {
			addCrate(slot, createRandomCrate(gameState.features, cratePool));
		}
	}
}

export class LaneButton {
	public ability: AbilityType = AbilityType.Lock;

	constructor(
		gameState: GameState,
		row: number,
		private readonly graphics: PIXI.Graphics,
		private readonly textGraphics: PIXI.Text
	) {
		this.showLock();
		graphics.on('click', () => {
			switch (this.ability) {
				case AbilityType.FastForward:
					tick(gameState, {type: "fast-forward", row})
					break;
				case AbilityType.Compress:
					tick(gameState, {type: "compress", row})
					break;
				case AbilityType.Lock:
					tick(gameState, {type: "lock", row})
					break;
				default:
					throw new Error("Unreachable.");
			}
		});
	}

	public showFastForward() {
		this.textGraphics.text = "⏩";
		this.ability = AbilityType.FastForward;
	}

	public showCompress() {
		this.textGraphics.text = "🧲";
		this.ability = AbilityType.Compress;
	}

	public showLock() {
		this.textGraphics.text = "🔓";
		this.ability = AbilityType.Lock;
	}

	public showLocked(turnsLeft: number) {
		// this.textGraphics.text = `⛓️\n${turnsLeft - 1}`;
		this.textGraphics.text = `⛓️`;
		this.ability = AbilityType.Lock;
	}
}

export function addLaneGraphics(gameState: GameState): [Lane[], ActionButton[]] {
	const laneCount = 3;
	const slotCount = 8;
	const laneSpacing = 15;
	const slotWidth = 50;
	const slotHeight = 40;
	const buttonSize = 25;
	const laneButtonWidth = buttonSize;
	const pushButtonHeight = buttonSize;
	const topMargin = pushButtonHeight + 10;
	const leftMargin = 10;
	const lanes: Lane[] = [];
	const actionButtons: ActionButton[] = [];
	for (let row = 0; row < laneCount; row++) {
		const laneButton = createBox(laneButtonWidth, slotHeight, 16777215, true);
		laneButton.x = leftMargin;
		const laneButtonText = new PIXI.Text("", {
			fontSize: 10,
			align: 'center'
		});
		laneButtonText.anchor.set(0.5, 0.5);
		laneButtonText.x = laneButton.width / 2;
		laneButtonText.y = laneButton.height / 2;
		laneButton.addChild(laneButtonText);
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: [],
			addBoatButton: createBox(slotWidth, pushButtonHeight, 0xffffff, true),
			lockTurnsLeft: 0,
			button: new LaneButton(gameState, row, laneButton, laneButtonText)
		};

		lane.addBoatButton.x = slotWidth * (slotCount + 1);
		lane.addBoatButton.visible = false;
		lane.graphics.addChild(lane.addBoatButton);

		lane.graphics.y = topMargin + row * (slotHeight + laneSpacing);
		for (let col = 0; col < slotCount; col++) {
			const slotGraphics = createBox(
				slotWidth, slotHeight,
				10265226
			);
			slotGraphics.x = leftMargin + laneButtonWidth + col * slotWidth;
			lane.graphics.addChild(slotGraphics);
			let slot = new Slot(
				gameState,
				slotGraphics
			);
			lane.slots.push(slot);

			if (row === 0) {
				const button = createBox(slotWidth, pushButtonHeight, 16777215, true);
				button.x = leftMargin + laneButtonWidth + col * slotWidth;
				button.y = -button.height;
				actionButtons.push({graphics: button, action: {type: "push", dir: "down", col}});
				lane.graphics.addChild(button);
			} else if (row === laneCount - 1) {
				const button = createBox(slotWidth, pushButtonHeight, 16777215, true);
				button.x = leftMargin + laneButtonWidth + col * slotWidth;
				button.y = slotHeight;
				actionButtons.push({graphics: button, action: {type: "push", dir: "up", col}});
				lane.graphics.addChild(button);
			}
		}
		lane.graphics.addChild(laneButton);
		lanes.push(lane);
		gameState.app.stage.addChild(lane.graphics);
	}

	const button = createBox(laneButtonWidth, slotHeight, 16777215, true);
	button.x = leftMargin;
	button.y = 230;
	actionButtons.push({graphics: button, action: {type: "none"}});
	gameState.app.stage.addChild(button);

	for (let col = 0; col < slotCount / 2; col++) {
		spawnCrateLine(gameState, lanes.map(l => l.slots[col]));
	}
	return [lanes, actionButtons];
}

export type Action =
	{ type: "flush"; from: Slot; } |
	{ type: "swap"; from: Slot; to: Slot; } |
	{ type: "compress"; row: number; } |
	{ type: "fast-forward"; row: number; } |
	{ type: "push"; dir: "up" | "down"; col: number; } |
	{ type: "lock"; row: number; } |
	{ type: "none"; };


