import * as PIXI from "pixi.js";
import {Crate, CrateType, CrateTypes, createCrate} from "./Crate";
import {Boat, boatTexture} from "./Boat";
import {GameState} from "./GameState";
import {weightedSample} from "./random";
import {advanceLevel, Configuration} from "./Configuration";
import {AbilityType} from "./AbilityBar";
import {tick} from "./tick";
import {interchangeTexture, Slot, slotTexture} from "./Slot";
import {GrayscaleFilter} from "@pixi/filter-grayscale";
import {VIEW_HEIGHT} from "./view";
import {bellSound, matchSound} from "./sounds";

const pipeTexture: PIXI.Texture = PIXI.Texture.from('assets/pipe1.png');
const smokingPipeTexture: PIXI.Texture = PIXI.Texture.from('assets/pipe2.png');
const pierTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/pier.png').castToBaseTexture(), new PIXI.Rectangle(
		208, 96, 74, 96
	)
);

export interface ActionButton {
	action: Action;
	graphics: PIXI.DisplayObject;
}

export interface Lane {
	slots: Slot[];
	graphics: PIXI.Container;
	addBoatButton: PIXI.Sprite;
	boat?: Boat;
	lockTurnsLeft: number;
	button: LaneButton;
}

export const pushDownButtonTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/trolly-control-top.gif').castToBaseTexture(), new PIXI.Rectangle(
		160, 32, 70, 64
	)
);

export const pushUpButtonTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/trolly-control-bottom.gif').castToBaseTexture(), new PIXI.Rectangle(
		122, 258, 70, 64
	)
);

export const laneButtonTextures = [1,2,3].map(i => new PIXI.Texture(
	PIXI.Texture.from(`assets/garage${i}.png`).castToBaseTexture(), new PIXI.Rectangle(
		0, 0, 160, 160+32
	)
));

export function incrementScore(state: GameState, value: number) {
	setScore(state, state.score.value + value);
}

export function setScore(state: GameState, value: number) {
	state.score.value = value;
	state.scoreDisplay?.update(value);
}

export function setLives(state: GameState, value: number) {
	if (value < 0) value = 0;
	state.lives.value = value;
	state.lighthouse.setLives(state.lives.value);
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
			if (slot.crate !== null) slot.pushCrateIntoWater();
		}
		lane.lockTurnsLeft = 0;
	}
	state.boatManager!.reset();
	state.onLevelChanged()
	bellSound.play()
}

export function setLevel(state: GameState, value: number) {
	state.level.value = value;
}

export function incrementProgress(state: GameState, value: number) {
	setProgress(state, state.progress.value + value);
}

export function setProgress(state: GameState, value: number) {
	state.progress.value = value;
	state.boatManager?.updateDeckGraphics();
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
		return createCrate(crate);
	} else {
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
	if (
		gameState.lanes.flatMap(l => l.slots).reduce((t, s) => t + (s.crate === null ? 0 : 1), 0) === 0
		&& crateCount === 0
	) {
		crateCount = 1;
	}
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
						crate!.graphics.scale.set(1, 1)
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
		private readonly graphics: PIXI.Container,
		private readonly textGraphics: PIXI.Text
	) {
		this.showLock();
		graphics.on('click', () => {
			switch (this.ability) {
				case AbilityType.FastForward:
					tick(gameState, { type: "fast-forward", row })
					break;
				case AbilityType.Compress:
					tick(gameState, { type: "compress", row })
					break;
				case AbilityType.Lock:
					tick(gameState, { type: "lock", row })
					break;
				default:
					throw new Error("Unreachable.");
			}
		});
	}

	public showFastForward() {
		this.textGraphics.text = "⏩";
		this.ability = AbilityType.FastForward;
		for (let i = 0; i < this.graphics.children.length-1; i++) {
			this.graphics.children[i].visible = false;
		}
		this.graphics.children[0].visible = true;
	}

	public showCompress() {
		this.textGraphics.text = "🧲";
		this.ability = AbilityType.Compress;
		for (let i = 0; i < this.graphics.children.length-1; i++) {
			this.graphics.children[i].visible = false;
		}
		this.graphics.children[0].visible = true;
	}

	public showLock() {
		this.textGraphics.text = "";
		this.ability = AbilityType.Lock;
		for (let i = 0; i < this.graphics.children.length-1; i++) {
			this.graphics.children[i].visible = false;
		}
		this.graphics.children[0].visible = true;
	}

	public showLocked(turnsLeft: number) {
		this.ability = AbilityType.Lock;
		for (let i = 0; i < this.graphics.children.length-1; i++) {
			this.graphics.children[i].visible = false;
		}
		this.graphics.children[2].visible = true;
	}
}

