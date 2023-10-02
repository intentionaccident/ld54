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

export interface Features {
	fastForwardTicks: number;
	enableFourthItem: boolean;
	enableJokerCrates: boolean,
	enableJokerCrateBoats: boolean,
	holdForXTurns: number,
	minBoatSize: number,
	maxBoatSize: number,
	jokerCrateChance: number,
	cranePattern: CranePattern,
	craneType: CraneType,
	craneRange: number,
	compressType: CompressType,
	flushType: FlushType
}

export const createFeatures: () => Features = () => ({
	fastForwardTicks: 2,
	enableFourthItem: false,
	enableJokerCrates: false,
	enableJokerCrateBoats: false,
	holdForXTurns: 2,
	minBoatSize: 2,
	maxBoatSize: 3,
	jokerCrateChance: 1 / 20,
	craneType: CraneType.OnlyEmpty,
	cranePattern: CranePattern.Cross,
	craneRange: 1, // Only applies to CranePattern.Cross and CranePattern.SameLane
	compressType: CompressType.EatGaps,
	flushType: FlushType.OneTick
});
