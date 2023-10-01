import * as PIXI from "pixi.js";
import { createBox } from "./Box";
import { Crate, CrateType, createCrate } from "./Crate";
import { Boat } from "./Boat";
import { GameState } from "./GameState";
import {enableJokerCrates} from "./featureToggles";
import {weightedSample} from "./random";

export interface ActionButton {
	action: Action;
	graphics: PIXI.Graphics;
}
interface Slot {
	crate: Crate | null;
	graphics: PIXI.Graphics;
}
export interface Lane {
	slots: Slot[];
	graphics: PIXI.Container;
	addBoatButton: PIXI.Graphics;
	boat?: Boat;
	holdTurnsLeft: number;
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
function createRandomCrate(): Crate | null {
	return createCrate(weightedSample([
		[1, CrateType.Circle],
		[1, CrateType.Square],
		[1, CrateType.Triangle],
		[enableJokerCrates ? 0.5 : 0, CrateType.Joker],
	]));
}
export function spawnCrateLine(slots: Slot[]) {
	const minCrates = 1;
	const maxCrates = 3;
	let crateCount = (minCrates + Math.floor(Math.random() * (maxCrates - minCrates + 1)));
	crateCount--;
	crateCount = Math.max(1, crateCount);
	for (let i = 0; i < crateCount; i++) {
		const slot = slots[Math.floor(Math.random() * slots.length)];
		slots.splice(slots.indexOf(slot), 1); // del slot
		if (slot.crate === null) {
			addCrate(slot, createRandomCrate());
		}
	}
}

export function addLaneGraphics(app: PIXI.Application): [Lane[], ActionButton[], PIXI.Text[]] {
	const laneCount = 3;
	const slotCount = 8;
	const laneSpacing = 15;
	const slotWidth = 50;
	const slotHeight = 40;
	const buttonSize = 25;
	const lockButtonWidth = buttonSize;
	const pushButtonHeight = buttonSize;
	const topMargin = pushButtonHeight + 10;
	const leftMargin = 10;
	const lanes: Lane[] = [];
	const actionButtons: ActionButton[] = [];
	const lockButtonTexts: PIXI.Text[] = [];
	for (let row = 0; row < laneCount; row++) {
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: [],
			addBoatButton: createBox(slotWidth, pushButtonHeight, 0xffffff, true),
			holdTurnsLeft: 0
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
			slotGraphics.x = leftMargin + lockButtonWidth + col * slotWidth;
			lane.graphics.addChild(slotGraphics);
			let slot = {
				crate: null,
				graphics: slotGraphics
			};
			lane.slots.push(slot);

			if (row === 0) {
				const button = createBox(slotWidth, pushButtonHeight, 16777215, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = -button.height;
				actionButtons.push({ graphics: button, action: { type: "push", dir: "down", col } });
				lane.graphics.addChild(button);
			} else if (row === laneCount - 1) {
				const button = createBox(slotWidth, pushButtonHeight, 16777215, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = slotHeight;
				actionButtons.push({ graphics: button, action: { type: "push", dir: "up", col } });
				lane.graphics.addChild(button);
			}
		}
		const button = createBox(lockButtonWidth, slotHeight, 16777215, true);
		button.x = leftMargin;
		const buttonText = new PIXI.Text("", {
			fontSize: 10
		});
		buttonText.anchor.set(0.5, 0.5);
		buttonText.x = button.width / 2;
		buttonText.y = button.height / 2;
		button.addChild(buttonText);
		lockButtonTexts.push(buttonText);
		actionButtons.push({ graphics: button, action: { type: "lock", row } });
		lane.graphics.addChild(button);
		lanes.push(lane);
		app.stage.addChild(lane.graphics);
	}

	const button = createBox(lockButtonWidth, slotHeight, 16777215, true);
	button.x = leftMargin;
	button.y = 230;
	actionButtons.push({ graphics: button, action: { type: "none" } });
	app.stage.addChild(button);

	for (let col = 0; col < slotCount / 2; col++) {
		spawnCrateLine(lanes.map(l => l.slots[col]));
	}
	return [lanes, actionButtons, lockButtonTexts];
}

export type Action =
	{ type: "push"; dir: "up" | "down"; col: number; } |
	{ type: "lock"; row: number; } |
	{ type: "none"; };


