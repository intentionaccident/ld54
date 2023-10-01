import * as PIXI from "pixi.js";

export function createBox(
	width: number, height: number,
	color: PIXI.ColorSource, interactive: boolean = false
): PIXI.Graphics {
	const graphics = new PIXI.Graphics();
	graphics.beginFill(color);
	const lineWidth = 1;
	graphics.lineStyle(lineWidth, 0x000000);
	graphics.drawRect(lineWidth / 2, lineWidth / 2, width - lineWidth / 2, height - lineWidth / 2);
	if (interactive) {
		graphics.interactive = true;
		graphics.cursor = "pointer";
	}
	graphics.hitArea = new PIXI.Rectangle(0, 0, width, height);
	return graphics;
}
