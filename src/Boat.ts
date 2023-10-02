import * as PIXI from "pixi.js";
import {Crate, CRATE_WIDTH, CrateType, createCrate} from "./Crate";
import {Lane} from "./Lane";
import {Configuration} from "./Configuration";
import {weightedSample} from "./random";

export enum BoatLocation {
	Lane,
	Hand,
	Deck
}

export interface Boat {
	size: number;
	location: BoatLocation;
	lane?: Lane;
	lastFilled: number
	crates: Crate[];
	graphics: PIXI.Graphics;
	moorIndex?: number;
}

export function getBoatLength(boat: Boat): number {
	return CRATE_WIDTH * boat.size
}

export function getBoatWidth(boat: Boat): number {
	return CRATE_WIDTH
}

export function createBoat(configuration: Configuration, size?: number) {
	size ??= weightedSample(configuration.boatSpawningDistribution) ?? 3;
	const boat: Boat = {
		size,
		crates: [],
		lastFilled: size,
		graphics: new PIXI.Graphics(),
		location: BoatLocation.Deck
	};

	boat.graphics.beginFill(0xaaaaaa, 1);
	boat.graphics.drawEllipse(getBoatLength(boat) / 2, getBoatWidth(boat) / 2, getBoatLength(boat) / 2, getBoatWidth(boat));
	// boat.graphics.drawRect(0, 0, getBoatLength(boat), CRATE_WIDTH);
	boat.graphics.endFill();

	boat.graphics.interactive = true;
	boat.graphics.eventMode = 'static';
	boat.graphics.hitArea = new PIXI.Ellipse(
		CRATE_WIDTH * size / 2,
		CRATE_WIDTH / 2,
		CRATE_WIDTH * size / 2,
		CRATE_WIDTH
	)

	while (size-- > 0) {
		const weight = (c: CrateType) => configuration.enabledCrateTypes.indexOf(c) === -1 ? 0 : 1;
		const crate = createCrate(weightedSample([
			[weight(CrateType.Circle), CrateType.Circle],
			[weight(CrateType.Square), CrateType.Square],
			[weight(CrateType.Triangle), CrateType.Triangle],
			[weight(CrateType.Cross), CrateType.Cross],
			[configuration.enableJokerCrateBoats ? 0.5 : 0, CrateType.Joker],
		]) ?? CrateType.Circle);
		crate.graphics.x = boat.crates.length * CRATE_WIDTH;
		crate.graphics.alpha = 0.5;
		boat.crates.push(crate);
		boat.graphics.addChild(crate.graphics);
	}

	return boat;
}
