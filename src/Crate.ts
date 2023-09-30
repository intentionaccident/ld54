import * as PIXI from "pixi.js";

export enum CrateType {
	Circle,
	Triangle,
	Square
}
interface Crate {
	graphics: PIXI.Graphics;
	type: CrateType;
}
const colorMap = {
	[CrateType.Circle]: 16711680,
	[CrateType.Triangle]: 65280,
	[CrateType.Square]: 255,
};
const CRATE_WIDTH = 20;
export function createCrate(type: CrateType): Crate {
	const graphics = new PIXI.Graphics();
	// graphics.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
	graphics.beginFill(colorMap[type], 1);
	switch (type) {
		case CrateType.Circle: {
			graphics.drawCircle(0, 0, CRATE_WIDTH / 2);
			break;
		} case CrateType.Triangle: {
			graphics.drawPolygon([
				new PIXI.Point(0, -CRATE_WIDTH / 2),
				new PIXI.Point(CRATE_WIDTH / 2, CRATE_WIDTH / 2),
				new PIXI.Point(-CRATE_WIDTH / 2, CRATE_WIDTH / 2),
			]);
			break;
		} case CrateType.Square: {
			graphics.drawRect(-CRATE_WIDTH / 2, -CRATE_WIDTH / 2, CRATE_WIDTH, CRATE_WIDTH);
			break;
		}
	}
	graphics.endFill();
	return {
		type,
		graphics
	};
}
