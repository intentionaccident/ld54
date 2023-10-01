export interface Features {
	enableFourthItem: boolean;
	enableJokerCrates: boolean,
	enableJokerCrateBoats: boolean,
	holdForXTurns: number,
	minBoatSize: number,
	maxBoatSize: number,
	jokerCrateChance: number
}

export const createFeatures: () => Features = () => ({
	enableFourthItem: true,
	enableJokerCrates: true,
	enableJokerCrateBoats: true,
	holdForXTurns: 2,
	minBoatSize: 2,
	maxBoatSize: 3,
	jokerCrateChance: 1 / 20,
});
