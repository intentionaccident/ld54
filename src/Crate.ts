import * as PIXI from "pixi.js";

export enum CrateType {
	Circle,
	Triangle,
	Square
}

export const CrateTypes = Object.values(CrateType).filter(Number.isInteger) as CrateType[]

export interface Crate {
	graphics: PIXI.Graphics;
	type: CrateType;
}

const colorMap = {
	[CrateType.Circle]: 16711680,
	[CrateType.Triangle]: 65280,
	[CrateType.Square]: 255,
};

export const CRATE_WIDTH = 20;
export function createCrate(type: CrateType): Crate {
	const graphics = new PIXI.Graphics();
	// graphics.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
	graphics.beginFill(colorMap[type], 1);
	switch (type) {
		case CrateType.Circle: {
			graphics.drawCircle(CRATE_WIDTH / 2, CRATE_WIDTH / 2, CRATE_WIDTH / 2);
			break;
		} case CrateType.Triangle: {
			graphics.drawPolygon([
				new PIXI.Point(CRATE_WIDTH / 2, 0),
				new PIXI.Point(CRATE_WIDTH, CRATE_WIDTH),
				new PIXI.Point(0, CRATE_WIDTH),
			]);
			break;
		} case CrateType.Square: {
			graphics.drawRect(0, 0, CRATE_WIDTH, CRATE_WIDTH);
			break;
		}
	}
	graphics.endFill();
	return {
		type,
		graphics
	};
}
