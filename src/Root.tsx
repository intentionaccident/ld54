import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { createBox } from "./Box";
import { Crate, CrateType, createCrate } from "./Crate";
import { Boat, createBoat, getBoatLength, getBoatWidth } from "./Boat";
import { CRATE_WIDTH } from "./Crate";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./view";

interface Slot {
	crate: Crate | null
	graphics: PIXI.Graphics
}

interface Lane {
	slots: Slot[]
	graphics: PIXI.Container
}

function addCrate(slot: Slot, crate: Crate | null) {
	if (slot.crate !== null) throw Error("`slot` is not empty.");
	if (crate === null) return;
	slot.crate = crate;
	slot.graphics.addChild(crate.graphics);
	crate.graphics.y = 5;
	crate.graphics.x = 5;
}

function destroyCrate(slot: Slot) {
	slot.crate.graphics.destroy();
	slot.crate = null;
}

function moveCrate(from: Slot, to: Slot) {
	if (to.crate !== null) throw Error("`to` is not empty.");
	if (from.crate === null) return;
	to.crate = from.crate;
	to.graphics.addChild(from.crate.graphics);
	from.crate = null;
}

function createRandomCrate(): Crate | null {
	const x = Math.floor(Math.random() * 4);
	if (x === 0) {
		return createCrate(CrateType.Circle);
	} else if (x === 1) {
		return createCrate(CrateType.Square);
	} else if (x === 2) {
		return createCrate(CrateType.Triangle);
	} else if (x === 3) {
		return null;
	} else throw new Error("Unreachable.");
}

export function addLaneGraphics(app: PIXI.Application): Lane[] {
	const laneCount = 3;
	const tileCount = 8;
	const laneSpacing = 15;
	const slotWidth = 50;
	const slotHeight = 40;
	const buttonSize = 25;
	const lockButtonWidth = buttonSize;
	const pushButtonHeight = buttonSize;
	const topMargin = pushButtonHeight + 10;
	const leftMargin = 10;
	const lanes: Lane[] = [];
	for (let row = 0; row < laneCount; row++) {
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: []
		}
		lane.graphics.y = topMargin + row * (slotHeight + laneSpacing);
		for (let col = 0; col < tileCount; col++) {
			const slotGraphics = createBox(
				slotWidth, slotHeight,
				0x9CA28A
			);
			slotGraphics.x = leftMargin + lockButtonWidth + col * slotWidth;
			lane.graphics.addChild(slotGraphics);
			let slot = {
				crate: null,
				graphics: slotGraphics
			};
			addCrate(slot, createRandomCrate());
			lane.slots.push(slot)

			if (row === 0) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = -button.height;
				button.on('click', () => tick(lanes, { type: "push", dir: "down", col }));
				lane.graphics.addChild(button);
			} else if (row === laneCount - 1) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = slotHeight;
				button.on('click', () => tick(lanes, { type: "push", dir: "up", col }));
				lane.graphics.addChild(button);
			}
		}
		const button = createBox(lockButtonWidth, slotHeight, 0xffffff, true);
		button.x = leftMargin;
		button.on('click', () => tick(lanes, { type: "lock", row }));
		lane.graphics.addChild(button);
		lanes.push(lane)
		app.stage.addChild(lane.graphics);
	}

	const button = createBox(lockButtonWidth, slotHeight, 0xffffff, true);
	button.x = leftMargin;
	button.y = 230;
	button.on('click', () => tick(lanes, { type: "none" }));
	app.stage.addChild(button);
	return lanes;
}

type Action =
	{ type: "push", dir: "up" | "down", col: number }
	| { type: "lock", row: number }
	| { type: "none" };

function tick(lanes: Lane[], action: Action) {
	let lockedLane: number | null = null;
	if (action.type === "push" && action.dir === "up") {
		for (let row = 0; row < lanes.length - 1; row++) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(lanes[row + 1].slots[action.col], lanes[row].slots[action.col]);
			}
		}
	} else if (action.type === "push" && action.dir === "down") {
		for (let row = lanes.length - 1; row > 0; row--) {
			if (lanes[row].slots[action.col].crate === null) {
				moveCrate(lanes[row - 1].slots[action.col], lanes[row].slots[action.col]);
			}
		}
	} else if (action.type === "lock") {
		lockedLane = action.row;
	}

	for (let row = 0; row < lanes.length; row++) {
		const lane = lanes[row];
		for (let col = lane.slots.length - 1; col >= 0; col--) {
			if (row === lockedLane) continue;
			if (lane.slots[col].crate !== null) {
				if (col === lane.slots.length - 1) {
					destroyCrate(lane.slots[col]);
				} else {
					moveCrate(lane.slots[col], lane.slots[col + 1])
				}
			}
		}
	}

	for (let row = 0; row < lanes.length; row++) {
		if (row === lockedLane) continue;
		addCrate(lanes[row].slots[0], createRandomCrate());
	}
}

function moorBoat(boat: Boat, moorIndex: number) {
	boat.graphics.rotation = Math.PI / 8 * 3
	boat.graphics.x = VIEW_WIDTH - (getBoatLength(boat) * Math.cos(boat.graphics.rotation))
		- moorIndex * (getBoatLength(boat) * Math.cos(boat.graphics.rotation) + getBoatWidth(boat) * Math.sin(boat.graphics.rotation));
	const deltaY = (getBoatWidth(boat) * Math.cos(boat.graphics.rotation))
	const initialPosition = (VIEW_HEIGHT) - (getBoatLength(boat) * Math.sin(boat.graphics.rotation)) + deltaY;
	boat.graphics.y = initialPosition
	boat.graphics.on("mouseenter", () => boat.graphics.y -= deltaY)
	boat.graphics.on("mouseleave", () => boat.graphics.y = initialPosition)
}

export function Root() {
	const app = new PIXI.Application({
		width: 1280,
		height: 640,
		antialias: false,
		backgroundColor: 0x3AC5B9
	});
	app.stage.scale.set(2);
	const texture = PIXI.Texture.from('assets/bunny.png');
	const bunny = new PIXI.Sprite(texture);
	bunny.x = app.renderer.width / app.stage.scale.x / 2;
	bunny.y = app.renderer.height / app.stage.scale.y / 2;

	bunny.anchor.x = 0.5;
	bunny.anchor.y = 0.5;
	app.stage.addChild(bunny);
	addLaneGraphics(app);
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});



	const item = createBoat(3)
	const mooredBoats: Boat[] = []
	for (let i = 0; i < 2; i++) {
		const boat = createBoat(3)
		app.stage.addChild(boat.graphics)
		moorBoat(boat, i)
	}

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}
