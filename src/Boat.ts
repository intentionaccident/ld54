import * as PIXI from "pixi.js";
import { CRATE_WIDTH, Crate, CrateTypes, createCrate } from "./Crate";

interface Boat {
	size: number;
	crates: Crate[];
	graphics: PIXI.Graphics;
}
export function createBoat(size: number) {
	const boat: Boat = {
		size,
		crates: [],
		graphics: new PIXI.Graphics()
	};

	boat.graphics.beginFill(11184810, 1);
	boat.graphics.drawEllipse(CRATE_WIDTH * size / 2, CRATE_WIDTH / 2, CRATE_WIDTH * size / 2, CRATE_WIDTH);
	boat.graphics.endFill();

	while (size-- > 0) {
		const crate = createCrate(CrateTypes[CrateTypes.length * Math.random() | 0]);
		crate.graphics.x = boat.crates.length * CRATE_WIDTH;
		boat.crates.push(crate);
		boat.graphics.addChild(crate.graphics);
	}

	return boat;
}
