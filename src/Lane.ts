import * as PIXI from "pixi.js";
import {createBox} from "./Box";
import {Crate, CrateType, CrateTypes, createCrate} from "./Crate";
import {Boat} from "./Boat";
import {GameState} from "./GameState";
import {weightedSample} from "./random";
import {advanceLevel, Configuration} from "./Configuration";
import {AbilityType} from "./AbilityBar";
import {tick} from "./tick";
import {Slot, slotTexture} from "./Slot";

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

export function incrementLevel(state: GameState) {
	setProgress(state, 0);
	setLevel(state, state.level.value + 1);
	advanceLevel(state.configuration, state.level.value);
	state.abilityBar!.onConfigurationChanged();
	for (const lane of state.lanes) {
		for (const slot of lane.slots) {
			if (slot.crate !== null) slot.destroyCrate();
		}
	}
	state.boatManager!.reset();
}

export function setLevel(state: GameState, value: number) {
	state.level.value = value;
	state.level.graphics.text = `Level: ${value+1}`;
}

export function incrementProgress(state: GameState, value: number) {
	setProgress(state, state.progress.value + value);
}

export function setProgress(state: GameState, value: number) {
	state.progress.value = value;
	const s = Number(state.progress.value / state.configuration.shipsNeeded).toLocaleString(undefined, {
		style: 'percent',
		minimumFractionDigits: 0
	});
	state.progress.graphics.text = `${s}`;
}
function createRandomCrate(configuration: Configuration, requestPool: Record<CrateType, number>): Crate | null {
	if (configuration.enableJokerCrates && Math.random() < configuration.jokerCrateChance) {
		return createCrate(CrateType.Joker)
	}

	// return createCrate(
	// 	weightedSample(
	// 		Object.entries(requestPool)
	// 			.map(([type, weight]) => [weight, parseInt(type) as CrateType])
	// 	) ?? weightedSample([
	// 		[1, CrateType.Circle],
	// 		[1, CrateType.Square],
	// 		[1, CrateType.Triangle],
	// 		[configuration.enableFourthItem ? 1 : 0, CrateType.Cross],
	// 	]) ?? CrateType.Circle
	// );

	let options: [number, CrateType][] = Object.entries(requestPool)
		.map(([type, weight]) => [weight, parseInt(type) as CrateType]);
	const crate = weightedSample(options);
	if (crate !== null) {
		let msg = "";
		let totalWeight = options.reduce((s, o) => s + o[0], 0);
		for (const [weight, type] of options) {
			const s = Number(weight/totalWeight).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:0});
			msg += `${CrateType[type]}: ${s}`;
			msg += '\n';
		}
		console.log(msg);
		return createCrate(crate);
	} else {
		console.warn("Failed to get a sample");
		console.warn(options);
		return null;
	}
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

	let crateCount = weightedSample(gameState.configuration.crateSpawningDistribution) ?? 0;
	for (let i = 0; i < crateCount; i++) {
		if (slots.length === 0) break;
		const slot = slots[Math.floor(Math.random() * slots.length)];
		slots.splice(slots.indexOf(slot), 1); // del slot
		if (slot.crate === null) {
			let crate = createRandomCrate(gameState.configuration, cratePool);
			slot.addCrate(crate);
			if (crate !== null) {
				crate.graphics.scale.set(0, 0);
				gameState.laneAnimations.push(() => {
					crate!.graphics.scale.x += (1 - crate!.graphics.scale.x) / 5;
					crate!.graphics.scale.y += (1 - crate!.graphics.scale.y) / 5;
					const epsilon = 10e-3;
					if (Math.abs(1 - crate!.graphics.scale.x) < epsilon) {
						crate!.graphics.scale.set(1,1)
						return false;
					} else return true;
				});
			}
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
	const slotCount = 11;
	const laneSpacing = 0;
	const slotWidth = 32;
	const slotHeight = 48;
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
			const slotGraphics = new PIXI.Sprite(slotTexture);
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