function setButtonAnimations(button: PIXI.DisplayObject, targets: PIXI.Sprite[]) {
	button.interactive = true;
	const highlight = (tint: PIXI.ColorSource) => {
		let color = new PIXI.Color(tint);
		for (let i = 0; i < targets.length; i++) {
			targets[i].tint = color;
			color = color.setAlpha(color.alpha * 0.5);
			// if (tint !== 0xffffff) {
			// 	color = color.multiply(0xaaaaaa);
			// }
		}
	};
	button.on('mousedown', () => highlight(0xADB2A9));
	button.on('mousemove', () => {
		// highlight(0xD0D6CB)
		let colors = [
			0xCCCCCC,
			0xCCCCCC,
			0xDDDDDD,
			0xEEEEEE
		]
		for (let i = 0; i < targets.length; i++) {
			targets[i].tint = colors[i];
		}
	});
	button.on('mouseup', () => highlight(0xD0D6CB));
	button.on('mouseleave', () => highlight(0xffffff));
	button.cursor = 'pointer';
}

function createAddBoatButton(): PIXI.Sprite {
	const graphics = new PIXI.Sprite(boatTexture);
	graphics.filters = [new GrayscaleFilter()];
	graphics.interactive = true;
	graphics.cursor = "pointer";
	graphics.alpha = 0.5;
	const offset = 30;
	graphics.hitArea = new PIXI.Rectangle(
		0, offset,
		graphics.width, graphics.height - offset
	);
	graphics.on('mousemove', () => {
		graphics.alpha= 0.8;
	});
	graphics.on('mouseleave', () => {
		graphics.alpha= 0.5;
	});
	return graphics;
}

