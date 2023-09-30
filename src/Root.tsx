import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { createBox } from "./Box";
import { CrateType, createCrate } from "./Crate";

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
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});

	for (const type of Object.values(CrateType).filter(Number.isInteger) as CrateType[]) {
		const item = createCrate(type)
		item.graphics.x = app.renderer.width / app.stage.scale.x * Math.random();
		item.graphics.y = app.renderer.height / app.stage.scale.y * Math.random();
		app.stage.addChild(item.graphics)
	}

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}
