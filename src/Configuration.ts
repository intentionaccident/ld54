import {AbilityType} from "./AbilityBar";
import {CrateType} from "./Crate";

export enum CranePattern {
	Anywhere,
	Cross,
	SameLane
}

export enum CraneType {
	Swap,
	OnlyEmpty
}

export enum CompressType {
	EatGaps,
	Full
}

export enum FlushType {
	OneTick,
	Full
}

export interface Configuration {
	shipsNeeded: number;
	boatLookAheadCount: number;
	fastForwardTicks: number;
	enabledCrateTypes: CrateType[];
	enableJokerCrates: boolean,
	enableJokerCrateBoats: boolean,
	holdForXTurns: number,
	jokerCrateChance: number,
	cranePattern: CranePattern,
	craneType: CraneType,
	craneRange: number,
	compressType: CompressType,
	flushType: FlushType,
	crateSpawningDistribution: [number, number][],
	boatSpawningDistribution: [number, number][],
	unlockedAbilities: AbilityType[],
}

export const createConfiguration: () => Configuration = () => ({
	shipsNeeded: 10,
	boatLookAheadCount: 0, // How many boats to consider, in addition to visible boats when spawning new crates
	fastForwardTicks: 2,
	enabledCrateTypes: [CrateType.Circle, CrateType.Square],
	enableFourthItem: false,
	enableJokerCrates: false,
	enableJokerCrateBoats: false,
	holdForXTurns: 2,
	jokerCrateChance: 1 / 20,
	craneType: CraneType.OnlyEmpty,
	cranePattern: CranePattern.SameLane,
	craneRange: 1, // Only applies to CranePattern.Cross and CranePattern.SameLane
	compressType: CompressType.EatGaps,
	flushType: FlushType.Full,
	crateSpawningDistribution: [
		[1, 0],
		[1, 1],
		[0, 2],
	],
	boatSpawningDistribution: [
		[1, 2],
		[0, 3],
	],
	unlockedAbilities: []
});

export function advanceLevel(configuration: Configuration, level: number) {
	if (level === 1) {
		configuration.shipsNeeded = 10;
		configuration.boatLookAheadCount = 1;
		configuration.enabledCrateTypes = [CrateType.Circle, CrateType.Square, CrateType.Triangle];
		configuration.crateSpawningDistribution = [
			[3, 0],
			[3, 1],
			[1, 2],
		];
		configuration.boatSpawningDistribution = [
			[1, 2],
			[2, 3],
			[0, 4],
			[0, 5],
		];
	} else if (level === 2) {
		configuration.shipsNeeded = 9;
		configuration.crateSpawningDistribution = [
			[1, 0],
			[2, 1],
			[1, 2],
		];
		configuration.boatSpawningDistribution = [
			[0.5, 2],
			[1, 3],
			[1, 4],
			[0, 5],
		];
	} else if (level === 3) {
		configuration.shipsNeeded = 8;
		configuration.boatLookAheadCount = 2;
		configuration.enabledCrateTypes = [CrateType.Circle, CrateType.Square, CrateType.Triangle, CrateType.Cross];
		configuration.crateSpawningDistribution = [
			[1, 0],
			[2, 1],
			[2, 2],
		];
		configuration.boatSpawningDistribution = [
			[0, 2],
			[1, 3],
			[1, 4],
			[1, 5],
		];
		configuration.unlockedAbilities = [
			AbilityType.FastForward, AbilityType.Compress, AbilityType.Swap, AbilityType.Flush
		]
	} else throw new Error("Level not implemented.");
}
