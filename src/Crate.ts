import * as PIXI from "pixi.js";
import '@pixi/graphics-extras';

export enum CrateType {
	Circle,
	Triangle,
	Square,
	Cross,
	Joker
}

export const CRATE_WIDTH = 32;
export const CrateTypes = Object.values(CrateType).filter(Number.isInteger) as CrateType[]

const cratesTexture = PIXI.Texture.from('assets/crates.gif');
export const wagonTexture = new PIXI.Texture(cratesTexture.castToBaseTexture(), new PIXI.Rectangle(
	0, 0, CRATE_WIDTH, CRATE_WIDTH
));
export const cratesTextures = [1,2,3,4].map(i =>
	new PIXI.Texture(cratesTexture.castToBaseTexture(), new PIXI.Rectangle(
		CRATE_WIDTH * i, 0, CRATE_WIDTH, CRATE_WIDTH
	)));

export interface Crate {
	graphics: PIXI.Container;
	type: CrateType;
	actionPath: { x: number, y: number }[];
	lanePath: { x: number, y: number }[];
	isDead: boolean;
}

const colorMap = {
	[CrateType.Circle]: 0xff0000,
	[CrateType.Triangle]: 0x00ff00,
	[CrateType.Square]: 0x0000ff,
	[CrateType.Cross]: 0x9D009B,
	[CrateType.Joker]: 0xFFFF00,
};

export function createCrate(type: CrateType, includeWagon: boolean = true): Crate {
	const container = new PIXI.Container();
	const graphics = new PIXI.Graphics();
	// container.addChild(graphics);
	if (includeWagon) {
		let wagonSprite = new PIXI.Sprite(wagonTexture);
		wagonSprite.anchor.set(0.5, 0.5);
		wagonSprite.y = 8;
		container.addChild(wagonSprite);
	}
	const crateSprite = new PIXI.Sprite(cratesTextures[type]);
	crateSprite.anchor.set(0.5, 0.5);
	container.addChild(crateSprite)
	// graphics.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
	graphics.beginFill(colorMap[type], 1);
	switch (type) {
		case CrateType.Circle: {
			graphics.drawCircle(CRATE_WIDTH / 2, CRATE_WIDTH / 2, CRATE_WIDTH / 2);
			break;
		}
		case CrateType.Triangle: {
			graphics.drawPolygon([
				new PIXI.Point(CRATE_WIDTH / 2, 0),
				new PIXI.Point(CRATE_WIDTH, CRATE_WIDTH),
				new PIXI.Point(0, CRATE_WIDTH),
			]);
			break;
		}
		case CrateType.Square: {
			graphics.drawRect(0, 0, CRATE_WIDTH, CRATE_WIDTH);
			break;
		}
		case CrateType.Cross: {
			graphics.lineStyle(4, colorMap[type], 1)
				.moveTo(0, 0)
				.lineTo(CRATE_WIDTH / 1.5, CRATE_WIDTH / 1.5)
				.moveTo(CRATE_WIDTH / 1.5, 0)
				.lineTo(0, CRATE_WIDTH / 1.5);
			break;
		}
		case CrateType.Joker: {
			graphics.drawStar!(20 / 2 / 20 * CRATE_WIDTH, 20 / 2 / 20 * CRATE_WIDTH, 7, 12 / 20 * CRATE_WIDTH, 5 / 20 * CRATE_WIDTH);
			break;
		}
		default: {
			throw new Error("Unreachable.");
		}
	}
	graphics.endFill();
	graphics.pivot.set(graphics.width / 2, graphics.height / 2);
	return {
		type,
		graphics: container,
		actionPath: [],
		lanePath: [],
		isDead: false
	};
}