export function addLaneGraphics(gameState: GameState): [Lane[], ActionButton[]] {
	const laneCount = 3;
	const slotCount = 11;
	const laneSpacing = 0;
	const slotWidth = 64;
	const slotHeight = 96;
	const buttonSize = 50;
	const laneButtonWidth = buttonSize;
	const pushButtonHeight = buttonSize;
	const topMargin = pushButtonHeight + 10 + 38;
	let leftMargin = 40 + laneCount * 16;
	const lanes: Lane[] = [];
	const actionButtons: ActionButton[] = [];
	for (let row = 0; row < laneCount; row++) {
		// const laneButton = createBox(laneButtonWidth, slotHeight, 16777215, true);
		const laneButton = new PIXI.Container();
		for (let i = 0; i < laneButtonTextures.length; i++) {
			const sprite = new PIXI.Sprite(laneButtonTextures[i]);
			laneButton.addChild(sprite);
		}
		setButtonAnimations(laneButton, laneButton.children as PIXI.Sprite[]);

		const showTexture = (i: number) => {
			for (let j = 0; j < laneButton.children.length-1; j++){
				laneButton.children[j].visible = false;
			}
			laneButton.children[i].visible = true;
		}
		laneButton.on('mousemove', () => {
			if (lane.lockTurnsLeft === 0 && lane.button.ability === AbilityType.Lock) showTexture(1);
		});
		laneButton.on('mouseleave', () => {
			if (lane.lockTurnsLeft === 0 && lane.button.ability === AbilityType.Lock) showTexture(0)
		});

		laneButton.x = leftMargin - 94;
		laneButton.y = -64-32;
		const laneButtonText = new PIXI.Text("", {
			fontSize: 20,
			align: 'center'
		});
		laneButtonText.anchor.set(0.5, 0.5);
		laneButtonText.x = laneButton.width / 2;
		laneButtonText.y = laneButton.height / 2;
		laneButton.addChild(laneButtonText);
		laneButton.hitArea = new PIXI.Rectangle(
			0, 32,
			160, 160
		)
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: [],
			addBoatButton: createAddBoatButton(),
			lockTurnsLeft: 0,
			button: new LaneButton(gameState, row, laneButton, laneButtonText)
		};

		lane.addBoatButton.pivot.set(0, -lane.addBoatButton.height / 2);
		lane.addBoatButton.x = leftMargin + slotWidth * (slotCount + 1) + 14;
		lane.addBoatButton.y = -100;
		lane.addBoatButton.visible = false;
		lane.graphics.addChild(lane.addBoatButton);

		lane.graphics.y = topMargin + row * (slotHeight + laneSpacing);
		for (let col = 0; col < slotCount; col++) {
			const slotGraphics = new PIXI.Sprite(slotTexture);
			slotGraphics.x = leftMargin + laneButtonWidth + col * slotWidth;
			lane.graphics.addChild(slotGraphics);
			if (row !== 0) {
				const interchangeGraphics = new PIXI.Sprite(interchangeTexture);
				interchangeGraphics.x = 28;
				interchangeGraphics.y = -56;
				slotGraphics.addChild(interchangeGraphics);
			}
			let slot = new Slot(
				gameState,
				slotGraphics
			);
			lane.slots.push(slot);

			if (row === 0) {
				const button = new PIXI.Sprite(pushDownButtonTexture);
				button.x = leftMargin + laneButtonWidth + col * slotWidth + 16;
				button.y = -button.height;
				actionButtons.push({ graphics: button, action: { type: "push", dir: "down", col } });
				lane.graphics.addChild(button);
				slot.button = button;
			} else if (row === laneCount - 1) {
				const button = new PIXI.Sprite(pushUpButtonTexture);
				button.x = leftMargin + laneButtonWidth + col * slotWidth - 8;
				button.y = slotHeight;
				actionButtons.push({ graphics: button, action: { type: "push", dir: "up", col } });
				lane.graphics.addChild(button);
				slot.button = button;
			}
		}
		const pier = new PIXI.Sprite(pierTexture);
		pier.x = 810 - row * 16;
		lane.graphics.addChildAt(pier, 2);
		lane.graphics.addChild(laneButton);
		lanes.push(lane);
		gameState.app.stage.addChild(lane.graphics);
		leftMargin -= 16;
	}

	const slotsAtCol = (lanes: Lane[], col: number) => {
		let slots: PIXI.Sprite[] = [];
		for (let row = 0; row < laneCount; row++) {
			slots.push(lanes[row].slots[col].graphics);
		}
		return slots;
	};
	for (let row = 0; row < laneCount; row++) {
		for (let col = 0; col < slotCount; col++) {
			const button = lanes[row].slots[col].button;
			if (button) {
				setButtonAnimations(button, [button].concat(
					row === 0
						? slotsAtCol(lanes, col)
						: slotsAtCol(lanes, col).reverse()
				));
			}
		}
	}

	const button = new PIXI.Container();
	const buttonPipe = new PIXI.Sprite(pipeTexture);
	button.addChild(buttonPipe);
	const buttonSmokingPipe = new PIXI.Sprite(smokingPipeTexture);
	buttonSmokingPipe.visible = false;
	button.addChild(buttonSmokingPipe);
	button.on('mousemove', () => {
		buttonPipe.visible = false;
		buttonSmokingPipe.visible = true;
	});
	button.on('mouseleave', () => {
		buttonPipe.visible = true;
		buttonSmokingPipe.visible = false;
	});
	button.on('mouseenter', () => matchSound.play());
	const width = 210;
	const height = 170;
	button.hitArea = new PIXI.Rectangle(
		0, VIEW_HEIGHT - height, width, height
	);
	button.interactive = true;
	button.cursor = "pointer";
	actionButtons.push({ graphics: button, action: { type: "none" } });
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


