import * as PIXI from "pixi.js";
import {Crate, CRATE_WIDTH, CrateType, createCrate} from "./Crate";
import {Lane} from "./Lane";
import {Configuration} from "./Configuration";
import {weightedSample} from "./random";

export const boatTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/ship.gif').castToBaseTexture(), new PIXI.Rectangle(
		890, 22, 380, 122
	)
);

export const boatManifestTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/manifest.gif').castToBaseTexture(), new PIXI.Rectangle(
		992, 380, 240, 260
	)
);

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
	boatGraphics: PIXI.Sprite;
	manifestGraphics: PIXI.Sprite;
	moorIndex?: number;
}

export function getBoatLength(boat: Boat): number {
	return CRATE_WIDTH * boat.size
}

export function getBoatWidth(boat: Boat): number {
	return CRATE_WIDTH
}

export function cratePositionOnBoat(i: number, max: number): { x: number, y: number } {
	const originX = 66;
	const originY = 80;
	const pointX = 62;
	const pointY = 60;
	let directionX = pointX - originX;
	let directionY = pointY - originY;
	let length = Math.sqrt(directionX ** 2 + directionY ** 2);
	directionX = directionX / length;
	directionY = directionY / length;
	length *= 6;
	const offset = length * ((i + 0.2) / max);
	return {x: originX - directionX * offset, y: originY - directionY * offset};
}

export function createBoat(configuration: Configuration, size?: number) {
	size ??= weightedSample(configuration.boatSpawningDistribution) ?? 3;
	const boat: Boat = {
		size,
		crates: [],
		lastFilled: size,
		boatGraphics: new PIXI.Sprite(boatTexture),
		manifestGraphics: new PIXI.Sprite(boatManifestTexture),
		location: BoatLocation.Deck
	};

	boat.manifestGraphics.interactive = true;
	boat.manifestGraphics.cursor = 'pointer';

	for (let i = 0; i < size; i++) {
		const weight = (c: CrateType) => configuration.enabledCrateTypes.indexOf(c) === -1 ? 0 : 1;
		let crateType = weightedSample([
			[weight(CrateType.Circle), CrateType.Circle],
			[weight(CrateType.Square), CrateType.Square],
			[weight(CrateType.Triangle), CrateType.Triangle],
			[weight(CrateType.Cross), CrateType.Cross],
			[configuration.enableJokerCrateBoats ? 0.5 : 0, CrateType.Joker],
		]) ?? CrateType.Circle;
		const manifestCrate = createCrate(crateType, false);
		manifestCrate.graphics.x = cratePositionOnBoat(i, size).x;
		manifestCrate.graphics.y = cratePositionOnBoat(i, size).y;
		manifestCrate.graphics.alpha = 1;
		boat.manifestGraphics.addChild(manifestCrate.graphics);

		const crate = createCrate(crateType, false);
		crate.graphics.x = 94 + i * 50;
		crate.graphics.y = 100;
		crate.graphics.alpha = 0.5;
		boat.boatGraphics.addChild(crate.graphics);
		boat.crates.push(crate);
	}

	return boat;
}
