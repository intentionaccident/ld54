import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { createBox } from "./Box";
import { createBoat } from "./Boat";

interface Slot {
	graphics: PIXI.Graphics
}

interface Lane {
	slots: Slot[]
	graphics: PIXI.Container
}

export function addLaneGraphics(app: PIXI.Application): Lane[] {
	const laneCount = 3;
	const tileCount = 8;
	const laneSpacing = 30;
	const slotWidth = 50;
	const slotHeight = 50;
	const topMargin = (
		app.renderer.height / app.stage.scale.y
		- laneCount * slotHeight - (laneCount - 1) * laneSpacing
	) / 2;
	const buttonSize = 25;
	const lockButtonWidth = buttonSize;
	const pushButtonHeight = buttonSize;
	const leftMargin = lockButtonWidth;
	const lanes: Lane[] = [];
	for (let row = 0; row < laneCount; row++) {
		const lane: Lane = {
			graphics: new PIXI.Container(),
			slots: []
		}
		lane.graphics.y = topMargin + row * (slotHeight + laneSpacing);
		for (let col = 0; col < tileCount; col++) {
			const slot = createBox(
				slotWidth, slotHeight,
				0x9CA28A
			);
			slot.x = leftMargin + col * slotWidth;
			lane.graphics.addChild(slot);
			lane.slots.push({
				graphics: slot
			})

			if (row == 0) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + col * slotWidth;
				button.y = -button.height;
				button.on('click', () => console.log(`Top Push Button ${col}`));
				lane.graphics.addChild(button);
			} else if (row == laneCount - 1) {
				const button = createBox(slotWidth, pushButtonHeight, 0xffffff, true);
				button.x = leftMargin + col * slotWidth;
				button.y = slotHeight;
				button.on('click', () => console.log(`Bottom Push Button ${col}`));
				lane.graphics.addChild(button);
			}
		}
		const button = createBox(lockButtonWidth, slotHeight, 0xffffff, true);
		button.on('click', () => console.log(`Lock Button ${row}`));
		lane.graphics.addChild(button);
		lanes.push(lane)
		app.stage.addChild(lane.graphics);
	}
	return lanes;
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
	item.graphics.x = app.renderer.width / app.stage.scale.x * Math.random();
	item.graphics.y = app.renderer.height / app.stage.scale.y * Math.random();
	app.stage.addChild(item.graphics)

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}
