import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { createBox } from "./Box";
import { createBoat } from "./Boat";

export function addLaneGraphics(app: PIXI.Application) {
	const laneCount = 3;
	const tileCount = 8;
	const itemSlotWidth = 50;
	const itemSlotHeight = 50;
	for (let row = 0; row < laneCount; row++) {
		const spacing = 30;

		const topMargin = (
			app.renderer.height / app.stage.scale.y
			- laneCount * itemSlotHeight - (laneCount - 1) * spacing
		) / 2;
		const lane = new PIXI.Container();
		lane.y = topMargin + row * (itemSlotHeight + spacing);
		for (let col = 0; col < tileCount; col++) {
			const slot = createBox(
				itemSlotWidth, itemSlotHeight,
				0x9CA28A
			);
			slot.x = col * itemSlotWidth;
			lane.addChild(slot);

			if (row == 0) {
				const button = createBox(itemSlotWidth, 25, 0xffffff);
				button.y = -button.height;
				slot.addChild(button);
			} else if (row == laneCount - 1) {
				const button = createBox(itemSlotWidth, 25, 0xffffff);
				button.y = itemSlotHeight;
				slot.addChild(button);
			}
		}
		app.stage.addChild(lane);
	}
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
