import * as PIXI from "pixi.js";
import {GrayscaleFilter} from '@pixi/filter-grayscale';
import {boatTexture} from "./Boat";

export function createBox(
	width: number, height: number,
	color: PIXI.ColorSource, interactive: boolean = false, lineWidth = 1, border = 0
): PIXI.Graphics {
	const graphics = new PIXI.Graphics();
	graphics.beginFill(color);
	graphics.lineStyle(lineWidth, border);
	graphics.drawRect(lineWidth / 2, lineWidth / 2, width - lineWidth / 2, height - lineWidth / 2);
	if (interactive) {
		graphics.interactive = true;
		graphics.cursor = "pointer";
	}
	graphics.hitArea = new PIXI.Rectangle(0, 0, width, height);
	return graphics;
}

(PIXI.Graphics.prototype as any).drawDashLine = function(toX: number, toY: number, dash = 16, gap = 8) {
	const lastPosition = this.currentPath.shape.points;

	const currentPosition = {
		x: lastPosition[lastPosition.length - 2] || 0,
		y: lastPosition[lastPosition.length - 1] || 0
	};

	const absValues = {
		toX: Math.abs(toX),
		toY: Math.abs(toY)
	};

	for (
		;
		Math.abs(currentPosition.x) < absValues.toX ||
		Math.abs(currentPosition.y) < absValues.toY;
	) {
		currentPosition.x =
			Math.abs(currentPosition.x + dash) < absValues.toX
				? currentPosition.x + dash
				: toX;
		currentPosition.y =
			Math.abs(currentPosition.y + dash) < absValues.toY
				? currentPosition.y + dash
				: toY;

		this.lineTo(currentPosition.x, currentPosition.y);

		currentPosition.x =
			Math.abs(currentPosition.x + gap) < absValues.toX
				? currentPosition.x + gap
				: toX;
		currentPosition.y =
			Math.abs(currentPosition.y + gap) < absValues.toY
				? currentPosition.y + gap
				: toY;

		this.moveTo(currentPosition.x, currentPosition.y);
	}
};
