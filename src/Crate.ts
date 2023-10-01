import * as PIXI from "pixi.js";
import '@pixi/graphics-extras';

export enum CrateType {
	Circle,
	Triangle,
	Square,
	Joker
}

export const CrateTypes = Object.values(CrateType).filter(Number.isInteger) as CrateType[]

export interface Crate {
	graphics: PIXI.Graphics;
	type: CrateType;
}

const colorMap = {
	[CrateType.Circle]: 0xff0000,
	[CrateType.Triangle]: 0x00ff00,
	[CrateType.Square]: 0x0000ff,
	[CrateType.Joker]: 0xFFFF00,
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
		} case CrateType.Joker: {
			graphics.drawStar!(20/2/20 * CRATE_WIDTH, 20/2/20 * CRATE_WIDTH, 7, 12/20 * CRATE_WIDTH, 5/20 * CRATE_WIDTH);
			break;
		} default: {
			throw new Error("Unreachable.");
		}
	}
	graphics.endFill();
	return {
		type,
		graphics
	};
}
