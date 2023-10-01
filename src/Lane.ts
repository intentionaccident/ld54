import * as PIXI from "pixi.js";
import {createBox} from "./Box";
import {Crate, CrateType, CrateTypes, createCrate} from "./Crate";
import {Boat} from "./Boat";
import {GameState} from "./GameState";
import {weightedSample} from "./random";
import {CranePattern, CraneType, Features} from "./Features";
import {AbilityType} from "./AbilityBar";
import {tick} from "./tick";

export interface ActionButton {
	action: Action;
	graphics: PIXI.Graphics;
}

export class Slot {
	private ability: AbilityType | null = null;
	constructor(
		private readonly gameState: GameState,
		public readonly graphics: PIXI.Graphics,
		public crate: Crate | null = null
	) {
		this.graphics.on('click', () => {
			if (this.ability === null) return;
			if (this.ability === AbilityType.Swap) {
				if (gameState.selectedSlot === null) {
					gameState.selectedSlot = this;
					gameState.activeAbility = null;
					this.showSelected();
					for (let row = 0; row < gameState.lanes.length; row++) {
						const lane = gameState.lanes[row];
						for (let col = 0; col < lane.slots.length; col++) {
							const slot = lane.slots[col];
							if (slot !== this) slot.showDefault();
							const enableSlotIfEmpty = (slot: Slot) => {
								if (slot === this) return;
								if (gameState.features.craneType === CraneType.OnlyEmpty) {
									if (slot.crate === null) slot.showButton(AbilityType.Swap);
								} else if (gameState.features.craneType === CraneType.Swap) {

								} else throw new Error("Unreachable.");
							}
							if (this.gameState.features.cranePattern === CranePattern.Anywhere) {
								enableSlotIfEmpty(slot);
							} else if (this.gameState.features.cranePattern === CranePattern.SameLane) {
								if (
									(row === this.row() && col === this.col() - 1)
									|| (row === this.row() && col === this.col() + 1)
								) enableSlotIfEmpty(slot);
							} else if (this.gameState.features.cranePattern === CranePattern.Cross) {
								if (
									(row === this.row() && col === this.col() - 1)
									|| (row === this.row() && col === this.col() + 1)
									|| (row === this.row() - 1 && col === this.col())
									|| (row === this.row() + 1 && col === this.col())
								) enableSlotIfEmpty(slot);
							} else throw new Error("Unreachable.");
						}
					}
				} else {
					tick(gameState, {type: "swap", from: gameState.selectedSlot, to: this});
				}
			} else if (this.ability === AbilityType.Flush) {
				tick(gameState, {type: "flush", from: this});
			} else {
				throw new Error("Unsupported ability");
			}
		});
	}

	public col(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return col;
			}
		}
		throw new Error('Unreachable.');
	}

	public row(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return row;
			}
		}
		throw new Error('Unreachable.');
	}

	public showSelected() {
		if (this.crate === null) throw new Error('`crate` is null.');
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showDefault() {
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showButton(ability: AbilityType) {
		this.graphics.interactive = true;
		this.graphics.cursor = "pointer";
		this.ability = ability;
		this.graphics.alpha = 0.7;
	}
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

function addCrate(slot: Slot, crate: Crate | null) {
	if (slot.crate !== null) throw Error("`slot` is not empty.");
	if (crate === null) return;
	slot.crate = crate;
	slot.graphics.addChild(crate.graphics);
	crate.graphics.y = slot.graphics.height / 2 - slot.crate.graphics.height / 2;
	crate.graphics.x = slot.graphics.width / 2 - slot.crate.graphics.width / 2;
}

export function destroyCrate(slot: Slot) {
	if (slot.crate === null) throw Error("`slot` is empty.");
	slot.crate.graphics.destroy();
	slot.crate = null;
}

export function moveCrate(from: Slot, to: Slot) {
	if (to.crate !== null) throw Error("`to` is not empty.");
	if (from.crate === null) return;
	to.crate = from.crate;
	to.graphics.addChild(from.crate.graphics);
	from.crate = null;
}

export function swapCrate(from: Slot, to: Slot) {
	if (from.crate !== null) {
		from.crate.graphics.removeFromParent();
		to.graphics.addChild(from.crate.graphics);
	}
	if (to.crate !== null) {
		to.crate.graphics.removeFromParent();
		from.graphics.addChild(to.crate.graphics);
	}
	[to.crate, from.crate] = [from.crate, to.crate];
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


