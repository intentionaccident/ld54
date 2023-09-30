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

interface ActionButton {
	action:Action
	graphics: PIXI.Graphics
}

interface GameState {
	actionButtons: ActionButton[]
	lanes: Lane[]
	turn: number
}

interface Slot {
	crate: Crate | null
	graphics: PIXI.Graphics
}

interface Lane {
	slots: Slot[]
	graphics: PIXI.Container
	addBoatButton: PIXI.Graphics
	boat?: Boat
}

function addCrate(slot: Slot, crate: Crate | null) {
	if (slot.crate !== null) throw Error("`slot` is not empty.");
	if (crate === null) return;
	slot.crate = crate;
	slot.graphics.addChild(crate.graphics);
	crate.graphics.y = slot.graphics.height / 2 - slot.crate.graphics.height / 2;
	crate.graphics.x = slot.graphics.width / 2 - slot.crate.graphics.width / 2;
}

function destroyCrate(slot: Slot) {
	if (slot.crate === null) throw Error("`slot` is empty.");
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
	const x = Math.floor(Math.random() * 3);
	if (x === 0) {
		return createCrate(CrateType.Circle);
	} else if (x === 1) {
		return createCrate(CrateType.Square);
	} else if (x === 2) {
		return createCrate(CrateType.Triangle);
	} else throw new Error("Unreachable.");
}

function spawnCrateLine(slots: Slot[]) {
	const minCrates = 1;
	const maxCrates = 2;
	const crateCount = (minCrates + Math.floor(Math.random() * (maxCrates - minCrates + 1)));
	for (let i = 0; i < crateCount; i++) {
		const slot = slots[Math.floor(Math.random() * slots.length)];
		slots.splice(slots.indexOf(slot), 1); // del slot
		if (slot.crate === null) {
			addCrate(slot, createRandomCrate());
		}
	}
}

export function addLaneGraphics(app: PIXI.Application): [Lane[], ActionButton[]]  {
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
	for (let row = 0; row < laneCount; row++) {
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: [],
			addBoatButton: createBox(slotWidth, pushButtonHeight, 0xffffff, true)
		}

		lane.addBoatButton.x = slotWidth * (slotCount + 1);
		lane.addBoatButton.visible = false;
		lane.graphics.addChild(lane.addBoatButton)

		lane.graphics.y = topMargin + row * (slotHeight + laneSpacing);
		for (let col = 0; col < slotCount; col++) {
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
			lane.slots.push(slot)

			if (row === 0) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = -button.height;
				actionButtons.push({graphics: button, action: { type: "push", dir: "down", col }})
				lane.graphics.addChild(button);
			} else if (row === laneCount - 1) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + lockButtonWidth + col * slotWidth;
				button.y = slotHeight;
				actionButtons.push({graphics: button, action: { type: "push", dir: "up", col }});
				lane.graphics.addChild(button);
			}
		}
		const button = createBox(lockButtonWidth, slotHeight, 0xffffff, true);
		button.x = leftMargin;
		actionButtons.push({graphics: button, action:  { type: "lock", row }});
		lane.graphics.addChild(button);
		lanes.push(lane)
		app.stage.addChild(lane.graphics);
	}

	const button = createBox(lockButtonWidth, slotHeight, 0xffffff, true);
	button.x = leftMargin;
	button.y = 230;
	actionButtons.push({graphics: button, action:  { type: "none" }});
	app.stage.addChild(button);

	for (let col = 0; col < slotCount / 2; col++) {
		spawnCrateLine(lanes.map(l => l.slots[col]));
	}
	return [lanes, actionButtons];
}

type Action =
	{ type: "push", dir: "up" | "down", col: number }
	| { type: "lock", row: number }
	| { type: "none" };

function tick(gameState: GameState, action: Action) {
	const lanes = gameState.lanes;
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

	spawnCrateLine(lanes.map(l => l.slots[0]));
	gameState.turn++;
}

function moorBoat(boat: Boat, moorIndex: number, lanes: Lane[], mooredBoats: Boat[], app: PIXI.Container) {
	boat.graphics.rotation = Math.PI / 8 * 3
	boat.graphics.x = VIEW_WIDTH - (getBoatLength(boat) * Math.cos(boat.graphics.rotation))
		- moorIndex * (getBoatLength(boat) * Math.cos(boat.graphics.rotation) + getBoatWidth(boat) * Math.sin(boat.graphics.rotation));
	const deltaY = (getBoatWidth(boat) * Math.cos(boat.graphics.rotation))
	const initialPosition = (VIEW_HEIGHT) - (getBoatLength(boat) * Math.sin(boat.graphics.rotation)) + deltaY;
	boat.graphics.y = initialPosition
	boat.graphics.on("mouseenter", () => boat.graphics.y -= deltaY)
	boat.graphics.on("mouseleave", () => boat.graphics.y = initialPosition)

	mooredBoats[moorIndex] = boat

	boat.graphics.on("click", () => {
		for (const lane of lanes) {
			lane.addBoatButton.visible = !lane.boat
			lane.addBoatButton.off("click")
			if (!lane.addBoatButton.visible) {
				continue
			}

			lane.addBoatButton.on("click", () => {
				moveBoatToLane(boat, lane)
				lane.boat = boat
				const removedBoat = mooredBoats.findIndex(m => m === boat)
				unmoorBoat(boat)

				mooredBoats[removedBoat] = createBoat(3)
				app.addChild(mooredBoats[removedBoat].graphics)

				moorBoat(mooredBoats[removedBoat], removedBoat, lanes, mooredBoats, app)
				for (const lane of lanes) {
					lane.addBoatButton.visible = false
					lane.addBoatButton.off("click")
				}
			})
		}
	})
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
	const [lanes, actionButtons] = addLaneGraphics(app);
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});

	const mooredBoats: Boat[] = []
	for (let i = 0; i < 2; i++) {
		const boat = createBoat(3)
		moorBoat(boat, i, lanes, mooredBoats, app.stage)
		app.stage.addChild(boat.graphics)
	}

	const gameState: GameState = {actionButtons, lanes, turn: 0};
	for (const button of actionButtons) {
		button.graphics.on('click', () => tick(gameState, button.action));
	}

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}

function moveBoatToLane(boat: Boat, lane: Lane) {
	boat.graphics.rotation = 0
	boat.graphics.y = 0
	boat.graphics.x = 500
	lane.graphics.addChild(boat.graphics)
}

function unmoorBoat(boat: Boat) {
	boat.graphics.interactive = false
	boat.graphics.off("mouseenter")
	boat.graphics.off("mouseleave")
}
