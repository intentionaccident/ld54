import * as PIXI from "pixi.js";

export function createBox(
	width: number, height: number,
	color: PIXI.ColorSource
): PIXI.Graphics {
	const graphics = new PIXI.Graphics();
	graphics.beginFill(color);
	const lineWidth = 1;
	graphics.lineStyle(lineWidth, 0x000000);
	graphics.drawRect(lineWidth / 2, lineWidth / 2, width - lineWidth / 2, height - lineWidth / 2);
	return graphics;
}
